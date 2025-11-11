import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Issue #2: Keyboard Events Not Captured
 * 
 * Priority: CRITICA
 * 
 * Expected Behavior:
 * When the user presses any key, the keyboard plugin should capture the event
 * and update the UI showing:
 * - The last key pressed (lastKey)
 * - The event counter incremented
 * 
 * Current Bug:
 * Pressed keys are not captured. The `lastKey` value remains "none" and
 * the counter stays at 0, even after pressing keys.
 * 
 * This test should FAIL initially, proving the bug exists.
 * After fixing the code, this test should PASS.
 */

test.describe('Issue #2: Keyboard Events Not Captured', () => {
  test('should capture arrow key presses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press ArrowUp key
    await page.keyboard.press('ArrowUp');
    
    // Wait for event processing
    await page.waitForTimeout(200);
    
    // CRITICAL ASSERTION: lastKey should be updated
    const lastKey = page.getByTestId('last-key');
    
    // This assertion should FAIL with current code
    await expect(lastKey).toContainText('ArrowUp', {
      timeout: 2000
    });
    
    // Should NOT still be "none"
    await expect(lastKey).not.toContainText('none');
  });

  test('should increment event counter on each key press', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial count
    const eventCount = page.getByTestId('event-count');
    const initialCount = parseInt(await eventCount.textContent() || '0');
    
    // Press 3 keys
    await page.keyboard.press('a');
    await page.waitForTimeout(100);
    await page.keyboard.press('b');
    await page.waitForTimeout(100);
    await page.keyboard.press('c');
    await page.waitForTimeout(100);
    
    // Get final count
    const finalCount = parseInt(await eventCount.textContent() || '0');
    
    // This should FAIL if events aren't captured
    expect(finalCount).toBe(initialCount + 3);
  });

  test('should capture different types of keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const keysToTest = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'a',
      '1'
    ];
    
    for (const key of keysToTest) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
      
      const lastKey = page.getByTestId('last-key');
      
      // Each key should be captured and displayed
      // This will FAIL for all keys if keyboard plugin isn't working
      await expect(lastKey).toContainText(key, {
        timeout: 1000
      });
    }
  });

  test('should update lastKey immediately after key press', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const lastKey = page.getByTestId('last-key');
    
    // Verify initial state
    await expect(lastKey).toContainText('none');
    
    // Press a key
    await page.keyboard.press('x');
    
    // The update should be almost immediate (within 500ms)
    await expect(lastKey).toContainText('x', {
      timeout: 500
    });
    
    // Press another key
    await page.keyboard.press('y');
    
    // Should update to new key
    await expect(lastKey).toContainText('y', {
      timeout: 500
    });
  });

  test('should handle continuous key presses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const eventCount = page.getByTestId('event-count');
    
    // Press 10 keys rapidly
    const numKeys = 10;
    for (let i = 0; i < numKeys; i++) {
      await page.keyboard.press('a');
      await page.waitForTimeout(50); // Small delay between presses
    }
    
    // Wait for all events to be processed
    await page.waitForTimeout(500);
    
    // Get final count
    const finalCount = parseInt(await eventCount.textContent() || '0');
    
    // Should have captured all events (or at least most of them)
    // This test is more forgiving, allowing for some event loss in rapid succession
    expect(finalCount).toBeGreaterThanOrEqual(numKeys * 0.8); // At least 80% captured
  });
});
