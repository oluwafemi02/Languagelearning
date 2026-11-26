const assert = require('assert');
const StateLogic = require('../state-logic');
const SRS = require('../srs');

const runTest = (name, fn) => {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

runTest('daily XP resets when date changes', () => {
  const state = {
    xpTotal: 100,
    xpToday: 30,
    dailyGoalXP: 50,
    streakCount: 0,
    lastActiveDate: '2024-01-01',
    settings: { autoUseStreakFreeze: true }
  };
  const now = new Date('2024-01-02T10:00:00Z');
  StateLogic.resetDailyXPIfNeeded(state, now);
  assert.strictEqual(state.xpToday, 0);
  assert.strictEqual(state.lastActiveDate, '2024-01-02');
});

runTest('streak increments when user practices on consecutive days', () => {
  const state = {
    xpTotal: 0,
    xpToday: 10,
    dailyGoalXP: 50,
    streakCount: 2,
    lastActiveDate: '2024-01-03',
    lastGoalMetDate: '2024-01-02'
  };
  const now = new Date('2024-01-03T12:00:00Z');
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.streakCount, 3);
  assert.strictEqual(state.lastGoalMetDate, '2024-01-03');
});

runTest('streak freeze spends XP and preserves streak after missed day', () => {
  const state = {
    xpTotal: 250,
    xpToday: 20,
    dailyGoalXP: 50,
    streakCount: 4,
    streakFreezeCost: 100,
    streakFreezesUsed: 0,
    lastActiveDate: '2024-01-02',
    lastGoalMetDate: '2024-01-02',
    settings: { autoUseStreakFreeze: true }
  };
  const now = new Date('2024-01-04T12:00:00Z');
  StateLogic.resetDailyXPIfNeeded(state, now);
  StateLogic.applyXp(state, 20, now);
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.xpTotal, 170);
  assert.strictEqual(state.streakFreezesUsed, 1);
  assert.strictEqual(state.streakCount, 5);
  assert.strictEqual(state.lastGoalMetDate, '2024-01-04');
});

runTest('streak resets when missed day and freeze unavailable', () => {
  const state = {
    xpTotal: 30,
    xpToday: 20,
    dailyGoalXP: 50,
    streakCount: 4,
    streakFreezeCost: 100,
    streakFreezesUsed: 0,
    lastActiveDate: '2024-01-02',
    lastGoalMetDate: '2024-01-02',
    settings: { autoUseStreakFreeze: true }
  };
  const now = new Date('2024-01-04T12:00:00Z');
  StateLogic.resetDailyXPIfNeeded(state, now);
  StateLogic.applyXp(state, 20, now);
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.streakCount, 1);
});

runTest('opening the app without practising does not hide a missed day', () => {
  const state = {
    xpTotal: 0, xpToday: 0, dailyGoalXP: 50, streakCount: 6,
    lastActiveDate: '2024-01-02', // opened on the 2nd, did nothing
    lastGoalMetDate: '2024-01-01',
    settings: { autoUseStreakFreeze: true }
  };
  StateLogic.resetDailyXPIfNeeded(state, new Date(2024, 0, 3, 12));
  assert.strictEqual(state.streakCount, 0);
  assert.deepStrictEqual(state.lastStreakLost, { length: 6, date: '2024-01-03' });
});

runTest('a freeze covers a day the app was opened but not used, only once', () => {
  const state = {
    xpTotal: 150, xpToday: 0, dailyGoalXP: 50, streakCount: 6, streakFreezeCost: 100,
    lastActiveDate: '2024-01-02', lastGoalMetDate: '2024-01-01',
    settings: { autoUseStreakFreeze: true }
  };
  const now = new Date(2024, 0, 3, 12);
  StateLogic.resetDailyXPIfNeeded(state, now);
  StateLogic.resetDailyXPIfNeeded(state, now);
  assert.strictEqual(state.streakCount, 6);
  assert.strictEqual(state.xpTotal, 50);
  assert.strictEqual(state.streakFreezesUsed, 1);
  assert.deepStrictEqual(state.frozenDays, ['2024-01-02']);
  StateLogic.applyXp(state, 10, now);
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.streakCount, 7);
  assert.strictEqual(state.longestStreak, 7);
});

runTest('practice just after midnight counts for the new local day', () => {
  const state = {
    xpTotal: 0, xpToday: 0, dailyGoalXP: 50, streakCount: 3,
    lastActiveDate: '2024-01-02', lastGoalMetDate: '2024-01-02', settings: {}
  };
  const now = new Date(2024, 0, 3, 0, 30); // 00:30 local time
  StateLogic.applyXp(state, 10, now);
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.lastGoalMetDate, '2024-01-03');
  assert.strictEqual(state.streakCount, 4);
});

runTest('daylight saving change does not break the streak', () => {
  const state = {
    xpTotal: 0, xpToday: 0, dailyGoalXP: 50, streakCount: 10,
    lastActiveDate: '2024-03-30', lastGoalMetDate: '2024-03-30', settings: {}
  };
  const now = new Date(2024, 2, 31, 9); // clocks go forward overnight in Europe
  StateLogic.applyXp(state, 10, now);
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.streakCount, 11);
  assert.strictEqual(StateLogic.daysBetween('2024-10-26', '2024-10-28'), 2);
});

runTest('week strip shows practised, frozen and missed days', () => {
  const state = { practiceDays: ['2024-01-01', '2024-01-03'], frozenDays: ['2024-01-02'] };
  const days = StateLogic.recentDays(state, new Date(2024, 0, 4, 12), 4);
  assert.deepStrictEqual(days.map(d => d.status), ['done', 'frozen', 'done', 'missed']);
  assert.strictEqual(days[3].isToday, true);
  assert.strictEqual(StateLogic.practicedToday({ lastGoalMetDate: '2024-01-04', xpToday: 5 }, new Date(2024, 0, 4, 12)), true);
});

runTest('old UTC day keys get one day of grace east of UTC', () => {
  const now = new Date(2024, 0, 4, 9);
  const state = { streakCount: 5, lastGoalMetDate: '2024-01-02', practiceDays: ['2024-01-02'] };
  StateLogic.migrateUtcDayKeys(state, now);
  if (now.getTimezoneOffset() < 0) {
    assert.strictEqual(state.lastGoalMetDate, '2024-01-03');
  } else {
    assert.strictEqual(state.lastGoalMetDate, '2024-01-02');
  }
  const longGone = { streakCount: 5, lastGoalMetDate: '2023-12-20' };
  StateLogic.migrateUtcDayKeys(longGone, now);
  assert.strictEqual(longGone.lastGoalMetDate, '2023-12-20');
});

runTest('SRS updates interval after correct answer', () => {
  const item = SRS.createItem({ id: 'labas', kind: 'word', now: new Date('2024-01-01T00:00:00Z') });
  const updated = SRS.updateItem(item, true, new Date('2024-01-01T00:00:00Z'));
  assert.strictEqual(updated.interval, 1);
  assert.ok(updated.correctStreak >= 1);
});

runTest('SRS resets interval after incorrect answer', () => {
  const item = {
    ...SRS.createItem({ id: 'labas', kind: 'word', now: new Date('2024-01-01T00:00:00Z') }),
    interval: 7,
    correctStreak: 3,
    box: 3
  };
  const updated = SRS.updateItem(item, false, new Date('2024-01-02T00:00:00Z'));
  assert.strictEqual(updated.interval, 1);
  assert.strictEqual(updated.correctStreak, 0);
  assert.strictEqual(updated.box, 1);
});

runTest('lesson unlock requires previous lesson completion', () => {
  const completed = [{ id: 1 }];
  assert.strictEqual(StateLogic.isLessonUnlocked(completed, 0), true);
  assert.strictEqual(StateLogic.isLessonUnlocked(completed, 1), true);
  assert.strictEqual(StateLogic.isLessonUnlocked(completed, 2), false);
});
