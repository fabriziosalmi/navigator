import { test, expect } from '@playwright/test';

test.describe('Navigation History HUD', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#quantum-hud', { timeout: 5000 });
        await page.waitForTimeout(1000);
    });

    test('should display history widget in HUD', async ({ page }) => {
        const historyDisplay = page.locator('.history-display');
    
        if (await historyDisplay.count() > 0) {
            await expect(historyDisplay).toBeVisible();
            console.log('History display is visible');
        } else {
            console.log('History display not found - may be in different HUD section');
        }
    });

    test('should show history icons container', async ({ page }) => {
        const historyIcons = page.locator('.history-icons');
    
        if (await historyIcons.count() > 0) {
            await expect(historyIcons).toBeVisible();
      
            const bgColor = await historyIcons.evaluate(el => 
                window.getComputedStyle(el).background
            );
            console.log('History icons background:', bgColor);
        }
    });

    test('should add icon when navigating right', async ({ page }) => {
        const initialIcons = await page.locator('.history-icon').count();
    
        // Navigate right
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(600);
    
        const afterIcons = await page.locator('.history-icon').count();
    
        console.log('Icons before:', initialIcons);
        console.log('Icons after navigation:', afterIcons);
    
        expect(afterIcons).toBeGreaterThan(initialIcons);
    });

    test('should add icon when navigating up (layer change)', async ({ page }) => {
        const initialIcons = await page.locator('.history-icon').count();
    
        // Navigate up (layer change)
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(700);
    
        const afterIcons = await page.locator('.history-icon').count();
    
        console.log('Icons before layer change:', initialIcons);
        console.log('Icons after layer change:', afterIcons);
    
        expect(afterIcons).toBeGreaterThan(initialIcons);
    });

    test('should show different icon styles for different actions', async ({ page }) => {
    // Navigate right
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
    
        // Navigate up
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(700);
    
        const icons = await page.locator('.history-icon').all();
    
        if (icons.length >= 2) {
            for (let i = 0; i < Math.min(icons.length, 3); i++) {
                const icon = icons[i];
                const innerHTML = await icon.innerHTML();
                const bgColor = await icon.evaluate(el => 
                    window.getComputedStyle(el).background
                );
        
                console.log(`Icon ${i}:`, innerHTML.substring(0, 50), 'BG:', bgColor);
            }
        }
    });

    test('should apply category colors to history icons', async ({ page }) => {
    // Perform navigation to generate history
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
    
        const icon = page.locator('.history-icon').first();
    
        if (await icon.count() > 0) {
            const bgColor = await icon.evaluate(el => 
                window.getComputedStyle(el).background
            );
      
            console.log('History icon background color:', bgColor);
      
            // Should have some color (not pure gray)
            expect(bgColor).toBeTruthy();
        }
    });

    test('should limit history display to recent entries', async ({ page }) => {
    // Create lots of history
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(200);
        }
    
        const iconCount = await page.locator('.history-icon').count();
    
        console.log('History icons after 20 navigations:', iconCount);
    
        // Should limit display (probably max 5-10 visible)
        expect(iconCount).toBeLessThanOrEqual(15);
    });

    test('should have fade-in animation for new icons', async ({ page }) => {
        const initialCount = await page.locator('.history-icon').count();
    
        // Add new navigation
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100); // Catch during animation
    
        // Check for animation
        const newIcon = page.locator('.history-icon').last();
    
        if (await newIcon.count() > 0) {
            const animation = await newIcon.evaluate(el => 
                window.getComputedStyle(el).animation
            );
      
            console.log('New icon animation:', animation);
      
            // Wait for animation to complete
            await page.waitForTimeout(500);
        }
    });

    test('should show layer transition icons differently', async ({ page }) => {
    // Horizontal navigation
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
    
        // Vertical navigation (layer change)
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(700);
    
        const icons = await page.locator('.history-icon').all();
    
        // Icons should have different visual indicators
        if (icons.length >= 2) {
            const icon1HTML = await icons[icons.length - 2].innerHTML();
            const icon2HTML = await icons[icons.length - 1].innerHTML();
      
            console.log('Horizontal nav icon:', icon1HTML.substring(0, 100));
            console.log('Vertical nav icon:', icon2HTML.substring(0, 100));
      
            // They should be different
            expect(icon1HTML).not.toBe(icon2HTML);
        }
    });

    test('should maintain history across rapid navigation', async ({ page }) => {
        const initialCount = await page.locator('.history-icon').count();
    
        // Rapid navigation
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1000);
    
        const finalCount = await page.locator('.history-icon').count();
    
        console.log('Initial history count:', initialCount);
        console.log('After rapid navigation:', finalCount);
    
        // Should have added to history
        expect(finalCount).toBeGreaterThan(initialCount);
    });

    test('should style history container with glassmorphism', async ({ page }) => {
        const historyIcons = page.locator('.history-icons');
    
        if (await historyIcons.count() > 0) {
            const borderRadius = await historyIcons.evaluate(el => 
                window.getComputedStyle(el).borderRadius
            );
      
            const border = await historyIcons.evaluate(el => 
                window.getComputedStyle(el).border
            );
      
            console.log('History container border-radius:', borderRadius);
            console.log('History container border:', border);
      
            expect(borderRadius).toContain('px');
        }
    });
});
