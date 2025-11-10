/**
 * INTERFACE STATUS HUD
 * Shows which input interfaces are active: keyboard, mouse, voice, gestures
 * Visual feedback with glowing icons and action indicators
 */

export class InterfaceStatusHUD {
    constructor() {
        this.container = null;
        this.interfaces = {
            keyboard: { active: false, lastAction: '', element: null },
            mouse: { active: false, lastAction: '', element: null },
            voice: { active: false, lastAction: '', element: null },
            gesture: { active: false, lastAction: '', element: null }
        };
        
        this.init();
        this.setupListeners();
    }
    
    init() {
        // Create main HUD container
        this.container = document.createElement('div');
        this.container.className = 'interface-status-hud';
        this.container.innerHTML = `
            <div class="interface-status-title">Active Interfaces</div>
            <div class="interface-indicators">
                <div class="interface-indicator" data-interface="keyboard">
                    <div class="indicator-icon">⌨️</div>
                    <div class="indicator-label">Keyboard</div>
                    <div class="indicator-action"></div>
                    <div class="indicator-glow"></div>
                </div>
                
                <div class="interface-indicator" data-interface="mouse">
                    <div class="indicator-icon">🖱️</div>
                    <div class="indicator-label">Mouse</div>
                    <div class="indicator-action"></div>
                    <div class="indicator-glow"></div>
                </div>
                
                <div class="interface-indicator" data-interface="voice">
                    <div class="indicator-icon">🎤</div>
                    <div class="indicator-label">Voice</div>
                    <div class="indicator-action"></div>
                    <div class="indicator-glow"></div>
                </div>
                
                <div class="interface-indicator" data-interface="gesture">
                    <div class="indicator-icon">👋</div>
                    <div class="indicator-label">Gesture</div>
                    <div class="indicator-action"></div>
                    <div class="indicator-glow"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache interface elements
        Object.keys(this.interfaces).forEach(key => {
            this.interfaces[key].element = this.container.querySelector(`[data-interface="${key}"]`);
        });
        
        console.log('🎛️ Interface Status HUD initialized');
    }
    
    setupListeners() {
        // Keyboard detection
        document.addEventListener('keydown', (e) => {
            this.activateInterface('keyboard', `Key: ${e.key}`);
        });
        
        // Mouse detection
        document.addEventListener('mousemove', () => {
            this.activateInterface('mouse', 'Moving');
        });
        
        document.addEventListener('click', (e) => {
            this.activateInterface('mouse', 'Click');
        });
        
        document.addEventListener('wheel', () => {
            this.activateInterface('mouse', 'Scroll');
        });
    }
    
    /**
     * Activate an interface and show action
     * @param {string} interfaceName - keyboard, mouse, voice, gesture
     * @param {string} action - Description of the action
     */
    activateInterface(interfaceName, action = '') {
        const iface = this.interfaces[interfaceName];
        if (!iface || !iface.element) return;
        
        // Mark as active
        iface.active = true;
        iface.lastAction = action;
        
        // Update UI
        iface.element.classList.add('active');
        
        // Update action text
        const actionEl = iface.element.querySelector('.indicator-action');
        if (actionEl && action) {
            actionEl.textContent = action;
            actionEl.classList.add('show');
            
            // Hide action after delay
            setTimeout(() => {
                actionEl.classList.remove('show');
            }, 2000);
        }
        
        // Pulse effect
        iface.element.classList.add('pulse');
        setTimeout(() => {
            iface.element.classList.remove('pulse');
        }, 300);
    }
    
    /**
     * Deactivate an interface
     * @param {string} interfaceName
     */
    deactivateInterface(interfaceName) {
        const iface = this.interfaces[interfaceName];
        if (!iface || !iface.element) return;
        
        iface.active = false;
        iface.element.classList.remove('active');
    }
    
    /**
     * Update voice interface status
     * @param {boolean} active
     * @param {string} command - Voice command recognized
     */
    updateVoice(active, command = '') {
        if (active) {
            this.activateInterface('voice', command || 'Listening...');
        } else {
            this.deactivateInterface('voice');
        }
    }
    
    /**
     * Update gesture interface status
     * @param {boolean} active
     * @param {string} gesture - Gesture type (swipe, pinch, etc)
     */
    updateGesture(active, gesture = '') {
        if (active) {
            this.activateInterface('gesture', gesture || 'Tracking');
        } else {
            this.deactivateInterface('gesture');
        }
    }
    
    /**
     * Get current active interfaces
     * @returns {Array<string>} Array of active interface names
     */
    getActiveInterfaces() {
        return Object.keys(this.interfaces).filter(key => this.interfaces[key].active);
    }
    
    /**
     * Toggle HUD visibility
     */
    toggle() {
        this.container.classList.toggle('hidden');
    }
    
    /**
     * Show HUD
     */
    show() {
        this.container.classList.remove('hidden');
    }
    
    /**
     * Hide HUD
     */
    hide() {
        this.container.classList.add('hidden');
    }
}

export default InterfaceStatusHUD;
