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
    lastActiveDate: '2024-01-01'
  };
  const now = new Date('2024-01-02T10:00:00Z');
  StateLogic.resetDailyXPIfNeeded(state, now);
  assert.strictEqual(state.xpToday, 0);
  assert.strictEqual(state.lastActiveDate, '2024-01-02');
});

runTest('streak increments only when daily goal met on consecutive days', () => {
  const state = {
    xpTotal: 0,
    xpToday: 50,
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

runTest('streak resets when goal missed the previous day', () => {
  const state = {
    xpTotal: 0,
    xpToday: 50,
    dailyGoalXP: 50,
    streakCount: 4,
    lastActiveDate: '2024-01-06',
    lastGoalMetDate: '2024-01-04'
  };
  const now = new Date('2024-01-06T12:00:00Z');
  StateLogic.updateStreakForGoal(state, now);
  assert.strictEqual(state.streakCount, 1);
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
