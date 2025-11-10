/**
 * Centralized Error Handler for Navigator
 * Provides global error catching, logging, and user-friendly error messages
 */

export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.criticalErrors = new Set([
            'MediaPipe initialization failed',
            'Camera access denied',
            'WebGL not supported'
        ]);
        
        this.setupGlobalHandlers();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Catch synchronous errors
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError({
                type: 'runtime',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                error: error,
                timestamp: new Date().toISOString()
            });
            return false; // Let browser handle it too
        };

        // Catch unhandled promise rejections
        window.onunhandledrejection = (event) => {
            this.logError({
                type: 'promise',
                message: event.reason?.message || event.reason,
                error: event.reason,
                timestamp: new Date().toISOString()
            });
        };

        console.log('✅ ErrorHandler: Global error handlers initialized');
    }

    /**
     * Log an error
     */
    logError(errorData) {
        // Add to error log
        this.errors.unshift(errorData);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
        }

        // Console logging with categorization
        const prefix = errorData.type === 'critical' ? '🚨' : '⚠️';
        console.error(`${prefix} [${errorData.type}]`, errorData.message, errorData.error);

        // Check if critical
        const isCritical = this.isCriticalError(errorData.message);
        if (isCritical) {
            this.handleCriticalError(errorData);
        }

        // Emit event for listeners
        window.dispatchEvent(new CustomEvent('navigator:error', {
            detail: { ...errorData, isCritical }
        }));
    }

    /**
     * Check if error is critical
     */
    isCriticalError(message) {
        return Array.from(this.criticalErrors).some(critical => 
            message.includes(critical)
        );
    }

    /**
     * Handle critical errors with user notification
     */
    handleCriticalError(errorData) {
        console.error('🚨 CRITICAL ERROR:', errorData);

        // Show user-friendly error overlay
        this.showErrorOverlay(errorData);

        // Optional: Send to analytics/monitoring service
        // this.sendToMonitoring(errorData);
    }

    /**
     * Show error overlay to user
     */
    showErrorOverlay(errorData) {
        // Check if overlay already exists
        let overlay = document.getElementById('error-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'error-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(20, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            const errorBox = document.createElement('div');
            errorBox.style.cssText = `
                max-width: 500px;
                padding: 40px;
                background: linear-gradient(135deg, rgba(40, 20, 20, 0.95), rgba(60, 20, 20, 0.95));
                border: 2px solid rgba(255, 100, 100, 0.5);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
            `;

            errorBox.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">System Error</h2>
                <p style="opacity: 0.8; margin: 0 0 20px 0; font-size: 14px;">
                    ${this.getUserFriendlyMessage(errorData.message)}
                </p>
                <button id="error-reload-btn" style="
                    background: linear-gradient(135deg, #ff4444, #cc0000);
                    border: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 14px;
                    margin-right: 10px;
                ">Reload Page</button>
                <button id="error-dismiss-btn" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    padding: 12px 30px;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 14px;
                ">Dismiss</button>
                <details style="margin-top: 20px; text-align: left; font-size: 12px; opacity: 0.6;">
                    <summary style="cursor: pointer;">Technical Details</summary>
                    <pre style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: auto;">${JSON.stringify(errorData, null, 2)}</pre>
                </details>
            `;

            overlay.appendChild(errorBox);
            document.body.appendChild(overlay);

            // Add event listeners
            document.getElementById('error-reload-btn').addEventListener('click', () => {
                window.location.reload();
            });

            document.getElementById('error-dismiss-btn').addEventListener('click', () => {
                overlay.remove();
            });
        }
    }

    /**
     * Convert technical error to user-friendly message
     */
    getUserFriendlyMessage(technicalMessage) {
        if (technicalMessage.includes('MediaPipe')) {
            return 'Unable to load hand tracking system. Please check your internet connection and reload the page.';
        }
        if (technicalMessage.includes('Camera')) {
            return 'Camera access is required. Please grant camera permissions and reload the page.';
        }
        if (technicalMessage.includes('WebGL')) {
            return 'Your browser does not support required 3D graphics. Please use a modern browser like Chrome or Firefox.';
        }
        return 'An unexpected error occurred. Please reload the page to continue.';
    }

    /**
     * Manual error logging
     */
    log(message, type = 'info', error = null) {
        this.logError({
            type: type,
            message: message,
            error: error,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get error history
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Clear error history
     */
    clearErrors() {
        this.errors = [];
    }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();
