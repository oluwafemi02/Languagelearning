// Daily reminders through Web Push.
//
// iOS cannot schedule a notification from a web page: timers stop as soon as the app is in the
// background, and `new Notification()` does not exist there. The only thing that works is a push
// sent by a server. This file connects the app to the small server in /push-worker and keeps it
// told about your streak, so it knows when to remind you and when to stay quiet.
//
// Requirements on iPhone: iOS 16.4 or later, and the app opened from the Home Screen.

const NotificationManager = {
  syncTimer: null,

  // ---------- Environment checks

  isIOS() {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  },

  pushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  // What the Profile screen should say about reminders.
  status() {
    const push = Storage.getUserData().settings.push || {};
    if (this.isIOS() && !this.isStandalone()) {
      return { state: 'install', text: 'Add this app to your Home Screen first (Share, Add to Home Screen), then open it from there to turn on reminders.' };
    }
    if (!this.pushSupported()) {
      return { state: 'unsupported', text: 'This browser cannot receive push reminders. On iPhone you need iOS 16.4 or later.' };
    }
    if (Notification.permission === 'denied') {
      return { state: 'denied', text: 'Notifications are blocked. Allow them in iPhone Settings, Notifications, Lithuanian.' };
    }
    if (!push.enabled) {
      return { state: 'off', text: 'Reminders are off.' };
    }
    if (push.lastError) {
      return { state: 'error', text: push.lastError };
    }
    const when = push.lastSync ? new Date(push.lastSync).toLocaleString() : 'not yet';
    return { state: 'on', text: `Reminders are on. Last synced ${when}.` };
  },

  // ---------- Server calls

  cleanUrl(u) {
    return String(u || '').trim().replace(/\/+$/, '');
  },

  randomToken(n = 24) {
    return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
  },

  b64ToBytes(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  },

  async api(path, body, method = 'POST') {
    const { url, secret } = Storage.getUserData().settings.push;
    const res = await fetch(this.cleanUrl(url) + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server replied ${res.status}`);
    return data;
  },

  savePush(patch) {
    const state = Storage.getUserData();
    state.settings.push = { ...state.settings.push, ...patch };
    Storage.saveUserData(state);
    return state.settings.push;
  },

  // Must be called from a button tap: iOS only shows the permission prompt after a user gesture.
  async connect(serverUrl) {
    const url = this.cleanUrl(serverUrl);
    if (!/^https:\/\//.test(url)) throw new Error('Paste the https:// address of your push server.');
    if (this.isIOS() && !this.isStandalone()) throw new Error('Open the app from your Home Screen first.');
    if (!this.pushSupported()) throw new Error('Push is not supported here. On iPhone you need iOS 16.4 or later.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notifications were not allowed. You can allow them in iPhone Settings, Notifications.');

    const res = await fetch(url + '/vapid').catch(() => null);
    if (!res || !res.ok) throw new Error('Could not reach the push server. Check the address.');
    const { publicKey } = await res.json();
    if (!publicKey) throw new Error('The server did not return a key. Check its setup.');

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe().catch(() => {});
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.b64ToBytes(publicKey) });

    const current = Storage.getUserData().settings.push || {};
    this.savePush({
      url,
      deviceId: current.deviceId || this.randomToken(12),
      secret: current.secret || this.randomToken(24)
    });
    await this.api('/register', {
      deviceId: Storage.getUserData().settings.push.deviceId,
      subscription: sub.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    this.savePush({ enabled: true, lastError: null });
    await this.sync();
  },

  async disconnect() {
    try { await this.api('/device', { deviceId: Storage.getUserData().settings.push.deviceId }, 'DELETE'); } catch (e) { /* server gone */ }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (e) { /* ignore */ }
    this.savePush({ enabled: false, lastSync: null, lastError: null });
  },

  // What the server needs to decide whether to remind you today.
  buildSyncPayload(state = Storage.getUserData()) {
    const dueCount = Object.values(state.srsItems || {}).filter(item => new Date(item.dueAt).getTime() <= Date.now()).length;
    return {
      deviceId: state.settings.push.deviceId,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      remindersOn: state.settings.notificationsEnabled !== false,
      remindTime: state.settings.reminderTime || '19:00',
      nudgeTime: state.settings.nudgeTime || '21:30',
      nudgeEnabled: state.settings.nudgeEnabled !== false,
      // Last day that counted for the streak (a practised day, or one covered by a freeze).
      lastPracticeDate: state.lastGoalMetDate || null,
      streak: state.streakCount || 0,
      dueCount,
      freezesLeft: state.settings.autoUseStreakFreeze ? Math.floor(state.xpTotal / (state.streakFreezeCost || 100)) : 0
    };
  },

  async sync() {
    const state = Storage.getUserData();
    if (!state.settings.push?.enabled) return null;
    try {
      const payload = this.buildSyncPayload(state);
      // iOS can drop a subscription (for example after reinstalling); send the current one.
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager?.getSubscription();
        if (sub) payload.subscription = sub.toJSON();
      }
      const res = await this.api('/sync', payload);
      this.savePush({
        lastSync: new Date().toISOString(),
        lastError: res.subscription === false ? (res.lastError || 'Turn reminders on again in Profile.') : null
      });
      return res;
    } catch (err) {
      this.savePush({ lastError: err.message });
      return null;
    }
  },

  // Debounced, so a burst of XP awards sends one request.
  scheduleSync() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.sync(), 1500);
  },

  async sendTest() {
    await this.sync();
    return this.api('/test', { deviceId: Storage.getUserData().settings.push.deviceId });
  },

  // Kept for older callers: reminders are now handled by the server, so this only syncs.
  async updateFromSettings() {
    await this.sync();
    return this.status().state === 'on';
  },

  async init() {
    await this.sync();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.scheduleSync();
    });
  }
};

if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
}
