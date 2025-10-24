/**
 * COSMIC ENGINE
 * A modular visualization system that responds to biometric data streams
 */

import CellularAutomata from './modes/cellular-automata.js';
import NBodyPhysics from './modes/nbody.js';
import ParticleField from './modes/particles.js';
import BiometricSensor from './biometric.js';

class CosmicEngine {
    constructor() {
        this.canvas = document.getElementById('cosmos');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.modes = {
            cellular: new CellularAutomata(this.ctx),
            nbody: new NBodyPhysics(this.ctx),
            particles: new ParticleField(this.ctx)
        };

        this.currentMode = 'cellular';
        this.biometric = new BiometricSensor();

        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();

        this.dataStream = {
            heartRate: 75, // Default synthetic value
            variance: 5,
            timestamp: Date.now()
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupBiometric();
        this.startSyntheticData();
        this.start();

        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        // Notify current mode of resize
        if (this.modes[this.currentMode]) {
            this.modes[this.currentMode].resize(this.width, this.height);
        }
    }

    setupEventListeners() {
        // Mode switcher
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);

                // Update UI
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') this.switchMode('cellular');
            if (e.key === '2') this.switchMode('nbody');
            if (e.key === '3') this.switchMode('particles');
            if (e.key === ' ') this.togglePause();
            if (e.key === 'r') this.resetCurrentMode();
        });
    }

    setupBiometric() {
        const connectBtn = document.getElementById('connect-sensor');

        connectBtn.addEventListener('click', async () => {
            try {
                connectBtn.textContent = 'connecting...';
                connectBtn.disabled = true;

                await this.biometric.connect();

                connectBtn.textContent = 'connected';
                document.getElementById('data-source').textContent = 'biometric';

                // Listen for heart rate updates
                this.biometric.on('heartrate', (bpm) => {
                    this.dataStream.heartRate = bpm;
                    this.dataStream.variance = this.calculateVariance(bpm);
                    this.dataStream.timestamp = Date.now();

                    this.updateBPMDisplay(bpm);
                });

                this.biometric.on('disconnect', () => {
                    connectBtn.textContent = 'connect biometric sensor';
                    connectBtn.disabled = false;
                    document.getElementById('data-source').textContent = 'synthetic';
                    this.updateBPMDisplay('--');
                    this.startSyntheticData();
                });

            } catch (error) {
                console.error('Failed to connect sensor:', error);
                connectBtn.textContent = 'connection failed – retry';
                connectBtn.disabled = false;
                document.getElementById('connection-status').textContent = error.message;
            }
        });
    }

    startSyntheticData() {
        // Generate synthetic heart rate data with realistic variation
        if (this.syntheticInterval) return;

        this.syntheticInterval = setInterval(() => {
            if (this.biometric.connected) {
                clearInterval(this.syntheticInterval);
                this.syntheticInterval = null;
                return;
            }

            // Simulate natural heart rate variation
            const time = Date.now() / 1000;
            const breath = Math.sin(time * 0.2) * 3; // Respiratory sinus arrhythmia
            const chaos = (Math.random() - 0.5) * 2; // Random variation

            this.dataStream.heartRate = 75 + breath + chaos;
            this.dataStream.variance = Math.abs(breath) + 2;
            this.dataStream.timestamp = Date.now();
        }, 200);
    }

    calculateVariance(currentBpm) {
        // Calculate heart rate variability proxy
        if (!this.lastBpm) {
            this.lastBpm = currentBpm;
            return 5;
        }

        const variance = Math.abs(currentBpm - this.lastBpm);
        this.lastBpm = currentBpm;
        return variance;
    }

    updateBPMDisplay(bpm) {
        const display = document.getElementById('bpm-value');
        const heart = document.getElementById('heart-icon');

        if (typeof bpm === 'number') {
            display.textContent = Math.round(bpm);
            heart.classList.add('beating');
            setTimeout(() => heart.classList.remove('beating'), 200);
        } else {
            display.textContent = bpm;
        }
    }

    switchMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
            this.modes[mode].init(this.width, this.height);
            document.getElementById('current-mode').textContent = mode.replace('-', ' ');
        }
    }

    resetCurrentMode() {
        if (this.modes[this.currentMode]) {
            this.modes[this.currentMode].init(this.width, this.height);
        }
    }

    togglePause() {
        this.paused = !this.paused;
    }

    start() {
        this.running = true;
        this.animate();
    }

    animate(timestamp = 0) {
        if (!this.running) return;

        // Calculate FPS
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFpsUpdate));
            document.getElementById('fps').textContent = this.fps;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }

        if (!this.paused) {
            const mode = this.modes[this.currentMode];
            if (mode) {
                mode.update(this.dataStream);
                mode.render(this.width, this.height);
            }
        }

        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CosmicEngine());
} else {
    new CosmicEngine();
}
