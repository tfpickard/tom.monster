/**
 * PARTICLE FIELD MODE
 * Swirling, morphing particle system synchronized to the rhythm of life
 */

export default class ParticleField {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.attractors = [];
        this.time = 0;
    }

    init(width, height) {
        this.width = width;
        this.height = height;
        this.particles = [];
        this.attractors = [];
        this.time = 0;

        // Create particles
        const numParticles = Math.min(2000, Math.floor(width * height / 400));

        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random(),
                hue: Math.random() * 360,
                size: 1 + Math.random() * 2
            });
        }

        // Create attractors
        this.createAttractors();
    }

    createAttractors() {
        this.attractors = [];
        const numAttractors = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numAttractors; i++) {
            this.attractors.push({
                x: this.width * (0.2 + Math.random() * 0.6),
                y: this.height * (0.2 + Math.random() * 0.6),
                strength: (Math.random() - 0.5) * 100,
                radius: 50 + Math.random() * 100,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    update(dataStream) {
        const { heartRate, variance } = dataStream;

        this.time += 0.016; // ~60fps

        // Heart rate affects flow speed and attractor behavior
        const flowSpeed = heartRate / 75;
        const turbulence = variance * 0.1;

        // Update attractor positions in circular patterns
        for (let i = 0; i < this.attractors.length; i++) {
            const attractor = this.attractors[i];
            const speed = 0.5 * flowSpeed;

            attractor.phase += speed * 0.02;
            attractor.x = this.width * 0.5 + Math.cos(attractor.phase + i * 2) * 200;
            attractor.y = this.height * 0.5 + Math.sin(attractor.phase + i * 2) * 150;

            // Pulse strength with heart rate
            const pulse = Math.sin(this.time * heartRate / 30) * 0.3 + 0.7;
            attractor.currentStrength = attractor.strength * pulse;
        }

        // Update particles
        for (const particle of this.particles) {
            let fx = 0, fy = 0;

            // Calculate forces from attractors
            for (const attractor of this.attractors) {
                const dx = attractor.x - particle.x;
                const dy = attractor.y - particle.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                if (dist < attractor.radius) {
                    const force = attractor.currentStrength * (1 - dist / attractor.radius);
                    fx += force * dx / dist;
                    fy += force * dy / dist;
                }
            }

            // Add flow field based on position
            const flowAngle = Math.sin(particle.x * 0.01 + this.time) +
                            Math.cos(particle.y * 0.01 + this.time);
            fx += Math.cos(flowAngle) * flowSpeed;
            fy += Math.sin(flowAngle) * flowSpeed;

            // Add turbulence
            fx += (Math.random() - 0.5) * turbulence;
            fy += (Math.random() - 0.5) * turbulence;

            // Update velocity
            particle.vx += fx * 0.1;
            particle.vy += fy * 0.1;

            // Apply drag
            particle.vx *= 0.95;
            particle.vy *= 0.95;

            // Limit speed
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > 5) {
                particle.vx = particle.vx / speed * 5;
                particle.vy = particle.vy / speed * 5;
            }

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x += this.width;
            if (particle.x > this.width) particle.x -= this.width;
            if (particle.y < 0) particle.y += this.height;
            if (particle.y > this.height) particle.y -= this.height;

            // Update life and color
            particle.life += 0.01 * flowSpeed;
            particle.hue = (particle.hue + 0.5 * flowSpeed) % 360;
        }

        // Occasionally recreate attractors at high heart rates
        if (heartRate > 90 && Math.random() < 0.005) {
            this.createAttractors();
        }
    }

    render(width, height) {
        const ctx = this.ctx;

        // Fade previous frame
        ctx.fillStyle = 'rgba(0, 5, 16, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Draw connections between nearby particles
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.lineWidth = 0.5;

        const connectionDistance = 80;
        const checkDistance = 100; // Optimization: only check nearby particles

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];

            // Only check a subset for performance
            if (i % 3 !== 0) continue;

            for (let j = i + 1; j < Math.min(i + 50, this.particles.length); j++) {
                const p2 = this.particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    const alpha = 1 - dist / connectionDistance;
                    ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.15})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const particle of this.particles) {
            const intensity = Math.sin(particle.life) * 0.5 + 0.5;
            const alpha = 0.6 + intensity * 0.4;

            // Particle glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );

            gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 70%, ${alpha})`);
            gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 50%, ${alpha * 0.5})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 60%, 30%, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Particle core
            ctx.fillStyle = `hsla(${particle.hue}, 100%, 90%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw attractor influence fields (subtle)
        for (const attractor of this.attractors) {
            const alpha = Math.abs(attractor.currentStrength) / 100 * 0.1;
            const hue = attractor.currentStrength > 0 ? 180 : 300;

            const gradient = ctx.createRadialGradient(
                attractor.x, attractor.y, 0,
                attractor.x, attractor.y, attractor.radius
            );

            gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(attractor.x, attractor.y, attractor.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}
