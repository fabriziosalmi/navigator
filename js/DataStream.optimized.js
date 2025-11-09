/**
 * DataStream.js (OPTIMIZED)
 * 
 * REFACTOR: Direct CardManager integration instead of CustomEvents
 * OPTIMIZATION: Batch updates within time window, reduce event overhead
 * 
 * Simulates real-time data with minimal performance impact
 */

export class DataStream {
    constructor(cardManager, appState, updateInterval = 2000) {
        this.cardManager = cardManager; // REFACTOR: Direct reference to CardManager
        this.appState = appState;       // REFACTOR: Use centralized state
        
        this.updateInterval = updateInterval;
        this.intervalId = null;
        this.isRunning = false;
        
        // OPTIMIZATION: Batch window for updates
        this.batchWindow = 100; // ms
        this.pendingUpdates = [];
        this.batchTimeoutId = null;
        
        // Possible trigger messages
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
        this.appState.dataStream.isRunning = true;
        
        // Generate initial update
        setTimeout(() => this.generateUpdate(), 1000);
        
        // Start periodic updates
        this.intervalId = setInterval(() => {
            this.generateUpdate();
        }, this.updateInterval);
        
        console.log(`DataStream started (interval: ${this.updateInterval}ms, batch: ${this.batchWindow}ms)`);
    }
    
    /**
     * Stop the data stream
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.batchTimeoutId) {
            clearTimeout(this.batchTimeoutId);
            this.batchTimeoutId = null;
        }
        
        // Flush remaining updates
        this.flushBatch();
        
        this.isRunning = false;
        this.appState.dataStream.isRunning = false;
        
        console.log('DataStream stopped');
    }
    
    /**
     * OPTIMIZATION: Generate update and queue for batching
     */
    generateUpdate() {
        const numCards = this.cardManager.getCardCount();
        if (numCards === 0) return;
        
        // Select random card(s) to update
        const updateCount = Math.floor(Math.random() * 3) + 1; // 1-3 cards per update
        
        for (let i = 0; i < updateCount; i++) {
            const cardId = Math.floor(Math.random() * numCards);
            const value = Math.random() * 100;
            const trigger = this.triggers[Math.floor(Math.random() * this.triggers.length)];
            
            const updateData = {
                cardId,
                data: {
                    value,
                    lastTrigger: trigger
                },
                timestamp: performance.now()
            };
            
            // OPTIMIZATION: Queue update instead of immediate dispatch
            this.queueUpdate(updateData);
        }
    }
    
    /**
     * OPTIMIZATION: Queue update for batch processing
     */
    queueUpdate(updateData) {
        this.pendingUpdates.push(updateData);
        this.appState.queueDataUpdate(updateData.cardId, updateData.data);
        
        // Schedule batch flush if not already scheduled
        if (!this.batchTimeoutId) {
            this.batchTimeoutId = setTimeout(() => {
                this.flushBatch();
            }, this.batchWindow);
        }
        
        // OPTIMIZATION: Immediate flush if queue gets large
        if (this.pendingUpdates.length >= 20) {
            this.flushBatch();
        }
    }
    
    /**
     * OPTIMIZATION: Flush batched updates to CardManager
     * This is where the magic happens - instead of N CustomEvents,
     * we make a single batch call to CardManager
     */
    flushBatch() {
        if (this.pendingUpdates.length === 0) return;
        
        // Clear batch timeout
        if (this.batchTimeoutId) {
            clearTimeout(this.batchTimeoutId);
            this.batchTimeoutId = null;
        }
        
        // OPTIMIZATION: Deduplicate updates (keep only latest update per card)
        const latestUpdates = new Map();
        this.pendingUpdates.forEach(update => {
            latestUpdates.set(update.cardId, update);
        });
        
        // Convert to array for batch update
        const batchUpdates = Array.from(latestUpdates.values());
        
        // REFACTOR: Direct CardManager call instead of CustomEvent
        this.cardManager.batchUpdateCards(batchUpdates);
        
        console.log(`DataStream: Flushed ${batchUpdates.length} batched updates (from ${this.pendingUpdates.length} total)`);
        
        // Clear pending updates
        this.pendingUpdates = [];
    }
    
    /**
     * OPTIMIZATION: Manual flush (useful for testing or immediate updates)
     */
    flush() {
        this.flushBatch();
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
     * Change the batch window
     * @param {number} newWindow - New batch window in milliseconds
     */
    setBatchWindow(newWindow) {
        this.batchWindow = Math.max(16, newWindow); // Minimum 1 frame
        console.log(`DataStream batch window set to ${this.batchWindow}ms`);
    }
    
    /**
     * Manually trigger an update for a specific card
     * @param {number} cardId - ID of the card to update
     */
    updateCard(cardId) {
        const card = this.cardManager.getCard(cardId);
        if (!card) {
            console.error(`Invalid card ID: ${cardId}`);
            return;
        }
        
        const value = Math.random() * 100;
        const trigger = 'Manual Update';
        
        this.queueUpdate({
            cardId,
            data: { value, lastTrigger: trigger },
            timestamp: performance.now()
        });
    }
    
    /**
     * Get current stream status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            batchWindow: this.batchWindow,
            pendingUpdates: this.pendingUpdates.length,
            cardCount: this.cardManager.getCardCount()
        };
    }
    
    /**
     * MEMORY: Cleanup
     */
    dispose() {
        this.stop();
        this.pendingUpdates = [];
        console.log('DataStream disposed');
    }
}

export default DataStream;
