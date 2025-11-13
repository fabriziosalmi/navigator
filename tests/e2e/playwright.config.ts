import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Navigator E2E Tests
 *
 * This config defines two logical Playwright projects that correspond
 * to two different apps we run in the monorepo. Each project uses the
 * Desktop Chrome device and overrides `use.baseURL` to the right port.
 *
 * The bash runner is responsible for starting the right server/port
 * before invoking Playwright. We keep trace/video/screenshot settings
 * so failures are well-instrumented.
 */
export default defineConfig({
  // Test files location
  testDir: './',

  // Playwright test timeout
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1, // Enable 1 retry to capture trace on failure
  workers: 1,

  // Reporter configuration
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],

  // Shared settings for all tests
  use: {
    // Default base URL (will usually be overridden per project)
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // Debug artifacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // Define two logical projects (each uses Desktop Chrome)
  projects: [
    // Project for the validation app (react-test-app / temp-e2e-app)
    {
      name: 'ReactTestApp',
      testMatch: /navigator-core\.spec\.ts|issue-\d+.*\.spec\.ts|keyboard-navigation\.spec\.js|adaptive-system\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
    },

    // Project for the cognitive-showcase demo
    {
      name: 'CognitiveShowcase',
      testMatch: /cognitive-showcase\.spec\.ts|cognitive-showcase\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
    },
  ],

  // No webServer: servers are started by our bash runner so we can control
  // the exact dev/prod process and logging behavior used in CI.
});
