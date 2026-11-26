import { test, expect, boot, tab, learner, day, noSideScroll } from './helpers.mjs';

test('starting the journey shows week 1, its phrases and tasks', async ({ page }) => {
  await boot(page);
  await expect(page.locator('#home-journey-card')).toContainText('Speak Lithuanian in 12 weeks');
  await tab(page, 'Journey').click();
  await expect(page.locator('.j-intro')).toContainText('Speak Lithuanian in 12 weeks');
  await expect(page.locator('.j-week')).toHaveCount(12);
  await page.getByRole('button', { name: 'Start my journey today' }).click();

  await expect(page.locator('.j-current .j-kicker')).toHaveText('Week 1 of 12 · Day 1 · Foundations');
  await expect(page.locator('.j-current .j-hero-title')).toHaveText('Sounds and first words');
  // The learner already finished lesson 1, so that task is done by the app.
  await expect(page.locator('#journey-week-progress')).toHaveText('1 / 5 tasks');
  const week1 = page.locator('#journey-week-1');
  await expect(week1.locator('.j-phrases li')).toHaveCount(7);
  await expect(week1.locator('.j-phrases li').first()).toContainText('Labas!');
  await expect(week1.locator('.j-task').first()).toHaveClass(/done/);
  await noSideScroll(page);

  await week1.getByRole('checkbox', { name: /Read the alphabet/ }).click();
  await expect(page.locator('#journey-week-progress')).toHaveText('2 / 5 tasks');
  await expect(week1.getByRole('checkbox', { name: /Read the alphabet/ })).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await tab(page, 'Journey').click();
  await expect(page.locator('#journey-week-progress')).toHaveText('2 / 5 tasks');
  await tab(page, 'Home').click();
  await expect(page.locator('#home-journey-card')).toContainText('Week 1: Sounds and first words');
  await expect(page.locator('#home-journey-card')).toContainText('2 of 5 tasks done this week');
});

test('the current week follows the calendar, and a task opens its lesson', async ({ page }) => {
  await boot(page, { state: learner({ journey: { startedAt: day(-16), done: {} } }) });
  await tab(page, 'Journey').click();
  await expect(page.locator('.j-current .j-kicker')).toHaveText('Week 3 of 12 · Day 17 · Foundations');
  await expect(page.locator('#journey-week-3')).toHaveClass(/current/);
  await expect(page.locator('#journey-week-3 .j-week-body')).toBeVisible();
  // Week 3 starts with lesson 2, which the learner finished.
  await expect(page.locator('#journey-week-3 .j-task').first()).toHaveClass(/done/);

  await page.locator('#journey-week-6 .j-week-row').click();
  await expect(page.locator('#journey-week-6 .j-week-body')).toContainText('Kur yra stotis?');
  await page.locator('#journey-week-6 .j-task', { hasText: 'lesson 4' }).getByRole('button', { name: 'Open' }).click();
  await expect(page.locator('#lesson-screen')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeHidden();
});

test('the app version is shown under Me', async ({ page }) => {
  await boot(page);
  await tab(page, 'Me').click();
  const version = await page.evaluate(() => APP_VERSION);
  await expect(page.locator('#app-version')).toContainText(`Version ${version}`);
});
