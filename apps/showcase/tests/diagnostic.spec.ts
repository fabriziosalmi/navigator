import { test, expect, Page } from '@playwright/test';

/**
 * 🔍 DIAGNOSTIC TEST
 * 
 * Simplified test to observe cognitive loop behavior via console logs.
 * This test doesn't assert on state changes, it only simulates actions
 * and lets us observe the diagnostic probes.
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Simulate concentrated user behavior - fast, precise arrow key presses
 */
const actConcentrated = async (page: Page, repetitions = 15) => {
  console.log('🎬 SIMULATING: Concentrated state...');
  for (let i = 0; i < repetitions; i++) {
    const key = i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
};

/**
 * Simulate frustrated user behavior - random invalid key presses
 */
const actFrustrated = async (page: Page, repetitions = 12) => {
  console.log('🎬 SIMULATING: Frustrated state...');
  const randomKeys = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'z', 'x', 'c'];
  for (let i = 0; i < repetitions; i++) {
    const key = randomKeys[Math.floor(Math.random() * randomKeys.length)];
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
  }
};

// =============================================================================
// DIAGNOSTIC TEST
// =============================================================================

test.describe('🔍 Cognitive Loop Diagnostic', () => {
  
  // Extended timeout for observation
  test.setTimeout(60000);
  
  test('Observe cognitive state detection with diagnostic probes', async ({ page }) => {
    
    console.log('\n🔍 === DIAGNOSTIC TEST START ===\n');
    
    // Capture console logs from the browser
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[DIAGNOSTIC]') || text.includes('[App]') || text.includes('[CognitiveModel]')) {
        console.log(`🌐 BROWSER: ${text}`);
      }
    });
    
    // Load the app
    await page.goto('/');
    
    // Wait for app to be ready
    await expect(page.locator('[data-testid="cognitive-state"]')).toBeVisible({ timeout: 10000 });
    console.log('✅ App loaded and HUD visible');
    
    // Give the cognitive loop time to start
    await page.waitForTimeout(2000);
    
    // =========================================================================
    // TEST 1: Simulate Concentrated Behavior
    // =========================================================================
    console.log('\n--- TEST 1: Concentrated Behavior ---');
    await actConcentrated(page, 20);
    
    // Wait for analysis cycles
    console.log('⏳ Waiting for cognitive analysis (5 seconds)...');
    await page.waitForTimeout(5000);
    
    // Read current state
    const stateAfterConcentrated = await page.locator('[data-testid="cognitive-state"]').textContent();
    console.log(`📊 State after concentrated actions: "${stateAfterConcentrated || 'EMPTY'}"`);
    
    // =========================================================================
    // TEST 2: Simulate Frustrated Behavior
    // =========================================================================
    console.log('\n--- TEST 2: Frustrated Behavior ---');
    await actFrustrated(page, 20);
    
    // Wait for analysis cycles
    console.log('⏳ Waiting for cognitive analysis (5 seconds)...');
    await page.waitForTimeout(5000);
    
    // Read current state
    const stateAfterFrustrated = await page.locator('[data-testid="cognitive-state"]').textContent();
    console.log(`📊 State after frustrated actions: "${stateAfterFrustrated || 'EMPTY'}"`);
    
    // =========================================================================
    // FINAL OBSERVATIONS
    // =========================================================================
    console.log('\n--- Final State Check ---');
    
    const finalState = await page.locator('[data-testid="cognitive-state"]').textContent();
    const errorRate = await page.locator('[data-testid="error-rate"]').textContent();
    const avgSpeed = await page.locator('[data-testid="avg-speed"]').textContent();
    
    console.log('📊 Final Metrics:', {
      state: finalState || 'EMPTY',
      errorRate,
      avgSpeed
    });
    
    console.log('\n🔍 === DIAGNOSTIC TEST END ===\n');
    console.log('👉 Check the browser console for [DIAGNOSTIC] logs!');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(3000);
  });
  
});
