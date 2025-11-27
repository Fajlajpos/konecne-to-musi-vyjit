// ==========================================
// AUDIO SYSTEM - SOUND MANAGER
// ==========================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('oblivions_muted') === 'true';
        this.initialized = false;

        // Audio nodes
        this.masterGain = null;
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Master volume
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3; // Restored volume to 30%
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('oblivions_muted', this.isMuted);

        if (this.masterGain) {
            // Smooth transition
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.3, now + 0.1);
        }

        return this.isMuted;
    }

    // CLICK SOUND: Deeper, metallic mechanical click
    playClick() {
        if (!this.initialized || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        // 1. Low frequency body (The "Thud")
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle'; // More metallic than sine
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        gain.gain.setValueAtTime(0.4, t); // Restored to 0.4
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);

        // 2. High frequency click (The "Crispness")
        this.playNoise(0.02, 0.15);
    }

    // HOVER SOUND: Very subtle static/air
    playHover() {
        if (!this.initialized || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Very quiet noise burst
        this.playNoise(0.03, 0.05);
    }

    // SUCCESS SOUND: Harmonious chord
    playSuccess() {
        if (!this.initialized || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const frequencies = [440, 554.37, 659.25]; // A major chord

        frequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Staggered entry
            const start = t + (i * 0.05);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.1); // Restored to 0.2
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.8);

            osc.start(start);
            osc.stop(start + 0.8);
        });
    }

    // Helper: White noise generator
    playNoise(duration, volume) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        // Filter to make it less harsh
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }
}

// Global instance
const audioManager = new SoundManager();

// Initialize on first interaction
document.addEventListener('click', () => {
    audioManager.init();
}, { once: true });

// Export for use
window.audioManager = audioManager;

// ==========================================
// AUTO-BINDING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const interactiveElements = document.querySelectorAll('a, button, .clothing-item, .cart-item, input');

    interactiveElements.forEach(el => {
        // Bind Click Sounds (except specific ones handled elsewhere)
        if (!el.classList.contains('add-to-cart-btn')) {
            el.addEventListener('click', () => {
                audioManager.playClick();
            });
        }
    });

    // Create Mute Toggle
    createMuteToggle();
});

function createMuteToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'audio-toggle';
    toggle.className = 'audio-toggle';
    toggle.innerHTML = getAudioIcon(audioManager.isMuted);
    toggle.title = 'Toggle Sound';

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMuted = audioManager.toggleMute();
        toggle.innerHTML = getAudioIcon(isMuted);
        toggle.classList.toggle('muted', isMuted);

        if (!isMuted) audioManager.playClick();
    });

    document.body.appendChild(toggle);
}

function getAudioIcon(isMuted) {
    if (isMuted) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
    } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
    }
}
