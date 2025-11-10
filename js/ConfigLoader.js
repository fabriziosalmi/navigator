/**
 * Configuration Loader for Navigator
 * Loads and applies settings from config.yaml
 * Provides runtime access to all configuration parameters
 */

export class ConfigLoader {
    constructor() {
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
    }

    /**
     * Load configuration from YAML file
     */
    async load() {
        try {
            const response = await fetch('./config.yaml');
            if (!response.ok) {
                console.warn('⚠️ config.yaml not found, using defaults');
                this.config = this.defaultConfig;
                return this.config;
            }

            const yamlText = await response.text();
            this.config = this.parseYAML(yamlText);
            
            // Apply preset if specified
            if (this.config.active_preset) {
                this.applyPreset(this.config.active_preset);
            }

            console.log('✅ Configuration loaded from config.yaml');
            console.log('📊 Active preset:', this.config.active_preset || 'none');
            
            return this.config;
        } catch (error) {
            console.error('❌ Error loading config.yaml:', error);
            this.config = this.defaultConfig;
            return this.config;
        }
    }

    /**
     * Simple YAML parser (supports basic key-value, nested objects, arrays)
     * For production, consider using js-yaml library
     */
    parseYAML(yamlText) {
        const config = {};
        const lines = yamlText.split('\n');
        const stack = [{ obj: config, indent: -1 }];

        for (const line of lines) {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || line.trim() === '') {
                continue;
            }

            const indent = line.search(/\S/);
            const trimmed = line.trim();

            // Pop stack until we find the right parent
            while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }

            const current = stack[stack.length - 1].obj;

            if (trimmed.includes(':')) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim();

                if (value === '' || value === '{}' || value === '[]') {
                    // Nested object or array
                    const newObj = value === '[]' ? [] : {};
                    current[key.trim()] = newObj;
                    stack.push({ obj: newObj, indent });
                } else {
                    // Simple value
                    current[key.trim()] = this.parseValue(value);
                }
            } else if (trimmed.startsWith('-')) {
                // Array item
                const value = trimmed.substring(1).trim();
                if (Array.isArray(current)) {
                    current.push(this.parseValue(value));
                }
            }
        }

        return config;
    }

    /**
     * Parse YAML value to appropriate JavaScript type
     */
    parseValue(value) {
        // Remove comments
        value = value.split('#')[0].trim();

        // Boolean
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }

        // Null
        if (value === 'null' || value === '~') {
            return null;
        }

        // Number
        if (!isNaN(value) && value !== '') {
            return parseFloat(value);
        }

        // String (remove quotes if present)
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        return value;
    }

    /**
     * Apply a configuration preset
     */
    applyPreset(presetName) {
        const preset = this.config.presets?.[presetName];
        if (!preset) {
            console.warn(`⚠️ Preset "${presetName}" not found`);
            return;
        }

        console.log(`🎨 Applying preset: ${presetName}`);

        for (const [path, value] of Object.entries(preset)) {
            this.set(path, value);
        }
    }

    /**
     * Get configuration value by path (dot notation)
     * Example: get('gestures.detection.min_detection_confidence')
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            console.warn('⚠️ Config not loaded, using default');
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
     * Default configuration (fallback if YAML fails to load)
     */
    getDefaultConfig() {
        return {
            performance: {
                target_fps: 60,
                idle_timeout_ms: 15000,
                idle_enabled: true
            },
            gestures: {
                detection: {
                    min_detection_confidence: 0.7,
                    min_tracking_confidence: 0.5,
                    model_complexity: 1,
                    max_num_hands: 1
                },
                recognition: {
                    swipe: {
                        min_distance: 0.08,
                        max_time_ms: 800,
                        cooldown_ms: 300
                    }
                },
                grid_lock: {
                    enabled: true,
                    cell_size: 0.15,
                    accumulator_decay: 0.85,
                    intent_threshold: 0.3,
                    dead_zone: 0.05
                }
            },
            navigation: {
                cards: {
                    transition_duration_ms: 600
                },
                momentum: {
                    enabled: true,
                    friction: 0.92
                }
            },
            audio: {
                enabled: true,
                master_volume: 0.3
            },
            visual_effects: {
                enabled: true,
                performance_mode: 'medium'
            },
            ui: {
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
        return this.objectToYAML(this.config);
    }

    /**
     * Convert JavaScript object to YAML string
     */
    objectToYAML(obj, indent = 0) {
        let yaml = '';
        const spaces = '  '.repeat(indent);

        for (const [key, value] of Object.entries(obj)) {
            if (value === null) {
                yaml += `${spaces}${key}: null\n`;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                yaml += this.objectToYAML(value, indent + 1);
            } else if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        yaml += this.objectToYAML(item, indent + 1);
                    } else {
                        yaml += `${spaces}  - ${item}\n`;
                    }
                });
            } else if (typeof value === 'string') {
                yaml += `${spaces}${key}: "${value}"\n`;
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }

        return yaml;
    }

    /**
     * Validate configuration values are within acceptable ranges
     */
    validate() {
        const warnings = [];

        // FPS validation
        const fps = this.get('performance.target_fps');
        if (fps < 30 || fps > 120) {
            warnings.push(`target_fps ${fps} outside recommended range [30-120]`);
        }

        // Confidence validation
        const detectionConf = this.get('gestures.detection.min_detection_confidence');
        if (detectionConf < 0.5 || detectionConf > 0.95) {
            warnings.push(`min_detection_confidence ${detectionConf} outside range [0.5-0.95]`);
        }

        // Volume validation
        const volume = this.get('audio.master_volume');
        if (volume < 0 || volume > 1) {
            warnings.push(`master_volume ${volume} outside range [0-1]`);
        }

        if (warnings.length > 0) {
            console.warn('⚠️ Configuration validation warnings:');
            warnings.forEach(w => console.warn('  -', w));
        }

        return warnings.length === 0;
    }

    /**
     * Hot reload configuration (for development)
     */
    async reload() {
        console.log('🔄 Reloading configuration...');
        await this.load();
        this.validate();
        
        // Emit event for components to react
        window.dispatchEvent(new CustomEvent('config:reloaded', {
            detail: { config: this.config }
        }));
        
        return this.config;
    }
}

// Create and export singleton
export const configLoader = new ConfigLoader();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.configLoader = configLoader;
}

// Helper function for easy access
export function getConfig(path, defaultValue) {
    return configLoader.get(path, defaultValue);
}
