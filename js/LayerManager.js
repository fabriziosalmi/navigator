/**
 * LayerManager - Gestisce i layer categorizzati di card
 */
export class LayerManager {
    constructor(config = {}) {
        this.layers = config.layers || this.getDefaultLayers();
        this.currentLayer = config.initialLayer || 'video';
        this.currentCardIndex = 0;
        this.onLayerChange = config.onLayerChange || (() => {});
        this.onCardChange = config.onCardChange || (() => {});
    }

    getDefaultLayers() {
        return {
            video: [
                { 
                    id: 1, 
                    title: '🎬 Gesture Navigation Demo', 
                    meta: 'Interactive Tutorial • 2min',
                    content: 'Welcome to the future of navigation! Use natural hand gestures to explore.',
                    media: { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
                },
                { 
                    id: 2, 
                    title: '🌊 Ocean Depths 4K', 
                    meta: 'Nature Documentary • 45min',
                    content: 'Explore the mysterious world beneath the waves in stunning 4K resolution.',
                    media: { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' }
                },
                { 
                    id: 3, 
                    title: '🚀 Space Exploration', 
                    meta: 'Science • Live Stream',
                    content: 'Journey through the cosmos and discover the wonders of space.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400' }
                },
                { 
                    id: 4, 
                    title: '🎵 Ambient Soundscapes', 
                    meta: 'Audio Experience • 1hr loop',
                    content: 'Immerse yourself in calming, generative soundscapes.',
                    media: { type: 'audio', name: 'Ambient Loop' }
                }
            ],
            news: [
                { 
                    id: 1, 
                    title: '🤖 AI Revolution: Gesture UI Takes Over', 
                    meta: 'Tech • 2 hours ago',
                    content: 'Natural gesture interfaces are revolutionizing how we interact with technology.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400' }
                },
                { 
                    id: 2, 
                    title: '🌍 Climate Tech Breakthrough', 
                    meta: 'Science • 5 hours ago',
                    content: 'New carbon capture technology shows promising results in field tests.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400' }
                },
                { 
                    id: 3, 
                    title: '🔬 Quantum Computing Milestone', 
                    meta: 'Technology • 1 day ago',
                    content: 'Researchers achieve quantum supremacy with 1000-qubit processor.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400' }
                },
                { 
                    id: 4, 
                    title: '🎨 Digital Art Renaissance', 
                    meta: 'Culture • 2 days ago',
                    content: 'AI-assisted creativity sparks new era in digital arts.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' }
                }
            ],
            images: [
                { 
                    id: 1, 
                    title: '🌌 Nebula Collection', 
                    meta: '48 photos • Space',
                    content: 'Breathtaking views of distant nebulae captured by deep space telescopes.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400' }
                },
                { 
                    id: 2, 
                    title: '🏙️ Cyberpunk Cityscapes', 
                    meta: '64 photos • Urban',
                    content: 'Neon-lit streets and futuristic architecture from around the globe.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400' }
                },
                { 
                    id: 3, 
                    title: '🦋 Nature Macro', 
                    meta: '102 photos • Wildlife',
                    content: "Incredible close-up photography revealing nature's hidden details.",
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400' }
                },
                { 
                    id: 4, 
                    title: '✨ Abstract Light Art', 
                    meta: '25 photos • Digital Art',
                    content: 'Mesmerizing light paintings and long-exposure experiments.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400' }
                }
            ],
            games: [
                { 
                    id: 1, 
                    title: '⚡ Neural Runner', 
                    meta: 'Action • Gesture Controlled',
                    content: 'Navigate through cyberspace using hand gestures. Pure adrenaline!',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' }
                },
                { 
                    id: 2, 
                    title: '🎯 Quantum Chess', 
                    meta: 'Strategy • Multiplayer',
                    content: 'Chess meets quantum mechanics in this mind-bending strategy game.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400' }
                },
                { 
                    id: 3, 
                    title: '🧩 Holographic Puzzles', 
                    meta: 'Puzzle • 3D Interactive',
                    content: 'Solve intricate 3D puzzles in holographic space.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400' }
                },
                { 
                    id: 4, 
                    title: '🏎️ Anti-Gravity Racing', 
                    meta: 'Racing • VR Ready',
                    content: 'Race at impossible speeds through zero-gravity tracks.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' }
                }
            ],
            apps: [
                { 
                    id: 1, 
                    title: '📊 Neural Workspace', 
                    meta: 'Productivity • AI-Powered',
                    content: 'Your intelligent workspace that adapts to your workflow.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' }
                },
                { 
                    id: 2, 
                    title: '🎨 Holographic Designer', 
                    meta: 'Creative • 3D Editing',
                    content: 'Design in 3D space with intuitive gesture controls.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400' }
                },
                { 
                    id: 3, 
                    title: '🎵 Quantum Synthesizer', 
                    meta: 'Music Production • Generative',
                    content: 'Create otherworldly sounds with AI-assisted synthesis.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400' }
                },
                { 
                    id: 4, 
                    title: '💻 Code Matrix', 
                    meta: 'Development • Neural IDE',
                    content: 'Next-generation development environment with AI pair programming.',
                    media: { type: 'image', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400' }
                }
            ],
            settings: [
                { 
                    id: 1, 
                    title: '🎨 Display & Themes', 
                    meta: 'Appearance Settings',
                    content: 'Customize colors, blur effects, and 3D depth parameters.',
                    media: { type: 'icon', icon: '🌈' }
                },
                { 
                    id: 2, 
                    title: '🔊 Audio & Effects', 
                    meta: 'Sound Configuration',
                    content: 'Adjust volume, enable spatial audio, and customize sound effects.',
                    media: { type: 'icon', icon: '🎧' }
                },
                { 
                    id: 3, 
                    title: '🖐️ Gesture Sensitivity', 
                    meta: 'Control Calibration',
                    content: 'Fine-tune gesture recognition, thresholds, and intent detection.',
                    media: { type: 'icon', icon: '✋' }
                },
                { 
                    id: 4, 
                    title: '🔒 Privacy & Security', 
                    meta: 'System Security',
                    content: 'Manage permissions, data handling, and security preferences.',
                    media: { type: 'icon', icon: '🛡️' }
                }
            ]
        };
    }

    getCurrentLayer() {
        return this.currentLayer;
    }

    getCurrentCard() {
        return this.layers[this.currentLayer][this.currentCardIndex];
    }

    getCurrentCardIndex() {
        return this.currentCardIndex;
    }

    getTotalCards() {
        return this.layers[this.currentLayer].length;
    }

    getLayerNames() {
        return Object.keys(this.layers);
    }

    setLayer(layerName) {
        if (this.layers[layerName]) {
            this.currentLayer = layerName;
            this.currentCardIndex = 0;
            this.onLayerChange(layerName);
            return true;
        }
        return false;
    }

    navigateCard(direction) {
        const totalCards = this.getTotalCards();
        let newIndex = this.currentCardIndex + direction;

        // Infinite loop - wrap around
        if (newIndex < 0) {
            newIndex = totalCards - 1;
        } else if (newIndex >= totalCards) {
            newIndex = 0;
        }

        this.currentCardIndex = newIndex;
        this.onCardChange(this.currentCardIndex, direction);
        return true;
    }

    navigateLayer(direction) {
        const layerNames = this.getLayerNames();
        const currentIndex = layerNames.indexOf(this.currentLayer);
        let newIndex = currentIndex + direction;

        // Infinite loop - wrap around
        if (newIndex < 0) {
            newIndex = layerNames.length - 1;
        } else if (newIndex >= layerNames.length) {
            newIndex = 0;
        }

        this.currentLayer = layerNames[newIndex];
        this.currentCardIndex = 0;
        this.onLayerChange(this.currentLayer);
        return true;
    }

    getLayerConfig(layerName) {
        const configs = {
            video: { icon: '🎬', label: 'Videos', theme: 'video' },
            news: { icon: '📰', label: 'News', theme: 'news' },
            images: { icon: '🖼️', label: 'Images', theme: 'images' },
            games: { icon: '🎮', label: 'Games', theme: 'games' },
            apps: { icon: '📱', label: 'Apps', theme: 'apps' },
            settings: { icon: '⚙️', label: 'Settings', theme: 'settings' }
        };
        return configs[layerName] || { icon: '❓', label: layerName, theme: 'default' };
    }
}
