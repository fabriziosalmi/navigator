/**
 * @file Logger - Configurable logging system for Navigator
 * @module Logger
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

/**
 * Get the name of a log level
 * @param {number} level
 * @returns {string}
 */
function getLogLevelName(level) {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    case LogLevel.NONE: return 'NONE';
    default: return 'UNKNOWN';
  }
}

/**
 * Logger - Provides centralized, configurable logging
 * 
 * @example
 * ```javascript
 * import { Logger, LogLevel } from './Logger.js';
 * 
 * const logger = new Logger({ level: LogLevel.INFO, prefix: '[Navigator]' });
 * 
 * logger.debug('Debug message'); // Won't show (level is INFO)
 * logger.info('Info message');   // Will show
 * logger.warn('Warning');        // Will show
 * logger.error('Error');         // Will show
 * ```
 */
export class Logger {
  /**
   * @param {Object} options
   * @param {number} [options.level=LogLevel.INFO] - Minimum log level to display
   * @param {string} [options.prefix='[Navigator]'] - Custom prefix for all log messages
   * @param {boolean} [options.timestamps=false] - Enable timestamps in log messages
   */
  constructor(options = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '[Navigator]';
    this.timestamps = options.timestamps ?? false;
  }

  /**
   * Log a debug message
   * @param {string} message
   * @param {*} [data]
   */
  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   * @param {string} message
   * @param {*} [data]
   */
  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   * @param {string} message
   * @param {*} [data]
   */
  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   * @param {string} message
   * @param {*} [data]
   */
  error(message, data) {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Internal logging method
   * @private
   * @param {number} level
   * @param {string} message
   * @param {*} [data]
   */
  log(level, message, data) {
    if (level < this.level) {
      return; // Don't log if below minimum level
    }

    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
    const levelName = getLogLevelName(level);
    const prefix = `${timestamp}${this.prefix} [${levelName}]`;
    
    const logMethod = level >= LogLevel.ERROR ? console.error :
                      level >= LogLevel.WARN ? console.warn :
                      console.log;

    if (data !== undefined) {
      logMethod(prefix, message, data);
    } else {
      logMethod(prefix, message);
    }
  }

  /**
   * Set the minimum log level
   * @param {number} level
   */
  setLevel(level) {
    this.level = level;
    this.debug('Log level changed', { newLevel: getLogLevelName(level) });
  }

  /**
   * Get the current log level
   * @returns {number}
   */
  getLevel() {
    return this.level;
  }
}

// Export a default logger instance
export const logger = new Logger({ level: LogLevel.INFO });
