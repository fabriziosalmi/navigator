/**
 * GestureLED - Cybernetic visual feedback for gesture detection
 * Activates cyan LED pulse on every navigation gesture
 */

export class GestureLED {
    constructor() {
        this.ledElement = document.getElementById('gesture-led');
        this.activeTimeout = null;
        this.pulseDuration = 600; // Match CSS animation duration
    }

    /**
     * Activate LED with cyan pulse
     */
    pulse() {
        if (!this.ledElement) {
            return;
        }

        // Clear any existing timeout
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }

        // Add active class for pulsing effect
        this.ledElement.classList.add('active');

        // Remove active class after pulse completes
        this.activeTimeout = setTimeout(() => {
            this.ledElement.classList.remove('active');
            this.activeTimeout = null;
        }, this.pulseDuration);
    }

    /**
     * Trigger LED pulse on navigation event
     * @param {Object} event - Navigation event { type, direction }
     */
    onNavigate(event) {
        this.pulse();
    }

    /**
     * Trigger LED pulse on gesture detection
     * @param {string} gestureName - Name of detected gesture
     */
    onGesture(gestureName) {
        this.pulse();
    }

    /**
     * Trigger LED pulse on keyboard navigation
     * @param {string} key - Key pressed
     */
    onKeyboard(key) {
        this.pulse();
    }

    /**
     * Trigger LED pulse on voice command
     * @param {string} command - Voice command recognized
     */
    onVoiceCommand(command) {
        this.pulse();
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }
        if (this.ledElement) {
            this.ledElement.classList.remove('active');
        }
    }
}
