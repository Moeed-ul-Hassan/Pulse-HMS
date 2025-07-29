/**
 * Pulse HMS - Professional Preloader with Humor
 * A delightful loading experience for healthcare professionals
 */

class PulsePreloader {
    constructor() {
        this.currentStep = 0;
        this.progress = 0;
        this.isLoading = true;
        this.funFacts = [
            "Did you know? The average doctor writes 10,000 prescriptions per year! 📝",
            "Fun fact: The stethoscope was invented in 1816 by René Laennec 🩺",
            "Interesting: The human body contains enough iron to make a 3-inch nail! 🔩",
            "Amazing: Your heart beats about 100,000 times every day! 💓",
            "Cool fact: The human brain can process images in as little as 13 milliseconds! 🧠",
            "Did you know? The average person spends 6 months of their life waiting for red lights! 🚦",
            "Fun fact: Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs! 🍯",
            "Interesting: A group of flamingos is called a 'flamboyance'! 🦩",
            "Amazing: The shortest war in history lasted only 38 minutes! ⚔️",
            "Cool fact: Bananas are berries, but strawberries aren't! 🍌"
        ];
        
        this.loadingSteps = [
            {
                status: "Initializing Pulse HMS...",
                message: "Booting up the healthcare management system",
                progress: 10
            },
            {
                status: "Loading medical database...",
                message: "Fetching patient records and medical data",
                progress: 25
            },
            {
                status: "Configuring AI services...",
                message: "Teaching our AI to be as smart as Dr. House",
                progress: 40
            },
            {
                status: "Setting up security protocols...",
                message: "Activating seven layers of digital protection",
                progress: 55
            },
            {
                status: "Optimizing user interface...",
                message: "Making sure everything looks as good as it works",
                progress: 70
            },
            {
                status: "Preparing analytics dashboard...",
                message: "Crunching numbers and creating beautiful charts",
                progress: 85
            },
            {
                status: "Finalizing setup...",
                message: "Almost ready to revolutionize healthcare!",
                progress: 95
            },
            {
                status: "Welcome to Pulse HMS!",
                message: "Your modern healthcare management system is ready",
                progress: 100
            }
        ];
        
        this.init();
    }
    
    init() {
        this.createPreloaderHTML();
        this.startLoading();
    }
    
    createPreloaderHTML() {
        const preloaderHTML = `
            <div id="pulsePreloader" class="preloader">
                <div class="preloader-content">
                    <div class="preloader-logo">
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <div class="preloader-title">Pulse HMS</div>
                    <div class="preloader-subtitle">Modern Healthcare Management</div>
                    
                    <div class="preloader-step active" id="loadingStep">
                        <div class="preloader-message" id="loadingMessage">
                            Initializing Pulse HMS...
                        </div>
                        <div class="preloader-progress">
                            <div class="preloader-bar" id="progressBar"></div>
                        </div>
                        <div class="preloader-status" id="loadingStatus">
                            Loading...
                        </div>
                    </div>
                    
                    <div class="preloader-fun-fact" id="funFact">
                        Did you know? The average doctor writes 10,000 prescriptions per year! 📝
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', preloaderHTML);
    }
    
    startLoading() {
        this.updateFunFact();
        this.loadingInterval = setInterval(() => {
            this.updateProgress();
        }, 200);
        
        this.stepInterval = setInterval(() => {
            this.nextStep();
        }, 1500);
    }
    
    updateProgress() {
        if (this.progress < 100) {
            this.progress += Math.random() * 2;
            this.progress = Math.min(this.progress, 100);
            
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = `${this.progress}%`;
            }
        }
    }
    
    nextStep() {
        if (this.currentStep < this.loadingSteps.length - 1) {
            this.currentStep++;
            this.updateStep();
        } else {
            this.completeLoading();
        }
    }
    
    updateStep() {
        const step = this.loadingSteps[this.currentStep];
        const messageEl = document.getElementById('loadingMessage');
        const statusEl = document.getElementById('loadingStatus');
        
        if (messageEl) {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.textContent = step.message;
                messageEl.style.opacity = '1';
            }, 200);
        }
        
        if (statusEl) {
            statusEl.textContent = step.status;
        }
        
        // Update progress to match step
        this.progress = step.progress;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${this.progress}%`;
        }
        
        // Update fun fact every few steps
        if (this.currentStep % 2 === 0) {
            this.updateFunFact();
        }
    }
    
    updateFunFact() {
        const funFactEl = document.getElementById('funFact');
        if (funFactEl) {
            const randomFact = this.funFacts[Math.floor(Math.random() * this.funFacts.length)];
            funFactEl.style.opacity = '0';
            setTimeout(() => {
                funFactEl.textContent = randomFact;
                funFactEl.style.opacity = '1';
            }, 300);
        }
    }
    
    completeLoading() {
        clearInterval(this.loadingInterval);
        clearInterval(this.stepInterval);
        
        // Final completion animation
        setTimeout(() => {
            const preloader = document.getElementById('pulsePreloader');
            if (preloader) {
                preloader.classList.add('hidden');
                
                // Remove preloader after animation
                setTimeout(() => {
                    preloader.remove();
                    this.isLoading = false;
                    
                    // Trigger any post-loading events
                    this.onComplete();
                }, 500);
            }
        }, 1000);
    }
    
    onComplete() {
        // Initialize main application features
        if (typeof initializeAnimations === 'function') {
            initializeAnimations();
        }
        
        if (typeof initializeSmoothScrolling === 'function') {
            initializeSmoothScrolling();
        }
        
        // Show welcome message
        this.showWelcomeMessage();
    }
    
    showWelcomeMessage() {
        const welcomeHTML = `
            <div id="welcomeMessage" class="alert alert-success alert-dismissible fade show" 
                 style="position: fixed; top: 20px; right: 20px; z-index: 9998; max-width: 300px;">
                <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle me-2"></i>
                    <div>
                        <strong>Welcome to Pulse HMS!</strong><br>
                        <small>Your healthcare management system is ready to serve.</small>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', welcomeHTML);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const welcomeEl = document.getElementById('welcomeMessage');
            if (welcomeEl) {
                welcomeEl.remove();
            }
        }, 5000);
    }
    
    // Public method to manually hide preloader
    hide() {
        const preloader = document.getElementById('pulsePreloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.remove();
                this.isLoading = false;
            }, 500);
        }
    }
    
    // Public method to show preloader again
    show() {
        if (!this.isLoading) {
            this.isLoading = true;
            this.currentStep = 0;
            this.progress = 0;
            this.createPreloaderHTML();
            this.startLoading();
        }
    }
}

// Initialize preloader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure everything is loaded
    setTimeout(() => {
        window.pulsePreloader = new PulsePreloader();
    }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PulsePreloader;
} 