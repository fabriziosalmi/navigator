/**
 * NavigationHistoryHUD - Visual history of recent navigation actions
 * Displays last 5 gestures/commands with modern SVG icons and fade animations
 */

export class NavigationHistoryHUD {
    constructor(maxHistory = 5) {
        this.maxHistory = maxHistory;
        this.history = [];
        this.container = document.getElementById('hud-history');
        
        if (!this.container) {
            console.warn('NavigationHistoryHUD: Container #hud-history not found');
            return;
        }
        
        // SVG icon templates
        this.icons = {
            'card-left': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 18l-6-6 6-6"/>
            </svg>`,
            
            'card-right': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6"/>
            </svg>`,
            
            'layer-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 19V5m0 0l-7 7m7-7l7 7"/>
            </svg>`,
            
            'layer-down': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14m0 0l-7-7m7 7l7-7"/>
            </svg>`,
            
            'voice': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>`,
            
            'keyboard': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>`
        };
        
        console.log('NavigationHistoryHUD initialized');
    }
    
    /**
     * Add navigation action to history
     * @param {string} action - Navigation action (card-left, card-right, layer-up, layer-down)
     * @param {string} source - Input source (gesture, keyboard, voice)
     */
    addAction(action, source = 'gesture') {
        if (!this.container) {
            return;
        }
        
        // Create history entry
        const entry = {
            action,
            source,
            timestamp: Date.now(),
            id: `history-${Date.now()}-${Math.random()}`
        };
        
        // Add to beginning of array
        this.history.unshift(entry);
        
        // Trim to max history
        if (this.history.length > this.maxHistory) {
            const removed = this.history.pop();
            this.removeIconElement(removed.id);
        }
        
        // Render new icon
        this.renderIcon(entry);
    }
    
    /**
     * Render icon element for history entry
     * @param {Object} entry - History entry
     */
    renderIcon(entry) {
        // Get icon template
        const iconSvg = this.icons[entry.action] || this.icons['card-right'];
        
        // Determine type for styling (combines action and source)
        const type = entry.source === 'gesture' ? entry.action : entry.source;
        
        // Create icon element
        const iconEl = document.createElement('div');
        iconEl.className = 'history-icon';
        iconEl.setAttribute('data-type', type);
        iconEl.setAttribute('data-id', entry.id);
        iconEl.setAttribute('title', this.getActionLabel(entry.action, entry.source));
        iconEl.innerHTML = iconSvg;
        
        // Add to beginning of container
        this.container.insertBefore(iconEl, this.container.firstChild);
        
        // Cleanup old icons beyond max
        const icons = this.container.querySelectorAll('.history-icon');
        if (icons.length > this.maxHistory) {
            // Fade out oldest icon
            const oldest = icons[icons.length - 1];
            oldest.classList.add('fading');
            
            setTimeout(() => {
                oldest.remove();
            }, 300);
        }
    }
    
    /**
     * Remove icon element by ID
     * @param {string} id - Entry ID
     */
    removeIconElement(id) {
        const iconEl = this.container.querySelector(`[data-id="${id}"]`);
        if (iconEl) {
            iconEl.classList.add('fading');
            setTimeout(() => iconEl.remove(), 300);
        }
    }
    
    /**
     * Get human-readable label for action
     * @param {string} action - Navigation action
     * @param {string} source - Input source
     * @returns {string} Label
     */
    getActionLabel(action, source) {
        const actionLabels = {
            'card-left': 'Swipe Left',
            'card-right': 'Swipe Right',
            'layer-up': 'Layer Up',
            'layer-down': 'Layer Down'
        };
        
        const sourceLabels = {
            'gesture': 'Gesture',
            'keyboard': 'Keyboard',
            'voice': 'Voice'
        };
        
        return `${actionLabels[action] || action} (${sourceLabels[source] || source})`;
    }
    
    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        
        if (this.container) {
            // Fade out all icons
            const icons = this.container.querySelectorAll('.history-icon');
            icons.forEach((icon, index) => {
                setTimeout(() => {
                    icon.classList.add('fading');
                    setTimeout(() => icon.remove(), 300);
                }, index * 50);
            });
        }
    }
    
    /**
     * Get current history
     * @returns {Array} History entries
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Get history count
     * @returns {number} Number of entries
     */
    getCount() {
        return this.history.length;
    }
}
