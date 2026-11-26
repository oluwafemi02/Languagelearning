import { test, expect, boot } from './helpers.mjs';

test('first launch walks through onboarding to home', async ({ page }) => {
  await boot(page, { state: null });
  await expect(page.locator('#onboarding-overlay')).toBeVisible();
  await expect(page.locator('#onboarding-1 h2')).toHaveText('Sveiki!');
  await page.getByRole('button', { name: 'Pradėti (Start)' }).click();
  await page.locator('.goal-option', { hasText: '10 min' }).click();
  await expect(page.locator('.goal-option.selected')).toContainText('10 min');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.locator('#onboarding-overlay')).toBeHidden();
  await expect(page.locator('#home-screen')).toBeVisible();
  await expect(page.locator('#daily-xp-goal')).toHaveText('50');
});

test('choosing reminders during onboarding opens the reminder settings', async ({ page }) => {
  await boot(page, { state: null });
  await page.getByRole('button', { name: 'Pradėti (Start)' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Set up reminders' }).click();
  await expect(page.locator('#profile-screen')).toBeVisible();
  await expect(page.locator('#push-section')).toBeInViewport();
});
