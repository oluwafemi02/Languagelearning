// LocalStorage wrapper for user progress
const Storage = {
  // Get user data
  getUserData() {
    const data = localStorage.getItem('lithuanianLearner');
    return data ? JSON.parse(data) : this.getDefaultUserData();
  },

  // Get default user data structure
  getDefaultUserData() {
    return {
      streak: 0,
      lastStudyDate: null,
      totalXP: 0,
      lessonsCompleted: [],
      currentLesson: 1,
      vocabulary: {},
      settings: {
        dailyGoal: 50,
        soundEnabled: true,
        notificationsEnabled: true,
        reminderTime: '19:00'
      }
    };
  },

  // Save user data
  saveUserData(data) {
    localStorage.setItem('lithuanianLearner', JSON.stringify(data));
  },

  // Update specific field
  updateField(field, value) {
    const data = this.getUserData();
    data[field] = value;
    this.saveUserData(data);
  },

  // Add XP
  addXP(amount) {
    const data = this.getUserData();
    data.totalXP += amount;
    this.saveUserData(data);
    return data.totalXP;
  },

  // Mark lesson as completed
  completeLesson(lessonId, score) {
    const data = this.getUserData();
    if (!data.lessonsCompleted.find(l => l.id === lessonId)) {
      data.lessonsCompleted.push({
        id: lessonId,
        completedAt: new Date().toISOString(),
        score: score
      });
    }
    this.saveUserData(data);
  },

  // Add vocabulary word to learned list
  addVocabulary(word, strength = 1) {
    const data = this.getUserData();
    data.vocabulary[word] = {
      strength: strength,
      lastReviewed: new Date().toISOString(),
      timesReviewed: 1
    };
    this.saveUserData(data);
  },

  // Clear all data (for testing)
  clearData() {
    localStorage.removeItem('lithuanianLearner');
  }
};
