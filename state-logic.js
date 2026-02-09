const StateLogic = (() => {
  const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);

  const resetDailyXPIfNeeded = (state, now = new Date()) => {
    const todayKey = dateKey(now);
    if (state.lastActiveDate !== todayKey) {
      state.xpToday = 0;
      state.lastActiveDate = todayKey;
    }
    return state;
  };

  const applyXp = (state, amount, now = new Date()) => {
    resetDailyXPIfNeeded(state, now);
    state.xpTotal += amount;
    state.xpToday += amount;
    return state;
  };

  const updateStreakForGoal = (state, now = new Date()) => {
    resetDailyXPIfNeeded(state, now);
    const todayKey = dateKey(now);
    if (state.xpToday < state.dailyGoalXP) {
      return state;
    }
    if (state.lastGoalMetDate === todayKey) {
      return state;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = dateKey(yesterday);

    if (state.lastGoalMetDate === yesterdayKey) {
      state.streakCount += 1;
    } else {
      state.streakCount = 1;
    }
    state.lastGoalMetDate = todayKey;
    return state;
  };

  const isLessonUnlocked = (lessonsCompleted, lessonIndex) => {
    if (lessonIndex === 0) return true;
    const completedIds = new Set(lessonsCompleted.map(entry => entry.id));
    return completedIds.has(lessonIndex);
  };

  return {
    dateKey,
    resetDailyXPIfNeeded,
    applyXp,
    updateStreakForGoal,
    isLessonUnlocked
  };
})();

if (typeof module !== 'undefined') {
  module.exports = StateLogic;
}
