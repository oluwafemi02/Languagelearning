const NotificationManager = {
  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Schedule daily reminder
  scheduleDailyReminder() {
    const data = Storage.getUserData();
    
    if (!data.settings.notificationsEnabled) {
      return;
    }

    // Check if user hasn't studied today
    const today = new Date().toDateString();
    const lastDate = data.lastStudyDate ? new Date(data.lastStudyDate).toDateString() : null;
    
    if (lastDate !== today) {
      this.sendReminder();
    }

    // Set up daily check
    const now = new Date();
    const [hours, minutes] = data.settings.reminderTime.split(':');
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime - now;
    
    setTimeout(() => {
      this.sendReminder();
      // Set up for next day
      setInterval(() => this.sendReminder(), 24 * 60 * 60 * 1000);
    }, timeUntilReminder);
  },

  // Send reminder notification
  sendReminder() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Laikas mokytis! 📚', {
        body: 'Nepamirški savo serijos! Praktikuok lietuvių kalbą šiandien.',
        icon: 'images/icons/icon-192x192.png',
        badge: 'images/icons/icon-72x72.png',
        tag: 'daily-reminder'
      });
    }
  },

  // Initialize
  async init() {
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      this.scheduleDailyReminder();
    }
  }
};
