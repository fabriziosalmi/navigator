/**
 * VisualEffects.js
 * Blade Runner/Akira aesthetic effects
 * - Light Trails (scie luminose)
 * - Data Streams (flussi di dati visibili)
 * - Ripple effects
 */

export class VisualEffects {
    constructor() {
        this.trailsCanvas = null;
        this.trailsCtx = null;
        this.streamsCanvas = null;
        this.streamsCtx = null;
        
        this.trails = [];
        this.streams = [];
        this.ripples = [];
        
        // Kamehameha Focus mode
        this.focusBeam = null;
        this.focusParticles = [];
        
        // Singularity mode
        this.singularityPoint = null;
        this.singularityParticles = [];
        
        // Hand Aura system
        this.handAura = {
            particles: [],
            x: 0,
            y: 0,
            mode: 'navigation', // navigation, point, pinch, focus
            active: false
        };
        
        this.enabled = true;
        this.animationFrame = null;
        
        this.init();
    }

    init() {
        // Setup Light Trails Canvas
        this.trailsCanvas = document.getElementById('light-trails-canvas');
        this.streamsCanvas = document.getElementById('data-streams-canvas');
        
        if (!this.trailsCanvas || !this.streamsCanvas) {
            console.error('Visual effects canvases not found');
            return;
        }

        this.trailsCtx = this.trailsCanvas.getContext('2d', { alpha: true });
        this.streamsCtx = this.streamsCanvas.getContext('2d', { alpha: true });
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.startAnimation();
        
        console.log('VisualEffects initialized - Blade Runner mode activated');
    }

    resize() {
        if (!this.trailsCanvas || !this.streamsCanvas) return;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        
        // Light Trails Canvas
        this.trailsCanvas.width = w * dpr;
        this.trailsCanvas.height = h * dpr;
        this.trailsCanvas.style.width = w + 'px';
        this.trailsCanvas.style.height = h + 'px';
        this.trailsCtx.scale(dpr, dpr);
        
        // Data Streams Canvas
        this.streamsCanvas.width = w * dpr;
        this.streamsCanvas.height = h * dpr;
        this.streamsCanvas.style.width = w + 'px';
        this.streamsCanvas.style.height = h + 'px';
        this.streamsCtx.scale(dpr, dpr);
    }

    /**
     * Add light trail (Akira/Tron style)
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} vx - Velocity X
     * @param {number} vy - Velocity Y
     * @param {string} color - Trail color
     */
    addLightTrail(x, y, vx, vy, color = '#00ffff') {
        const trail = {
            points: [{ x, y, life: 1 }],
            vx,
            vy,
            color,
            maxLength: 30,
            life: 1,
            decayRate: 0.015
        };
        
        this.trails.push(trail);
    }

    /**
     * Create data stream (fascio di particelle che viaggia verso target)
     * @param {number} startX - Start X
     * @param {number} startY - Start Y
     * @param {number} targetX - Target X
     * @param {number} targetY - Target Y
     * @param {string} color - Stream color
     * @param {Function} onComplete - Callback when stream reaches target
     */
    createDataStream(startX, startY, targetX, targetY, color = '#00ff00', onComplete = null) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = distance / 500; // pixels per second
        
        const stream = {
            particles: [],
            startX,
            startY,
            targetX,
            targetY,
            color,
            progress: 0,
            duration,
            speed: 1 / (duration * 60), // per frame at 60fps
            onComplete,
            particleCount: 20
        };
        
        // Create particles along the path
        for (let i = 0; i < stream.particleCount; i++) {
            stream.particles.push({
                offset: i / stream.particleCount,
                life: 1,
                size: 2 + Math.random() * 3
            });
        }
        
        this.streams.push(stream);
    }

    /**
     * Create ripple effect on card (impact visual)
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {string} color - Ripple color
     */
    createRipple(x, y, color = '#0ff') {
        this.ripples.push({
            x,
            y,
            radius: 0,
            maxRadius: 150,
            life: 1,
            color,
            speed: 5,
            decayRate: 0.02
        });
    }

    /**
     * Update and render light trails
     */
    updateTrails() {
        if (!this.trailsCtx) return;
        
        const ctx = this.trailsCtx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Fade out previous frame (creates trail effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);
        
        // Update and draw trails
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            
            // Add new point
            const lastPoint = trail.points[trail.points.length - 1];
            trail.points.push({
                x: lastPoint.x + trail.vx,
                y: lastPoint.y + trail.vy,
                life: trail.life
            });
            
            // Remove old points
            if (trail.points.length > trail.maxLength) {
                trail.points.shift();
            }
            
            // Draw trail
            ctx.strokeStyle = trail.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            trail.points.forEach((point, index) => {
                const alpha = (point.life * (index / trail.points.length)).toFixed(2);
                ctx.globalAlpha = alpha;
                
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            // Decay trail
            trail.life -= trail.decayRate;
            trail.points.forEach(p => p.life -= trail.decayRate);
            
            // Remove dead trails
            if (trail.life <= 0) {
                this.trails.splice(i, 1);
            }
        }
    }

    /**
     * Update and render data streams
     */
    updateStreams() {
        if (!this.streamsCtx) return;
        
        const ctx = this.streamsCtx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Update and draw streams
        for (let i = this.streams.length - 1; i >= 0; i--) {
            const stream = this.streams[i];
            
            stream.progress += stream.speed;
            
            // Draw particles
            stream.particles.forEach(particle => {
                const particleProgress = Math.min(1, Math.max(0, stream.progress - particle.offset));
                
                if (particleProgress > 0 && particleProgress < 1) {
                    const x = stream.startX + (stream.targetX - stream.startX) * particleProgress;
                    const y = stream.startY + (stream.targetY - stream.startY) * particleProgress;
                    
                    ctx.fillStyle = stream.color;
                    ctx.globalAlpha = particle.life * (1 - particleProgress);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add glow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = stream.color;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
            
            ctx.globalAlpha = 1;
            
            // Check completion
            if (stream.progress >= 1.5) {
                if (stream.onComplete) {
                    stream.onComplete();
                }
                this.streams.splice(i, 1);
            }
        }
    }

    /**
     * Update and render ripples
     */
    updateRipples() {
        if (!this.streamsCtx) return;
        
        const ctx = this.streamsCtx;
        
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            
            ripple.radius += ripple.speed;
            ripple.life -= ripple.decayRate;
            
            // Draw ripple
            ctx.strokeStyle = ripple.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = ripple.life;
            
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner ripple
            ctx.globalAlpha = ripple.life * 0.5;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            
            // Remove dead ripples
            if (ripple.life <= 0 || ripple.radius >= ripple.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }

    /**
     * Animation loop
     */
    startAnimation() {
        const animate = () => {
            if (!this.enabled) return;
            
            this.updateTrails();
            this.updateStreams();
            this.updateRipples();
            this.updateKamehamehaFocus();
            this.updateSingularity();
            this.updateHandAura();
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * Stop animation
     */
    stop() {
        this.enabled = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * Clear all effects
     */
    clear() {
        this.trails = [];
        this.streams = [];
        this.ripples = [];
        this.focusBeam = null;
        this.focusParticles = [];
        this.singularityPoint = null;
        this.singularityParticles = [];
        
        if (this.trailsCtx) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.trailsCtx.clearRect(0, 0, w, h);
        }
        
        if (this.streamsCtx) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.streamsCtx.clearRect(0, 0, w, h);
        }
    }

    /**
     * KAMEHAMEHA FOCUS MODE
     * Create converging particles and beam from finger to card
     */
    startKamehamehaFocus(fingerX, fingerY, cardX, cardY) {
        this.focusBeam = {
            fingerX,
            fingerY,
            cardX,
            cardY,
            intensity: 0,
            maxIntensity: 1,
            growthRate: 0.05
        };

        // Create ambient particles that converge
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 300;
            const startX = cardX + Math.cos(angle) * distance;
            const startY = cardY + Math.sin(angle) * distance;

            this.focusParticles.push({
                x: startX,
                y: startY,
                targetX: cardX,
                targetY: cardY,
                speed: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                life: 1
            });
        }
    }

    updateKamehamehaFocus() {
        if (!this.focusBeam && this.focusParticles.length === 0) return;

        const ctx = this.streamsCtx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Draw beam from finger to card
        if (this.focusBeam) {
            const beam = this.focusBeam;
            
            // Grow intensity
            beam.intensity = Math.min(beam.maxIntensity, beam.intensity + beam.growthRate);

            // Draw main beam
            const gradient = ctx.createLinearGradient(
                beam.fingerX, beam.fingerY,
                beam.cardX, beam.cardY
            );
            gradient.addColorStop(0, `rgba(0, 255, 255, ${beam.intensity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 0, 255, ${beam.intensity})`);
            gradient.addColorStop(1, `rgba(255, 255, 0, ${beam.intensity * 0.8})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 5 * beam.intensity;
            ctx.shadowBlur = 20 * beam.intensity;
            ctx.shadowColor = '#0ff';

            ctx.beginPath();
            ctx.moveTo(beam.fingerX, beam.fingerY);
            ctx.lineTo(beam.cardX, beam.cardY);
            ctx.stroke();

            // Draw glow around beam
            ctx.globalAlpha = beam.intensity * 0.3;
            ctx.lineWidth = 15 * beam.intensity;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        // Update and draw converging particles
        for (let i = this.focusParticles.length - 1; i >= 0; i--) {
            const p = this.focusParticles[i];

            // Move towards target
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            p.x += dx * p.speed;
            p.y += dy * p.speed;

            // Draw particle
            ctx.fillStyle = `rgba(0, 255, 255, ${p.life})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Check if reached target
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                this.focusParticles.splice(i, 1);
            }
        }
    }

    stopKamehamehaFocus() {
        this.focusBeam = null;
        this.focusParticles = [];
    }

    /**
     * SINGULARITY MODE
     * Collapse all cards to a single point, then explode
     */
    startSingularityCollapse(handX, handY, cardPositions) {
        this.singularityPoint = {
            x: handX,
            y: handY,
            collapsed: false,
            particles: []
        };

        // Create particles from each card position
        cardPositions.forEach(cardPos => {
            for (let i = 0; i < 10; i++) {
                const offsetX = (Math.random() - 0.5) * 50;
                const offsetY = (Math.random() - 0.5) * 50;

                this.singularityParticles.push({
                    x: cardPos.x + offsetX,
                    y: cardPos.y + offsetY,
                    startX: cardPos.x + offsetX,
                    startY: cardPos.y + offsetY,
                    targetX: handX,
                    targetY: handY,
                    speed: 0.05 + Math.random() * 0.05,
                    size: 2 + Math.random() * 3,
                    life: 1,
                    color: cardPos.color || '#0ff',
                    phase: 'collapse'
                });
            }
        });
    }

    startSingularityExplosion(gridPositions) {
        if (!this.singularityPoint) return;

        const center = this.singularityPoint;

        // Redistribute particles to grid positions
        const particlesPerCard = Math.floor(this.singularityParticles.length / gridPositions.length);

        gridPositions.forEach((gridPos, index) => {
            const startIdx = index * particlesPerCard;
            const endIdx = startIdx + particlesPerCard;

            for (let i = startIdx; i < endIdx && i < this.singularityParticles.length; i++) {
                const p = this.singularityParticles[i];
                p.targetX = gridPos.x + (Math.random() - 0.5) * 50;
                p.targetY = gridPos.y + (Math.random() - 0.5) * 50;
                p.phase = 'explode';
                p.speed = 0.08 + Math.random() * 0.08;
                p.x = center.x;
                p.y = center.y;
            }
        });
    }

    updateSingularity() {
        if (this.singularityParticles.length === 0) return;

        const ctx = this.streamsCtx;

        // Update and draw particles
        for (let i = this.singularityParticles.length - 1; i >= 0; i--) {
            const p = this.singularityParticles[i];

            // Move towards target
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            p.x += dx * p.speed;
            p.y += dy * p.speed;

            // Draw particle with trail
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Check if reached target
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                if (p.phase === 'explode') {
                    this.singularityParticles.splice(i, 1);
                }
            }
        }

        // Draw singularity core
        if (this.singularityPoint && this.singularityParticles.some(p => p.phase === 'collapse')) {
            const core = this.singularityPoint;
            const pulseSize = 10 + Math.sin(Date.now() / 100) * 5;

            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#0ff';
            ctx.globalAlpha = 0.8;
            
            ctx.beginPath();
            ctx.arc(core.x, core.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    stopSingularity() {
        this.singularityPoint = null;
        this.singularityParticles = [];
    }

    /**
     * HAND AURA SYSTEM
     * Visual feedback showing current interaction mode
     */
    updateHandPosition(x, y, mode = 'navigation') {
        this.handAura.x = x;
        this.handAura.y = y;
        this.handAura.mode = mode;
        this.handAura.active = true;

        // Generate new particles around hand
        const particleCount = mode === 'pinch' ? 3 : mode === 'focus' ? 5 : 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const speedMult = mode === 'focus' ? 2 : 1;

            this.handAura.particles.push({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * speedMult,
                vy: (Math.random() - 0.5) * speedMult,
                life: 1,
                size: 2 + Math.random() * 2,
                color: this.getAuraColor(mode)
            });
        }

        // Limit particle count
        if (this.handAura.particles.length > 100) {
            this.handAura.particles.splice(0, this.handAura.particles.length - 100);
        }
    }

    getAuraColor(mode) {
        switch (mode) {
            case 'navigation': return '#00aaff'; // Blue calm
            case 'point': return '#ffffff';      // White concentrated
            case 'pinch': return '#ffdd00';      // Yellow flowing
            case 'focus': return '#aa00ff';      // Purple vortex
            default: return '#00ffff';
        }
    }

    updateHandAura() {
        if (!this.handAura.active || this.handAura.particles.length === 0) return;

        const ctx = this.streamsCtx;

        for (let i = this.handAura.particles.length - 1; i >= 0; i--) {
            const p = this.handAura.particles[i];

            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Fade out
            p.life -= 0.02;

            // Draw particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * 0.6;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Remove dead particles
            if (p.life <= 0) {
                this.handAura.particles.splice(i, 1);
            }
        }

        // Draw aura glow around hand position
        if (this.handAura.mode === 'focus') {
            const pulseSize = 15 + Math.sin(Date.now() / 200) * 5;
            ctx.fillStyle = this.getAuraColor(this.handAura.mode);
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.getAuraColor(this.handAura.mode);

            ctx.beginPath();
            ctx.arc(this.handAura.x, this.handAura.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    deactivateHandAura() {
        this.handAura.active = false;
    }
}

export default VisualEffects;
