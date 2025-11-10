/**
 * OnboardingPlugin.js
 * 
 * First-run wizard that guides new users through camera permissions,
 * hand tracking calibration, and first gesture test.
 * Uses localStorage to track completion status.
 * 
 * Events emitted:
 * - onboarding:started
 * - onboarding:step_changed
 * - onboarding:completed
 * - onboarding:skipped
 */

import { BasePlugin } from '../../core/BasePlugin.js';

export class OnboardingPlugin extends BasePlugin {
    constructor(config = {}) {
        super('Onboarding', {
            enabled: true,
            storageKey: 'navigator_onboarding_completed',
            autoStart: true,
            steps: [
                'welcome',
                'permissions',
                'calibration',
                'gesture_test',
                'completed'
            ],
            ...config
        });

        this.currentStep = 0;
        this.wizardElement = null;
        this.isActive = false;
        this.handDetected = false;
        this.gestureDetected = false;
    }

    async onInit() {
        this.log('Initializing onboarding wizard');

        // Check if already completed
        const completed = localStorage.getItem(this.getConfig('storageKey'));
        if (completed === 'true') {
            this.log('Onboarding already completed, skipping');
            return;
        }

        // Create wizard DOM
        this._createWizardDOM();

        // Listen for system events
        this.on('system:ready', () => this._maybeStartWizard());
        this.on('input:gesture:hand_detected', () => this._onHandDetected());
        this.on('input:gesture:hand_lost', () => this._onHandLost());
        this.on('input:gesture:swipe_right', () => this._onGestureDetected('swipe_right'));
        this.on('system:camera_permission_granted', () => this._onPermissionGranted());
        this.on('system:camera_permission_denied', () => this._onPermissionDenied());
    }

    async onStart() {
        // Wizard starts automatically when system is ready
    }

    async onStop() {
        if (this.isActive) {
            this._hideWizard();
        }
    }

    async onDestroy() {
        if (this.wizardElement) {
            this.wizardElement.remove();
            this.wizardElement = null;
        }
    }

    // ========================================
    // Wizard Lifecycle
    // ========================================

    _maybeStartWizard() {
        if (!this.getConfig('autoStart', true)) {
            return;
        }

        const completed = localStorage.getItem(this.getConfig('storageKey'));
        if (completed === 'true') {
            return;
        }

        this._startWizard();
    }

    _startWizard() {
        this.log('Starting onboarding wizard');

        this.isActive = true;
        this.currentStep = 0;

        // Pause system interactions
        this.emit('system:pause', { reason: 'onboarding' });

        // Show wizard
        this._showWizard();
        this._renderStep();

        this.emit('onboarding:started', {});
    }

    _completeWizard() {
        this.log('Onboarding completed');

        // Mark as completed
        localStorage.setItem(this.getConfig('storageKey'), 'true');

        // Hide wizard
        this._hideWizard();

        // Resume system
        this.emit('system:resume', { reason: 'onboarding' });

        this.emit('onboarding:completed', {});
        this.isActive = false;
    }

    _skipWizard() {
        this.log('Onboarding skipped');

        // Mark as completed anyway
        localStorage.setItem(this.getConfig('storageKey'), 'true');

        this._hideWizard();
        this.emit('system:resume', { reason: 'onboarding' });
        this.emit('onboarding:skipped', {});
        this.isActive = false;
    }

    // ========================================
    // Step Navigation
    // ========================================

    _nextStep() {
        const steps = this.getConfig('steps', []);
        
        if (this.currentStep < steps.length - 1) {
            this.currentStep++;
            this._renderStep();
            this.emit('onboarding:step_changed', { 
                step: this.currentStep,
                name: steps[this.currentStep]
            });
        }
    }

    _renderStep() {
        const steps = this.getConfig('steps', []);
        const stepName = steps[this.currentStep];

        const contentEl = this.wizardElement.querySelector('.onboarding-content');
        if (!contentEl) return;

        switch (stepName) {
            case 'welcome':
                this._renderWelcomeStep(contentEl);
                break;
            case 'permissions':
                this._renderPermissionsStep(contentEl);
                break;
            case 'calibration':
                this._renderCalibrationStep(contentEl);
                break;
            case 'gesture_test':
                this._renderGestureTestStep(contentEl);
                break;
            case 'completed':
                this._renderCompletedStep(contentEl);
                break;
        }

        // Update progress indicator
        this._updateProgress();
    }

    // ========================================
    // Step Renderers
    // ========================================

    _renderWelcomeStep(container) {
        container.innerHTML = `
            <div class="onboarding-step welcome-step">
                <div class="step-icon">👋</div>
                <h2>Welcome to Navigator</h2>
                <p class="step-description">
                    Navigate through content using <strong>hand gestures</strong>, 
                    <strong>voice commands</strong>, or <strong>keyboard</strong>.
                </p>
                <p class="step-description">
                    Let's set up your experience in just a few steps.
                </p>
                <div class="step-actions">
                    <button class="btn-primary" id="welcome-start">
                        🚀 Get Started
                    </button>
                    <button class="btn-secondary" id="welcome-skip">
                        Skip Tutorial
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        container.querySelector('#welcome-start')?.addEventListener('click', () => {
            this._nextStep();
        });

        container.querySelector('#welcome-skip')?.addEventListener('click', () => {
            this._skipWizard();
        });
    }

    _renderPermissionsStep(container) {
        container.innerHTML = `
            <div class="onboarding-step permissions-step">
                <div class="step-icon">📹</div>
                <h2>Camera Access</h2>
                <p class="step-description">
                    To use hand gestures, we need access to your camera.
                    <strong>Your video never leaves your device.</strong>
                </p>
                <div class="permission-status" id="permission-status">
                    <div class="status-indicator waiting">
                        <div class="spinner"></div>
                        <span>Waiting for permission...</span>
                    </div>
                </div>
                <p class="step-note">
                    Click "Allow" when your browser asks for camera access.
                </p>
            </div>
        `;

        // Trigger camera permission request via GestureInputPlugin
        // The plugin should emit system:camera_permission_granted/denied
    }

    _renderCalibrationStep(container) {
        container.innerHTML = `
            <div class="onboarding-step calibration-step">
                <div class="step-icon">✋</div>
                <h2>Hand Detection</h2>
                <p class="step-description">
                    Show your hand to the camera with your palm open.
                </p>
                <div class="hand-tracking-status" id="hand-status">
                    <div class="hand-indicator ${this.handDetected ? 'detected' : 'searching'}">
                        <div class="hand-icon">🖐️</div>
                        <div class="tracking-bar">
                            <div class="tracking-fill ${this.handDetected ? 'active' : ''}"></div>
                        </div>
                        <span class="status-text">
                            ${this.handDetected ? '✓ Hand Detected!' : 'Searching for hand...'}
                        </span>
                    </div>
                </div>
                ${this.handDetected ? `
                    <div class="step-actions">
                        <button class="btn-primary" id="calibration-next">
                            Continue →
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        if (this.handDetected) {
            container.querySelector('#calibration-next')?.addEventListener('click', () => {
                this._nextStep();
            });
        }
    }

    _renderGestureTestStep(container) {
        container.innerHTML = `
            <div class="onboarding-step gesture-test-step">
                <div class="step-icon">👉</div>
                <h2>Try Your First Gesture</h2>
                <p class="step-description">
                    Move your hand to the <strong>right</strong> to perform a swipe.
                </p>
                <div class="gesture-demo">
                    <div class="gesture-animation">
                        <div class="hand-sprite">✋</div>
                        <div class="arrow-indicator">→</div>
                    </div>
                    <div class="gesture-result ${this.gestureDetected ? 'success' : ''}">
                        ${this.gestureDetected ? '✓ Perfect!' : 'Waiting for swipe...'}
                    </div>
                </div>
                ${this.gestureDetected ? `
                    <div class="step-actions">
                        <button class="btn-primary" id="gesture-next">
                            Continue →
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        if (this.gestureDetected) {
            container.querySelector('#gesture-next')?.addEventListener('click', () => {
                this._nextStep();
            });
        }
    }

    _renderCompletedStep(container) {
        container.innerHTML = `
            <div class="onboarding-step completed-step">
                <div class="step-icon">🎉</div>
                <h2>You're All Set!</h2>
                <p class="step-description">
                    You've mastered the basics. Here are the gestures you can use:
                </p>
                <div class="gesture-cheatsheet">
                    <div class="gesture-item">
                        <span class="gesture-icon">←→</span>
                        <span>Swipe left/right to navigate cards</span>
                    </div>
                    <div class="gesture-item">
                        <span class="gesture-icon">↑↓</span>
                        <span>Swipe up/down to change layers</span>
                    </div>
                    <div class="gesture-item">
                        <span class="gesture-icon">⌨️</span>
                        <span>Arrow keys or WASD also work</span>
                    </div>
                    <div class="gesture-item">
                        <span class="gesture-icon">🎤</span>
                        <span>Press 'M' to enable voice commands</span>
                    </div>
                </div>
                <div class="step-actions">
                    <button class="btn-primary btn-large" id="completed-start">
                        🚀 Start Navigating
                    </button>
                </div>
            </div>
        `;

        container.querySelector('#completed-start')?.addEventListener('click', () => {
            this._completeWizard();
        });
    }

    // ========================================
    // Event Handlers
    // ========================================

    _onHandDetected() {
        this.handDetected = true;
        
        const steps = this.getConfig('steps', []);
        if (steps[this.currentStep] === 'calibration') {
            this._renderStep();
        }
    }

    _onHandLost() {
        this.handDetected = false;
        
        const steps = this.getConfig('steps', []);
        if (steps[this.currentStep] === 'calibration') {
            this._renderStep();
        }
    }

    _onGestureDetected(gestureType) {
        if (gestureType === 'swipe_right') {
            this.gestureDetected = true;
            
            const steps = this.getConfig('steps', []);
            if (steps[this.currentStep] === 'gesture_test') {
                this._renderStep();
            }
        }
    }

    _onPermissionGranted() {
        const statusEl = document.getElementById('permission-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="status-indicator success">
                    <span class="status-icon">✓</span>
                    <span>Camera access granted!</span>
                </div>
            `;

            setTimeout(() => {
                this._nextStep();
            }, 1500);
        }
    }

    _onPermissionDenied() {
        const statusEl = document.getElementById('permission-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="status-indicator error">
                    <span class="status-icon">✗</span>
                    <span>Camera access denied</span>
                </div>
                <p class="error-help">
                    Please enable camera access in your browser settings and refresh the page.
                </p>
                <div class="step-actions">
                    <button class="btn-secondary" id="permission-skip">
                        Skip for Now
                    </button>
                </div>
            `;

            statusEl.querySelector('#permission-skip')?.addEventListener('click', () => {
                this._skipWizard();
            });
        }
    }

    // ========================================
    // DOM Management
    // ========================================

    _createWizardDOM() {
        this.wizardElement = document.createElement('div');
        this.wizardElement.id = 'onboarding-wizard';
        this.wizardElement.className = 'onboarding-wizard';
        this.wizardElement.style.display = 'none';

        this.wizardElement.innerHTML = `
            <div class="onboarding-overlay"></div>
            <div class="onboarding-modal">
                <div class="onboarding-header">
                    <div class="onboarding-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-text">
                            <span class="current-step">1</span> / <span class="total-steps">5</span>
                        </div>
                    </div>
                </div>
                <div class="onboarding-content">
                    <!-- Steps rendered here -->
                </div>
            </div>
        `;

        document.body.appendChild(this.wizardElement);
    }

    _showWizard() {
        if (this.wizardElement) {
            this.wizardElement.style.display = 'flex';
            // Trigger reflow for animation
            this.wizardElement.offsetHeight;
            this.wizardElement.classList.add('visible');
        }
    }

    _hideWizard() {
        if (this.wizardElement) {
            this.wizardElement.classList.remove('visible');
            setTimeout(() => {
                if (this.wizardElement) {
                    this.wizardElement.style.display = 'none';
                }
            }, 300);
        }
    }

    _updateProgress() {
        const steps = this.getConfig('steps', []);
        const currentStepEl = this.wizardElement?.querySelector('.current-step');
        const totalStepsEl = this.wizardElement?.querySelector('.total-steps');
        const progressFillEl = this.wizardElement?.querySelector('.progress-fill');

        if (currentStepEl) {
            currentStepEl.textContent = this.currentStep + 1;
        }

        if (totalStepsEl) {
            totalStepsEl.textContent = steps.length;
        }

        if (progressFillEl) {
            const percent = ((this.currentStep + 1) / steps.length) * 100;
            progressFillEl.style.width = `${percent}%`;
        }
    }
}

export default OnboardingPlugin;
