import { test, expect, boot, tab } from './helpers.mjs';

test('a practice session runs in focus mode and can be left', async ({ page }) => {
  await boot(page);
  await tab(page, 'Practice').click();
  await page.locator('.practice-mode-card', { hasText: 'Vocabulary Focus' }).click();
  await expect(page.locator('.practice-screen')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeHidden();
  await expect(page.locator('.practice-progress')).toContainText('1/10');

  const option = page.locator('.practice-options .answer-option').first();
  if (await option.count()) {
    await option.click();
    await page.locator('#practice-check-btn').click();
    await expect(page.locator('#practice-feedback')).toBeVisible();
    await expect(page.locator('#practice-feedback')).toHaveClass(/correct|incorrect/);
  }
  page.once('dialog', (d) => d.accept());
  await page.locator('.practice-header .close-btn').click();
  await expect(page.locator('.practice-home')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeVisible();
});

test('word bank flashcards open and close', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Word bank/ }).click();
  await page.getByRole('button', { name: 'Flashcards' }).click();
  await expect(page.locator('.learning-card')).toBeVisible();
  await expect(page.locator('#wordbank-screen h1')).toBeHidden();
  await expect(page.locator('.tabbar')).toBeHidden();
  await page.locator('.learning-header .close-btn').click();
  await expect(page.locator('.wordbank-list')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeVisible();
});
