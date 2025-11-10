#!/bin/bash
# Script to replace console.log/warn/error with logger calls

# ConfigLoader.js remaining
sed -i '' "s/console\.warn('⚠️ config\.yaml not found, using defaults');/logger.warn('config.yaml not found, using defaults');/" js/ConfigLoader.js
sed -i '' "s/console\.error('❌ Configuration validation failed');/logger.error('Configuration validation failed');/" js/ConfigLoader.js
sed -i '' "s/console\.error('Validation errors:', this\.ajv\.errors);/logger.error('Validation errors', this.ajv.errors);/" js/ConfigLoader.js
sed -i '' "s/console\.error('❌ Error loading config\.yaml:', error);/logger.error('Error loading config.yaml', error);/" js/ConfigLoader.js
sed -i '' "s/console\.warn(\`⚠️ Preset \"\${presetName}\" not found\`);/logger.warn(\`Preset \"\${presetName}\" not found\`);/" js/ConfigLoader.js
sed -i '' "s/console\.log(\`🎨 Applying preset: \${presetName}\`);/logger.info(\`Applying preset: \${presetName}\`);/" js/ConfigLoader.js
sed -i '' "s/console\.warn('⚠️ Config not loaded, using default');/logger.warn('Config not loaded, using default');/" js/ConfigLoader.js
sed -i '' "s/console\.warn('⚠️ Configuration validation warnings:');/logger.warn('Configuration validation warnings:');/" js/ConfigLoader.js
sed -i '' "s/warnings\.forEach(w => console\.warn('  -', w));/warnings.forEach(w => logger.warn('  -' + w));/" js/ConfigLoader.js
sed -i '' "s/console\.log('🔄 Reloading configuration\.\.\.');/logger.info('Reloading configuration...');/" js/ConfigLoader.js

echo "✅ ConfigLoader.js console statements replaced"
