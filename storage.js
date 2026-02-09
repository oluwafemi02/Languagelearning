const Storage = {
  STORAGE_KEY: 'lithuanianLearner',
  STATE_VERSION: 2,

  getDefaultState() {
    return {
      version: this.STATE_VERSION,
      xpTotal: 0,
      xpToday: 0,
      dailyGoalXP: 50,
      streakCount: 0,
      lastActiveDate: StateLogic.dateKey(),
      lastGoalMetDate: null,
      lessonsCompleted: [],
      accuracyRolling7d: 0,
      srsItems: {},
      settings: {
        soundEffects: true,
        notificationsEnabled: true,
        reminderTime: '19:00',
        ignoreDiacritics: true
      },
      onboardingCompleted: false,
      dailyQuests: {
        date: null,
        quests: [],
        bonusClaimed: false
      },
      sentences: {
        learned: [],
        lastLearningDate: null,
        dailyCount: 0,
        weeklyReviewDate: null,
        reviewScores: []
      }
    };
  },

  migrateState(state) {
    if (!state || typeof state !== 'object') {
      return this.getDefaultState();
    }
    if (state.version === this.STATE_VERSION) {
      return state;
    }

    const migrated = this.getDefaultState();

    if (state.totalXP !== undefined) {
      migrated.xpTotal = state.totalXP;
    }
    if (state.dailyXP !== undefined) {
      migrated.xpToday = state.dailyXP;
    }
    if (state.settings?.dailyGoal !== undefined) {
      migrated.dailyGoalXP = state.settings.dailyGoal;
    }
    if (state.streak !== undefined) {
      migrated.streakCount = state.streak;
    }
    if (state.lastStudyDate) {
      migrated.lastActiveDate = new Date(state.lastStudyDate).toISOString().slice(0, 10);
    }
    if (Array.isArray(state.lessonsCompleted)) {
      migrated.lessonsCompleted = state.lessonsCompleted;
    }
    if (state.settings) {
      migrated.settings.notificationsEnabled = state.settings.notificationsEnabled ?? migrated.settings.notificationsEnabled;
      migrated.settings.soundEffects = state.settings.soundEnabled ?? migrated.settings.soundEffects;
      migrated.settings.reminderTime = state.settings.reminderTime ?? migrated.settings.reminderTime;
    }
    if (state.onboardingCompleted !== undefined) {
      migrated.onboardingCompleted = state.onboardingCompleted;
    }
    if (state.dailyQuests) {
      migrated.dailyQuests = state.dailyQuests;
    }
    if (state.sentences) {
      migrated.sentences = state.sentences;
    }

    if (state.vocabulary) {
      Object.entries(state.vocabulary).forEach(([word, data]) => {
        const item = SRS.createItem({ id: word, kind: 'word', now: new Date() });
        const timesReviewed = data.timesReviewed || 0;
        item.correctStreak = timesReviewed;
        const intervals = [1, 3, 7, 14, 30, 60, 120];
        item.interval = intervals[Math.min(timesReviewed - 1, intervals.length - 1)] || 1;
        const lastReviewed = data.lastReviewed ? new Date(data.lastReviewed) : new Date();
        const dueDate = new Date(lastReviewed);
        dueDate.setDate(dueDate.getDate() + item.interval);
        item.lastReviewedAt = lastReviewed.toISOString();
        item.dueAt = dueDate.toISOString();
        migrated.srsItems[word] = item;
      });
    }

    migrated.version = this.STATE_VERSION;
    return migrated;
  },

  loadState() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = this.migrateState(parsed);
    StateLogic.resetDailyXPIfNeeded(migrated);
    this.saveState(migrated);
    return migrated;
  },

  saveState(state) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  },

  resetState() {
    const state = this.getDefaultState();
    this.saveState(state);
    return state;
  },

  getUserData() {
    return this.loadState();
  },

  saveUserData(state) {
    this.saveState(state);
  },

  updateField(field, value) {
    const state = this.loadState();
    state[field] = value;
    this.saveState(state);
  },

  awardXP(amount) {
    const state = this.loadState();
    StateLogic.applyXp(state, amount);
    StateLogic.updateStreakForGoal(state);
    this.saveState(state);
    if (window.QuestManager && !window.QuestManager.isRewarding) {
      window.QuestManager.updateProgress('xp', amount);
    }
    return state;
  },

  completeLesson(lessonId, accuracy, passed) {
    const state = this.loadState();
    if (passed && !state.lessonsCompleted.find(entry => entry.id === lessonId)) {
      state.lessonsCompleted.push({
        id: lessonId,
        completedAt: new Date().toISOString(),
        accuracy
      });
    }
    this.saveState(state);
    if (passed && window.QuestManager) {
      window.QuestManager.updateProgress('lessons', 1);
    }
  },

  addSrsItem({ id, kind }) {
    const state = this.loadState();
    if (!state.srsItems[id]) {
      state.srsItems[id] = SRS.createItem({ id, kind, now: new Date() });
      this.saveState(state);
    }
    return state.srsItems[id];
  },

  updateSrsItem(id, isCorrect) {
    const state = this.loadState();
    const item = state.srsItems[id] || SRS.createItem({ id, kind: 'word', now: new Date() });
    state.srsItems[id] = SRS.updateItem(item, isCorrect, new Date());
    this.saveState(state);
    return state.srsItems[id];
  },

  getDueSrsItems() {
    const state = this.loadState();
    return SRS.getDueItems(Object.values(state.srsItems), new Date());
  },

  getDailyXP() {
    const state = this.loadState();
    return state.xpToday;
  },

  addDailyXP(amount) {
    const state = this.awardXP(amount);
    return state.xpToday;
  },

  addVocabulary(word, kind = 'word') {
    this.addSrsItem({ id: word, kind });
  }
};

if (typeof module !== 'undefined') {
  module.exports = Storage;
}
