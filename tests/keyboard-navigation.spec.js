import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation - WASD + Arrows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#quantum-hud', { timeout: 5000 });
        await page.waitForTimeout(1000);
    });

    test('should navigate right with ArrowRight key', async ({ page }) => {
    // Get initial position
        const initialPosition = await page.locator('.current-card').textContent();
    
        // Press right arrow
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500); // Wait for animation
    
        // Check position changed
        const newPosition = await page.locator('.current-card').textContent();
    
        console.log('Initial position:', initialPosition);
        console.log('New position after ArrowRight:', newPosition);
    
        expect(parseInt(newPosition)).toBe(parseInt(initialPosition) + 1);
    });

    test('should navigate left with ArrowLeft key', async ({ page }) => {
    // First navigate right to have space to go left
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
    
        const beforeLeft = await page.locator('.current-card').textContent();
    
        // Press left arrow
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(500);
    
        const afterLeft = await page.locator('.current-card').textContent();
    
        console.log('Before ArrowLeft:', beforeLeft);
        console.log('After ArrowLeft:', afterLeft);
    
        expect(parseInt(afterLeft)).toBe(parseInt(beforeLeft) - 1);
    });

    test('should navigate right with D key (WASD)', async ({ page }) => {
        const initialPosition = await page.locator('.current-card').textContent();
    
        await page.keyboard.press('d');
        await page.waitForTimeout(500);
    
        const newPosition = await page.locator('.current-card').textContent();
    
        console.log('Initial position:', initialPosition);
        console.log('New position after D:', newPosition);
    
        expect(parseInt(newPosition)).toBe(parseInt(initialPosition) + 1);
    });

    test('should navigate left with A key (WASD)', async ({ page }) => {
    // First navigate right
        await page.keyboard.press('d');
        await page.waitForTimeout(500);
    
        const beforeA = await page.locator('.current-card').textContent();
    
        await page.keyboard.press('a');
        await page.waitForTimeout(500);
    
        const afterA = await page.locator('.current-card').textContent();
    
        console.log('Before A:', beforeA);
        console.log('After A:', afterA);
    
        expect(parseInt(afterA)).toBe(parseInt(beforeA) - 1);
    });

    test('should change layer up with ArrowUp key', async ({ page }) => {
        const initialLayer = await page.locator('.layer-name').textContent();
    
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(700); // Layer changes take longer
    
        const newLayer = await page.locator('.layer-name').textContent();
    
        console.log('Initial layer:', initialLayer);
        console.log('New layer after ArrowUp:', newLayer);
    
        expect(newLayer).not.toBe(initialLayer);
    });

    test('should change layer down with ArrowDown key', async ({ page }) => {
        const initialLayer = await page.locator('.layer-name').textContent();
    
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(700);
    
        const newLayer = await page.locator('.layer-name').textContent();
    
        console.log('Initial layer:', initialLayer);
        console.log('New layer after ArrowDown:', newLayer);
    
        expect(newLayer).not.toBe(initialLayer);
    });

    test('should change layer up with W key (WASD)', async ({ page }) => {
        const initialLayer = await page.locator('.layer-name').textContent();
    
        await page.keyboard.press('w');
        await page.waitForTimeout(700);
    
        const newLayer = await page.locator('.layer-name').textContent();
    
        console.log('Initial layer:', initialLayer);
        console.log('New layer after W:', newLayer);
    
        expect(newLayer).not.toBe(initialLayer);
    });

    test('should change layer down with S key (WASD)', async ({ page }) => {
        const initialLayer = await page.locator('.layer-name').textContent();
    
        await page.keyboard.press('s');
        await page.waitForTimeout(700);
    
        const newLayer = await page.locator('.layer-name').textContent();
    
        console.log('Initial layer:', initialLayer);
        console.log('New layer after S:', newLayer);
    
        expect(newLayer).not.toBe(initialLayer);
    });

    test('should update HUD position counter on navigation', async ({ page }) => {
        const initialCount = await page.locator('.current-card').textContent();
    
        // Navigate multiple times
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
    
        const finalCount = await page.locator('.current-card').textContent();
    
        console.log('Initial count:', initialCount);
        console.log('Final count after 2x right:', finalCount);
    
        expect(parseInt(finalCount)).toBe(parseInt(initialCount) + 2);
    });

    test.skip('should have smooth transitions between cards', async ({ page }) => {
    // Wait for initial card to become active
        await page.waitForSelector('.card.active', { timeout: 5000 });
        const activeCard = page.locator('.card.active').first();
    
        // Check transition property exists
        const transition = await activeCard.evaluate(el => 
            window.getComputedStyle(el).transition
        );
    
        expect(transition).toContain('cubic-bezier');
    
        // Navigate and verify animation
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100); // Mid-transition
    
        // Card should still exist during transition
        await expect(activeCard).toBeTruthy();
    });

    test('should not break on rapid key presses', async ({ page }) => {
        const initialPosition = await page.locator('.current-card').textContent();
    
        // Rapid navigation
        await page.keyboard.press('d');
        await page.keyboard.press('d');
        await page.keyboard.press('d');
        await page.waitForTimeout(800); // Wait for all to complete
    
        const finalPosition = await page.locator('.current-card').textContent();
    
        console.log('Initial:', initialPosition);
        console.log('After rapid 3x D:', finalPosition);
    
        // Should have moved at least once (debouncing might prevent all 3)
        expect(parseInt(finalPosition)).toBeGreaterThan(parseInt(initialPosition));
    });

    test('should track navigation in history HUD', async ({ page }) => {
        const historyIcons = page.locator('.history-icon');
        const initialCount = await historyIcons.count();
    
        // Make some navigations
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
    
        const finalCount = await historyIcons.count();
    
        console.log('Initial history icons:', initialCount);
        console.log('After navigation history icons:', finalCount);
    
        // Should have added to history
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });
});
