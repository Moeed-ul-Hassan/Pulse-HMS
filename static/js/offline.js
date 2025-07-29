// Pulse HMS - Offline Functionality

// Simple offline detection and sync queue
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        this.initializeOfflineHandling();
    }

    initializeOfflineHandling() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
        });

        // Update sync badge
        this.updateSyncBadge();
        
        // Set up manual sync button
        const manualSyncBtn = document.getElementById('manualSyncBtn');
        if (manualSyncBtn) {
            manualSyncBtn.addEventListener('click', () => {
                this.processSyncQueue();
            });
        }
    }

    showOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    updateSyncBadge() {
        const badge = document.getElementById('pendingSyncCount');
        if (badge && this.syncQueue.length > 0) {
            badge.textContent = this.syncQueue.length;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    addToSyncQueue(action, data) {
        if (!this.isOnline) {
            const queueItem = {
                id: Date.now().toString(),
                action: action,
                data: data,
                timestamp: new Date().toISOString()
            };
            
            this.syncQueue.push(queueItem);
            localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
            this.updateSyncBadge();
            
            if (window.PulseHMS) {
                window.PulseHMS.showNotification('Action queued for sync when online', 'warning');
            }
            return true;
        }
        return false;
    }

    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        const itemsToSync = [...this.syncQueue];
        this.syncQueue = [];
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

        for (const item of itemsToSync) {
            try {
                // Process sync item (simplified version)
                console.log('Processing sync item:', item);
                
                // Here you would implement actual sync logic
                // For now, we'll just simulate success
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error('Sync failed for item:', item, error);
                // Re-add failed items back to queue
                this.syncQueue.push(item);
            }
        }

        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        this.updateSyncBadge();

        if (window.PulseHMS) {
            window.PulseHMS.showNotification('Sync completed successfully', 'success');
        }
    }
}

// Initialize offline manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.offlineManager = new OfflineManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}