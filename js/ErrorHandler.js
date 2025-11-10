/**
 * Centralized Error Handler for Navigator
 * Provides global error catching, logging, and user-friendly error messages
 * Supports multiple severity levels: critical, warning, info
 */

export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.criticalErrors = new Set([
            'MediaPipe initialization failed',
            'Camera access denied',
            'WebGL not supported',
            'Config validation failed',
            'Configuration validation failed'
        ]);
        
        this.toastContainer = null;
        this.setupGlobalHandlers();
        this.createToastContainer();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Catch synchronous errors
        window.onerror = (message, source, lineno, colno, error) => {
            this.logError({
                severity: 'critical',
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
                severity: 'critical',
                type: 'promise',
                message: event.reason?.message || event.reason,
                error: event.reason,
                timestamp: new Date().toISOString()
            });
        };

        console.log('✅ ErrorHandler: Global error handlers initialized');
    }

    /**
     * Create toast notification container
     */
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99998;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Log an error with severity level
     */
    logError(errorData) {
        // Ensure severity is set
        if (!errorData.severity) {
            errorData.severity = this.isCriticalError(errorData.message) ? 'critical' : 'warning';
        }

        // Add to error log
        this.errors.unshift(errorData);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
        }

        // Console logging with categorization
        const prefix = {
            'critical': '🚨',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[errorData.severity] || '⚠️';

        console.error(`${prefix} [${errorData.severity}] [${errorData.type}]`, errorData.message, errorData.error);

        // Handle based on severity
        if (errorData.severity === 'critical') {
            this.handleCriticalError(errorData);
        } else if (errorData.severity === 'warning') {
            this.showToast(errorData);
        } else if (errorData.severity === 'info') {
            this.showToast(errorData);
        }

        // Emit event for listeners
        window.dispatchEvent(new CustomEvent('navigator:error', {
            detail: errorData
        }));
    }

    /**
     * Public method for manual logging with severity
     */
    log(message, severity = 'info', error = null) {
        this.logError({
            severity: severity,
            type: 'manual',
            message: message,
            error: error,
            timestamp: new Date().toISOString()
        });
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
        if (technicalMessage.includes('Config') || technicalMessage.includes('configuration')) {
            return 'Configuration file is invalid or corrupted. Using default settings.';
        }
        return 'An unexpected error occurred. Please reload the page to continue.';
    }

    /**
     * Show toast notification for non-critical errors
     */
    showToast(errorData) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${errorData.severity}`;
        
        const icon = {
            'warning': '⚠️',
            'info': 'ℹ️'
        }[errorData.severity] || 'ℹ️';

        toast.style.cssText = `
            background: ${errorData.severity === 'warning' 
                ? 'linear-gradient(135deg, rgba(255, 150, 0, 0.95), rgba(255, 100, 0, 0.95))' 
                : 'linear-gradient(135deg, rgba(0, 150, 255, 0.95), rgba(0, 100, 255, 0.95))'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 400px;
            pointer-events: all;
            cursor: pointer;
            transition: all 0.3s ease;
            animation: toastSlideIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        toast.innerHTML = `
            <div style="font-size: 24px; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px; text-transform: capitalize;">
                    ${errorData.severity}
                </div>
                <div style="font-size: 14px; opacity: 0.95; line-height: 1.4;">
                    ${this.getUserFriendlyMessage(errorData.message)}
                </div>
            </div>
            <button style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                flex-shrink: 0;
                transition: background 0.2s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes toastSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        if (!document.querySelector('#toast-animations')) {
            style.id = 'toast-animations';
            document.head.appendChild(style);
        }

        // Close button handler
        const closeBtn = toast.querySelector('button');
        const removeToast = () => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeToast();
        });

        // Click anywhere to dismiss
        toast.addEventListener('click', removeToast);

        // Auto-dismiss after 5 seconds
        setTimeout(removeToast, 5000);

        this.toastContainer.appendChild(toast);
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
