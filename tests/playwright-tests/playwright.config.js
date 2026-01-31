// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Global setup to check backend test mode */
  globalSetup: require.resolve('./global-setup.js'),
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests sequentially - only one test at a time */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto(/)`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'employee',
      testMatch: /tests\/employee\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Run in headed mode to see browser execution
        slowMo: 500, // Slow down operations by 500ms to make it easier to follow
      },
    },
    {
      name: 'manager',
      testMatch: /tests\/manager\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        slowMo: 500,
      },
    },
    {
      name: 'admin',
      testMatch: /tests\/admin\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        slowMo: 500,
      },
    },
    {
      name: 'full',
      testMatch: /tests\/(employee|manager|admin)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Run in headed mode to see browser execution
        slowMo: 500, // Slow down operations by 500ms to make it easier to follow
      },
    },

    /* Branded browsers. */
    // {
    //   name: 'Microsoft Edge',   //   use: { ...devices['Desktop Edge'], channel: msedge },
    // },
    // {
    //   name: 'Google Chrome',   //   use: { ...devices['Desktop Chrome'], channel: chrome },
    // },
  ],
});
