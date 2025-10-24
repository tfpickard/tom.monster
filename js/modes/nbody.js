/**
 * N-BODY PHYSICS MODE
 * Gravitational dance of celestial bodies modulated by biometric chaos
 */

export default class NBodyPhysics {
    constructor(ctx) {
        this.ctx = ctx;
        this.bodies = [];
        this.trails = [];
        this.G = 0.5; // Gravitational constant
        this.maxTrailLength = 100;
    }

    init(width, height) {
        this.width = width;
        this.height = height;
        this.bodies = [];
        this.trails = [];

        // Create initial bodies
        const numBodies = 12 + Math.floor(Math.random() * 8);

        for (let i = 0; i < numBodies; i++) {
            this.createBody();
        }

        // Create a few massive central attractors
        for (let i = 0; i < 2; i++) {
            this.bodies.push({
                x: width * (0.3 + i * 0.4),
                y: height * 0.5,
                vx: 0,
                vy: 0,
                mass: 5000 + Math.random() * 2000,
                radius: 20,
                hue: Math.random() * 360,
                trail: []
            });
        }
    }

    createBody() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const mass = 50 + Math.random() * 200;
        const speed = Math.sqrt(this.G * 5000 / distance) * (0.8 + Math.random() * 0.4);

        this.bodies.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            vx: -Math.sin(angle) * speed,
            vy: Math.cos(angle) * speed,
            mass: mass,
            radius: Math.sqrt(mass) * 0.5,
            hue: Math.random() * 360,
            trail: []
        });
    }

    update(dataStream) {
        const { heartRate, variance } = dataStream;

        // Heart rate affects gravitational constant and chaos
        const bpmFactor = heartRate / 75;
        const effectiveG = this.G * bpmFactor;
        const chaos = variance * 0.01;

        // Calculate forces between all bodies
        for (let i = 0; i < this.bodies.length; i++) {
            const bodyA = this.bodies[i];
            let fx = 0, fy = 0;

            for (let j = 0; j < this.bodies.length; j++) {
                if (i === j) continue;

                const bodyB = this.bodies[j];
                const dx = bodyB.x - bodyA.x;
                const dy = bodyB.y - bodyA.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                // Prevent singularities
                if (dist < 5) continue;

                // F = G * m1 * m2 / r^2
                const force = effectiveG * bodyA.mass * bodyB.mass / distSq;
                const forceX = force * dx / dist;
                const forceY = force * dy / dist;

                fx += forceX;
                fy += forceY;
            }

            // Add chaos based on heart rate variance
            fx += (Math.random() - 0.5) * chaos * bodyA.mass;
            fy += (Math.random() - 0.5) * chaos * bodyA.mass;

            // Update velocity: a = F / m
            bodyA.vx += fx / bodyA.mass;
            bodyA.vy += fy / bodyA.mass;

            // Apply drag
            bodyA.vx *= 0.99;
            bodyA.vy *= 0.99;
        }

        // Update positions and trails
        for (const body of this.bodies) {
            body.x += body.vx;
            body.y += body.vy;

            // Wrap around edges
            if (body.x < 0) body.x += this.width;
            if (body.x > this.width) body.x -= this.width;
            if (body.y < 0) body.y += this.height;
            if (body.y > this.height) body.y -= this.height;

            // Add to trail
            body.trail.push({ x: body.x, y: body.y });
            if (body.trail.length > this.maxTrailLength) {
                body.trail.shift();
            }

            // Slowly shift hue
            body.hue = (body.hue + 0.2) % 360;
        }

        // Occasionally add new body if heart rate is high
        if (heartRate > 85 && Math.random() < 0.01 && this.bodies.length < 30) {
            this.createBody();
        }

        // Remove bodies that are too far from center
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        this.bodies = this.bodies.filter(body => {
            const dx = body.x - centerX;
            const dy = body.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < Math.max(this.width, this.height) * 2;
        });
    }

    render(width, height) {
        const ctx = this.ctx;

        // Fade previous frame for trail effect
        ctx.fillStyle = 'rgba(0, 5, 16, 0.15)';
        ctx.fillRect(0, 0, width, height);

        // Draw trails
        for (const body of this.bodies) {
            if (body.trail.length < 2) continue;

            ctx.strokeStyle = `hsla(${body.hue}, 70%, 50%, 0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let i = 0; i < body.trail.length; i++) {
                const point = body.trail[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }

            ctx.stroke();
        }

        // Draw bodies with glow
        for (const body of this.bodies) {
            const intensity = Math.min(1, body.mass / 1000);

            // Outer glow
            const glowGradient = ctx.createRadialGradient(
                body.x, body.y, 0,
                body.x, body.y, body.radius * 3
            );
            glowGradient.addColorStop(0, `hsla(${body.hue}, 100%, 70%, ${0.8 * intensity})`);
            glowGradient.addColorStop(0.3, `hsla(${body.hue}, 90%, 60%, ${0.4 * intensity})`);
            glowGradient.addColorStop(1, `hsla(${body.hue}, 80%, 50%, 0)`);

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            const coreGradient = ctx.createRadialGradient(
                body.x, body.y, 0,
                body.x, body.y, body.radius
            );
            coreGradient.addColorStop(0, `hsla(${body.hue}, 100%, 90%, 1)`);
            coreGradient.addColorStop(1, `hsla(${body.hue}, 100%, 60%, 0.9)`);

            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}
