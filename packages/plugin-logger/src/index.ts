/**
 * @file LoggerPlugin - Configurable logging system for Navigator
 * @module @navigator.menu/plugin-logger
 */

/**
 * Log levels in order of severity
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

/**
 * Get the name of a log level
 */
function getLogLevelName(level: LogLevelType): string {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    case LogLevel.NONE: return 'NONE';
    default: return 'UNKNOWN';
  }
}

export interface LoggerPluginOptions {
  /** Minimum log level to display (default: INFO) */
  level?: LogLevelType;
  /** Custom prefix for all log messages */
  prefix?: string;
  /** Enable timestamps in log messages */
  timestamps?: boolean;
}

/**
 * Logger Plugin - Provides centralized, configurable logging
 * 
 * @example
 * ```typescript
 * import { NavigatorCore } from '@navigator.menu/core';
 * import { LoggerPlugin, LogLevel } from '@navigator.menu/plugin-logger';
 * 
 * const nav = new NavigatorCore();
 * const logger = new LoggerPlugin({ level: LogLevel.WARN });
 * nav.use(logger);
 * 
 * // These won't show (level is WARN)
 * logger.debug('Debug message');
 * logger.info('Info message');
 * 
 * // These will show
 * logger.warn('Warning message');
 * logger.error('Error message');
 * ```
 */
export class LoggerPlugin {
  public readonly name = 'logger';
  public readonly version = '1.0.0';
  
  private level: LogLevelType;
  private prefix: string;
  private timestamps: boolean;

  constructor(options: LoggerPluginOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '[Navigator]';
    this.timestamps = options.timestamps ?? false;
  }

  /**
   * Initialize the plugin (called by NavigatorCore)
   */
  public async init(): Promise<void> {
    this.debug('Logger plugin initialized', { level: getLogLevelName(this.level) });
  }

  /**
   * Start the plugin (called by NavigatorCore)
   */
  public async start(): Promise<void> {
    // No-op for logger
  }

  /**
   * Stop the plugin (called by NavigatorCore)
   */
  public async stop(): Promise<void> {
    // No-op for logger
  }

  /**
   * Destroy the plugin (called by NavigatorCore)
   */
  public async destroy(): Promise<void> {
    // No-op for logger
  }

  /**
   * Log a debug message
   */
  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  public error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevelType, message: string, data?: unknown): void {
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
   */
  public setLevel(level: LogLevelType): void {
    this.level = level;
    this.debug('Log level changed', { newLevel: getLogLevelName(level) });
  }

  /**
   * Get the current log level
   */
  public getLevel(): LogLevelType {
    return this.level;
  }
}
