/**
 * VoiceCommandModule - Speech Recognition for Navigation
 * Handles voice commands for multi-directional navigation
 * Commands: "up", "down", "left", "right", "su", "giù", "sinistra", "destra"
 */

export class VoiceCommandModule {
    constructor(navigationController, audioManager, historyHUD = null) {
        this.navigationController = navigationController;
        this.audioManager = audioManager;
        this.historyHUD = historyHUD;
        
        // Web Speech API
        this.recognition = null;
        this.isListening = false;
        this.isEnabled = false;
        
        // Command mapping (English + Italian)
        this.commands = {
            // Vertical (layer changes)
            'up': 'layer-up',
            'su': 'layer-up',
            'down': 'layer-down',
            'giù': 'layer-down',
            'giu': 'layer-down', // Alternative without accent
            
            // Horizontal (card navigation)
            'left': 'card-left',
            'sinistra': 'card-left',
            'right': 'card-right',
            'destra': 'card-right',
            
            // Shortcuts
            'back': 'card-left',
            'indietro': 'card-left',
            'next': 'card-right',
            'avanti': 'card-right'
        };
        
        // Voice feedback settings
        this.feedbackEnabled = true;
        this.lastCommandTime = 0;
        this.commandCooldown = 300; // ms between commands
        
        // Visual indicator
        this.indicator = null;
        
        this.init();
    }
    
    /**
     * Initialize Speech Recognition API
     */
    init() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition API not supported in this browser');
            return;
        }
        
        // Create recognition instance
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'it-IT'; // Italian primary, will recognize English too
        this.recognition.continuous = true; // Keep listening
        this.recognition.interimResults = false; // Only final results
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => this.handleStart();
        this.recognition.onend = () => this.handleEnd();
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        
        // Create visual indicator
        this.createIndicator();
        
        console.log('VoiceCommandModule initialized');
    }
    
    /**
     * Create visual indicator for voice listening state
     */
    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.id = 'voice-indicator';
        this.indicator.innerHTML = '🎤';
        document.body.appendChild(this.indicator);
    }
    
    /**
     * Start listening for voice commands
     */
    start() {
        if (!this.recognition) {
            console.warn('Speech Recognition not available');
            return false;
        }
        
        if (this.isListening) {
            return true;
        }
        
        try {
            this.recognition.start();
            this.isEnabled = true;
            return true;
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            return false;
        }
    }
    
    /**
     * Stop listening for voice commands
     */
    stop() {
        if (!this.recognition || !this.isListening) {
            return;
        }
        
        try {
            this.recognition.stop();
            this.isEnabled = false;
        } catch (error) {
            console.error('Failed to stop voice recognition:', error);
        }
    }
    
    /**
     * Toggle voice command listening
     */
    toggle() {
        if (this.isListening) {
            this.stop();
            return false;
        } else {
            return this.start();
        }
    }
    
    /**
     * Handle recognition start
     */
    handleStart() {
        this.isListening = true;
        console.log('Voice recognition started');
        
        // Show indicator with listening class
        if (this.indicator) {
            this.indicator.classList.add('listening');
        }
        
        // Audio feedback
        if (this.audioManager && this.feedbackEnabled) {
            this.audioManager.playTone(880, 0.05, 'sine'); // High beep
        }
    }
    
    /**
     * Handle recognition end
     */
    handleEnd() {
        this.isListening = false;
        console.log('Voice recognition ended');
        
        // Hide indicator by removing listening class
        if (this.indicator) {
            this.indicator.classList.remove('listening');
        }
        
        // Auto-restart if still enabled
        if (this.isEnabled) {
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.warn('Failed to restart recognition:', error);
                }
            }, 100);
        }
    }
    
    /**
     * Handle recognition result
     */
    handleResult(event) {
        const result = event.results[event.results.length - 1];
        
        if (!result.isFinal) {
            return;
        }
        
        const transcript = result[0].transcript.toLowerCase().trim();
        console.log('Voice command received:', transcript);
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastCommandTime < this.commandCooldown) {
            console.log('Command ignored (cooldown)');
            return;
        }
        
        // Parse command
        const action = this.parseCommand(transcript);
        
        if (action) {
            this.lastCommandTime = now;
            this.executeCommand(action);
            
            // Visual feedback
            this.flashIndicator();
        } else {
            console.log('Command not recognized:', transcript);
        }
    }
    
    /**
     * Handle recognition error
     */
    handleError(event) {
        console.error('Voice recognition error:', event.error);
        
        // Don't log "no-speech" errors (too noisy)
        if (event.error === 'no-speech') {
            return;
        }
        
        // Auto-restart on certain errors
        if (event.error === 'aborted' || event.error === 'audio-capture') {
            if (this.isEnabled) {
                setTimeout(() => this.start(), 1000);
            }
        }
    }
    
    /**
     * Parse voice transcript into navigation command
     * @param {string} transcript - Voice input text
     * @returns {string|null} - Action name or null
     */
    parseCommand(transcript) {
        // Direct match
        if (this.commands[transcript]) {
            return this.commands[transcript];
        }
        
        // Fuzzy match (contains keyword)
        for (const [keyword, action] of Object.entries(this.commands)) {
            if (transcript.includes(keyword)) {
                return action;
            }
        }
        
        return null;
    }
    
    /**
     * Execute navigation command
     * @param {string} action - Command to execute
     */
    executeCommand(action) {
        console.log('Executing voice command:', action);
        
        // Play success sound
        if (this.audioManager && this.feedbackEnabled) {
            this.audioManager.playTone(1320, 0.08, 'sine'); // Success tone
        }
        
        // Execute navigation
        switch (action) {
            case 'layer-up':
                this.navigationController.navigateToLayer(
                    this.navigationController.currentLayer - 1
                );
                if (this.historyHUD) this.historyHUD.addAction('layer-up', 'voice');
                break;
                
            case 'layer-down':
                this.navigationController.navigateToLayer(
                    this.navigationController.currentLayer + 1
                );
                if (this.historyHUD) this.historyHUD.addAction('layer-down', 'voice');
                break;
                
            case 'card-left':
                this.navigationController.navigateInDirection('left');
                if (this.historyHUD) this.historyHUD.addAction('card-left', 'voice');
                break;
                
            case 'card-right':
                this.navigationController.navigateInDirection('right');
                if (this.historyHUD) this.historyHUD.addAction('card-right', 'voice');
                break;
                
            default:
                console.warn('Unknown action:', action);
        }
    }
    
    /**
     * Flash indicator on successful command
     */
    flashIndicator() {
        if (!this.indicator) return;
        
        // Pulse animation
        this.indicator.style.background = 'rgba(0, 255, 153, 0.4)';
        this.indicator.style.borderColor = 'rgba(0, 255, 153, 0.8)';
        this.indicator.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            this.indicator.style.background = 'rgba(0, 255, 153, 0.1)';
            this.indicator.style.borderColor = 'rgba(0, 255, 153, 0.3)';
            this.indicator.style.transform = 'scale(1)';
        }, 200);
    }
    
    /**
     * Enable/disable voice feedback sounds
     */
    setFeedbackEnabled(enabled) {
        this.feedbackEnabled = enabled;
    }
    
    /**
     * Get listening state
     */
    getState() {
        return {
            isListening: this.isListening,
            isEnabled: this.isEnabled,
            isSupported: !!this.recognition,
            language: this.recognition ? this.recognition.lang : null
        };
    }
    
    /**
     * Add custom command mapping
     * @param {string} keyword - Voice keyword
     * @param {string} action - Navigation action
     */
    addCommand(keyword, action) {
        this.commands[keyword.toLowerCase()] = action;
    }
    
    /**
     * Remove command mapping
     * @param {string} keyword - Voice keyword to remove
     */
    removeCommand(keyword) {
        delete this.commands[keyword.toLowerCase()];
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
        
        if (this.recognition) {
            this.recognition.onstart = null;
            this.recognition.onend = null;
            this.recognition.onresult = null;
            this.recognition.onerror = null;
            this.recognition = null;
        }
        
        console.log('VoiceCommandModule destroyed');
    }
}
