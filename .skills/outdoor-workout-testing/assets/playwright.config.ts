import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Outdoor Workout Spots PWA
 * Optimized for Next.js app with MapLibre, TanStack Query, and infinite scroll
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure for debugging */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'mobile',
      use: { ...devices['iPhone 13 Pro'] },
    },

    {
      name: 'mobile-android',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },

    /* Uncomment to test other browsers */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Next.js to start
  },

  /* Global timeout for each test */
  timeout: 60 * 1000, // 60 seconds

  /* Timeout for each assertion */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },
});
