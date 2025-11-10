#!/bin/bash
# Script to comment out all console.log statements (keeping warn/error)

FILES=(
    "js/AdaptiveNavigationHUD.js"
    "js/CarouselMomentum.js"
    "js/ErrorHandler.js"
    "js/GridLockSystem.js"
    "js/InterfaceStatusHUD.js"
    "js/LightBeamSystem.js"
    "js/VisualEffects.js"
    "js/VoiceCommandModule.js"
    "js/core/EventBus.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Comment out console.log lines (but not console.warn or console.error)
        sed -i '' 's/^        console\.log(/        \/\/ console.log(/' "$file"
        sed -i '' 's/^            console\.log(/            \/\/ console.log(/' "$file"
        echo "✅ Commented console.log in $file"
    fi
done

echo "🎯 All console.log statements commented out"
