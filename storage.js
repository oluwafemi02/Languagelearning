const Storage = {
  STORAGE_KEY: 'lithuanianLearner',
  STATE_VERSION: 3,

  getDefaultState() {
    return {
      version: this.STATE_VERSION,
      xpTotal: 0,
      xpToday: 0,
      dailyGoalXP: 50,
      streakCount: 0,
      streakFreezesUsed: 0,
      streakFreezeCost: 100,
      lastActiveDate: StateLogic.dateKey(),
      lastGoalMetDate: null,
      longestStreak: 0,
      practiceDays: [],
      frozenDays: [],
      lessonsCompleted: [],
      accuracyRolling7d: 0,
      srsItems: {},
      settings: {
        soundEffects: true,
        notificationsEnabled: true,
        reminderTime: '19:00',
        nudgeTime: '21:30',
        nudgeEnabled: true,
        ignoreDiacritics: true,
        autoUseStreakFreeze: true,
        push: {
          enabled: false,
          url: '',
          deviceId: '',
          secret: '',
          lastSync: null,
          lastError: null
        }
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
    if (state.profileName !== undefined) {
      migrated.profileName = state.profileName;
    }
    if (state.lastStudyDate) {
      migrated.lastActiveDate = StateLogic.dateKey(new Date(state.lastStudyDate));
    }
    if (Array.isArray(state.lessonsCompleted)) {
      migrated.lessonsCompleted = state.lessonsCompleted;
    }
    if (state.settings) {
      migrated.settings.notificationsEnabled = state.settings.notificationsEnabled ?? migrated.settings.notificationsEnabled;
      migrated.settings.soundEffects = state.settings.soundEnabled ?? migrated.settings.soundEffects;
      migrated.settings.reminderTime = state.settings.reminderTime ?? migrated.settings.reminderTime;
      migrated.settings.autoUseStreakFreeze = state.settings.autoUseStreakFreeze ?? migrated.settings.autoUseStreakFreeze;
    }
    if (state.streakFreezeCost !== undefined) {
      migrated.streakFreezeCost = state.streakFreezeCost;
    }
    if (state.streakFreezesUsed !== undefined) {
      migrated.streakFreezesUsed = state.streakFreezesUsed;
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


  ensureStateShape(state) {
    const defaults = this.getDefaultState();
    const merged = {
      ...defaults,
      ...state,
      settings: {
        ...defaults.settings,
        ...(state.settings || {}),
        push: {
          ...defaults.settings.push,
          ...((state.settings && state.settings.push) || {})
        }
      },
      dailyQuests: {
        ...defaults.dailyQuests,
        ...(state.dailyQuests || {})
      },
      sentences: {
        ...defaults.sentences,
        ...(state.sentences || {})
      }
    };

    if (!Array.isArray(merged.lessonsCompleted)) {
      merged.lessonsCompleted = [];
    }
    if (!merged.srsItems || typeof merged.srsItems !== 'object') {
      merged.srsItems = {};
    }
    // Older saves have no practice history: rebuild it from finished lessons so the
    // week strip is not empty on first launch after the update.
    if (!Array.isArray(merged.practiceDays) || merged.practiceDays.length === 0) {
      const days = new Set();
      merged.lessonsCompleted.forEach(entry => {
        if (entry && entry.completedAt) days.add(StateLogic.dateKey(new Date(entry.completedAt)));
      });
      if (merged.lastGoalMetDate) days.add(merged.lastGoalMetDate);
      merged.practiceDays = [...days].sort().slice(-120);
    }
    if (!Array.isArray(merged.frozenDays)) merged.frozenDays = [];
    merged.longestStreak = Math.max(merged.longestStreak || 0, merged.streakCount || 0);

    return merged;
  },

  loadState() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const migrated = this.migrateState(parsed);
    const normalized = this.ensureStateShape(migrated);
    if (!normalized.localDayKeys) {
      if (parsed) StateLogic.migrateUtcDayKeys(normalized);
      normalized.localDayKeys = true;
    }
    StateLogic.resetDailyXPIfNeeded(normalized);
    this.saveState(normalized);
    return normalized;
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
    // Tell the reminder server you practised, so tonight's reminder is skipped.
    if (window.NotificationManager) {
      window.NotificationManager.scheduleSync();
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
