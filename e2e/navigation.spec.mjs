import { test, expect, boot, tab, noSideScroll } from './helpers.mjs';

const tabs = [
  { name: 'Phrases', screen: '#sentences-screen', title: 'Phrases', ready: '.sentence-stats-grid' },
  { name: 'Practice', screen: '#practicemode-screen', title: 'Practice', ready: '.practice-mode-card' },
  { name: 'Journey', screen: '#journey-screen', title: 'Journey', ready: '#journey-start-btn' },
  { name: 'Me', screen: '#profile-screen', title: 'Lithuanian Learner', ready: '#push-section' },
];

for (const t of tabs) {
  test(`${t.name} tab opens its screen`, async ({ page }) => {
    await boot(page);
    await tab(page, t.name).click();
    await expect(page.locator(t.screen)).toBeVisible();
    await expect(page.locator(`${t.screen} h1, ${t.screen} .practice-home > h2`).first()).toHaveText(t.title);
    await expect(page.locator(`${t.screen} ${t.ready}`).first()).toBeVisible();
    await expect(tab(page, t.name)).toHaveClass(/active/);
    await expect(page.locator('#home-screen')).toBeHidden();
    await noSideScroll(page);
  });
}

test('Learn list reaches the sentence builder and scenarios, and back goes home', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Sentence builder/ }).click();
  await expect(page.locator('#sentencebuilder-screen h1')).toHaveText('Sentence builder');
  await expect(page.locator('.sentence-lesson-card').first()).toBeVisible();
  await noSideScroll(page);
  await page.locator('#sentencebuilder-screen .back').click();
  await expect(page.locator('#home-screen')).toBeVisible();

  await page.getByRole('button', { name: /Real-life scenarios/ }).click();
  await expect(page.locator('#scenario-content h2')).toHaveText('Real-life scenarios');
  await expect(page.locator('#scenario-list .lesson-card').first()).toBeVisible();
  await noSideScroll(page);
  await page.evaluate(() => App.navigateToScreen('home'));

  await page.getByRole('button', { name: /Word bank/ }).click();
  await expect(page.locator('#wordbank-screen h1')).toHaveText('Words');
  await expect(page.locator('.word-card').first()).toBeVisible();
  await page.locator('#wordbank-screen .back').click();
  await expect(page.locator('#home-screen')).toBeVisible();
});

test('dark mode uses the dark palette', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await boot(page);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(18, 32, 28)');
  const card = await page.locator('#home-screen .hero').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(card).toBe('rgb(26, 43, 38)');
  await context.close();
});

test('the narrowest iPhone (320px) has no sideways scroll on any screen', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await boot(page);
  for (const s of ['home', 'journey', 'sentences', 'practicemode', 'wordbank', 'profile', 'sentencebuilder', 'scenario']) {
    await page.evaluate((name) => App.navigateToScreen(name), s);
    await page.waitForTimeout(250);
    await noSideScroll(page, `on ${s}:`);
  }
  await context.close();
});
