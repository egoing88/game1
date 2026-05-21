// Web Audio API Retro Sound Synthesizer

class AudioSynth {
    constructor() {
        this.ctx = null;
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.bgmInterval = null;
        this.bgmSequence = [];
        this.bgmIndex = 0;
        this.tempo = 140; // BPM
        this.currentBgmSource = null;
        
        // Define simple retro tracks (notes & durations)
        // Format: [note, duration_in_beats]
        // Notes representation: C4, D4, E4, F4, G4, A4, B4, C5, etc. (0 for rest)
        this.tracks = {
            1: [
                ['E4', 0.5], ['G4', 0.5], ['A4', 0.5], ['0', 0.5],
                ['E4', 0.5], ['G4', 0.5], ['B4', 0.25], ['A4', 0.75],
                ['E4', 0.5], ['G4', 0.5], ['A4', 0.5], ['G4', 0.5],
                ['E4', 1.0], ['0', 1.0],
                ['D4', 0.5], ['F4', 0.5], ['G4', 0.5], ['0', 0.5],
                ['D4', 0.5], ['F4', 0.5], ['A4', 0.25], ['G4', 0.75],
                ['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['C5', 0.5],
                ['B4', 1.0], ['A4', 1.0]
            ],
            2: [
                ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5],
                ['G4', 0.5], ['G4', 0.5], ['B4', 1.0],
                ['F4', 0.5], ['F4', 0.5], ['A4', 0.5], ['F4', 0.5],
                ['E4', 0.5], ['G4', 0.5], ['E4', 1.0],
                ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['A4', 0.5],
                ['D5', 1.0], ['C5', 1.0],
                ['B4', 0.5], ['G4', 0.5], ['A4', 1.0],
                ['E4', 1.0], ['0', 1.0]
            ],
            3: [
                ['A4', 0.25], ['C5', 0.25], ['D#5', 0.25], ['0', 0.25],
                ['A4', 0.25], ['C5', 0.25], ['D#5', 0.25], ['0', 0.25],
                ['A4', 0.5], ['C5', 0.5], ['A4', 0.5], ['0', 0.5],
                ['G4', 0.25], ['A#4', 0.25], ['C#5', 0.25], ['0', 0.25],
                ['G4', 0.25], ['A#4', 0.25], ['C#5', 0.25], ['0', 0.25],
                ['G4', 0.5], ['A#4', 0.5], ['G4', 0.5], ['0', 0.5]
            ],
            4: [
                ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5],
                ['B5', 0.5], ['G5', 0.5], ['A5', 1.0],
                ['F5', 0.5], ['A5', 0.5], ['C6', 0.5], ['F6', 0.5],
                ['E6', 0.5], ['C6', 0.5], ['D6', 1.0],
                ['G5', 0.5], ['B5', 0.5], ['D6', 0.5], ['G6', 0.5],
                ['F6', 0.5], ['D6', 0.5], ['E6', 1.0]
            ],
            5: [
                ['E4', 0.25], ['E4', 0.25], ['G4', 0.5], ['E4', 0.25], ['E4', 0.25], ['A4', 0.5],
                ['E4', 0.25], ['E4', 0.25], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5],
                ['D4', 0.25], ['D4', 0.25], ['F4', 0.5], ['D4', 0.25], ['D4', 0.25], ['G4', 0.5],
                ['D4', 0.25], ['D4', 0.25], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5]
            ],
            6: [
                ['C5', 0.5], ['G4', 0.5], ['E4', 0.5], ['G4', 0.5], 
                ['A4', 0.5], ['C5', 0.5], ['B4', 1.0], 
                ['D5', 0.5], ['A4', 0.5], ['F4', 0.5], ['A4', 0.5], 
                ['G4', 0.5], ['B4', 0.5], ['C5', 1.0]
            ],
            7: [
                ['D4', 0.5], ['0', 0.25], ['D4', 0.25], ['F4', 0.5], ['D4', 0.5], 
                ['G#4', 0.5], ['G4', 0.5], ['F4', 0.5], ['D4', 0.5],
                ['C4', 0.5], ['0', 0.25], ['C4', 0.25], ['E4', 0.5], ['C4', 0.5], 
                ['F#4', 0.5], ['F4', 0.5], ['D#4', 0.5], ['C4', 0.5]
            ],
            8: [
                ['E5', 0.25], ['B4', 0.25], ['E5', 0.25], ['G5', 0.25], 
                ['F#5', 0.25], ['D5', 0.25], ['F#5', 0.25], ['A5', 0.25], 
                ['G5', 0.25], ['E5', 0.25], ['G5', 0.25], ['B5', 0.25], 
                ['A5', 0.5], ['B5', 0.5]
            ],
            9: [
                ['C5', 0.5], ['E5', 0.5], ['B4', 0.5], ['D5', 0.5], 
                ['A4', 0.5], ['C5', 0.5], ['G4', 1.0],
                ['F4', 0.5], ['A4', 0.5], ['E4', 0.5], ['G4', 0.5], 
                ['D4', 0.5], ['F4', 0.5], ['C4', 1.0]
            ],
            10: [
                ['A4', 0.25], ['A4', 0.25], ['C5', 0.25], ['A4', 0.25], 
                ['D5', 0.25], ['A4', 0.25], ['D#5', 0.5], 
                ['D5', 0.25], ['C5', 0.25], ['A4', 0.25], ['G4', 0.25], 
                ['A4', 0.5], ['0', 0.5]
            ],
            'ending': [
                ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['G5', 0.5], 
                ['A5', 0.5], ['G5', 0.5], ['C6', 1.0], 
                ['B5', 0.5], ['A5', 0.5], ['G5', 0.5], ['E5', 0.5], 
                ['D5', 0.5], ['E5', 0.5], ['C5', 1.0]
            ]
        };

        // Note frequencies mapping
        this.noteFreqs = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
            'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
            'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'B5': 987.77,
            'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00, 'B6': 1975.53,
            '0': 0
        };
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopBGM();
        } else {
            this.init();
            this.playBGM();
        }
        return this.musicEnabled;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    // Play retro jump sound effect
    playJump() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Retro jump wave
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.15); // Quick sweep up
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Play club swing sound (Whoosh)
    playSwing() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18); // Sweep down
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.18);
    }

    // Play hit enemy sound (Crash/hit)
    playHit() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Low pitch boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.12);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        
        // Noise burst for crunch
        const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        noise.connect(noiseGain);
        
        gain.connect(this.ctx.destination);
        noiseGain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.1);
    }

    // Play item collect sound (Arpeggio)
    playCollect() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Note 1 (C5)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(this.noteFreqs['C5'], now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        
        // Note 2 (E5)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(this.noteFreqs['E5'], now + 0.06);
        gain2.gain.setValueAtTime(0.08, now + 0.06);
        gain2.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        // Note 3 (G5)
        const osc3 = this.ctx.createOscillator();
        const gain3 = this.ctx.createGain();
        osc3.type = 'square';
        osc3.frequency.setValueAtTime(this.noteFreqs['G5'], now + 0.12);
        gain3.gain.setValueAtTime(0.08, now + 0.12);
        gain3.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc3.connect(gain3);
        gain3.connect(this.ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.06);
        osc2.stop(now + 0.15);
        osc3.start(now + 0.12);
        osc3.stop(now + 0.22);
    }

    // Play damage taken sound (Sad crash)
    playDamage() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.25);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Play level clear / stage clear (Triumphant)
    playVictory() {
        if (!this.soundEnabled) return;
        this.init();
        this.stopBGM();
        const now = this.ctx.currentTime;
        
        const notes = ['C5', 'E5', 'G5', 'C6'];
        const duration = 0.12;
        
        notes.forEach((note, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const freq = note === 'C6' ? 1046.50 : this.noteFreqs[note];
            osc.frequency.setValueAtTime(freq, now + i * duration);
            
            gain.gain.setValueAtTime(0.08, now + i * duration);
            gain.gain.linearRampToValueAtTime(0.01, now + i * duration + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + i * duration);
            osc.stop(now + i * duration + 0.25);
        });
    }

    // Play game over music/sound
    playGameOver() {
        if (!this.soundEnabled) return;
        this.init();
        this.stopBGM();
        const now = this.ctx.currentTime;
        
        const notes = ['G4', 'E4', 'C#4', 'C4'];
        const duration = 0.2;
        
        notes.forEach((note, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(this.noteFreqs[note], now + i * duration);
            
            gain.gain.setValueAtTime(0.12, now + i * duration);
            gain.gain.linearRampToValueAtTime(0.01, now + i * duration + 0.35);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + i * duration);
            osc.stop(now + i * duration + 0.35);
        });
    }

    // Play retro dash sound effect
    playDash() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.12);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // Play retro arrow firing sound effect
    playArrow() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Continuous pitch bend for charging
    startChargeSound() {
        if (!this.soundEnabled) return;
        this.init();
        this.stopChargeSound(); // Safety check
        
        const now = this.ctx.currentTime;
        this.chargeOsc = this.ctx.createOscillator();
        this.chargeGain = this.ctx.createGain();
        
        this.chargeOsc.type = 'triangle';
        this.chargeOsc.frequency.setValueAtTime(200, now);
        this.chargeOsc.frequency.linearRampToValueAtTime(900, now + 1.5);
        
        this.chargeGain.gain.setValueAtTime(0.01, now);
        this.chargeGain.gain.linearRampToValueAtTime(0.12, now + 0.5);
        
        this.chargeOsc.connect(this.chargeGain);
        this.chargeGain.connect(this.ctx.destination);
        
        this.chargeOsc.start(now);
    }

    stopChargeSound() {
        if (!this.ctx) return;
        if (this.chargeOsc) {
            const now = this.ctx.currentTime;
            const osc = this.chargeOsc;
            const gain = this.chargeGain;
            
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
                osc.stop(now + 0.05);
            } catch(e) {}
            
            this.chargeOsc = null;
            this.chargeGain = null;
        }
    }

    // Start 8-bit Background Music loop
    playBGM(stage = 1) {
        if (!this.musicEnabled) return;
        this.init();
        this.stopBGM();
        
        this.bgmSequence = this.tracks[stage] || this.tracks[1];
        this.bgmIndex = 0;
        
        const beatDuration = 60 / this.tempo; // Duration of one beat in seconds
        let nextNoteTime = this.ctx.currentTime;
        
        const scheduleNextNote = () => {
            if (!this.musicEnabled) return;
            
            const current = this.bgmSequence[this.bgmIndex];
            const note = current[0];
            const duration = current[1];
            
            const noteTime = nextNoteTime;
            const freq = this.noteFreqs[note];
            
            if (freq > 0) {
                // Play lead melody note
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                // Determine oscillator wave type and gain based on stage
                let oscType = 'triangle';
                let leadGainVal = 0.05;
                let bassGainVal = 0.04;
                
                if (stage === 1 || stage === 4 || stage === 6 || stage === 9 || stage === 'ending') {
                    oscType = 'triangle';
                    leadGainVal = 0.05;
                } else if (stage === 2 || stage === 5 || stage === 8) {
                    oscType = 'square';
                    leadGainVal = 0.04;
                } else if (stage === 3 || stage === 7 || stage === 10) {
                    oscType = 'sawtooth';
                    leadGainVal = 0.03; // Lower volume since sawtooth is louder
                }
                
                osc.type = oscType;
                osc.frequency.setValueAtTime(freq, noteTime);
                
                gain.gain.setValueAtTime(leadGainVal, noteTime);
                // Ramp down before note ends to create distinct articulation
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (duration * beatDuration) - 0.02);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + duration * beatDuration);

                // Add a very simple retro bass accompaniment on stages
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'triangle';
                bassOsc.frequency.setValueAtTime(freq / 2, noteTime); // One octave lower
                bassGain.gain.setValueAtTime(bassGainVal, noteTime);
                bassGain.gain.exponentialRampToValueAtTime(0.001, noteTime + (duration * beatDuration) - 0.02);
                
                bassOsc.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start(noteTime);
                bassOsc.stop(noteTime + duration * beatDuration);
            }
            
            nextNoteTime += duration * beatDuration;
            this.bgmIndex = (this.bgmIndex + 1) % this.bgmSequence.length;
            
            // Schedule the timeout for slightly before the note plays to ensure smooth playback
            const delay = (nextNoteTime - this.ctx.currentTime) * 1000 - 30;
            this.bgmInterval = setTimeout(scheduleNextNote, Math.max(10, delay));
        };
        
        scheduleNextNote();
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearTimeout(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

// Global instance
const gameAudio = new AudioSynth();
window.gameAudio = gameAudio;
