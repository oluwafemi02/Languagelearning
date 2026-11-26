import { test, expect, boot, tab, learner } from './helpers.mjs';

test('reminders explain the Home Screen step in iPhone Safari', async ({ page }) => {
  await boot(page);
  await tab(page, 'Me').click();
  await expect(page.locator('#push-status')).toContainText('Add this app to your Home Screen first');
  await expect(page.locator('#push-connect-btn')).toBeDisabled();
});

test('settings save and survive a reload', async ({ page }) => {
  await boot(page);
  await tab(page, 'Me').click();
  await page.locator('label.toggle', { hasText: 'Nudge if my streak is at risk' }).click();
  await page.locator('#profile-reminder-time').fill('08:15');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.locator('#profile-settings-status')).toContainText('Settings saved');

  await page.reload();
  await page.waitForFunction(() => typeof App !== 'undefined' && App.lessons.length);
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('lithuanianLearner')).settings);
  expect(s.nudgeEnabled).toBe(false);
  expect(s.reminderTime).toBe('08:15');
});

test('profile shows level, totals and achievements', async ({ page }) => {
  await boot(page, { state: learner() });
  await tab(page, 'Me').click();
  await expect(page.locator('#profile-xp')).toHaveText('340');
  await expect(page.locator('#profile-lessons')).toHaveText('2');
  await expect(page.locator('#profile-recent-list li')).toHaveCount(2);
  await expect(page.locator('#achievements-container .achievement-card').first()).toBeVisible();
});
