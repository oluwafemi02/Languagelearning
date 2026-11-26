// End-to-end test of the worker routes and cron with an in-memory KV and a fake push service.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ece from 'http_ece';
import worker, { runDue, localClock, previousDay } from '../src/index.js';
import { generateVapidKeys, b64url } from '../src/webpush.js';

const kv = new Map();
const DEVICES = {
  async get(k, type) { const v = kv.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
  async put(k, v) { kv.set(k, v); },
  async delete(k) { kv.delete(k); },
  async list({ prefix }) { return { keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
};
const keys = await generateVapidKeys();
const env = { DEVICES, VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_JWK: JSON.stringify(keys.privateJwk), VAPID_SUBJECT: 'mailto:t@example.com', MAX_DEVICES: '2' };

const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
const auth = crypto.randomBytes(16);
const subscription = { endpoint: 'https://web.push.apple.com/fake', keys: { p256dh: b64url(ua.getPublicKey()), auth: b64url(auth) } };
const delivered = [];
let pushStatus = 201;
globalThis.fetch = async (url, init) => {
  assert.ok(String(url).startsWith('https://web.push.apple.com/'));
  assert.match(init.headers.Authorization, /^vapid t=.+, k=/);
  if (pushStatus !== 201) return new Response('gone', { status: pushStatus });
  const plain = ece.decrypt(Buffer.from(init.body), { version: 'aes128gcm', privateKey: ua, authSecret: auth });
  delivered.push(JSON.parse(plain.toString()));
  return new Response('', { status: 201 });
};

const call = (method, path, body, secret) => worker.fetch(new Request('https://w.example' + path, {
  method, headers: { 'Content-Type': 'application/json', ...(secret ? { Authorization: `Bearer ${secret}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
}), env);

const ok = (name) => console.log(`✓ ${name}`);
const deviceId = 'abcdef0123456789abcdef01';
const secret = 'f'.repeat(48);
// Vilnius is UTC+2 in winter. 2026-12-10 17:00 UTC = 19:00 local.
const at = (iso) => Date.parse(iso);

assert.deepEqual(localClock(at('2026-12-10T17:00:00Z'), 'Europe/Vilnius'), { day: '2026-12-10', minutes: 19 * 60 });
assert.deepEqual(localClock(at('2026-12-10T22:30:00Z'), 'Europe/Vilnius'), { day: '2026-12-11', minutes: 30 });
assert.equal(previousDay('2026-03-01'), '2026-02-28');
ok('local clock follows the phone time zone');

let r = await call('GET', '/vapid');
assert.equal((await r.json()).publicKey, keys.publicKey);

r = await call('POST', '/register', { deviceId, subscription, tz: 'Europe/Vilnius' }, secret);
assert.equal(r.status, 200, await r.clone().text());
r = await call('POST', '/sync', { deviceId, streak: 1 }, 'wrong-secret-wrong-secret');
assert.equal(r.status, 403);
ok('register and auth');

r = await call('POST', '/sync', { deviceId, remindTime: '19:00', nudgeTime: '21:30', lastPracticeDate: '2026-12-09', streak: 12, dueCount: 7, freezesLeft: 0 }, secret);
assert.equal(r.status, 200);

assert.equal(await runDue(env, at('2026-12-10T16:50:00Z')), 0, 'nothing before 19:00');
assert.equal(await runDue(env, at('2026-12-10T17:05:00Z')), 1);
assert.equal(delivered.at(-1).title, 'Laikas mokytis! 📚');
assert.match(delivered.at(-1).body, /12-day streak/);
assert.match(delivered.at(-1).body, /7 words are due/);
assert.equal(await runDue(env, at('2026-12-10T17:20:00Z')), 0, 'reminder only once a day');
ok('daily reminder at 19:00 local, once');

assert.equal(await runDue(env, at('2026-12-10T19:35:00Z')), 1);
assert.equal(delivered.at(-1).tag, 'streak-nudge');
assert.match(delivered.at(-1).body, /ends at midnight/);
assert.equal(await runDue(env, at('2026-12-10T19:50:00Z')), 0);
ok('streak-at-risk nudge at 21:30 local, once');

// Practised on the 11th: no reminder that day.
await call('POST', '/sync', { deviceId, lastPracticeDate: '2026-12-11', streak: 13, dueCount: 0 }, secret);
assert.equal(await runDue(env, at('2026-12-11T17:05:00Z')), 0);
assert.equal(await runDue(env, at('2026-12-11T19:35:00Z')), 0);
ok('silent on days you already practised');

// Missed the 12th, but one streak freeze is available: the 13th is still savable.
await call('POST', '/sync', { deviceId, freezesLeft: 1 }, secret);
assert.equal(await runDue(env, at('2026-12-13T17:05:00Z')), 1);
assert.match(delivered.at(-1).body, /13-day streak/);
await call('POST', '/sync', { deviceId, freezesLeft: 0, lastPracticeDate: '2026-12-13', streak: 14 }, secret);
ok('a streak a freeze can still save counts as at risk');

// Missed the 14th with no freezes: on the 15th the streak is gone, so no nudge, and a fresh-start reminder.
await call('POST', '/sync', { deviceId, streak: 0 }, secret);
assert.equal(await runDue(env, at('2026-12-15T17:05:00Z')), 1);
assert.match(delivered.at(-1).body, /new streak/);
assert.equal(await runDue(env, at('2026-12-15T19:35:00Z')), 0);
ok('no nudge when there is no streak to lose');

// Server was down at 19:00 and comes back at 01:00: too late, skip.
assert.equal(await runDue(env, at('2026-12-16T23:00:00Z')), 0);
ok('stale reminders are skipped');

// Reminders off.
await call('POST', '/sync', { deviceId, remindersOn: false }, secret);
assert.equal(await runDue(env, at('2026-12-17T17:05:00Z')), 0);
await call('POST', '/sync', { deviceId, remindersOn: true }, secret);
ok('reminders can be paused');

r = await call('POST', '/test', { deviceId }, secret);
assert.equal(r.status, 200);
assert.match(delivered.at(-1).title, /Reminders work/);
ok('test push');

// Expired subscription is dropped and reported.
pushStatus = 410;
r = await call('POST', '/test', { deviceId }, secret);
assert.equal(r.status, 502);
r = await call('POST', '/sync', { deviceId }, secret);
const s = await r.json();
assert.equal(s.subscription, false);
assert.match(s.lastError, /turn reminders on again/);
pushStatus = 201;
ok('expired subscription reported back to the app');

r = await call('POST', '/register', { deviceId: 'bbbbbbbbbbbbbbbbbbbbbbbb', subscription }, 'a'.repeat(32));
assert.equal(r.status, 200);
r = await call('POST', '/register', { deviceId: 'cccccccccccccccccccccccc', subscription }, 'a'.repeat(32));
assert.equal(r.status, 403, 'MAX_DEVICES enforced');

r = await call('DELETE', '/device', { deviceId }, secret);
assert.equal(r.status, 200);
assert.equal(kv.has(`d:${deviceId}`), false);
ok('device limit and delete');
