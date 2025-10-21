const StreakManager = {
  // Check and update streak
  updateStreak() {
    const data = Storage.getUserData();
    const today = new Date().toDateString();
    const lastDate = data.lastStudyDate ? new Date(data.lastStudyDate).toDateString() : null;
    
    if (lastDate === today) {
      // Already studied today
      return data.streak;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastDate === yesterdayStr) {
      // Continue streak
      data.streak += 1;
    } else if (lastDate === null) {
      // First time
      data.streak = 1;
    } else {
      // Streak broken
      data.streak = 1;
    }
    
    data.lastStudyDate = new Date().toISOString();
    Storage.saveUserData(data);
    
    this.displayStreak(data.streak);
    return data.streak;
  },

  // Display streak
  displayStreak(streak) {
    const streakElement = document.getElementById('streak-count');
    if (streakElement) {
      streakElement.textContent = streak;
      
      // Add animation for streak milestones
      if (streak % 7 === 0 && streak > 0) {
        this.celebrateStreak(streak);
      }
    }
  },

  // Celebrate streak milestones
  celebrateStreak(streak) {
    // Show celebration message
    const message = streak === 7 ? '🎉 Viena savaitė iš eilės!' :
                    streak === 30 ? '🏆 Vienas mėnuo iš eilės!' :
                    streak === 100 ? '👑 100 dienų iš eilės!' :
                    `🔥 ${streak} dienų iš eilės!`;
    
    this.showNotification(message);
  },

  // Show notification
  showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mokykis Lietuvių', {
        body: message,
        icon: 'images/icons/icon-192x192.png',
        badge: 'images/icons/icon-72x72.png'
      });
    }
  },

  // Initialize streak display
  init() {
    const data = Storage.getUserData();
    this.displayStreak(data.streak);
  }
};
