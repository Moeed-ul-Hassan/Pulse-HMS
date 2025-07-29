// Pulse HMS - Main JavaScript Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
    
    // Initialize QR scanner
    initializeQRScanner();
    
    // Initialize offline functionality
    initializeOfflineSupport();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize loading states
    initializeLoadingStates();
    
    // Initialize notifications
    initializeNotifications();
}

// Tooltip initialization
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
}

// Chart initialization for dashboard
function initializeCharts() {
    // Appointments chart
    const appointmentsChart = document.getElementById('appointmentsChart');
    if (appointmentsChart) {
        createAppointmentsChart(appointmentsChart);
    }
    
    // Patient statistics chart
    const patientsChart = document.getElementById('patientsChart');
    if (patientsChart) {
        createPatientsChart(patientsChart);
    }
}

function createAppointmentsChart(canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Scheduled', 'Arrived', 'Completed', 'Cancelled'],
            datasets: [{
                data: [12, 5, 8, 2],
                backgroundColor: [
                    '#3182ce',
                    '#d69e2e',
                    '#38a169',
                    '#e53e3e'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function createPatientsChart(canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Patients',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// QR Scanner functionality
function initializeQRScanner() {
    const qrScannerBtn = document.getElementById('qrScannerBtn');
    const qrCodeInput = document.getElementById('qrCodeInput');
    const qrScanResult = document.getElementById('qrScanResult');
    
    if (qrScannerBtn) {
        qrScannerBtn.addEventListener('click', function() {
            // In a real implementation, this would integrate with a camera QR scanner
            // For now, we'll simulate with text input
            const qrModal = new bootstrap.Modal(document.getElementById('qrScanModal'));
            qrModal.show();
        });
    }
    
    if (qrCodeInput) {
        qrCodeInput.addEventListener('input', function() {
            const qrData = this.value.trim();
            if (qrData.startsWith('PULSE_HMS:')) {
                processQRCode(qrData);
            }
        });
    }
}

function processQRCode(qrData) {
    showLoading();
    
    fetch('/qr-checkin/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_data: qrData })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            showNotification(data.message, 'success');
            // Refresh the page or update the appointments list
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showNotification('Error processing QR code', 'error');
        console.error('QR processing error:', error);
    });
}

// Offline support
function initializeOfflineSupport() {
    // Check if we're offline
    updateOnlineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initialize offline storage
    initializeOfflineStorage();
}

function updateOnlineStatus() {
    const offlineIndicator = document.getElementById('offlineIndicator');
    const isOnline = navigator.onLine;
    
    if (offlineIndicator) {
        if (isOnline) {
            offlineIndicator.classList.remove('show');
            // Sync offline data when coming back online
            syncOfflineData();
        } else {
            offlineIndicator.classList.add('show');
            offlineIndicator.textContent = '📡 Offline Mode';
        }
    }
}

function initializeOfflineStorage() {
    // Initialize local storage for offline appointments
    if (!localStorage.getItem('pulse_offline_appointments')) {
        localStorage.setItem('pulse_offline_appointments', JSON.stringify([]));
    }
}

function saveOfflineAppointment(appointmentData) {
    const offlineAppointments = JSON.parse(localStorage.getItem('pulse_offline_appointments') || '[]');
    offlineAppointments.push(appointmentData);
    localStorage.setItem('pulse_offline_appointments', JSON.stringify(offlineAppointments));
}

function syncOfflineData() {
    const offlineAppointments = JSON.parse(localStorage.getItem('pulse_offline_appointments') || '[]');
    
    if (offlineAppointments.length > 0) {
        fetch('/api/offline-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appointments: offlineAppointments })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('pulse_offline_appointments', JSON.stringify([]));
                showNotification(`Synced ${data.synced_count} offline appointments`, 'success');
            }
        })
        .catch(error => {
            console.error('Sync error:', error);
        });
    }
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        });
    });
    
    // Real-time validation for specific fields
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            validatePhoneNumber(this);
        });
    });
    
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            validateEmail(this);
        });
    });
}

function validatePhoneNumber(input) {
    const phoneRegex = /^\d{10}$/;
    const isValid = phoneRegex.test(input.value.replace(/\D/g, ''));
    
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
}

function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);
    
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
}

// Loading states
function initializeLoadingStates() {
    // Add loading states to buttons
    const actionButtons = document.querySelectorAll('.btn-loading');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                showButtonLoading(this);
            }
        });
    });
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showButtonLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
    button.disabled = true;
    
    // Store original text for restoration
    button.dataset.originalText = originalText;
}

function hideButtonLoading(button) {
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
    }
}

// Notifications
function initializeNotifications() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            fadeOut(alert);
        }, 5000);
    });
}

function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        fadeOut(notification);
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

function fadeOut(element) {
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 300);
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        let searchTimeout;
        
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value, this.dataset.searchType);
            }, 300);
        });
    });
}

function performSearch(query, type) {
    // Implementation would depend on the specific search context
    console.log(`Searching for: ${query} in ${type}`);
}

// Patient dashboard specific functionality
function initializePatientDashboard() {
    // Initialize appointment reminders
    const appointmentReminders = document.querySelectorAll('.appointment-reminder');
    appointmentReminders.forEach(reminder => {
        const appointmentDate = new Date(reminder.dataset.appointmentDate);
        const now = new Date();
        const timeDiff = appointmentDate - now;
        
        if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
            reminder.classList.add('urgent');
        }
    });
    
    // Initialize download buttons for lab reports
    const downloadButtons = document.querySelectorAll('.download-report');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reportId = this.dataset.reportId;
            downloadLabReport(reportId);
        });
    });
}

function downloadLabReport(reportId) {
    showLoading();
    
    fetch(`/api/lab-report/${reportId}/download`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lab_report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            showNotification('Error downloading report', 'error');
            console.error('Download error:', error);
        });
}

// Print functionality
function printPage() {
    window.print();
}

function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<link rel="stylesheet" href="/static/css/style.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}

// AI functionality helpers
function generateAISummary(patientId) {
    showLoading();
    
    fetch(`/api/ai-summary/${patientId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            displayAISummary(data.summary);
        } else {
            showNotification('Could not generate AI summary', 'warning');
        }
    })
    .catch(error => {
        hideLoading();
        showNotification('Error generating AI summary', 'error');
        console.error('AI summary error:', error);
    });
}

function displayAISummary(summary) {
    const summaryContainer = document.getElementById('aiSummaryContainer');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="ai-summary">
                <h5><i class="fas fa-robot ai-icon"></i>AI Health Summary</h5>
                <p>${summary.summary}</p>
                <div class="mt-3">
                    <strong>Key Changes:</strong>
                    <ul class="mt-2">
                        ${summary.key_changes.map(change => `<li>${change}</li>`).join('')}
                    </ul>
                </div>
                <div class="mt-3">
                    <span class="badge badge-${summary.risk_level}">${summary.risk_level.toUpperCase()} RISK</span>
                </div>
            </div>
        `;
    }
}

// Export functions for global use
window.PulseHMS = {
    showLoading,
    hideLoading,
    showNotification,
    printPage,
    printElement,
    generateAISummary,
    processQRCode,
    saveOfflineAppointment,
    syncOfflineData
};
