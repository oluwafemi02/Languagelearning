const StateLogic = (() => {
  const pad = (n) => String(n).padStart(2, '0');

  // Calendar day in the phone's own time zone (not UTC), so practice just after
  // midnight in Vilnius counts for the new day.
  const dateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  // Whole days from key a to key b, immune to daylight saving changes.
  const daysBetween = (a, b) => {
    const toUtc = (key) => {
      const [y, m, d] = key.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUtc(b) - toUtc(a)) / 86400000);
  };

  const shiftKey = (key, days) => {
    const [y, m, d] = key.split('-').map(Number);
    return dateKey(new Date(y, m - 1, d + days));
  };

  const PRACTICE_HISTORY_DAYS = 120;

  const remember = (list, key) => {
    const next = Array.isArray(list) ? list.filter(k => k !== key) : [];
    next.push(key);
    next.sort();
    return next.slice(-PRACTICE_HISTORY_DAYS);
  };

  // Settles the streak for days that passed without practice. The gap is measured from
  // the last day you practised (lastGoalMetDate), not from the last time the app was
  // opened, so opening the app without practising no longer hides a missed day.
  const settleStreak = (state, now = new Date()) => {
    const todayKey = dateKey(now);
    if (!state.streakCount || !state.lastGoalMetDate) {
      return state;
    }
    const missedDays = daysBetween(state.lastGoalMetDate, todayKey) - 1;
    if (missedDays <= 0) {
      return state;
    }

    const freezeCost = state.streakFreezeCost || 100;
    const frozen = [];
    while (
      frozen.length < missedDays
      && state.settings?.autoUseStreakFreeze
      && state.xpTotal >= freezeCost
    ) {
      state.xpTotal -= freezeCost;
      state.streakFreezesUsed = (state.streakFreezesUsed || 0) + 1;
      frozen.push(shiftKey(state.lastGoalMetDate, frozen.length + 1));
    }

    if (frozen.length < missedDays) {
      state.lastStreakLost = { length: state.streakCount, date: todayKey };
      state.streakCount = 0;
      state.lastGoalMetDate = null;
    } else {
      frozen.forEach(key => { state.frozenDays = remember(state.frozenDays, key); });
      state.lastGoalMetDate = shiftKey(todayKey, -1);
    }
    return state;
  };

  // One-time fix for saves made before day keys were local. Older versions stored UTC
  // dates, so east of UTC (Lithuania is UTC+2/+3) practice between local midnight and
  // UTC midnight was saved under the previous day. If that would now look like a missed
  // day, give the benefit of the doubt once by moving it forward a day.
  const migrateUtcDayKeys = (state, now = new Date()) => {
    const eastOfUtc = now.getTimezoneOffset() < 0;
    if (!eastOfUtc || !state.streakCount || !state.lastGoalMetDate) return state;
    const todayKey = dateKey(now);
    if (daysBetween(state.lastGoalMetDate, todayKey) === 2) {
      const shifted = shiftKey(state.lastGoalMetDate, 1);
      state.lastGoalMetDate = shifted;
      state.practiceDays = remember(state.practiceDays, shifted);
    }
    return state;
  };

  const resetDailyXPIfNeeded = (state, now = new Date()) => {
    const todayKey = dateKey(now);
    settleStreak(state, now);
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

  // Any practice that earns XP keeps the streak alive for today.
  const updateStreakForGoal = (state, now = new Date()) => {
    resetDailyXPIfNeeded(state, now);
    const todayKey = dateKey(now);
    if (state.xpToday <= 0) {
      return state;
    }
    state.practiceDays = remember(state.practiceDays, todayKey);
    if (state.lastGoalMetDate === todayKey) {
      return state;
    }

    if (state.lastGoalMetDate === shiftKey(todayKey, -1)) {
      state.streakCount += 1;
    } else {
      state.streakCount = 1;
    }
    state.longestStreak = Math.max(state.longestStreak || 0, state.streakCount);
    state.lastGoalMetDate = todayKey;
    return state;
  };

  const practicedToday = (state, now = new Date()) => state.lastGoalMetDate === dateKey(now) && state.xpToday > 0;

  // The last `days` calendar days, oldest first, for the week strip on the home screen.
  const recentDays = (state, now = new Date(), days = 7) => {
    const todayKey = dateKey(now);
    const practised = new Set(state.practiceDays || []);
    const frozen = new Set(state.frozenDays || []);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = shiftKey(todayKey, -i);
      const [y, m, d] = key.split('-').map(Number);
      out.push({
        key,
        weekday: new Date(y, m - 1, d).getDay(),
        isToday: i === 0,
        status: practised.has(key) ? 'done' : frozen.has(key) ? 'frozen' : 'missed'
      });
    }
    return out;
  };

  const isLessonUnlocked = (lessonsCompleted, lessonIndex) => {
    if (lessonIndex === 0) return true;

    // Primary unlock rule: linear path progression by completion count.
    // This supports numeric IDs, string IDs, and generated lessons.
    if ((lessonsCompleted || []).length >= lessonIndex) return true;

    // Backward compatibility for older saved states that tracked numeric IDs.
    const completedIds = new Set((lessonsCompleted || []).map(entry => entry.id));
    return completedIds.has(lessonIndex);
  };

  return {
    dateKey,
    daysBetween,
    shiftKey,
    settleStreak,
    migrateUtcDayKeys,
    resetDailyXPIfNeeded,
    applyXp,
    updateStreakForGoal,
    practicedToday,
    recentDays,
    isLessonUnlocked
  };
})();

if (typeof module !== 'undefined') {
  module.exports = StateLogic;
}
