const StreakManager = {
  // Check and update streak
  updateStreak() {
    const data = Storage.getUserData();
    const before = data.streakCount;
    StateLogic.updateStreakForGoal(data);
    Storage.saveUserData(data);
    this.displayStreak(data.streakCount, data.streakCount > before);
    return data.streakCount;
  },

  // Display streak in the header and the week strip on the home screen
  displayStreak(streak, justIncreased = false) {
    const streakElement = document.getElementById('streak-count');
    if (streakElement) {
      streakElement.textContent = streak;
    }
    this.renderWeek();
    if (justIncreased && streak > 0 && streak % 7 === 0) {
      this.celebrateStreak(streak);
    }
  },

  renderWeek() {
    const container = document.getElementById('streak-week');
    if (!container) return;
    const data = Storage.getUserData();
    const labels = ['S', 'Pr', 'A', 'T', 'K', 'Pn', 'Š']; // sekmadienis ... šeštadienis
    const days = StateLogic.recentDays(data);
    container.innerHTML = days.map(day => `
      <div class="streak-day ${day.status} ${day.isToday ? 'today' : ''}" title="${day.key}">
        <span class="streak-day-dot">${day.status === 'done' ? '✓' : day.status === 'frozen' ? '❄' : ''}</span>
        <span class="streak-day-label">${labels[day.weekday]}</span>
      </div>`).join('');

    const statusEl = document.getElementById('streak-today-status');
    if (statusEl) {
      if (StateLogic.practicedToday(data)) {
        statusEl.textContent = 'Done for today. Puiku! 🔥';
        statusEl.className = 'streak-today-status done';
      } else if (data.streakCount > 0) {
        statusEl.textContent = `Practise today to keep your ${data.streakCount}-day streak.`;
        statusEl.className = 'streak-today-status pending';
      } else if (data.lastStreakLost && data.lastStreakLost.date === StateLogic.dateKey()) {
        statusEl.textContent = `Your ${data.lastStreakLost.length}-day streak ended. Start a new one today.`;
        statusEl.className = 'streak-today-status pending';
      } else {
        statusEl.textContent = 'Practise today to start a streak.';
        statusEl.className = 'streak-today-status pending';
      }
    }
    const bestEl = document.getElementById('streak-best');
    if (bestEl) bestEl.textContent = data.longestStreak || data.streakCount || 0;
  },

  // Celebrate streak milestones inside the app
  celebrateStreak(streak) {
    const message = streak === 7 ? '🎉 Viena savaitė iš eilės!' :
                    streak === 30 ? '🏆 Vienas mėnuo iš eilės!' :
                    streak === 100 ? '👑 100 dienų iš eilės!' :
                    `🔥 ${streak} dienų iš eilės!`;
    this.showToast(message);
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'streak-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  // Initialize streak display
  init() {
    const data = Storage.getUserData();
    this.displayStreak(data.streakCount);
  }
};
