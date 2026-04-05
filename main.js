import './style.css'

// Spiral Galaxy Loader Logic (Ported from SpiralAnimation React)
class Vector2D {
    constructor(x, y) { this.x = x; this.y = y; }
    static random(min, max) { return min + Math.random() * (max - min); }
}

class Vector3D {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    static random(min, max) { return min + Math.random() * (max - min); }
}

class Star {
    constructor(cameraZ, cameraTravelDistance) {
        this.angle = Math.random() * Math.PI * 2;
        this.distance = 30 * Math.random() + 15;
        this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
        this.expansionRate = 1.2 + Math.random() * 0.8;
        this.finalScale = 0.7 + Math.random() * 0.6;
        this.dx = this.distance * Math.cos(this.angle);
        this.dy = this.distance * Math.sin(this.angle);
        this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
        this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ);
        const lerp = (start, end, t) => start * (1 - t) + end * t;
        this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation);
        this.strokeWeightFactor = Math.pow(Math.random(), 2.0);
    }

    render(p, controller) {
        const spiralPos = controller.spiralPath(this.spiralLocation);
        const q = p - this.spiralLocation;
        if (q > 0) {
            const displacementProgress = controller.constrain(4 * q, 0, 1);
            const linearEasing = displacementProgress;
            const elasticEasing = controller.easeOutElastic(displacementProgress);
            const powerEasing = Math.pow(displacementProgress, 2);
            let easing;
            if (displacementProgress < 0.3) easing = controller.lerp(linearEasing, powerEasing, displacementProgress / 0.3);
            else if (displacementProgress < 0.7) easing = controller.lerp(powerEasing, elasticEasing, (displacementProgress - 0.3) / 0.4);
            else easing = elasticEasing;

            let screenX, screenY;
            if (displacementProgress < 0.3) {
                screenX = controller.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3);
                screenY = controller.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3);
            } else if (displacementProgress < 0.7) {
                const midProgress = (displacementProgress - 0.3) / 0.4;
                const curveStrength = Math.sin(midProgress * Math.PI) * this.rotationDirection * 1.5;
                const baseX = spiralPos.x + this.dx * 0.3, baseY = spiralPos.y + this.dy * 0.3;
                const targetX = spiralPos.x + this.dx * 0.7, targetY = spiralPos.y + this.dy * 0.7;
                const perpX = -this.dy * 0.4 * curveStrength, perpY = this.dx * 0.4 * curveStrength;
                screenX = controller.lerp(baseX, targetX, midProgress) + perpX * midProgress;
                screenY = controller.lerp(baseY, targetY, midProgress) + perpY * midProgress;
            } else {
                const finalProgress = (displacementProgress - 0.7) / 0.3;
                const baseX = spiralPos.x + this.dx * 0.7, baseY = spiralPos.y + this.dy * 0.7;
                const targetDistance = this.distance * this.expansionRate * 1.5;
                const spiralAngle = this.angle + 1.2 * this.rotationDirection * finalProgress * Math.PI;
                screenY = controller.lerp(baseY, spiralPos.y + targetDistance * Math.sin(spiralAngle), finalProgress);
                screenX = controller.lerp(baseX, spiralPos.x + targetDistance * Math.cos(spiralAngle), finalProgress);
            }

            const position = new Vector3D((this.z - controller.cameraZ) * screenX / controller.viewZoom, (this.z - controller.cameraZ) * screenY / controller.viewZoom, this.z);
            let sizeMultiplier = displacementProgress < 0.6 ? 1.0 + displacementProgress * 0.2 : 1.2 * (1.0 - (displacementProgress - 0.6) / 0.4) + this.finalScale * ((displacementProgress - 0.6) / 0.4);
            controller.showProjectedDot(position, 8.5 * this.strokeWeightFactor * sizeMultiplier);
        }
    }
}

class AnimationController {
    constructor(canvas, ctx, size) {
        this.canvas = canvas; this.ctx = ctx; this.size = size;
        this.time = 0; this.stars = [];
        this.changeEventTime = 0.32; this.cameraZ = -400; this.cameraTravelDistance = 3400;
        this.startDotYOffset = 28; this.viewZoom = 100; this.numberOfStars = 2000; this.trailLength = 60;
        for (let i = 0; i < this.numberOfStars; i++) this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));
        this.timeline = gsap.timeline({ repeat: -1 })
            .to(this, { time: 1, duration: 12, repeat: -1, ease: "none", onUpdate: () => this.render() });
    }

    constrain(v, min, max) { return Math.min(Math.max(v, min), max); }
    map(v, s1, st1, s2, st2) { return s2 + (st2 - s2) * ((v - s1) / (st1 - s1)); }
    lerp(s, e, t) { return s * (1 - t) + e * t; }
    ease(p, g) { return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g); }
    easeOutElastic(x) { return x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * ((2 * Math.PI) / 4.5)) + 1; }
    
    spiralPath(p) {
        p = this.ease(this.constrain(1.2 * p, 0, 1), 1.8);
        const theta = 2 * Math.PI * 6 * Math.sqrt(p);
        const r = 170 * Math.sqrt(p);
        return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset);
    }

    rotate(v1, v2, p, orientation) {
        const middle = new Vector2D((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
        const dx = v1.x - middle.x, dy = v1.y - middle.y;
        const angle = Math.atan2(dy, dx), o = orientation ? -1 : 1, r = Math.sqrt(dx * dx + dy * dy);
        const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p);
        return new Vector2D(middle.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(p)), middle.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(p)));
    }

    showProjectedDot(pos, sizeFact) {
        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
        const newCZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance;
        if (pos.z > newCZ) {
            const depth = pos.z - newCZ;
            const x = this.viewZoom * pos.x / depth, y = this.viewZoom * pos.y / depth;
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(x, y, (400 * sizeFact / depth) / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    render() {
        this.ctx.fillStyle = 'black'; this.ctx.fillRect(0, 0, this.size, this.size);
        this.ctx.save(); this.ctx.translate(this.size / 2, this.size / 2);
        const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1);
        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
        this.ctx.rotate(-Math.PI * this.ease(t2, 2.7));
        for (let i = 0; i < this.trailLength; i++) {
            const f = this.map(i, 0, this.trailLength, 1.1, 0.1), sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
            const p = this.spiralPath(t1 - 0.00015 * i);
            const rotated = this.rotate(p, new Vector2D(p.x + 5, p.y + 5), Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, i % 2 === 0);
            this.ctx.fillStyle = 'white'; this.ctx.beginPath(); this.ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2); this.ctx.fill();
        }
        for (const star of this.stars) star.render(t1, this);
        this.ctx.restore();
    }
}

// DotGrid Interaction Logic
class DotGrid {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            dotSize: 5,
            gap: 15,
            baseColor: '#1a1a1a',
            activeColor: '#ffffff',
            proximity: 120,
            resistance: 750,
            returnDuration: 1.5,
            ...options
        };
        this.dots = [];
        this.pointer = { x: 0, y: 0 };
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.render();
    }

    resize() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = parent.clientWidth * dpr;
        this.canvas.height = parent.clientHeight * dpr;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.ctx.scale(dpr, dpr);
        this.buildGrid();
    }

    buildGrid() {
        const { dotSize, gap } = this.options;
        const cell = dotSize + gap;
        const cols = Math.floor((this.canvas.width / (window.devicePixelRatio || 1)) / cell);
        const rows = Math.floor((this.canvas.height / (window.devicePixelRatio || 1)) / cell);
        
        this.dots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.dots.push({
                    cx: x * cell + cell / 2,
                    cy: y * cell + cell / 2,
                    xOffset: 0,
                    yOffset: 0,
                    active: false
                });
            }
        }
    }

    updatePointer(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = x - rect.left;
        this.pointer.y = y - rect.top;

        const { proximity, returnDuration } = this.options;
        this.dots.forEach(dot => {
            const dx = dot.cx - this.pointer.x;
            const dy = dot.cy - this.pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < proximity && !dot.active) {
                dot.active = true;
                const pushX = (dx / dist) * 15;
                const pushY = (dy / dist) * 15;
                
                gsap.to(dot, {
                    xOffset: pushX,
                    yOffset: pushY,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(dot, {
                            xOffset: 0,
                            yOffset: 0,
                            duration: returnDuration,
                            ease: "elastic.out(1, 0.3)",
                            onComplete: () => { dot.active = false; }
                        });
                    }
                });
            }
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const { dotSize, baseColor, activeColor, proximity } = this.options;

        this.dots.forEach(dot => {
            const dx = dot.cx - this.pointer.x;
            const dy = dot.cy - this.pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            this.ctx.beginPath();
            this.ctx.arc(dot.cx + dot.xOffset, dot.cy + dot.yOffset, dotSize / 2, 0, Math.PI * 2);
            
            if (dist < proximity) {
                const t = 1 - dist / proximity;
                this.ctx.fillStyle = activeColor;
                this.ctx.globalAlpha = 0.2 + t * 0.8;
            } else {
                this.ctx.fillStyle = baseColor;
                this.ctx.globalAlpha = 0.3;
            }
            
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.render());
    }
}

// Global DotGrid instances
const dotGrids = [];

const initDotGrids = () => {
    document.querySelectorAll('.dot-grid-canvas').forEach(canvas => {
        dotGrids.push(new DotGrid(canvas));
    });
};

// Initialization
const initSpiralLoader = () => {
    const canvas = document.getElementById('spiral-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = '100vw'; canvas.style.height = '100vh';
    ctx.scale(dpr, dpr);
    const controller = new AnimationController(canvas, ctx, size);
    
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => { 
                loader.remove(); 
                controller.timeline.kill(); 
            }, 1000);
        }
    });
};

initSpiralLoader();
initDotGrids();

// Typewriter Implementation (Vanilla JS)
class Typewriter {
    constructor(id, options = {}) {
        this.el = document.getElementById(id);
        if (!this.el) return;
        this.texts = options.texts || [];
        this.speed = options.speed || 100;
        this.waitTime = options.waitTime || 1500;
        this.deleteSpeed = options.deleteSpeed || 50;
        this.cursorChar = options.cursorChar || '_';
        this.loop = options.loop !== undefined ? options.loop : true;
        
        this.textIdx = 0;
        this.charIdx = 0;
        this.isDeleting = false;
        
        // Add cursor
        this.el.innerHTML = `<span></span><span class="typewriter-cursor">${this.cursorChar}</span>`;
        this.textSpan = this.el.querySelector('span');
        this.cursorSpan = this.el.querySelector('.typewriter-cursor');
        
        // GSAP Cursor Animation (Blinking)
        gsap.to(this.cursorSpan, { opacity: 0, duration: 0.1, repeat: -1, repeatDelay: 0.4, yoyo: true });
        
        this.type();
    }

    type() {
        const fullText = this.texts[this.textIdx];
        
        if (this.isDeleting) {
            this.textSpan.textContent = fullText.substring(0, this.charIdx - 1);
            this.charIdx--;
        } else {
            this.textSpan.textContent = fullText.substring(0, this.charIdx + 1);
            this.charIdx++;
        }

        let delta = this.isDeleting ? this.deleteSpeed : this.speed;

        if (!this.isDeleting && this.charIdx === fullText.length) {
            delta = this.waitTime;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIdx === 0) {
            this.isDeleting = false;
            this.textIdx = (this.textIdx + 1) % this.texts.length;
            delta = 500; // brief pause before next word
        }

        setTimeout(() => this.type(), delta);
    }
}

// Initialize Hero Typewriter
new Typewriter('hero-typewriter', {
    texts: [
        "build",
        "implement",
        "change",
        "impact",
        "replace"
    ],
    speed: 70,
    waitTime: 2000,
    deleteSpeed: 40,
    cursorChar: "_"
});

// WhatsApp Form Redirect Logic
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const project = formData.get('project');
        
        const message = `Hello Khan Steel!%0A%0A*New Enquiry Received*%0A------------------%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Project Interest:* ${project}%0A------------------%0AI would like to discuss a potential project.`;
        
        const whatsappUrl = `https://wa.me/918936993790?text=${message}`;
        
        // Premium transition effect or direct redirect
        window.open(whatsappUrl, '_blank');
    });
}

// Spotlight Sync Logic
const syncPointer = (e) => {
    const { clientX: x, clientY: y } = e;
    document.documentElement.style.setProperty('--x', x.toFixed(2));
    document.documentElement.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
    document.documentElement.style.setProperty('--y', y.toFixed(2));
    document.documentElement.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    
    dotGrids.forEach(grid => grid.updatePointer(x, y));
};

document.addEventListener('pointermove', syncPointer);
document.addEventListener('touchstart', (e) => syncPointer(e.touches[0]));

// Interactive Map Initialization (Leaflet.js - Free & No-Key Required)
window.initMap = function() {
    const khanSteelLocation = [25.2976602, 82.9780176];
    const mapElements = document.querySelectorAll('.gmap-container');
    
    mapElements.forEach(container => {
        // Clear placeholder
        container.innerHTML = '';
        
        const map = L.map(container, {
            center: khanSteelLocation,
            zoom: 16,
            zoomControl: false,
            dragging: !L.Browser.mobile,
            touchZoom: L.Browser.mobile,
            scrollWheelZoom: false
        });

        // Use a clean, dark-mode friendly tile set (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Custom Marker
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="relative w-8 h-8">
                    <div class="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                    <div class="absolute inset-1 bg-white rounded-full border-4 border-black"></div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker(khanSteelLocation, { icon }).addTo(map);

        marker.bindPopup(`
            <div style="background: #000; color: #fff; padding: 12px; border-radius: 8px; font-family: 'Syne', sans-serif;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 1px;">KHAN STEEL</h3>
                <p style="margin: 4px 0 0; font-size: 10px; color: #888; text-transform: uppercase;">Plant Location</p>
            </div>
        `, {
            className: 'custom-popup',
            closeButton: false
        }).openPopup();

        // Add zoom control manually to top-right
        L.control.zoom({ position: 'topright' }).addTo(map);
    });
};

// Check if Leaflet is already loaded, otherwise wait for it or trigger manually
if (typeof L !== 'undefined') {
    window.initMap();
}

console.log('Khan Steel Household Platform Initialized')
