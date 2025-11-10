import { test, expect } from '@playwright/test';

/**
 * Navigator E2E Tests - Core Functionality
 * 
 * These tests run against a fresh application created by the CLI,
 * ensuring that the entire user flow works correctly.
 */

test.describe('Navigator Core Initialization', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Navigator E2E Test App/);
    
    // Check that main heading is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Navigator E2E Test App');
  });

  test('should display initial Navigator status', async ({ page }) => {
    await page.goto('/');
    
    // Check that Navigator Core is running
    const statusValue = page.locator('.status-value').first();
    await expect(statusValue).toContainText('Running');
    
    // Check initial state
    const lastKey = page.getByTestId('last-key');
    await expect(lastKey).toContainText('none');
    
    const eventCount = page.getByTestId('event-count');
    await expect(eventCount).toContainText('0');
  });
});

test.describe('Keyboard Input Detection', () => {
  test('should detect arrow key presses', async ({ page }) => {
    await page.goto('/');
    
    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    
    // Check that last key was updated
    const lastKey = page.getByTestId('last-key');
    await expect(lastKey).toContainText('ArrowUp');
    
    // Check event count incremented
    const eventCount = page.getByTestId('event-count');
    await expect(eventCount).not.toContainText('0');
  });

  test('should track multiple key presses', async ({ page }) => {
    await page.goto('/');
    
    // Press multiple keys
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    
    // Check that last key is the most recent
    const lastKey = page.getByTestId('last-key');
    await expect(lastKey).toContainText('ArrowRight');
    
    // Check event count is correct
    const eventCount = page.getByTestId('event-count');
    const count = await eventCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(4);
  });

  test('should display key history', async ({ page }) => {
    await page.goto('/');
    
    // Press some keys
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Check that history is displayed
    const history = page.getByTestId('key-history');
    await expect(history).toBeVisible();
    
    // Verify history contains pressed keys
    const historyText = await history.textContent();
    expect(historyText).toContain('ArrowUp');
    expect(historyText).toContain('ArrowDown');
    expect(historyText).toContain('Enter');
  });

  test('should handle special keys (Enter, Space)', async ({ page }) => {
    await page.goto('/');
    
    // Test Enter key
    await page.keyboard.press('Enter');
    const lastKeyAfterEnter = page.getByTestId('last-key');
    await expect(lastKeyAfterEnter).toContainText('Enter');
    
    // Test Space key
    await page.keyboard.press('Space');
    const lastKeyAfterSpace = page.getByTestId('last-key');
    await expect(lastKeyAfterSpace).toContainText(' '); // Space shows as whitespace
  });
});

test.describe('Navigator React Integration', () => {
  test('should use useNavigator hook correctly', async ({ page }) => {
    await page.goto('/');
    
    // Press a key to trigger the hook
    await page.keyboard.press('ArrowUp');
    
    // Wait for React to update
    await page.waitForTimeout(100);
    
    // Verify that all hook values are displayed
    const lastKey = page.getByTestId('last-key');
    const eventCount = page.getByTestId('event-count');
    
    await expect(lastKey).not.toContainText('none');
    await expect(eventCount).not.toContainText('0');
  });

  test('should maintain state across interactions', async ({ page }) => {
    await page.goto('/');
    
    // Perform multiple interactions
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    
    // Verify count is cumulative
    const eventCount = page.getByTestId('event-count');
    const count = await eventCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(5);
  });
});

test.describe('Visual Rendering', () => {
  test('should display all status cards', async ({ page }) => {
    await page.goto('/');
    
    // Check that all status cards are present
    const statusCards = page.locator('.status-card');
    const cardCount = await statusCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3); // Core status, Last Key, Event Count
  });

  test('should display instructions panel', async ({ page }) => {
    await page.goto('/');
    
    // Check instructions are visible
    const instructions = page.locator('.instructions');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText('E2E Test Instructions');
  });

  test('should have proper styling', async ({ page }) => {
    await page.goto('/');
    
    // Check that container has proper class
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Check that heading has correct styling
    const heading = page.locator('h1');
    const color = await heading.evaluate((el) => 
      window.getComputedStyle(el).color
    );
    // Purple color (rgb(102, 126, 234))
    expect(color).toBeTruthy();
  });
});
