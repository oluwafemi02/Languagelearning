const StateLogic = (() => {
  const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);

  const resetDailyXPIfNeeded = (state, now = new Date()) => {
    const todayKey = dateKey(now);
    if (state.lastActiveDate !== todayKey) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const lastDate = state.lastActiveDate ? new Date(`${state.lastActiveDate}T00:00:00`) : null;
      const todayDate = new Date(`${todayKey}T00:00:00`);
      const missedDays = lastDate
        ? Math.max(Math.floor((todayDate - lastDate) / oneDayMs) - 1, 0)
        : 0;

      if (state.streakCount > 0 && missedDays > 0) {
        const freezeCost = state.streakFreezeCost || 100;
        let remainingMissedDays = missedDays;

        while (
          remainingMissedDays > 0
          && state.settings?.autoUseStreakFreeze
          && state.xpTotal >= freezeCost
        ) {
          state.xpTotal -= freezeCost;
          state.streakFreezesUsed = (state.streakFreezesUsed || 0) + 1;
          remainingMissedDays -= 1;
        }

        if (remainingMissedDays > 0) {
          state.streakCount = 0;
          state.lastGoalMetDate = null;
        } else {
          const yesterday = new Date(todayDate);
          yesterday.setDate(yesterday.getDate() - 1);
          state.lastGoalMetDate = dateKey(yesterday);
        }
      }

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
    if (state.xpToday <= 0) {
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
