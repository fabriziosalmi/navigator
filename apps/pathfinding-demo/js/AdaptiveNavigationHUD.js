/**
 * ADAPTIVE NAVIGATION HUD
 * Displays current level, progress, and performance metrics
 */

export class AdaptiveNavigationHUD {
    constructor(adaptiveSystem) {
        this.adaptiveSystem = adaptiveSystem;
        this.container = null;
        this.isVisible = true;
        
        this.init();
    }
    
    init() {
        // Create HUD container
        this.container = document.createElement('div');
        this.container.className = 'adaptive-progress-bar';
        this.container.innerHTML = `
            <div class="progress-label">
                <span class="current-level">Level <strong id="current-level-num">1</strong></span>
                <span class="next-level" id="next-level-text">→ L2</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="progress-metrics">
                <div class="metric-item">
                    <span>Accuracy:</span>
                    <span class="metric-value" id="metric-accuracy">100%</span>
                </div>
                <div class="metric-item">
                    <span>Speed:</span>
                    <span class="metric-value" id="metric-speed">--</span>
                </div>
                <div class="metric-item">
                    <span>Stability:</span>
                    <span class="metric-value" id="metric-stability">100%</span>
                </div>
                <div class="metric-item">
                    <span>Streak:</span>
                    <span class="metric-value" id="metric-streak">0</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache DOM elements
        this.elements = {
            currentLevelNum: document.getElementById('current-level-num'),
            nextLevelText: document.getElementById('next-level-text'),
            progressFill: document.getElementById('progress-fill'),
            metricAccuracy: document.getElementById('metric-accuracy'),
            metricSpeed: document.getElementById('metric-speed'),
            metricStability: document.getElementById('metric-stability'),
            metricStreak: document.getElementById('metric-streak')
        };
        
        // Subscribe to adaptive system updates
        this.adaptiveSystem.onMetricsUpdate = (metrics) => {
            this.update(metrics);
        };
        
        this.adaptiveSystem.onLevelChange = (newLevel, oldLevel, changeType) => {
            this.onLevelChange(newLevel, oldLevel, changeType);
        };
        
        // console.log('📊 Adaptive Navigation HUD initialized');
    }
    
    /**
     * Update HUD with current metrics
     */
    update(metrics) {
        // Update level display
        this.elements.currentLevelNum.textContent = metrics.level;
        
        // Update next level text
        if (metrics.level === 3) {
            this.elements.nextLevelText.textContent = '✓ MAX';
            this.elements.nextLevelText.style.color = '#0f6';
        } else {
            this.elements.nextLevelText.textContent = `→ L${metrics.level + 1}`;
            this.elements.nextLevelText.style.color = '';
        }
        
        // Update progress bar
        const progress = Math.round(metrics.progressToNextLevel * 100);
        this.elements.progressFill.style.width = `${progress}%`;
        
        // Change color based on progress
        if (progress >= 80) {
            this.elements.progressFill.style.background = 'linear-gradient(90deg, #0f6, #0f9)';
        } else if (progress >= 50) {
            this.elements.progressFill.style.background = 'linear-gradient(90deg, #0cf, #0f6)';
        } else {
            this.elements.progressFill.style.background = 'linear-gradient(90deg, #08f, #0cf)';
        }
        
        // Update metrics
        this.elements.metricAccuracy.textContent = `${Math.round(metrics.recentAccuracy * 100)}%`;
        this.elements.metricSpeed.textContent = Math.round(metrics.speed * 100) + '%';
        this.elements.metricStability.textContent = `${Math.round(metrics.stability * 100)}%`;
        this.elements.metricStreak.textContent = metrics.consecutiveSuccesses;
        
        // Color-code accuracy
        if (metrics.recentAccuracy >= 0.8) {
            this.elements.metricAccuracy.style.color = '#0f6';
        } else if (metrics.recentAccuracy >= 0.6) {
            this.elements.metricAccuracy.style.color = '#fa0';
        } else {
            this.elements.metricAccuracy.style.color = '#f33';
        }
        
        // Color-code streak
        if (metrics.consecutiveSuccesses >= 8) {
            this.elements.metricStreak.style.color = '#0f6';
        } else if (metrics.consecutiveSuccesses >= 4) {
            this.elements.metricStreak.style.color = '#0cf';
        } else {
            this.elements.metricStreak.style.color = '';
        }
        
        // Pulse effect on high progress
        if (progress >= 90 && metrics.level < 3) {
            this.container.style.animation = 'pulse-glow 1s ease-in-out infinite';
        } else {
            this.container.style.animation = '';
        }
    }
    
    /**
     * Handle level change
     */
    onLevelChange(newLevel, oldLevel, changeType) {
        // Flash effect
        this.container.style.transform = 'scale(1.1)';
        this.container.style.borderColor = changeType === 'upgrade' ? '#0f6' : '#fa0';
        
        setTimeout(() => {
            this.container.style.transform = '';
            this.container.style.borderColor = '';
        }, 500);
    }
    
    /**
     * Toggle HUD visibility
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
    }
    
    /**
     * Show HUD
     */
    show() {
        this.isVisible = true;
        this.container.classList.remove('hidden');
    }
    
    /**
     * Hide HUD
     */
    hide() {
        this.isVisible = false;
        this.container.classList.add('hidden');
    }
}
