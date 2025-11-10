/**
 * AKIRA-STYLE LIGHT BEAM SYSTEM
 * Creates horizontal light beams when cards move left/right
 * Inspired by Akira motorcycle chase scenes
 */

export class LightBeamSystem {
    constructor(canvasId = 'light-beams-canvas') {
        this.canvas = document.getElementById(canvasId);
        
        // Disable if canvas not found (performance optimization)
        if (!this.canvas) {
            console.log('⚡ Light Beam System: Canvas not found, system disabled for performance');
            this.enabled = false;
            this.ctx = null;
            this.beams = [];
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.beams = [];
        this.enabled = true;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Start animation loop
        this.animate();
        
        console.log('⚡ Light Beam System initialized (Akira style)');
    }
    
    resize() {
        if (!this.canvas) {
            return;
        }
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Create horizontal light beam (Akira-style)
     * @param {string} direction - 'left' or 'right'
     * @param {number} intensity - 0-1, affects length and brightness
     */
    createBeam(direction = 'right', intensity = 1.0) {
        if (!this.enabled) {
            return;
        }
        
        const centerY = window.innerHeight / 2;
        const spread = 200; // Vertical spread of beams
        const numBeams = Math.floor(3 + intensity * 5); // More beams = higher intensity
        
        for (let i = 0; i < numBeams; i++) {
            const beam = {
                x: direction === 'right' ? 0 : window.innerWidth,
                y: centerY + (Math.random() - 0.5) * spread,
                length: 100 + Math.random() * 300 * intensity,
                width: 1 + Math.random() * 3,
                speed: (15 + Math.random() * 25) * intensity,
                direction: direction === 'right' ? 1 : -1,
                opacity: 0.6 + Math.random() * 0.4,
                color: this.getBeamColor(),
                decay: 0.015 + Math.random() * 0.01,
                life: 1.0
            };
            
            this.beams.push(beam);
        }
    }
    
    /**
     * Create vertical beams for layer navigation
     * @param {string} direction - 'up' or 'down'
     * @param {number} intensity - 0-1
     */
    createVerticalBeam(direction = 'down', intensity = 1.0) {
        if (!this.enabled) {
            return;
        }
        
        const centerX = window.innerWidth / 2;
        const spread = 300;
        const numBeams = Math.floor(2 + intensity * 4);
        
        for (let i = 0; i < numBeams; i++) {
            const beam = {
                x: centerX + (Math.random() - 0.5) * spread,
                y: direction === 'down' ? 0 : window.innerHeight,
                length: 80 + Math.random() * 200 * intensity,
                width: 1 + Math.random() * 2,
                speed: (12 + Math.random() * 20) * intensity,
                direction: direction === 'down' ? 1 : -1,
                opacity: 0.5 + Math.random() * 0.3,
                color: this.getVerticalBeamColor(),
                decay: 0.02 + Math.random() * 0.01,
                life: 1.0,
                vertical: true
            };
            
            this.beams.push(beam);
        }
    }
    
    /**
     * Get beam color (cyan/magenta Akira palette)
     */
    getBeamColor() {
        const colors = [
            'rgba(0, 255, 255, ',     // Cyan
            'rgba(255, 0, 255, ',     // Magenta
            'rgba(0, 200, 255, ',     // Light blue
            'rgba(255, 100, 200, ',   // Pink
            'rgba(255, 255, 255, '    // White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Get vertical beam color (purple/pink palette)
     */
    getVerticalBeamColor() {
        const colors = [
            'rgba(255, 0, 255, ',     // Magenta
            'rgba(200, 0, 255, ',     // Purple
            'rgba(255, 100, 255, ',   // Pink
            'rgba(150, 50, 255, '     // Deep purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Update all beams
     */
    update() {
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const beam = this.beams[i];
            
            // Move beam
            if (beam.vertical) {
                beam.y += beam.speed * beam.direction;
            } else {
                beam.x += beam.speed * beam.direction;
            }
            
            // Decay life
            beam.life -= beam.decay;
            
            // Remove dead beams
            if (beam.life <= 0 || 
                beam.x < -beam.length || beam.x > window.innerWidth + beam.length ||
                beam.y < -beam.length || beam.y > window.innerHeight + beam.length) {
                this.beams.splice(i, 1);
            }
        }
    }
    
    /**
     * Render all beams
     */
    render() {
        if (!this.ctx || !this.canvas) {
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const beam of this.beams) {
            const alpha = beam.opacity * beam.life;
            
            // Create gradient for beam trail
            const gradient = beam.vertical
                ? this.ctx.createLinearGradient(beam.x, beam.y, beam.x, beam.y + beam.length * beam.direction)
                : this.ctx.createLinearGradient(beam.x, beam.y, beam.x + beam.length * beam.direction, beam.y);
            
            gradient.addColorStop(0, beam.color + alpha + ')');
            gradient.addColorStop(0.5, beam.color + (alpha * 0.6) + ')');
            gradient.addColorStop(1, beam.color + '0)');
            
            // Draw beam
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = beam.width;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            if (beam.vertical) {
                this.ctx.moveTo(beam.x, beam.y);
                this.ctx.lineTo(beam.x, beam.y + beam.length * beam.direction);
            } else {
                this.ctx.moveTo(beam.x, beam.y);
                this.ctx.lineTo(beam.x + beam.length * beam.direction, beam.y);
            }
            this.ctx.stroke();
            
            // Add glow effect
            if (beam.life > 0.7) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = beam.color + (alpha * 0.8) + ')';
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.enabled || !this.ctx) {
            return;
        }
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Enable/disable system
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.beams = [];
        }
    }
    
    /**
     * Clear all beams
     */
    clear() {
        this.beams = [];
    }
}
