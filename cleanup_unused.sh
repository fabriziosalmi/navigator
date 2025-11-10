#!/bin/bash

# File JS non utilizzati da rimuovere
JS_UNUSED=(
    "js/main.js"
    "js/main.optimized.js"
    "js/SceneManager.js"
    "js/SceneManager.optimized.js"
    "js/Card.js"
    "js/CardManager.js"
    "js/LODManager.js"
    "js/DataStream.js"
    "js/DataStream.optimized.js"
    "js/GestureController.js"
    "js/GestureController.optimized.js"
    "js/UIManager.js"
    "js/AppStateManager.js"
)

# Backup prima di eliminare
mkdir -p .backup/$(date +%Y%m%d_%H%M%S)
for file in "${JS_UNUSED[@]}"; do
    if [ -f "$file" ]; then
        echo "Backing up $file"
        cp "$file" ".backup/$(date +%Y%m%d_%H%M%S)/"
    fi
done

# Rimuovi i file non utilizzati
for file in "${JS_UNUSED[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing $file"
        rm "$file"
    fi
done

echo "Cleanup completed!"
