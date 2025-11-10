/**
 * NavigationController - Gestisce la navigazione UI e gli aggiornamenti DOM
 */
export class NavigationController {
    constructor(layerManager, config = {}) {
        this.layerManager = layerManager;
        this.viewport = null;
        this.snapIndicators = { left: null, right: null };
        this.onNavigate = config.onNavigate || (() => {});
        
        this.fullscreenCard = null;
        this.confirmationPending = false;
        this.confirmationType = null;
        this.confirmationCallback = null;
    }

    init(viewportId = 'cards-viewport') {
        this.viewport = document.getElementById(viewportId);
        if (!this.viewport) {
            console.error('Viewport not found:', viewportId);
            return false;
        }

        this.snapIndicators.left = document.querySelector('.snap-indicator.left');
        this.snapIndicators.right = document.querySelector('.snap-indicator.right');

        this.initLayers();
        this.updateView();
        
        return true;
    }

    initLayers() {
        if (!this.viewport) return;

        this.viewport.innerHTML = '';
        
        const layerNames = this.layerManager.getLayerNames();
        
        layerNames.forEach(layerName => {
            const layerConfig = this.layerManager.getLayerConfig(layerName);
            const layerContainer = document.createElement('div');
            layerContainer.className = `layer-container layer-${layerConfig.theme}`;
            layerContainer.id = `layer-${layerName}`;
            
            const cardsGrid = document.createElement('div');
            cardsGrid.className = 'cards-grid';
            
            const cards = this.layerManager.layers[layerName];
            cards.forEach((cardData, index) => {
                const card = document.createElement('div');
                card.className = 'card hidden';
                card.dataset.cardIndex = index;
                
                // Render media based on type
                let mediaHTML = '';
                if (cardData.media) {
                    switch(cardData.media.type) {
                        case 'video':
                            mediaHTML = `
                                <video class="card-media" autoplay loop muted playsinline>
                                    <source src="${cardData.media.url}" type="video/mp4">
                                </video>
                            `;
                            break;
                        case 'image':
                            mediaHTML = `
                                <img class="card-media" src="${cardData.media.url}" alt="${cardData.title}">
                            `;
                            break;
                        case 'audio':
                            mediaHTML = `
                                <div class="card-audio">
                                    <div class="audio-visualizer">
                                        <div class="wave"></div>
                                        <div class="wave"></div>
                                        <div class="wave"></div>
                                    </div>
                                    <p>🎵 ${cardData.media.name}</p>
                                </div>
                            `;
                            break;
                        case 'icon':
                            mediaHTML = `
                                <div class="card-icon">
                                    <div class="icon-large">${cardData.media.icon}</div>
                                </div>
                            `;
                            break;
                    }
                }
                
                card.innerHTML = `
                    ${mediaHTML}
                    <div class="card-header">${cardData.title}</div>
                    <div class="card-meta">${cardData.meta}</div>
                    <div class="card-content">
                        <p>${cardData.content || `Card ID: ${cardData.id}`}</p>
                    </div>
                `;
                cardsGrid.appendChild(card);
            });
            
            layerContainer.appendChild(cardsGrid);
            this.viewport.appendChild(layerContainer);
        });
    }

    updateView() {
        const currentLayer = this.layerManager.getCurrentLayer();
        const currentCardIndex = this.layerManager.getCurrentCardIndex();
        
        const layerContainer = document.getElementById(`layer-${currentLayer}`);
        if (!layerContainer) return;

        // Layer depth positioning handled by external update3DLayerPositions()
        // Just update active state
        document.querySelectorAll('.layer-container').forEach(layer => {
            // Don't remove depth classes, only manage card positions
        });

        // Aggiorna tab (se esistono)
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.layer === currentLayer) {
                tab.classList.add('active');
            }
        });

        // Posiziona le card con effetto carousel 3D
        const cards = layerContainer.querySelectorAll('.card');
        cards.forEach((card, index) => {
            // Remove all position classes
            card.classList.remove('active', 'previous', 'next', 'far-previous', 'far-next', 
                                 'center', 'left', 'right', 'hidden', 'fullscreen');
            
            const diff = index - currentCardIndex;
            
            // Apply 3D carousel classes
            if (diff === 0) {
                card.classList.add('active'); // Focused card (large, center)
            } else if (diff === -1) {
                card.classList.add('previous'); // Left card (folded)
            } else if (diff === 1) {
                card.classList.add('next'); // Right card (folded)
            } else if (diff === -2) {
                card.classList.add('far-previous'); // Far left
            } else if (diff === 2) {
                card.classList.add('far-next'); // Far right
            } else {
                // Hide cards that are too far away
                card.classList.add('hidden');
            }
        });

        // Aggiorna UI info
        this.updateUI();
    }

    updateUI() {
        const currentLayer = this.layerManager.getCurrentLayer();
        const layerConfig = this.layerManager.getLayerConfig(currentLayer);
        
        const layerNameEl = document.getElementById('current-layer-name');
        if (layerNameEl) {
            layerNameEl.textContent = layerConfig.label;
        }

        const currentCardEl = document.getElementById('current-card');
        if (currentCardEl) {
            currentCardEl.textContent = this.layerManager.getCurrentCardIndex() + 1;
        }

        const totalCardsEl = document.getElementById('total-cards');
        if (totalCardsEl) {
            totalCardsEl.textContent = this.layerManager.getTotalCards();
        }
    }

    showSnapIndicator(direction) {
        const indicator = this.snapIndicators[direction];
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 400);
        }
    }

    navigateCard(direction) {
        if (this.confirmationPending) return false;
        
        const success = this.layerManager.navigateCard(direction);
        
        if (success) {
            this.updateView();
            this.showSnapIndicator(direction > 0 ? 'right' : 'left');
            this.onNavigate({ type: 'card', direction });
        }
        
        return success;
    }

    navigateLayer(direction) {
        if (this.confirmationPending) return false;
        
        const success = this.layerManager.navigateLayer(direction);
        
        if (success) {
            this.updateView();
            this.onNavigate({ type: 'layer', direction });
        }
        
        return success;
    }

    switchToLayer(layerName) {
        if (this.confirmationPending) return false;
        
        const success = this.layerManager.setLayer(layerName);
        
        if (success) {
            this.updateView();
            this.onNavigate({ type: 'layer-switch', layerName });
        }
        
        return success;
    }

    toggleFullscreen() {
        if (this.confirmationPending) return;
        
        this.showConfirmation(
            'Fullscreen Mode',
            'Expand this card to fullscreen?',
            () => this.executeFullscreen()
        );
    }

    executeFullscreen() {
        const currentLayer = this.layerManager.getCurrentLayer();
        const currentCardIndex = this.layerManager.getCurrentCardIndex();
        const layerContainer = document.getElementById(`layer-${currentLayer}`);
        
        if (!layerContainer) return;

        const cards = layerContainer.querySelectorAll('.card');
        const currentCard = cards[currentCardIndex];

        if (this.fullscreenCard === currentCard) {
            // Esci da fullscreen
            currentCard.classList.remove('fullscreen');
            this.fullscreenCard = null;
            this.updateView();
        } else {
            // Entra in fullscreen
            cards.forEach(card => card.classList.remove('fullscreen'));
            currentCard.classList.remove('center', 'left', 'right', 'hidden');
            currentCard.classList.add('fullscreen');
            this.fullscreenCard = currentCard;
        }
    }

    deleteCurrentCard() {
        if (this.confirmationPending) return;
        
        this.showConfirmation(
            'Delete Card',
            'Are you sure you want to delete this card?',
            () => this.executeDelete()
        );
    }

    executeDelete() {
        const currentLayer = this.layerManager.getCurrentLayer();
        const currentCardIndex = this.layerManager.getCurrentCardIndex();
        const layerContainer = document.getElementById(`layer-${currentLayer}`);
        
        if (!layerContainer) return;

        const cards = layerContainer.querySelectorAll('.card');
        const currentCard = cards[currentCardIndex];

        currentCard.classList.add('deleting');
        
        setTimeout(() => {
            currentCard.remove();
            
            // Rimuovi anche dai dati
            this.layerManager.layers[currentLayer].splice(currentCardIndex, 1);
            
            // Aggiusta indice se necessario
            if (this.layerManager.currentCardIndex >= this.layerManager.getTotalCards()) {
                this.layerManager.currentCardIndex = Math.max(0, this.layerManager.getTotalCards() - 1);
            }
            
            this.updateView();
        }, 300);
    }

    showConfirmation(title, message, onConfirm) {
        this.confirmationPending = true;
        this.confirmationType = title;
        this.confirmationCallback = onConfirm;

        const overlay = document.getElementById('confirmation-overlay');
        if (overlay) {
            document.getElementById('confirmation-title').textContent = title;
            document.getElementById('confirmation-message').textContent = message;
            overlay.classList.add('show');
        }
    }

    confirmYes() {
        if (this.confirmationPending && this.confirmationCallback) {
            this.confirmationCallback();
            this.hideConfirmation();
        }
    }

    confirmNo() {
        this.hideConfirmation();
    }

    hideConfirmation() {
        this.confirmationPending = false;
        this.confirmationType = null;
        this.confirmationCallback = null;

        const overlay = document.getElementById('confirmation-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    isConfirmationPending() {
        return this.confirmationPending;
    }
}
