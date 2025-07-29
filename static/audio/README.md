# Audio Files for Pulse HMS Sound System

This directory contains audio files for the sound system. All files should be lightweight (under 50KB each) and in MP3 or WAV format.

## Required Audio Files

### 1. sidebar-toggle.mp3
- **Purpose**: Played when sidebar is toggled
- **Duration**: 0.1-0.3 seconds
- **Style**: Soft click or slide sound
- **Volume**: 0.4 (40% of master volume)

### 2. button-click.mp3
- **Purpose**: Played when buttons are clicked
- **Duration**: 0.1-0.2 seconds
- **Style**: Gentle click or tap sound
- **Volume**: 0.3 (30% of master volume)

### 3. notification.mp3
- **Purpose**: Played when notifications appear
- **Duration**: 0.2-0.5 seconds
- **Style**: Pleasant chime or bell sound
- **Volume**: 0.5 (50% of master volume)

### 4. success.mp3
- **Purpose**: Played for successful actions
- **Duration**: 0.3-0.6 seconds
- **Style**: Positive chime or success sound
- **Volume**: 0.4 (40% of master volume)

### 5. error.mp3
- **Purpose**: Played for error states
- **Duration**: 0.2-0.4 seconds
- **Style**: Gentle error tone (not harsh)
- **Volume**: 0.4 (40% of master volume)

### 6. hover.mp3 (Optional)
- **Purpose**: Played on hover effects
- **Duration**: 0.1-0.2 seconds
- **Style**: Very subtle sound
- **Volume**: 0.2 (20% of master volume)

## Audio File Guidelines

1. **File Size**: Keep each file under 50KB for fast loading
2. **Format**: Use MP3 for best compression, WAV for highest quality
3. **Sample Rate**: 44.1kHz is sufficient for UI sounds
4. **Bitrate**: 128kbps MP3 or 16-bit WAV
5. **Channels**: Mono is fine for UI sounds (smaller file size)

## Recommended Sources

- **Free Sound Libraries**: Freesound.org, Zapsplat
- **UI Sound Packs**: Many available on design marketplaces
- **Create Your Own**: Use tools like Audacity or online audio editors

## Testing

After adding audio files, test the sound system by:
1. Opening the browser console
2. Looking for "🎵 Preloaded: [sound-name]" messages
3. Interacting with UI elements to hear sounds
4. Adjusting volume and toggle settings

## Fallback

If audio files are missing, the sound system will log warnings but continue to function normally without playing sounds. 