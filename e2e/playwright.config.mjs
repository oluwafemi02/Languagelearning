// End-to-end tests at iPhone size. Run: npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

const phone = { ...devices['iPhone 13'], timezoneId: 'Europe/Vilnius', locale: 'en-GB' };
const chromium = process.env.CHROME_PATH
  ? { launchOptions: { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } }
  : {};

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.mjs/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8090/Languagelearning/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'iphone-chromium', use: { ...phone, browserName: 'chromium', ...chromium } },
    ...(process.env.SKIP_WEBKIT ? [] : [{ name: 'iphone-webkit', use: { ...phone, browserName: 'webkit' } }]),
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'node e2e/serve.mjs',
    cwd: '..',
    url: 'http://localhost:8090/Languagelearning/',
    reuseExistingServer: true,
  },
});
