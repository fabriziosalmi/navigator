import { test, expect, Page } from '@playwright/test';

/**
 * 🎬 THE AUTOMATED DEMO DIRECTOR
 * 
 * This script automatically records a professional 30-second promotional video
 * showcasing Navigator's cognitive intelligence in real-time.
 * 
 * The recording will be saved in test-results/ folder as a .webm file.
 */

// =============================================================================
// HELPER FUNCTIONS - "THE ACTORS"
// =============================================================================

/**
 * Wait for the cognitive state to change to a specific value
 */
const waitForCognitiveState = async (page: Page, state: string) => {
  const stateLocator = page.locator('[data-testid="cognitive-state"]');
  await expect(stateLocator).toContainText(state, { timeout: 15000 });
  console.log(`✅ State changed to: ${state}`);
};

/**
 * Simulate concentrated user behavior - fast, precise arrow key presses
 */
const actConcentrated = async (page: Page, repetitions = 15) => {
  console.log('🎬 SCENE: Simulating CONCENTRATED state...');
  for (let i = 0; i < repetitions; i++) {
    // Alternate between left and right for variety
    const key = i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.press(key);
    await page.waitForTimeout(150); // Fast but not too fast
  }
};

/**
 * Simulate frustrated user behavior - random invalid key presses
 */
const actFrustrated = async (page: Page, repetitions = 12) => {
  console.log('🎬 SCENE: Simulating FRUSTRATED state...');
  const randomKeys = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'z', 'x', 'c'];
  for (let i = 0; i < repetitions; i++) {
    const key = randomKeys[Math.floor(Math.random() * randomKeys.length)];
    await page.keyboard.press(key);
    await page.waitForTimeout(100); // Rapid frustrated pressing
  }
};

/**
 * Simulate learning/recovery behavior - slower, deliberate actions
 */
const actLearning = async (page: Page, repetitions = 8) => {
  console.log('🎬 SCENE: Simulating LEARNING/RECOVERY state...');
  for (let i = 0; i < repetitions; i++) {
    const key = i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.press(key);
    await page.waitForTimeout(400); // Slower, more deliberate
  }
};

/**
 * Add dramatic pause for emphasis
 */
const dramaticPause = async (page: Page, duration = 2000) => {
  console.log(`⏸️  Dramatic pause (${duration}ms)...`);
  await page.waitForTimeout(duration);
};

// =============================================================================
// THE MAIN SCRIPT - "THE DIRECTOR"
// =============================================================================

test.describe('🎬 Navigator Cognitive Showcase - Automated Demo Recording', () => {
  
  // --- FASE 1: TIMEOUT FIX ---
  // Imposta un timeout più lungo (90 secondi) per permettere la registrazione completa
  // Questo sovrascrive il timeout predefinito solo per questi test di registrazione
  test.setTimeout(90000);
  // ---------------------------
  
  test('The Sentient Interface in Action - 30 Second Demo', async ({ page }) => {
    
    // ==========================================================================
    // ACT 0: OPENING - App Load & Initial State
    // ==========================================================================
    console.log('\n🎬 ACT 0: OPENING - Loading Cognitive Showcase...\n');
    
    await page.goto('/');
    
    // Wait for app to be fully loaded and in neutral state
    await expect(page.locator('[data-testid="cognitive-state"]')).toBeVisible({ timeout: 10000 });
    await waitForCognitiveState(page, 'neutral');
    
    // Opening pause - let viewers see the initial state
    await dramaticPause(page, 1500);
    
    
    // ==========================================================================
    // ACT 1: CONCENTRATION (0-10s)
    // Show Navigator detecting and adapting to concentrated user behavior
    // ==========================================================================
    console.log('\n🎬 ACT 1: CONCENTRATION (0-10s)\n');
    
    await actConcentrated(page, 18);
    
    // SMART WAIT: Wait for cognitive state to change to "concentrated"
    await waitForCognitiveState(page, 'concentrated');
    
    // Verify UI has adapted to concentrated state (faster animations)
    const carousel = page.locator('[data-testid="carousel-wrapper"]');
    await expect(carousel).toBeVisible();
    
    // Verify error rate is low (concentrated users are precise)
    const errorRate = page.locator('[data-testid="error-rate"]');
    const errorRateText = await errorRate.textContent();
    console.log(`📊 Error Rate after concentration: ${errorRateText}`);
    
    // Brief pause to show the concentrated state
    await dramaticPause(page, 1500);
    
    
    // ==========================================================================
    // ACT 2: FRUSTRATION (10-20s)
    // Show Navigator detecting frustration and adapting the UI (slower animations)
    // ==========================================================================
    console.log('\n🎬 ACT 2: FRUSTRATION (10-20s)\n');
    
    await actFrustrated(page, 15);
    
    // SMART WAIT: Wait for cognitive state to change to "frustrated"
    await waitForCognitiveState(page, 'frustrated');
    
    // Verify error rate has increased (frustrated users make mistakes)
    const frustratedErrorRate = await errorRate.textContent();
    console.log(`📊 Error Rate after frustration: ${frustratedErrorRate}`);
    
    // Verify carousel has adapted to frustrated state (slower animations)
    await expect(carousel).toBeVisible();
    
    // Pause to show the frustrated state and UI adaptation
    await dramaticPause(page, 1500);
    
    
    // ==========================================================================
    // ACT 3: RECOVERY / LEARNING (20-30s)
    // Show Navigator helping user recover with adapted interface
    // ==========================================================================
    console.log('\n🎬 ACT 3: RECOVERY (20-30s)\n');
    
    await actLearning(page, 10);
    
    // SMART WAIT: Wait for state to normalize (could be 'learning', 'neutral', or 'concentrated')
    // We check that it's no longer 'frustrated'
    const cognitiveState = page.locator('[data-testid="cognitive-state"]');
    await expect(cognitiveState).not.toContainText('frustrated', { timeout: 10000 });
    
    // Get final state
    const recoveredState = await cognitiveState.textContent();
    console.log(`📊 Final state: ${recoveredState}`);
    
    // Get final metrics
    const finalErrorRate = await errorRate.textContent();
    const avgSpeed = await page.locator('[data-testid="avg-speed"]').textContent();
    console.log(`📊 Final Error Rate: ${finalErrorRate}`);
    console.log(`📊 Avg Speed: ${avgSpeed}`);
    
    // Verify carousel is still responsive
    await expect(carousel).toBeVisible();
    
    // Final dramatic pause - show the stable recovered state
    await dramaticPause(page, 1500);
    
    
    // ==========================================================================
    // CLOSING
    // ==========================================================================
    console.log('\n🎬 CLOSING - Demo Complete!\n');
    
    // Final pause before ending
    await dramaticPause(page, 1000);
    
    console.log('\n✅ Recording complete! Check test-results/ for the video file.\n');
  });
  
});
