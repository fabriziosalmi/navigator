import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential execution for recording
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for demo recording
  workers: 1, // Single worker for consistent recording
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'off', // No trace needed for recording
  },

  projects: [
    {
      name: 'record-demo',
      testMatch: /record-demo\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // MUST be false for clean recording
        viewport: { width: 1920, height: 1080 }, // Full HD resolution
        launchOptions: {
          slowMo: 50, // Slow down actions by 50ms for smoother look
        },
        video: {
          mode: 'on', // Always record
          size: { width: 1920, height: 1080 },
        },
        screenshot: 'off', // No screenshots needed
      },
    },
    {
      name: 'diagnostic',
      testMatch: /diagnostic\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Browser visible for console inspection
        viewport: { width: 1920, height: 1080 },
        video: 'off',
        screenshot: 'off',
      },
    },
  ],

  // Dev server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
