/**
 * DomRendererPlugin.js
 * 
 * Output plugin that renders navigation state to the DOM.
 * Listens to intent events and updates the visual interface.
 * Wraps existing LayerManager functionality but in a decoupled way.
 * 
 * Listens for:
 * - intent:navigate_left
 * - intent:navigate_right
 * - intent:navigate_up
 * - intent:navigate_down
 * - intent:select_card
 * - intent:toggle_fullscreen
 * - intent:go_back
 * - state:navigation:changed
 */

import { BasePlugin } from '../../core/BasePlugin.js';
import { LayerManager } from '../../LayerManager.js';

export class DomRendererPlugin extends BasePlugin {
    constructor(config = {}) {
        super('DomRenderer', {
            enabled: true,
            containerSelector: '#layer-system',
            transitionDuration: 600,
            easeFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            carousel3d: {
                enabled: true,
                activeScale: 1.0,
                sideScale: 0.75,
                sideOpacity: 0.5,
                sideRotation: 45,
                sideOffsetX: 600,
                sideOffsetZ: -400
            },
            ...config
        });

        this.layerManager = null;
        this.container = null;
        this.isTransitioning = false;
    }

    async onInit() {
        this.log('Initializing DOM renderer');

        // Find or create container
        const selector = this.getConfig('containerSelector', '#layer-system');
        this.container = document.querySelector(selector);

        if (!this.container) {
            this.warn(`Container "${selector}" not found, creating it`);
            this.container = document.createElement('div');
            this.container.id = 'layer-system';
            document.body.appendChild(this.container);
        }

        // Initialize LayerManager
        this.layerManager = new LayerManager({
            initialLayer: this.getState('navigation.layerName', 'video'),
            onLayerChange: (layerData) => this._onLayerChange(layerData),
            onCardChange: (cardData) => this._onCardChange(cardData)
        });

        // Render initial state
        this._renderLayers();

        // Listen to intent events
        this.on('intent:navigate_left', () => this._navigateCard(-1));
        this.on('intent:navigate_right', () => this._navigateCard(1));
        this.on('intent:navigate_up', () => this._navigateLayer(1));
        this.on('intent:navigate_down', () => this._navigateLayer(-1));
        this.on('intent:select_card', () => this._selectCard());
        this.on('intent:toggle_fullscreen', () => this._toggleFullscreen());
        this.on('intent:go_back', () => this._goBack());

        // Listen to state changes for reactive rendering
        this.watchState('navigation.currentLayer', (layer) => {
            this._updateLayerDisplay(layer);
        });

        this.watchState('navigation.currentCardIndex', (index) => {
            this._updateCardDisplay(index);
        });
    }

    async onStart() {
        if (!this.getConfig('enabled', true)) {
            this.log('DOM renderer disabled by config');
            return;
        }

        this.log('Starting DOM renderer');
        
        // Show initial layer and card
        const currentLayer = this.getState('navigation.currentLayer', 0);
        const currentCard = this.getState('navigation.currentCardIndex', 0);
        
        this._updateLayerDisplay(currentLayer);
        this._updateCardDisplay(currentCard);

        this.setPluginState('enabled', true);
    }

    async onStop() {
        this.log('Stopping DOM renderer');
        this.setPluginState('enabled', false);
    }

    async onDestroy() {
        // Cleanup DOM if needed
        if (this.container && this.getConfig('cleanupOnDestroy', false)) {
            this.container.innerHTML = '';
        }

        this.layerManager = null;
        this.container = null;
    }

    // ========================================
    // Navigation Handlers
    // ========================================

    _navigateCard(direction) {
        if (this.isTransitioning) {
            this.log('Transition in progress, ignoring navigation');
            return;
        }

        this.isTransitioning = true;
        this.setState('navigation.isTransitioning', true);

        const currentIndex = this.getState('navigation.currentCardIndex', 0);
        const totalCards = this.getState('navigation.totalCards', 4);
        
        let newIndex = currentIndex + direction;
        
        // Wrap around
        if (newIndex < 0) newIndex = totalCards - 1;
        if (newIndex >= totalCards) newIndex = 0;

        // Update state
        this.setState('navigation.currentCardIndex', newIndex);

        // Emit navigation event
        this.emit('renderer:card_changed', {
            previousIndex: currentIndex,
            currentIndex: newIndex,
            direction
        });

        // Allow transitions again after duration
        setTimeout(() => {
            this.isTransitioning = false;
            this.setState('navigation.isTransitioning', false);
        }, this.getConfig('transitionDuration', 600));
    }

    _navigateLayer(direction) {
        if (this.isTransitioning) {
            this.log('Transition in progress, ignoring navigation');
            return;
        }

        this.isTransitioning = true;
        this.setState('navigation.isTransitioning', true);

        const currentLayer = this.getState('navigation.currentLayer', 0);
        const totalLayers = this.getState('navigation.totalLayers', 6);
        
        let newLayer = currentLayer + direction;
        
        // Wrap around
        if (newLayer < 0) newLayer = totalLayers - 1;
        if (newLayer >= totalLayers) newLayer = 0;

        // Update state
        this.setState('navigation.currentLayer', newLayer);

        // Get layer name
        const layerNames = ['video', 'news', 'images', 'games', 'apps', 'settings'];
        const layerName = layerNames[newLayer] || 'video';
        this.setState('navigation.layerName', layerName);

        // Emit navigation event
        this.emit('renderer:layer_changed', {
            previousLayer: currentLayer,
            currentLayer: newLayer,
            layerName,
            direction
        });

        // Allow transitions again after duration
        setTimeout(() => {
            this.isTransitioning = false;
            this.setState('navigation.isTransitioning', false);
        }, this.getConfig('transitionDuration', 600));
    }

    _selectCard() {
        const currentCard = this.getState('navigation.currentCardIndex', 0);
        
        this.emit('renderer:card_selected', {
            cardIndex: currentCard
        });

        this.log('Card selected:', currentCard);
    }

    _toggleFullscreen() {
        const fullscreenCard = this.getState('ui.fullscreenCard', null);
        
        if (fullscreenCard !== null) {
            // Exit fullscreen
            this.setState('ui.fullscreenCard', null);
            this.emit('renderer:fullscreen_exit', {});
        } else {
            // Enter fullscreen
            const currentCard = this.getState('navigation.currentCardIndex', 0);
            this.setState('ui.fullscreenCard', currentCard);
            this.emit('renderer:fullscreen_enter', { cardIndex: currentCard });
        }
    }

    _goBack() {
        const fullscreenCard = this.getState('ui.fullscreenCard', null);
        
        if (fullscreenCard !== null) {
            // Exit fullscreen
            this._toggleFullscreen();
        } else {
            // Go to previous view (could implement history)
            this.emit('renderer:back', {});
        }
    }

    // ========================================
    // Rendering
    // ========================================

    _renderLayers() {
        if (!this.container) return;

        // Use LayerManager to build the DOM
        const layerNames = Object.keys(this.layerManager.layers);
        
        this.container.innerHTML = '';

        layerNames.forEach((layerName, index) => {
            const layerContainer = document.createElement('div');
            layerContainer.className = `layer-container layer-${layerName}`;
            layerContainer.dataset.layer = index;
            
            const cards = this.layerManager.layers[layerName];
            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'cards-grid';

            cards.forEach((card, cardIndex) => {
                const cardElement = this._createCardElement(card, cardIndex);
                cardsGrid.appendChild(cardElement);
            });

            layerContainer.appendChild(cardsGrid);
            this.container.appendChild(layerContainer);
        });

        // Update state with totals
        this.setState('navigation.totalLayers', layerNames.length);
        this.setState('navigation.totalCards', this.layerManager.layers[layerNames[0]].length);

        this.log('Layers rendered');
    }

    _createCardElement(cardData, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-inner">
                ${this._renderCardMedia(cardData.media)}
                <div class="card-overlay">
                    <h3 class="card-title">${cardData.title}</h3>
                    <p class="card-meta">${cardData.meta}</p>
                    <p class="card-content">${cardData.content}</p>
                </div>
            </div>
        `;

        return card;
    }

    _renderCardMedia(media) {
        if (media.type === 'video') {
            return `<video class="card-media" autoplay loop muted playsinline src="${media.url}"></video>`;
        } else if (media.type === 'image') {
            return `<img class="card-media" src="${media.url}" alt="Card image">`;
        } else if (media.type === 'audio') {
            return `<div class="card-audio"><span>🎵 ${media.name}</span></div>`;
        } else {
            return `<div class="card-icon">${media.icon || '📄'}</div>`;
        }
    }

    _updateLayerDisplay(layerIndex) {
        if (!this.container) return;

        const layers = this.container.querySelectorAll('.layer-container');
        
        layers.forEach((layer, index) => {
            if (index === layerIndex) {
                layer.classList.add('active');
                layer.classList.remove('hidden');
            } else {
                layer.classList.remove('active');
                layer.classList.add('hidden');
            }
        });
    }

    _updateCardDisplay(cardIndex) {
        if (!this.container) return;

        const activeLayer = this.container.querySelector('.layer-container.active');
        if (!activeLayer) return;

        const cards = activeLayer.querySelectorAll('.card');
        
        cards.forEach((card, index) => {
            if (index === cardIndex) {
                card.classList.add('active');
                card.classList.remove('hidden', 'side-left', 'side-right');
            } else if (index === cardIndex - 1 || (cardIndex === 0 && index === cards.length - 1)) {
                card.classList.add('side-left');
                card.classList.remove('active', 'hidden', 'side-right');
            } else if (index === cardIndex + 1 || (cardIndex === cards.length - 1 && index === 0)) {
                card.classList.add('side-right');
                card.classList.remove('active', 'hidden', 'side-left');
            } else {
                card.classList.add('hidden');
                card.classList.remove('active', 'side-left', 'side-right');
            }
        });
    }

    // ========================================
    // LayerManager Callbacks
    // ========================================

    _onLayerChange(layerData) {
        this.log('Layer changed:', layerData);
        // State is already updated in _navigateLayer
    }

    _onCardChange(cardData) {
        this.log('Card changed:', cardData);
        // State is already updated in _navigateCard
    }
}

export default DomRendererPlugin;
