const NotificationManager = {
  iconData: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🇱🇹</text></svg>",
  reminderTimeoutId: null,
  reminderIntervalId: null,

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  clearScheduledReminder() {
    if (this.reminderTimeoutId) {
      clearTimeout(this.reminderTimeoutId);
      this.reminderTimeoutId = null;
    }
    if (this.reminderIntervalId) {
      clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = null;
    }
  },

  scheduleDailyReminder() {
    this.clearScheduledReminder();
    const data = Storage.getUserData();

    if (!data.settings.notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const sendNotification = () => {
      const latestState = Storage.getUserData();
      const message = this.buildReminderMessage(latestState);
      this.sendReminder(message);
    };

    const now = new Date();
    const [hours, minutes] = (data.settings.reminderTime || '19:00').split(':').map(Number);
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;

    this.reminderTimeoutId = setTimeout(() => {
      sendNotification();
      this.reminderIntervalId = setInterval(sendNotification, 24 * 60 * 60 * 1000);
    }, timeUntilReminder);
  },

  buildReminderMessage(data) {
    const dailyXP = data.xpToday || 0;
    const needsPractice = dailyXP === 0;
    if (needsPractice && data.streakCount > 0) {
      const freezeHint = data.settings?.autoUseStreakFreeze
        ? `Auto-freeze can protect it for ${data.streakFreezeCost || 100} XP.`
        : 'Enable streak freeze in Profile settings to protect your streak.';
      return `Your ${data.streakCount}-day streak is at risk today. Practice now! ${freezeHint}`;
    }

    if (dailyXP < data.dailyGoalXP) {
      return `You are ${data.dailyGoalXP - dailyXP} XP away from today's goal. Keep going!`;
    }

    return 'Great work! Keep momentum with a quick Lithuanian review today.';
  },

  sendReminder(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Laikas mokytis! 📚', {
        body: message,
        icon: this.iconData,
        badge: this.iconData,
        tag: 'daily-reminder'
      });
    }
  },

  async updateFromSettings(requestPermission = false) {
    if (!('Notification' in window)) {
      return false;
    }

    const data = Storage.getUserData();
    if (!data.settings.notificationsEnabled) {
      this.clearScheduledReminder();
      return false;
    }

    let hasPermission = Notification.permission === 'granted';
    if (!hasPermission && requestPermission) {
      hasPermission = await this.requestPermission();
    }

    if (hasPermission) {
      this.scheduleDailyReminder();
    }

    return hasPermission;
  },

  async init() {
    await this.updateFromSettings(false);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.scheduleDailyReminder();
      }
    });
  }
};
