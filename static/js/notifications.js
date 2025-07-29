// Pulse HMS - Notification System

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.soundEnabled = true;
        this.initialize();
    }

    initialize() {
        this.createNotificationContainer();
        this.setupWebSocket();
        this.setupSound();
        this.loadNotifications();
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    setupWebSocket() {
        // Simulate real-time notifications
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // Check every 30 seconds
    }

    setupSound() {
        this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }

    loadNotifications() {
        // Load notifications from localStorage
        const saved = localStorage.getItem('pulse_hms_notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        }
    }

    saveNotifications() {
        localStorage.setItem('pulse_hms_notifications', JSON.stringify(this.notifications));
    }

    addNotification(type, title, message, duration = 5000) {
        const notification = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.showNotification(notification, duration);
        this.updateNotificationBadge();
    }

    showNotification(notification, duration) {
        const container = document.getElementById('notification-container');
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type} animate-slide-in-right`;
        element.innerHTML = `
            <div class="notification-header">
                <i class="fas ${this.getIcon(notification.type)}"></i>
                <span class="notification-title">${notification.title}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-body">
                ${notification.message}
            </div>
            <div class="notification-time">
                ${this.formatTime(notification.timestamp)}
            </div>
        `;

        container.appendChild(element);

        // Auto remove after duration
        setTimeout(() => {
            if (element.parentNode) {
                element.classList.add('notification-fade-out');
                setTimeout(() => element.remove(), 300);
            }
        }, duration);

        // Play sound using the sound system
        if (window.soundSystem) {
            window.soundSystem.playNotification();
        } else if (this.soundEnabled) {
            // Fallback to old sound system
            this.notificationSound.play().catch(() => {});
        }
    }

    getIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle',
            'appointment': 'fa-calendar-check',
            'patient': 'fa-user',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateNotificationBadge();
    }

    checkForNewNotifications() {
        // Simulate new notifications based on user activity
        const random = Math.random();
        if (random < 0.3) {
            const types = ['appointment', 'patient', 'system'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            switch(type) {
                case 'appointment':
                    this.addNotification('appointment', 'New Appointment', 'A new appointment has been scheduled for today.');
                    break;
                case 'patient':
                    this.addNotification('patient', 'Patient Update', 'Patient records have been updated.');
                    break;
                case 'system':
                    this.addNotification('system', 'System Update', 'System maintenance completed successfully.');
                    break;
            }
        }
    }

    // Quick notification methods
    success(title, message) {
        this.addNotification('success', title, message);
    }

    error(title, message) {
        this.addNotification('error', title, message);
    }

    warning(title, message) {
        this.addNotification('warning', title, message);
    }

    info(title, message) {
        this.addNotification('info', title, message);
    }

    appointment(title, message) {
        this.addNotification('appointment', title, message);
    }
}

// Initialize notification system
const notifications = new NotificationSystem();

// Global notification functions
window.showSuccess = (title, message) => notifications.success(title, message);
window.showError = (title, message) => notifications.error(title, message);
window.showWarning = (title, message) => notifications.warning(title, message);
window.showInfo = (title, message) => notifications.info(title, message); 