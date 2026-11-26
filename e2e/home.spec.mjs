import { test, expect, boot, tab, noSideScroll, day } from './helpers.mjs';

test('home shows the streak, the week and today\'s goal', async ({ page }) => {
  await boot(page);
  await expect(page.locator('#home-greeting')).toHaveText('Labas rytas!');
  await expect(page.locator('#home-date')).toHaveText('Thursday 26 November');
  await expect(page.locator('#streak-card-count')).toHaveText('4');
  await expect(page.locator('#streak-count')).toHaveText('4');
  await expect(page.locator('#streak-today-status')).toHaveText('Practise today to keep your 4-day streak.');
  await expect(page.locator('#streak-best')).toHaveText('9');
  await expect(page.locator('#daily-xp-goal')).toHaveText('50');
  await expect(page.locator('#hero-due')).toHaveText('1');

  const days = page.locator('#streak-week .streak-day');
  await expect(days).toHaveCount(7);
  await expect(days.nth(6)).toHaveClass(/today/);
  await expect(days.nth(6)).toHaveClass(/missed/);
  await expect(days.nth(5)).toHaveClass(/done/);
  await expect(days.nth(1)).toHaveClass(/missed/); // 5 days ago was skipped
  await expect(days.locator('.streak-day-label')).toHaveText(['Pn', 'Š', 'S', 'Pr', 'A', 'T', 'K']);

  await expect(page.locator('#review-section')).toBeVisible();
  await expect(page.locator('#lesson-path .unit').first().locator('.lesson-card.completed')).toHaveCount(2);
  await expect(page.locator('#lesson-path .lesson-card.current')).toHaveCount(1);
  await expect(tab(page, 'Home')).toHaveClass(/active/);
  await noSideScroll(page);
});

test('Practise now opens the due review in focus mode', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Practise now' }).click();
  await expect(page.locator('#lesson-screen')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeHidden();
  await expect(page.locator('#question-container .question')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.locator('#exit-lesson-btn').click();
  await expect(page.locator('#home-screen')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeVisible();
});

test('a new learner sees a fresh start, not a broken streak', async ({ page }) => {
  await boot(page, { state: { version: 3, onboardingCompleted: true, lastActiveDate: day(0), localDayKeys: true, settings: {} } });
  await expect(page.locator('#streak-card-count')).toHaveText('0');
  await expect(page.locator('#streak-today-status')).toHaveText('Practise today to start a streak.');
  await expect(page.locator('#review-section')).toBeHidden();
});
