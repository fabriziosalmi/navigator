/**
 * DataStream.js
 * 
 * Simulates a real-time data stream that updates cards with new values.
 * Uses CustomEvent to dispatch data updates in a decoupled manner.
 */

export class DataStream {
    constructor(numCards, updateInterval = 2000) {
        this.numCards = numCards;
        this.updateInterval = updateInterval; // milliseconds
        this.intervalId = null;
        this.isRunning = false;
        
        // Possible trigger messages for variety
        this.triggers = [
            'System Update',
            'User Action',
            'External API',
            'Sensor Input',
            'Network Event',
            'Timer Tick',
            'Cache Refresh',
            'Database Sync',
            'AI Prediction',
            'Weather Change',
            'Market Shift',
            'Node Activity'
        ];
    }
    
    /**
     * Start the data stream
     */
    start() {
        if (this.isRunning) {
            console.warn('DataStream is already running');
            return;
        }
        
        this.isRunning = true;
        
        // Generate initial update
        setTimeout(() => this.generateUpdate(), 1000);
        
        // Start periodic updates
        this.intervalId = setInterval(() => {
            this.generateUpdate();
        }, this.updateInterval);
        
        console.log(`DataStream started (interval: ${this.updateInterval}ms)`);
    }
    
    /**
     * Stop the data stream
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('DataStream stopped');
    }
    
    /**
     * Generate a random data update and dispatch it as a CustomEvent
     */
    generateUpdate() {
        // Select a random card to update
        const cardId = Math.floor(Math.random() * this.numCards);
        
        // Generate random data
        const value = Math.random() * 100;
        const trigger = this.triggers[Math.floor(Math.random() * this.triggers.length)];
        
        const data = {
            cardId: cardId,
            value: value,
            lastTrigger: trigger,
            timestamp: Date.now()
        };
        
        // Dispatch custom event with the data
        const event = new CustomEvent('newData', {
            detail: data
        });
        
        window.dispatchEvent(event);
        
        console.log(`Data update dispatched for Card ${cardId}:`, data);
    }
    
    /**
     * Change the update interval
     * @param {number} newInterval - New interval in milliseconds
     */
    setUpdateInterval(newInterval) {
        this.updateInterval = newInterval;
        
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    
    /**
     * Manually trigger an update for a specific card
     * @param {number} cardId - ID of the card to update
     */
    updateCard(cardId) {
        if (cardId < 0 || cardId >= this.numCards) {
            console.error(`Invalid card ID: ${cardId}`);
            return;
        }
        
        const value = Math.random() * 100;
        const trigger = 'Manual Update';
        
        const data = {
            cardId: cardId,
            value: value,
            lastTrigger: trigger,
            timestamp: Date.now()
        };
        
        const event = new CustomEvent('newData', {
            detail: data
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * Get current stream status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            numCards: this.numCards
        };
    }
}
