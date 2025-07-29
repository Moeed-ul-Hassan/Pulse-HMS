// Pulse HMS - Main JavaScript File

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Pulse HMS initialized');
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize receipt functionality
    initializeReceiptSystem();
});

// Animation system
function initializeAnimations() {
    // Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const animationClass = entry.target.dataset.animation || 'animate-fade-in';
                entry.target.classList.add(animationClass);
                
                // Add delay for staggered animations
                const delay = entry.target.dataset.delay || 0;
                if (delay > 0) {
                    setTimeout(() => {
                        entry.target.classList.add(animationClass);
                    }, delay);
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements with animation attributes
    document.querySelectorAll('[data-animation]').forEach((el) => {
        observer.observe(el);
    });
    
    // Add hover animations to cards
    document.querySelectorAll('.card, .dashboard-card').forEach((el) => {
        el.classList.add('hover-lift');
    });
    
    // Add glow effect to buttons
    document.querySelectorAll('.btn-primary, .btn-gradient').forEach((el) => {
        el.classList.add('hover-glow');
    });
}

// Smooth scrolling system
function initializeSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Smooth scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
        
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Enhanced navbar scroll effects
    const navbar = document.querySelector('.top-navbar');
    if (navbar) {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add scrolled class for enhanced styling
            if (scrollTop > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Hide/show navbar on scroll (optional)
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }
}

// Receipt system
function initializeReceiptSystem() {
    // Generate receipt button
    const generateReceiptBtn = document.getElementById('generateReceipt');
    if (generateReceiptBtn) {
        generateReceiptBtn.addEventListener('click', generateCustomReceipt);
    }
    
    // Print receipt button
    const printReceiptBtn = document.getElementById('printReceipt');
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
    }
}

// Generate custom receipt
function generateCustomReceipt() {
    const receiptData = {
        receiptNumber: generateReceiptNumber(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        patientName: document.getElementById('patientName')?.value || 'John Doe',
        serviceType: document.getElementById('serviceType')?.value || 'Consultation',
        amount: document.getElementById('amount')?.value || '150.00',
        doctorName: document.getElementById('doctorName')?.value || 'Dr. Smith',
        notes: document.getElementById('notes')?.value || 'Regular checkup completed'
    };
    
    displayReceipt(receiptData);
}

// Generate unique receipt number
function generateReceiptNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
}

// Display receipt
function displayReceipt(data) {
    const receiptHTML = `
        <div class="receipt-container animate-scale-in">
            <div class="receipt-header">
                <div class="receipt-logo">
                    <i class="fas fa-heartbeat"></i>
                    <h3>Pulse HMS</h3>
                </div>
                <div class="receipt-info">
                    <p><strong>Receipt #:</strong> ${data.receiptNumber}</p>
                    <p><strong>Date:</strong> ${data.date}</p>
                    <p><strong>Time:</strong> ${data.time}</p>
                </div>
            </div>
            <div class="receipt-body">
                <div class="receipt-section">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> ${data.patientName}</p>
                    <p><strong>Doctor:</strong> ${data.doctorName}</p>
                </div>
                <div class="receipt-section">
                    <h4>Service Details</h4>
                    <p><strong>Service:</strong> ${data.serviceType}</p>
                    <p><strong>Amount:</strong> $${data.amount}</p>
                    <p><strong>Notes:</strong> ${data.notes}</p>
                </div>
            </div>
            <div class="receipt-footer">
                <p>Thank you for choosing Pulse HMS</p>
                <p>For any queries, please contact us</p>
            </div>
        </div>
    `;
    
    // Show receipt in modal
    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    document.getElementById('receiptContent').innerHTML = receiptHTML;
    modal.show();
}

// Print receipt
function printReceipt() {
    const receiptContent = document.querySelector('.receipt-container');
    if (receiptContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt - Pulse HMS</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .receipt-container { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
                        .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
                        .receipt-logo { font-size: 24px; color: #667eea; }
                        .receipt-section { margin-bottom: 20px; }
                        .receipt-footer { text-align: center; border-top: 2px solid #333; padding-top: 15px; margin-top: 20px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${receiptContent.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Global utility functions
window.PulseHMS = {
    // Show loading overlay
    showLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },
    
    // Hide loading overlay
    hideLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
};