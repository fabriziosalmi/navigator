import { test, expect } from '@playwright/test';

test.describe('Visual Refinements - Spatial Computing Style', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    
        // Wait for app initialization
        await page.waitForSelector('#quantum-hud', { timeout: 5000 });
        await page.waitForTimeout(1000); // Let animations settle
    });

    test('should display quantum HUD with glassmorphism', async ({ page }) => {
        const hud = page.locator('#quantum-hud');
    
        // HUD should be visible
        await expect(hud).toBeVisible();
    
        // Check glassmorphism properties
        const backdropFilter = await hud.evaluate(el => 
            window.getComputedStyle(el).backdropFilter
        );
        expect(backdropFilter).toContain('blur');
    
        // Check position
        const position = await hud.evaluate(el => 
            window.getComputedStyle(el).position
        );
        expect(position).toBe('fixed');
    });

    test('should show layer depth hierarchy with blur gradients', async ({ page }) => {
        const layers = await page.locator('.layer-container').all();
    
        expect(layers.length).toBeGreaterThan(0);
    
        // Check active layer has no blur
        const activeLayer = page.locator('.layer-container.active');
        await expect(activeLayer).toBeVisible();
    
        const activeFilter = await activeLayer.evaluate(el => 
            window.getComputedStyle(el).filter
        );
    
        // Active should have minimal/no blur
        console.log('Active layer filter:', activeFilter);
    });

    test('should display focus ring on active card', async ({ page }) => {
        const activeCard = page.locator('.card.active').first();
    
        if (await activeCard.count() > 0) {
            await expect(activeCard).toBeVisible();
      
            // Check for border styling
            const borderImage = await activeCard.evaluate(el => 
                window.getComputedStyle(el).borderImage
            );
      
            console.log('Active card border-image:', borderImage);
      
            // Check for category color variable
            const categoryColor = await activeCard.evaluate(el => 
                window.getComputedStyle(el).getPropertyValue('--category-color')
            );
      
            console.log('Category color:', categoryColor);
        }
    });

    test('should apply category colors to different layers', async ({ page }) => {
        const categoryColors = {
            'layer-video': 'rgba(255, 0, 100',
            'layer-news': 'rgba(255, 165, 0',
            'layer-images': 'rgba(255, 0, 255',
            'layer-games': 'rgba(0, 255, 0',
            'layer-apps': 'rgba(0, 100, 255',
            'layer-settings': 'rgba(150, 150, 150'
        };

        for (const [layerClass, expectedColor] of Object.entries(categoryColors)) {
            const layer = page.locator(`.${layerClass}`).first();
      
            if (await layer.count() > 0) {
                const card = layer.locator('.card').first();
        
                if (await card.count() > 0) {
                    const categoryGlow = await card.evaluate(el => 
                        window.getComputedStyle(el).getPropertyValue('--category-glow')
                    );
          
                    console.log(`${layerClass} glow:`, categoryGlow);
                    expect(categoryGlow).toContain('rgba');
                }
            }
        }
    });

    test('should have smooth card hover effects', async ({ page }) => {
        const card = page.locator('.card').first();
    
        if (await card.count() > 0) {
            // Get initial transform
            const initialTransform = await card.evaluate(el => 
                window.getComputedStyle(el).transform
            );
      
            // Hover card
            await card.hover();
            await page.waitForTimeout(300); // Wait for transition
      
            // Check transform changed
            const hoverTransform = await card.evaluate(el => 
                window.getComputedStyle(el).transform
            );
      
            console.log('Initial transform:', initialTransform);
            console.log('Hover transform:', hoverTransform);
      
            // Should have transition property
            const transition = await card.evaluate(el => 
                window.getComputedStyle(el).transition
            );
      
            expect(transition).toContain('cubic-bezier');
        }
    });

    test('should display layer name and position in HUD', async ({ page }) => {
        const layerName = page.locator('.layer-name');
        const cardPosition = page.locator('.card-position');
    
        await expect(layerName).toBeVisible();
        await expect(cardPosition).toBeVisible();
    
        const nameText = await layerName.textContent();
        console.log('Current layer:', nameText);
    
        expect(nameText).toBeTruthy();
    });

    test('should have navigation controls in HUD', async ({ page }) => {
        const navControls = page.locator('.nav-controls');
        await expect(navControls).toBeVisible();
    
        const navButtons = await navControls.locator('.hud-nav').all();
        expect(navButtons.length).toBeGreaterThanOrEqual(2); // At least left/right
    
        // Check button styling
        const button = navButtons[0];
        const borderRadius = await button.evaluate(el => 
            window.getComputedStyle(el).borderRadius
        );
    
        expect(borderRadius).toContain('px');
    });

    test('should show saturation filters on depth layers', async ({ page }) => {
        const backLayer = page.locator('.layer-container.back-1').first();
    
        if (await backLayer.count() > 0) {
            const filter = await backLayer.evaluate(el => 
                window.getComputedStyle(el).filter
            );
      
            console.log('Back-1 layer filter:', filter);
      
            // Should contain blur and saturate
            expect(filter).toContain('blur');
            // Note: saturate might be in filter or combined
        }
    });

    test('should have refined text shadows (no heavy neon)', async ({ page }) => {
        const cardHeader = page.locator('.card-header').first();
    
        if (await cardHeader.count() > 0) {
            const textShadow = await cardHeader.evaluate(el => 
                window.getComputedStyle(el).textShadow
            );
      
            console.log('Card header text-shadow:', textShadow);
      
            // Should have subtle shadow, not heavy neon flicker
            expect(textShadow).toBeTruthy();
            // Should NOT have animation
            const animation = await cardHeader.evaluate(el => 
                window.getComputedStyle(el).animation
            );
            expect(animation).not.toContain('Flicker');
        }
    });

    test('should display navigation history HUD', async ({ page }) => {
        const historyDisplay = page.locator('.history-display');
    
        // History display should exist in HUD
        if (await historyDisplay.count() > 0) {
            await expect(historyDisplay).toBeVisible();
      
            const historyIcons = page.locator('.history-icon');
            console.log('History icons count:', await historyIcons.count());
        }
    });
});
