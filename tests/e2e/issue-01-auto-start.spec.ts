import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Issue #1: Navigator Auto-Start Failure
 * 
 * Priority: CRITICA
 * 
 * Expected Behavior:
 * When the application loads, the Navigator Core should auto-start automatically
 * and display "Running" status in the UI.
 * 
 * Current Bug:
 * The application loads with status "⏸️ Stopped" instead of "▶️ Running".
 * The Navigator does not auto-start, requiring manual user action.
 * 
 * This test should FAIL initially, proving the bug exists.
 * After fixing the code, this test should PASS.
 */

test.describe('Issue #1: Navigator Auto-Start Failure', () => {
  test('Navigator should auto-start on page load', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Give the Navigator a moment to initialize and auto-start
    await page.waitForTimeout(500);
    
    // CRITICAL ASSERTION: The Navigator should be in "Running" state
    const statusValue = page.locator('.status-value').first();
    
    // This assertion should FAIL with current code
    await expect(statusValue).toContainText('Running', {
      timeout: 5000
    });
    
    // Double-check: Should NOT be in Stopped state
    await expect(statusValue).not.toContainText('Stopped');
  });

  test('Navigator should be ready to accept input immediately', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // If Navigator auto-starts, it should be ready to process events
    // Try pressing a key immediately
    await page.keyboard.press('ArrowUp');
    
    // Wait for event processing
    await page.waitForTimeout(200);
    
    // The event counter should be > 0 if Navigator is running
    const eventCount = page.getByTestId('event-count');
    const countText = await eventCount.textContent();
    const count = parseInt(countText || '0');
    
    // This should FAIL if Navigator doesn't auto-start
    expect(count).toBeGreaterThan(0);
  });

  test('Navigator status should transition from initializing to running', async ({ page }) => {
    // This test verifies the initialization sequence
    await page.goto('/');
    
    // Initially, we might see "Initializing" or immediately "Running"
    const statusValue = page.locator('.status-value').first();
    
    // Wait up to 2 seconds for the status to become "Running"
    await expect(statusValue).toContainText('Running', {
      timeout: 2000
    });
    
    // Verify it stays in Running state
    await page.waitForTimeout(1000);
    await expect(statusValue).toContainText('Running');
  });
});
