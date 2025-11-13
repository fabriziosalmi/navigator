import { test, expect } from '@playwright/test';
import { robustGoto } from './helpers';

// Cognitive Showcase E2E
// Simulates frustration and recovery on the cognitive-showcase demo.

test.describe('Cognitive Showcase - Frustration & Recovery', () => {
  test('should transition to FRUSTRATED and back to NEUTRAL', async ({ page, baseURL }) => {
    // Arrange
  await robustGoto(page, baseURL || 'http://localhost:5173');

    const stateLocator = page.locator('[data-testid="cognitive-state"]');
  // root container; used implicitly by page interactions

    // Wait for initial neutral state
    await expect(stateLocator).toBeVisible({ timeout: 10000 });
    await expect(stateLocator).toHaveText(/neutral/i);

    // Act: Frustration - simulate invalid key presses
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('KeyX');
      await page.waitForTimeout(50);
    }

    // Assert: Wait for FRUSTRATED state
    await expect(stateLocator).toHaveText(/frustrated/i, { timeout: 5000 });

    // Also check an element that reflects the cognitive state (cognitive overlay or HUD)
    const overlay = page.locator('.state-display[data-state="frustrated"], .cognitive-overlay[data-state="frustrated"]');
    await expect(overlay.first()).toBeVisible({ timeout: 5000 });

    // Act: Recovery - press ArrowRight many times to navigate successfully
    // Need enough successful actions to drop error rate below 40%
    // With 8 errors, need 13+ successes: 8/(8+13) = 38% < 40%
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(30);
    }

    // Assert: Wait for neutral or concentrated state
    await expect(stateLocator).toHaveText(/neutral|concentrated/i, { timeout: 5000 });

    // Verify the HUD no longer indicates frustrated state
    await expect(overlay.first()).toHaveCount(0);
  });
});
