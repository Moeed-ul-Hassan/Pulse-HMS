// Pulse HMS - Offline Functionality
class OfflineManager {
    constructor() {
        this.storageKey = 'pulse_hms_offline';
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.init();
    }
    
    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Initialize storage
        this.initStorage();
        
        // Register service worker for caching
        this.registerServiceWorker();
        
        // Check for pending sync on load
        if (this.isOnline) {
            this.syncOfflineData();
        }
    }
    
    initStorage() {
        const defaultData = {
            appointments: [],
            patients: [],
            sync_queue: [],
            last_sync: null
        };
        
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }
    
    handleOnline() {
        this.isOnline = true;
        this.updateOfflineIndicator(false);
        this.syncOfflineData();
        console.log('App is back online');
    }
    
    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator(true);
        console.log('App is offline');
    }
    
    updateOfflineIndicator(isOffline) {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            if (isOffline) {
                indicator.textContent = '📡 Offline Mode - Data will sync when online';
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    }
    
    // Save appointment offline
    saveAppointmentOffline(appointmentData) {
        const data = this.getOfflineData();
        
        // Add unique offline ID
        appointmentData.offline_id = this.generateOfflineId();
        appointmentData.offline_timestamp = new Date().toISOString();
        appointmentData.sync_status = 'pending';
        
        data.appointments.push(appointmentData);
        data.sync_queue.push({
            type: 'appointment',
            action: 'create',
            data: appointmentData,
            timestamp: new Date().toISOString()
        });
        
        this.saveOfflineData(data);
        
        return appointmentData;
    }
    
    // Save patient data offline
    savePatientOffline(patientData) {
        const data = this.getOfflineData();
        
        patientData.offline_id = this.generateOfflineId();
        patientData.offline_timestamp = new Date().toISOString();
        patientData.sync_status = 'pending';
        
        data.patients.push(patientData);
        data.sync_queue.push({
            type: 'patient',
            action: 'create',
            data: patientData,
            timestamp: new Date().toISOString()
        });
        
        this.saveOfflineData(data);
        
        return patientData;
    }
    
    // Get offline appointments for today
    getTodayAppointmentsOffline() {
        const data = this.getOfflineData();
        const today = new Date().toDateString();
        
        return data.appointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date).toDateString();
            return aptDate === today;
        });
    }
    
    // Update appointment status offline
    updateAppointmentStatusOffline(appointmentId, status) {
        const data = this.getOfflineData();
        
        const appointment = data.appointments.find(apt => 
            apt.appointment_id === appointmentId || apt.offline_id === appointmentId
        );
        
        if (appointment) {
            appointment.status = status;
            appointment.updated_at = new Date().toISOString();
            
            // Add to sync queue
            data.sync_queue.push({
                type: 'appointment',
                action: 'update',
                data: { id: appointmentId, status: status },
                timestamp: new Date().toISOString()
            });
            
            this.saveOfflineData(data);
            return true;
        }
        
        return false;
    }
    
    // Sync offline data with server
    async syncOfflineData() {
        if (!this.isOnline) {
            return false;
        }
        
        const data = this.getOfflineData();
        
        if (data.sync_queue.length === 0) {
            return true;
        }
        
        try {
            const response = await fetch('/api/offline-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sync_queue: data.sync_queue,
                    last_sync: data.last_sync
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear synced data
                data.sync_queue = [];
                data.last_sync = new Date().toISOString();
                
                // Update sync status for synced items
                data.appointments.forEach(apt => {
                    if (apt.sync_status === 'pending') {
                        apt.sync_status = 'synced';
                    }
                });
                
                data.patients.forEach(patient => {
                    if (patient.sync_status === 'pending') {
                        patient.sync_status = 'synced';
                    }
                });
                
                this.saveOfflineData(data);
                
                // Show sync success notification
                if (window.PulseHMS) {
                    window.PulseHMS.showNotification(
                        `Synced ${result.synced_count} items successfully`, 
                        'success'
                    );
                }
                
                return true;
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            
            if (window.PulseHMS) {
                window.PulseHMS.showNotification(
                    'Sync failed - will retry when connection improves', 
                    'warning'
                );
            }
            
            return false;
        }
    }
    
    // Helper methods
    getOfflineData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }
    
    saveOfflineData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    generateOfflineId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Get pending sync count
    getPendingSyncCount() {
        const data = this.getOfflineData();
        return data.sync_queue.length;
    }
    
    // Clear all offline data (admin function)
    clearOfflineData() {
        localStorage.removeItem(this.storageKey);
        this.initStorage();
    }
    
    // Export offline data for backup
    exportOfflineData() {
        const data = this.getOfflineData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulse_hms_offline_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Offline Form Handler
class OfflineFormHandler {
    constructor(offlineManager) {
        this.offlineManager = offlineManager;
        this.init();
    }
    
    init() {
        // Handle appointment forms
        const appointmentForms = document.querySelectorAll('.appointment-form');
        appointmentForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        });
        
        // Handle patient forms
        const patientForms = document.querySelectorAll('.patient-form');
        patientForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handlePatientSubmit(e));
        });
        
        // Handle status updates
        const statusButtons = document.querySelectorAll('.status-update-btn');
        statusButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleStatusUpdate(e));
        });
    }
    
    handleAppointmentSubmit(event) {
        if (!navigator.onLine) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const appointmentData = {
                appointment_id: this.generateAppointmentId(),
                patient_id: formData.get('patient_id'),
                doctor_id: formData.get('doctor_id'),
                appointment_date: formData.get('appointment_date'),
                duration: formData.get('duration') || 30,
                type: formData.get('type'),
                reason: formData.get('reason'),
                status: 'scheduled'
            };
            
            const savedAppointment = this.offlineManager.saveAppointmentOffline(appointmentData);
            
            // Show success message
            if (window.PulseHMS) {
                window.PulseHMS.showNotification(
                    'Appointment saved offline. Will sync when online.', 
                    'info'
                );
            }
            
            // Redirect or update UI
            this.updateAppointmentList(savedAppointment);
        }
    }
    
    handlePatientSubmit(event) {
        if (!navigator.onLine) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const patientData = {
                patient_id: this.generatePatientId(),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                date_of_birth: formData.get('date_of_birth'),
                gender: formData.get('gender'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address')
            };
            
            const savedPatient = this.offlineManager.savePatientOffline(patientData);
            
            if (window.PulseHMS) {
                window.PulseHMS.showNotification(
                    'Patient saved offline. Will sync when online.', 
                    'info'
                );
            }
            
            this.updatePatientList(savedPatient);
        }
    }
    
    handleStatusUpdate(event) {
        const button = event.target;
        const appointmentId = button.dataset.appointmentId;
        const newStatus = button.dataset.newStatus;
        
        if (!navigator.onLine) {
            const updated = this.offlineManager.updateAppointmentStatusOffline(appointmentId, newStatus);
            
            if (updated) {
                button.textContent = newStatus.toUpperCase();
                button.className = `btn btn-sm badge-${newStatus}`;
                
                if (window.PulseHMS) {
                    window.PulseHMS.showNotification(
                        'Status updated offline. Will sync when online.', 
                        'info'
                    );
                }
            }
        }
    }
    
    updateAppointmentList(appointment) {
        const appointmentsList = document.getElementById('appointmentsList');
        if (appointmentsList) {
            const appointmentRow = this.createAppointmentRow(appointment);
            appointmentsList.insertBefore(appointmentRow, appointmentsList.firstChild);
        }
    }
    
    updatePatientList(patient) {
        const patientsList = document.getElementById('patientsList');
        if (patientsList) {
            const patientRow = this.createPatientRow(patient);
            patientsList.insertBefore(patientRow, patientsList.firstChild);
        }
    }
    
    createAppointmentRow(appointment) {
        const row = document.createElement('tr');
        row.className = 'offline-item';
        row.innerHTML = `
            <td>${appointment.appointment_id}</td>
            <td>${appointment.patient_name || 'Offline Patient'}</td>
            <td>${new Date(appointment.appointment_date).toLocaleString()}</td>
            <td>${appointment.type}</td>
            <td><span class="badge badge-${appointment.status}">${appointment.status}</span></td>
            <td><span class="badge badge-warning">Offline</span></td>
        `;
        return row;
    }
    
    createPatientRow(patient) {
        const row = document.createElement('tr');
        row.className = 'offline-item';
        row.innerHTML = `
            <td>${patient.patient_id}</td>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.phone}</td>
            <td>${patient.email || 'N/A'}</td>
            <td><span class="badge badge-warning">Offline</span></td>
        `;
        return row;
    }
    
    generateAppointmentId() {
        return 'APT' + Date.now().toString().slice(-8);
    }
    
    generatePatientId() {
        return 'PT' + Date.now().toString().slice(-8);
    }
}

// Initialize offline functionality
document.addEventListener('DOMContentLoaded', function() {
    const offlineManager = new OfflineManager();
    const offlineFormHandler = new OfflineFormHandler(offlineManager);
    
    // Make available globally
    window.OfflineManager = offlineManager;
    window.OfflineFormHandler = offlineFormHandler;
    
    // Add sync button functionality
    const syncButton = document.getElementById('manualSyncBtn');
    if (syncButton) {
        syncButton.addEventListener('click', function() {
            offlineManager.syncOfflineData();
        });
    }
    
    // Add offline data export
    const exportButton = document.getElementById('exportOfflineBtn');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            offlineManager.exportOfflineData();
        });
    }
    
    // Show pending sync count
    const updateSyncCount = () => {
        const syncCountElement = document.getElementById('pendingSyncCount');
        if (syncCountElement) {
            const count = offlineManager.getPendingSyncCount();
            syncCountElement.textContent = count;
            syncCountElement.style.display = count > 0 ? 'inline' : 'none';
        }
    };
    
    // Update sync count every 30 seconds
    updateSyncCount();
    setInterval(updateSyncCount, 30000);
});
