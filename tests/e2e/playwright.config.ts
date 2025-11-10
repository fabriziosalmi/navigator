import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Navigator E2E Tests
 * 
 * This config is used by the autonomous E2E validation script.
 * The test server is managed externally by run-e2e-tests.sh,
 * not by Playwright's webServer option.
 */
export default defineConfig({
  // Test files location
  testDir: './',
  
  // Playwright test timeout
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  // Reporter configuration
  reporter: process.env.CI 
    ? [['github'], ['html']]
    : [['list'], ['html']],

  // Shared settings for all tests
  use: {
    // Base URL is set by the E2E script
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Test projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers if needed:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // NO webServer config - managed by bash script!
  // webServer: undefined,
});
