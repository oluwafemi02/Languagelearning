// Lithuanian push server: sends the daily study reminder and a late "streak at risk"
// nudge as real Web Push notifications, so they arrive on iPhone even when the app is closed.
// Runs on a Cloudflare Worker with one KV namespace and a cron trigger.
//
// Routes
//   GET    /                health check
//   GET    /vapid           public VAPID key for subscribing
//   POST   /register        { deviceId, subscription, tz }        Bearer <secret>
//   POST   /sync            { deviceId, ...reminder settings, progress }   Bearer <secret>
//   POST   /test            { deviceId }                          Bearer <secret>
//   DELETE /device          { deviceId }                          Bearer <secret>
//
// What the phone sends: its push subscription, time zone, reminder times, the last day
// you practised, your streak, and how many words are due. Nothing else.

import { sendPush } from './webpush.js';

const DEFAULTS = { remindTime: '19:00', nudgeTime: '21:30', nudgeEnabled: true, remindersOn: true };
const LATE_WINDOW_MIN = 5 * 60; // if the server missed the time by more than 5h, skip that day

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

const json = (env, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function vapid(env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_JWK) throw new Error('Server is missing VAPID keys. See push-worker/README.md.');
  return { publicKey: env.VAPID_PUBLIC_KEY, privateJwk: env.VAPID_PRIVATE_JWK, subject: env.VAPID_SUBJECT || 'mailto:admin@example.com' };
}

const validId = (id) => typeof id === 'string' && /^[a-f0-9]{8,64}$/.test(id);
const validTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const validDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

function validTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

const loadDevice = (env, id) => env.DEVICES.get(`d:${id}`, 'json');

async function saveDevice(env, id, rec) {
  rec.updatedAt = Date.now();
  await env.DEVICES.put(`d:${id}`, JSON.stringify(rec));
}

async function authed(env, req, id) {
  if (!validId(id)) return { error: 'Missing or invalid device id', status: 400 };
  const secret = bearer(req);
  if (!secret || secret.length < 16) return { error: 'Missing secret', status: 401 };
  const rec = await loadDevice(env, id);
  if (!rec) return { error: 'This phone is not registered. Turn reminders on again in the app.', status: 404 };
  if (rec.secretHash !== await sha256(secret)) return { error: 'Wrong secret', status: 403 };
  return { rec };
}

function validSubscription(sub) {
  return sub && typeof sub.endpoint === 'string' && /^https:\/\//.test(sub.endpoint) && sub.keys?.p256dh && sub.keys?.auth;
}

// Local calendar day and minutes past midnight in the phone's time zone.
export function localClock(now, tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(now)).map((p) => [p.type, p.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function previousDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const t = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 864e5);
}

const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Decides which notification (if any) is due for one phone right now.
export function dueMessage(rec, now) {
  if (!rec.subscription || rec.remindersOn === false) return null;
  const { day, minutes } = localClock(now, rec.tz);
  if (rec.lastPracticeDate === day) return null; // already practised today: stay quiet
  const sent = rec.sent || {};
  const streak = Number(rec.streak) || 0;
  // The streak can still be saved today if every missed day since the last practice can be
  // covered by a streak freeze (the app spends them automatically when it next opens).
  const gap = rec.lastPracticeDate ? daysBetween(rec.lastPracticeDate, day) : Infinity;
  const freezesLeft = Number(rec.freezesLeft) || 0;
  const atRisk = streak > 0 && gap >= 1 && gap - 1 <= freezesLeft;
  const due = Number(rec.dueCount) || 0;

  const nudgeAt = toMinutes(rec.nudgeTime || DEFAULTS.nudgeTime);
  if (rec.nudgeEnabled !== false && atRisk && sent.nudge !== day && minutes >= nudgeAt && minutes < nudgeAt + LATE_WINDOW_MIN) {
    return {
      kind: 'nudge',
      day,
      payload: {
        title: 'Paskutinė proga! 🔥',
        body: freezesLeft > gap - 1
          ? `Your ${streak}-day streak ends at midnight. A streak freeze will cover today, but a 5-minute review keeps it for real.`
          : `Your ${streak}-day streak ends at midnight. A 5-minute review keeps it alive.`,
        url: './?start=today',
        tag: 'streak-nudge',
      },
    };
  }

  const remindAt = toMinutes(rec.remindTime || DEFAULTS.remindTime);
  if (sent.reminder !== day && minutes >= remindAt && minutes < remindAt + LATE_WINDOW_MIN) {
    let body;
    if (atRisk) body = `Keep your ${streak}-day streak going.${due ? ` ${plural(due, 'word is', 'words are')} due for review.` : ''}`;
    else if (due) body = `${plural(due, 'word is', 'words are')} due for review. About 5 minutes.`;
    else body = streak > 0 ? 'Time for today\'s Lithuanian practice.' : 'Start a new streak today. One short lesson is enough.';
    return { kind: 'reminder', day, payload: { title: 'Laikas mokytis! 📚', body, url: './?start=today', tag: 'daily-reminder' } };
  }
  return null;
}

async function deliver(env, rec, payload) {
  if (!rec.subscription) return { ok: false, status: 0 };
  const res = await sendPush(rec.subscription, payload, vapid(env), { ttl: 6 * 3600 });
  if (res.gone) {
    rec.subscription = null;
    rec.lastError = 'iPhone dropped the subscription. Open the app and turn reminders on again.';
  } else if (!res.ok) {
    rec.lastError = `Push service replied ${res.status} ${res.text}`.slice(0, 200);
  } else {
    rec.lastError = null;
    rec.lastSentAt = new Date().toISOString();
  }
  return res;
}

function applySettings(rec, body) {
  if (validSubscription(body.subscription)) rec.subscription = body.subscription;
  if (body.tz && validTz(body.tz)) rec.tz = String(body.tz).slice(0, 64);
  if (validTime(body.remindTime)) rec.remindTime = body.remindTime;
  if (validTime(body.nudgeTime)) rec.nudgeTime = body.nudgeTime;
  if (typeof body.nudgeEnabled === 'boolean') rec.nudgeEnabled = body.nudgeEnabled;
  if (typeof body.remindersOn === 'boolean') rec.remindersOn = body.remindersOn;
  if (body.lastPracticeDate === null || validDay(body.lastPracticeDate)) rec.lastPracticeDate = body.lastPracticeDate;
  if (Number.isFinite(body.streak)) rec.streak = Math.max(0, Math.floor(body.streak));
  if (Number.isFinite(body.dueCount)) rec.dueCount = Math.max(0, Math.floor(body.dueCount));
  if (Number.isFinite(body.freezesLeft)) rec.freezesLeft = Math.max(0, Math.min(99, Math.floor(body.freezesLeft)));
}

async function handle(req, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });

  if (req.method === 'GET' && path === '/') return json(env, { ok: true, service: 'lithuanian-push' });
  if (req.method === 'GET' && path === '/vapid') return json(env, { publicKey: vapid(env).publicKey });

  let body = {};
  if (req.method === 'POST' || req.method === 'DELETE') body = await req.json().catch(() => ({}));
  const deviceId = body.deviceId || url.searchParams.get('id');

  if (req.method === 'POST' && path === '/register') {
    if (!validId(deviceId)) return json(env, { error: 'Invalid device id' }, 400);
    const secret = bearer(req);
    if (!secret || secret.length < 16) return json(env, { error: 'Missing secret' }, 401);
    if (!validSubscription(body.subscription)) return json(env, { error: 'Invalid push subscription' }, 400);
    const existing = await loadDevice(env, deviceId);
    const secretHash = await sha256(secret);
    if (existing && existing.secretHash !== secretHash) return json(env, { error: 'Device id already in use' }, 403);
    if (!existing) {
      const max = Number(env.MAX_DEVICES || 3);
      const list = await env.DEVICES.list({ prefix: 'd:' });
      if (list.keys.length >= max) return json(env, { error: `This server allows ${max} devices. Raise MAX_DEVICES to add more.` }, 403);
    }
    const rec = existing || { secretHash, ...DEFAULTS, sent: {}, createdAt: Date.now() };
    applySettings(rec, body);
    rec.tz ||= 'UTC';
    rec.lastError = null;
    await saveDevice(env, deviceId, rec);
    return json(env, { ok: true });
  }

  if (req.method === 'POST' && path === '/sync') {
    const a = await authed(env, req, deviceId);
    if (a.error) return json(env, { error: a.error }, a.status);
    applySettings(a.rec, body);
    await saveDevice(env, deviceId, a.rec);
    return json(env, { ok: true, subscription: !!a.rec.subscription, lastError: a.rec.lastError || null, lastSentAt: a.rec.lastSentAt || null });
  }

  if (req.method === 'POST' && path === '/test') {
    const a = await authed(env, req, deviceId);
    if (a.error) return json(env, { error: a.error }, a.status);
    const res = await deliver(env, a.rec, { title: 'Puiku! Reminders work 🎉', body: 'Your daily Lithuanian reminder will arrive like this, even when the app is closed.', url: './', tag: 'test' });
    await saveDevice(env, deviceId, a.rec);
    if (!res.ok) return json(env, { error: a.rec.lastError || 'Push failed' }, 502);
    return json(env, { ok: true });
  }

  if (req.method === 'DELETE' && path === '/device') {
    const a = await authed(env, req, deviceId);
    if (a.error) return json(env, { error: a.error }, a.status);
    await env.DEVICES.delete(`d:${deviceId}`);
    return json(env, { ok: true });
  }

  return json(env, { error: 'Not found' }, 404);
}

// Runs on the cron schedule (every 15 minutes).
export async function runDue(env, now = Date.now()) {
  let sent = 0;
  let cursor;
  do {
    const page = await env.DEVICES.list({ prefix: 'd:', cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const key of page.keys) {
      const id = key.name.slice(2);
      const rec = await loadDevice(env, id);
      if (!rec) continue;
      const msg = dueMessage(rec, now);
      if (!msg) continue;
      rec.sent ||= {};
      rec.sent[msg.kind] = msg.day; // mark first, so a failing push is not retried every 15 minutes
      if (msg.kind === 'nudge') rec.sent.reminder = msg.day; // never send the reminder after the nudge
      const res = await deliver(env, rec, msg.payload);
      if (res.ok) sent++;
      await saveDevice(env, id, rec);
    }
  } while (cursor);
  return sent;
}

export default {
  async fetch(req, env) {
    try { return await handle(req, env); }
    catch (err) { return json(env, { error: err.message || 'Server error' }, 500); }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDue(env));
  },
};
