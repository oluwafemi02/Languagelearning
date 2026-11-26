import { test, expect, boot } from './helpers.mjs';

// Answers the current exercise correctly through the UI where possible.
async function answerCorrectly(page) {
  const answer = await page.evaluate(() => LessonManager.currentLesson.exercises[LessonManager.currentExercise].answer);
  const option = page.locator('#answer-options .answer-option', { hasText: new RegExp(`^\\s*${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });
  if (await option.count()) {
    await option.first().click();
  } else if (await page.locator('#typing-answer').count()) {
    await page.locator('#typing-answer').fill(answer);
  } else {
    await page.evaluate((a) => { LessonManager.selectedAnswer = a; document.getElementById('check-answer-btn').disabled = false; }, answer);
  }
  await page.locator('#check-answer-btn').click();
}

test('finishing a lesson completes today and extends the streak', async ({ page }) => {
  await boot(page);
  await page.locator('#lesson-path .lesson-card.current').click();
  await expect(page.locator('#lesson-screen')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeHidden();

  const total = await page.evaluate(() => LessonManager.currentLesson.exercises.length);
  for (let i = 0; i < total; i++) {
    await answerCorrectly(page);
    await expect(page.locator('#feedback-panel')).toHaveClass(/correct/);
    await expect(page.locator('#feedback-title')).toContainText('Teisingai');
    await page.locator('#continue-btn').click();
  }

  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#accuracy')).toContainText('100');
  await page.locator('#continue-learning-btn').click();

  await expect(page.locator('#home-screen')).toBeVisible();
  await expect(page.locator('#streak-card-count')).toHaveText('5');
  await expect(page.locator('#streak-today-status')).toHaveText('Done for today. Puiku! 🔥');
  await expect(page.locator('#streak-week .streak-day').nth(6)).toHaveClass(/done/);
  await expect(page.locator('#lesson-path .lesson-card.completed')).toHaveCount(3);
});

test('a wrong answer shows the correct one in a red sheet', async ({ page }) => {
  await boot(page);
  await page.locator('#lesson-path .lesson-card.current').click();
  await expect(page.locator('#question-container .question')).toBeVisible();
  const ex = await page.evaluate(() => LessonManager.currentLesson.exercises[0]);
  const wrong = (ex.options || []).find((o) => o !== ex.answer);
  test.skip(!wrong, 'first exercise has no options');
  await page.locator('#answer-options .answer-option', { hasText: wrong }).first().click();
  await page.locator('#check-answer-btn').click();
  await expect(page.locator('#feedback-panel')).toHaveClass(/incorrect/);
  await expect(page.locator('#feedback-message')).toContainText(ex.answer);
  await expect(page.locator('#feedback-panel')).toBeInViewport();
});
