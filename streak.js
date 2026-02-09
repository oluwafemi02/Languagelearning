const StreakManager = {
  iconData: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🇱🇹</text></svg>",
  // Check and update streak
  updateStreak() {
    const data = Storage.getUserData();
    StateLogic.updateStreakForGoal(data);
    Storage.saveUserData(data);
    this.displayStreak(data.streakCount);
    return data.streakCount;
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
        icon: this.iconData,
        badge: this.iconData
      });
    }
  },

  // Initialize streak display
  init() {
    const data = Storage.getUserData();
    this.displayStreak(data.streakCount);
  }
};
