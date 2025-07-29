/**
 * Pulse HMS Sound System
 * 
 * A modular sound system that provides audio feedback for user interactions.
 * Features:
 * - Preloaded audio files for performance
 * - Volume control and mute functionality
 * - Easy enable/disable toggle
 * - Clean, modular design
 * - Local storage for user preferences
 * 
 * Sound Effects:
 * - sidebar-toggle: When sidebar is toggled
 * - button-click: When buttons are clicked
 * - notification: When notifications appear
 * - success: For successful actions
 * - error: For error states
 * - hover: For hover effects (optional)
 */

class SoundSystem {
    constructor() {
        // Sound system configuration
        this.config = {
            enabled: true,
            volume: 0.3,
            sounds: {
                'sidebar-toggle': {
                    file: '/static/audio/sidebar-toggle.mp3',
                    volume: 0.4,
                    description: 'Sidebar toggle sound'
                },
                'button-click': {
                    file: '/static/audio/button-click.mp3',
                    volume: 0.3,
                    description: 'Button click sound'
                },
                'notification': {
                    file: '/static/audio/notification.mp3',
                    volume: 0.5,
                    description: 'Notification sound'
                },
                'success': {
                    file: '/static/audio/success.mp3',
                    volume: 0.4,
                    description: 'Success sound'
                },
                'error': {
                    file: '/static/audio/error.mp3',
                    volume: 0.4,
                    description: 'Error sound'
                },
                'hover': {
                    file: '/static/audio/hover.mp3',
                    volume: 0.2,
                    description: 'Hover sound (optional)'
                }
            }
        };

        // Audio cache for preloaded sounds
        this.audioCache = {};
        
        // Initialize the sound system
        this.init();
    }

    /**
     * Initialize the sound system
     */
    init() {
        // Load user preferences from localStorage
        this.loadPreferences();
        
        // Preload all audio files
        this.preloadSounds();
        
        // Add sound system controls to the UI
        this.addSoundControls();
        
        console.log('🎵 Sound system initialized');
    }

    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        try {
            const savedEnabled = localStorage.getItem('soundSystemEnabled');
            const savedVolume = localStorage.getItem('soundSystemVolume');
            
            if (savedEnabled !== null) {
                this.config.enabled = JSON.parse(savedEnabled);
            }
            
            if (savedVolume !== null) {
                this.config.volume = parseFloat(savedVolume);
            }
        } catch (error) {
            console.warn('Failed to load sound preferences:', error);
        }
    }

    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('soundSystemEnabled', JSON.stringify(this.config.enabled));
            localStorage.setItem('soundSystemVolume', this.config.volume.toString());
        } catch (error) {
            console.warn('Failed to save sound preferences:', error);
        }
    }

    /**
     * Preload all audio files for better performance
     */
    preloadSounds() {
        Object.keys(this.config.sounds).forEach(soundName => {
            const soundConfig = this.config.sounds[soundName];
            this.preloadSound(soundName, soundConfig.file);
        });
    }

    /**
     * Preload a single audio file
     */
    preloadSound(soundName, filePath) {
        const audio = new Audio();
        
        audio.addEventListener('canplaythrough', () => {
            this.audioCache[soundName] = audio;
            console.log(`🎵 Preloaded: ${soundName}`);
        });
        
        audio.addEventListener('error', (error) => {
            console.warn(`Failed to preload sound ${soundName}:`, error);
        });
        
        // Set audio properties
        audio.preload = 'auto';
        audio.volume = this.config.sounds[soundName].volume * this.config.volume;
        
        // Load the audio file
        audio.src = filePath;
    }

    /**
     * Play a sound effect
     */
    play(soundName) {
        if (!this.config.enabled) {
            return;
        }

        const audio = this.audioCache[soundName];
        if (!audio) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        try {
            // Reset audio to beginning and play
            audio.currentTime = 0;
            audio.volume = this.config.sounds[soundName].volume * this.config.volume;
            
            // Play the sound
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Failed to play sound ${soundName}:`, error);
                });
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }

    /**
     * Enable or disable the sound system
     */
    toggle() {
        this.config.enabled = !this.config.enabled;
        this.savePreferences();
        this.updateSoundControls();
        
        // Play a feedback sound if enabling
        if (this.config.enabled) {
            setTimeout(() => this.play('success'), 100);
        }
        
        console.log(`Sound system ${this.config.enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set the master volume
     */
    setVolume(volume) {
        this.config.volume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
        this.updateSoundControls();
        
        // Update all cached audio volumes
        Object.keys(this.audioCache).forEach(soundName => {
            const audio = this.audioCache[soundName];
            if (audio) {
                audio.volume = this.config.sounds[soundName].volume * this.config.volume;
            }
        });
    }

    /**
     * Add sound controls to the UI
     */
    addSoundControls() {
        // Create sound controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'soundControls';
        controlsContainer.className = 'sound-controls';
        controlsContainer.innerHTML = `
            <div class="sound-control-panel">
                <div class="sound-control-header">
                    <i class="fas fa-volume-up"></i>
                    <span>Sound Effects</span>
                </div>
                <div class="sound-control-body">
                    <div class="sound-toggle">
                        <label class="sound-switch">
                            <input type="checkbox" id="soundToggle" ${this.config.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span>Enable Sounds</span>
                    </div>
                    <div class="sound-volume">
                        <label>Volume</label>
                        <input type="range" id="soundVolume" min="0" max="100" 
                               value="${Math.round(this.config.volume * 100)}" 
                               ${!this.config.enabled ? 'disabled' : ''}>
                        <span class="volume-value">${Math.round(this.config.volume * 100)}%</span>
                    </div>
                </div>
            </div>
        `;

        // Add to the navbar
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const soundControlItem = document.createElement('div');
            soundControlItem.className = 'nav-item dropdown me-2';
            soundControlItem.innerHTML = `
                <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-volume-up" id="soundIcon"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end sound-dropdown">
                    ${controlsContainer.innerHTML}
                </div>
            `;
            
            // Insert before the user dropdown
            const userDropdown = navbar.querySelector('.dropdown:last-child');
            if (userDropdown) {
                navbar.insertBefore(soundControlItem, userDropdown);
            } else {
                navbar.appendChild(soundControlItem);
            }
        }

        // Add event listeners
        this.addSoundControlListeners();
    }

    /**
     * Add event listeners for sound controls
     */
    addSoundControlListeners() {
        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.config.enabled = e.target.checked;
                this.savePreferences();
                this.updateSoundControls();
                
                if (this.config.enabled) {
                    setTimeout(() => this.play('success'), 100);
                }
            });
        }

        // Volume slider
        const soundVolume = document.getElementById('soundVolume');
        if (soundVolume) {
            soundVolume.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setVolume(volume);
                
                // Update volume display
                const volumeValue = e.target.parentElement.querySelector('.volume-value');
                if (volumeValue) {
                    volumeValue.textContent = `${e.target.value}%`;
                }
            });
        }
    }

    /**
     * Update sound control UI elements
     */
    updateSoundControls() {
        const soundToggle = document.getElementById('soundToggle');
        const soundVolume = document.getElementById('soundVolume');
        const soundIcon = document.getElementById('soundIcon');
        
        if (soundToggle) {
            soundToggle.checked = this.config.enabled;
        }
        
        if (soundVolume) {
            soundVolume.value = Math.round(this.config.volume * 100);
            soundVolume.disabled = !this.config.enabled;
        }
        
        if (soundIcon) {
            if (this.config.enabled) {
                soundIcon.className = this.config.volume > 0.5 ? 'fas fa-volume-up' : 
                                    this.config.volume > 0 ? 'fas fa-volume-down' : 'fas fa-volume-mute';
            } else {
                soundIcon.className = 'fas fa-volume-mute';
            }
        }
    }

    /**
     * Add sound effects to existing UI elements
     */
    attachSoundEffects() {
        // Sidebar toggle button
        const sidebarToggle = document.getElementById('sidebarToggleBtn');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.play('sidebar-toggle');
            });
        }

        // All buttons (with some exceptions)
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, input[type="submit"], input[type="button"]')) {
                // Don't play sound for sound control buttons
                if (!e.target.closest('.sound-controls') && 
                    !e.target.closest('.sound-dropdown') &&
                    !e.target.matches('#soundToggle, #soundVolume')) {
                    this.play('button-click');
                }
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (!e.target.closest('.sound-controls')) {
                this.play('button-click');
            }
        });

        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href]:not([href="#"])')) {
                this.play('button-click');
            }
        });

        // Optional: Hover effects (can be disabled)
        if (this.config.sounds.hover) {
            document.addEventListener('mouseenter', (e) => {
                if (e.target.matches('button, .btn, .nav-link') && this.config.enabled) {
                    // Debounce hover sounds
                    clearTimeout(e.target.hoverTimeout);
                    e.target.hoverTimeout = setTimeout(() => {
                        this.play('hover');
                    }, 50);
                }
            }, true);
        }
    }

    /**
     * Play notification sound (called by notification system)
     */
    playNotification() {
        this.play('notification');
    }

    /**
     * Play success sound
     */
    playSuccess() {
        this.play('success');
    }

    /**
     * Play error sound
     */
    playError() {
        this.play('error');
    }
}

// Initialize sound system when DOM is loaded
let soundSystem;

document.addEventListener('DOMContentLoaded', () => {
    soundSystem = new SoundSystem();
    
    // Attach sound effects to UI elements
    setTimeout(() => {
        soundSystem.attachSoundEffects();
    }, 100);
});

// Export for use in other modules
window.soundSystem = soundSystem; 