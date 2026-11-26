// Shared setup: fixed clock, seeded progress, and a check that the page logs no errors.
import { test as base, expect } from '@playwright/test';

// Thursday 26 Nov 2026, 10:00 in Vilnius.
export const NOW = new Date('2026-11-26T10:00:00+02:00');

const day = (offset) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Vilnius' });
};
export { day };

export const test = base.extend({
  errors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource|ERR_|speechSynthesis/i.test(m.text())) errors.push(`console: ${m.text()}`);
    });
    await use(errors);
    expect(errors, 'no errors in the page').toEqual([]);
  }, { auto: true }],
});
export { expect };

// A learner on a 4-day streak who practised yesterday but not yet today.
export function learner(overrides = {}) {
  return {
    version: 3,
    xpTotal: 340,
    xpToday: 0,
    dailyGoalXP: 50,
    streakCount: 4,
    longestStreak: 9,
    lastActiveDate: day(-1),
    lastGoalMetDate: day(-1),
    localDayKeys: true,
    lessonsCompleted: [
      { id: 1, completedAt: NOW.toISOString(), accuracy: 90 },
      { id: 2, completedAt: NOW.toISOString(), accuracy: 80 },
    ],
    srsItems: {
      labas: { id: 'labas', kind: 'word', ease: 2.5, interval: 1, dueAt: '2026-01-01T00:00:00Z', correctStreak: 1, incorrectCount: 0, box: 1 },
    },
    practiceDays: [day(-6), day(-4), day(-3), day(-2), day(-1)],
    onboardingCompleted: true,
    settings: { notificationsEnabled: true, reminderTime: '19:00', autoUseStreakFreeze: true },
    ...overrides,
  };
}

export async function boot(page, { state = learner(), now = NOW, path = 'index.html' } = {}) {
  await page.clock.setFixedTime(now);
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    if (data) localStorage.setItem('lithuanianLearner', JSON.stringify(data));
  }, state);
  await page.goto(path);
  await page.waitForFunction(() => typeof App !== 'undefined' && (document.querySelector('#lesson-path .lesson-card') || !document.getElementById('onboarding-overlay').classList.contains('hidden')));
}

export const tab = (page, name) => page.locator('.tabbar').getByRole('button', { name, exact: true });

// The page must never scroll sideways at phone width.
export async function noSideScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no horizontal overflow').toBeLessThanOrEqual(0);
}
