/**
 * Configuration Loader for Navigator v2.0
 * Loads and validates config.yaml using JSON Schema
 * Supports plugin-based architecture with schema validation
 */

import yaml from 'js-yaml';
import Ajv from 'ajv';
import { logger, LogLevel } from './Logger.js';

export class ConfigLoader {
    constructor() {
        this.config = null;
        this.schema = null;
        this.ajv = new Ajv({ allErrors: true, strict: false });
        this.defaultConfig = this.getDefaultConfig();
    }

    /**
     * Load and validate configuration from YAML file
     */
    async load() {
        try {
            // Load config.yaml
            const configResponse = await fetch('./config.yaml');
            if (!configResponse.ok) {
                logger.warn('config.yaml not found, using defaults');
                this.config = this.defaultConfig;
                return this.config;
            }

            const yamlText = await configResponse.text();
            this.config = yaml.load(yamlText);

            // Load and validate against schema
            await this.loadSchema();
            const isValid = this.validateConfig();

            if (!isValid) {
                logger.error('Configuration validation failed');
                logger.error('Validation errors', this.ajv.errors);
                throw new Error('Invalid configuration');
            }

            // Apply preset if specified
            if (this.config.active_preset) {
                this.applyPreset(this.config.active_preset);
            }

            logger.info('Configuration loaded and validated from config.yaml');
            logger.info('Active preset: ' + (this.config.active_preset || 'none'));
            logger.info('Plugins loaded: ' + this.getPluginList().length);

            return this.config;
        } catch (error) {
            logger.error('Error loading config.yaml', error);
            this.config = this.defaultConfig;
            return this.config;
        }
    }

    /**
     * Load JSON Schema for validation
     */
    async loadSchema() {
        try {
            const response = await fetch('./config.schema.json');
            if (!response.ok) {
                logger.warn('config.schema.json not found, skipping validation');
                return;
            }

            this.schema = await response.json();
            logger.info('Schema loaded from config.schema.json');
        } catch (error) {
            logger.error('Error loading schema', error);
        }
    }

    /**
     * Validate configuration against schema
     */
    validateConfig() {
        if (!this.schema) {
            logger.warn('No schema loaded, skipping validation');
            return true;
        }

        const validate = this.ajv.compile(this.schema);
        const valid = validate(this.config);

        if (!valid) {
            logger.error('Configuration validation errors:');
            
            // Build detailed error message
            const errorMessages = validate.errors.map(error => {
                const path = error.instancePath || 'root';
                const message = error.message || 'Unknown error';
                const params = error.params ? JSON.stringify(error.params) : '';
                return `${path}: ${message} ${params}`;
            }).join('\n  - ');

            logger.error(`  - ${errorMessages}`);

            // Emit detailed error for ErrorHandler
            if (window.errorHandler) {
                window.errorHandler.log(
                    `Configuration validation failed:\n  - ${errorMessages}`,
                    'critical',
                    new Error('Config validation failed')
                );
            }

            return false;
        }

        logger.info('Configuration schema validation passed');
        return true;
    }

    /**
     * Get list of enabled plugins with their configuration
     */
    getPluginList() {
        if (!this.config || !this.config.plugins) {
            return [];
        }

        return this.config.plugins.filter(plugin => plugin.enabled);
    }

    /**
     * Get configuration for a specific plugin
     * @param {string} pluginName - Name of the plugin (e.g., "GestureInputPlugin")
     * @returns {object|null} Plugin configuration object
     */
    getPluginConfig(pluginName) {
        const plugins = this.config?.plugins || [];
        const plugin = plugins.find(p => p.name === pluginName);
        return plugin?.options || null;
    }

    /**
     * Check if a plugin is enabled
     * @param {string} pluginName - Name of the plugin
     * @returns {boolean}
     */
    isPluginEnabled(pluginName) {
        const plugins = this.config?.plugins || [];
        const plugin = plugins.find(p => p.name === pluginName);
        return plugin?.enabled || false;
    }

    /**
     * Apply a configuration preset
     */
    applyPreset(presetName) {
        const preset = this.config.presets?.[presetName];
        if (!preset) {
            logger.warn(`Preset "${presetName}" not found`);
            return;
        }

        logger.info(`Applying preset: ${presetName}`);

        for (const [path, value] of Object.entries(preset)) {
            // Handle plugin overrides in presets
            if (path === 'plugins' && Array.isArray(value)) {
                this.mergePluginPresets(value);
            } else {
                this.set(path, value);
            }
        }
    }

    /**
     * Merge plugin-specific preset values with existing plugin config
     */
    mergePluginPresets(presetPlugins) {
        presetPlugins.forEach(presetPlugin => {
            const existingPlugin = this.config.plugins.find(
                p => p.name === presetPlugin.name
            );

            if (existingPlugin && presetPlugin.options) {
                // Deep merge options
                existingPlugin.options = this.deepMerge(
                    existingPlugin.options || {},
                    presetPlugin.options
                );
            }
        });
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const output = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }

        return output;
    }

    /**
     * Get configuration value by path (dot notation)
     * Example: get('performance.target_fps')
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            logger.warn('Config not loaded, using default');
            return defaultValue;
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        let obj = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!obj[key] || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }

        obj[keys[keys.length - 1]] = value;
    }

    /**
     * Get entire config object
     */
    getAll() {
        return this.config || this.defaultConfig;
    }

    /**
     * Default configuration (minimal fallback if YAML fails)
     */
    getDefaultConfig() {
        return {
            plugins: [
                { name: 'KeyboardInputPlugin', enabled: true, priority: 100, options: {} },
                { name: 'NavigationLogicPlugin', enabled: true, priority: 50, options: {} },
                { name: 'DomRendererPlugin', enabled: true, priority: 10, options: {} }
            ],
            performance: {
                target_fps: 60,
                idle_timeout_ms: 15000,
                idle_enabled: true
            },
            navigation: {
                initial_layer: 'video',
                initial_card_index: 0
            },
            ui: {
                hud: {
                    top_bar: true,
                    bottom_bar: true,
                    compact_mode: true
                },
                debug: {
                    enabled: false,
                    console_logging: true
                }
            }
        };
    }

    /**
     * Export current config as YAML string (for saving)
     */
    exportYAML() {
        return yaml.dump(this.config, {
            indent: 2,
            lineWidth: 120,
            noRefs: true
        });
    }

    /**
     * Validate configuration values are within acceptable ranges
     * (Lightweight validation for runtime checks)
     */
    validate() {
        const warnings = [];

        // FPS validation
        const fps = this.get('performance.target_fps');
        if (fps && (fps < 30 || fps > 120)) {
            warnings.push(`target_fps ${fps} outside recommended range [30-120]`);
        }

        // Plugin validation
        const plugins = this.getPluginList();
        if (plugins.length === 0) {
            warnings.push('No plugins enabled - application may not function');
        }

        // Check for required plugins
        const hasNavigationLogic = plugins.some(p => p.name === 'NavigationLogicPlugin');
        const hasRenderer = plugins.some(p => p.name === 'DomRendererPlugin');

        if (!hasNavigationLogic) {
            warnings.push('NavigationLogicPlugin not enabled - navigation may not work');
        }

        if (!hasRenderer) {
            warnings.push('DomRendererPlugin not enabled - UI may not render');
        }

        if (warnings.length > 0) {
            logger.warn('Configuration validation warnings:');
            warnings.forEach(w => logger.warn('  -' + w));
        }

        return warnings.length === 0;
    }

    /**
     * Hot reload configuration (for development)
     */
    async reload() {
        logger.info('Reloading configuration...');
        await this.load();
        this.validate();

        // Emit event for components to react
        window.dispatchEvent(new CustomEvent('config:reloaded', {
            detail: { config: this.config }
        }));

        return this.config;
    }

    /**
     * Get detailed validation report
     */
    getValidationReport() {
        if (!this.schema) {
            return { valid: true, errors: [], message: 'No schema loaded' };
        }

        const validate = this.ajv.compile(this.schema);
        const valid = validate(this.config);

        return {
            valid,
            errors: validate.errors || [],
            message: valid ? 'Configuration is valid' : 'Configuration has errors'
        };
    }
}

// Create and export singleton
export const configLoader = new ConfigLoader();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.configLoader = configLoader;
}

// Helper functions for easy access
export function getConfig(path, defaultValue) {
    return configLoader.get(path, defaultValue);
}

export function getPluginConfig(pluginName) {
    return configLoader.getPluginConfig(pluginName);
}

export function isPluginEnabled(pluginName) {
    return configLoader.isPluginEnabled(pluginName);
}
