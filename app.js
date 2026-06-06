/* ==========================================================================
   INTERACTIVE LOGIC AND GRAPHICS CONTROLLERS - app.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Logon screen lock
    initLogonScreen();

    // Navigation routing, widgets, canvases
    initNavigation();
    initWidgets();
    initBackgroundCanvas();
    
    // Audio synthesis engine & visualizers
    initAudioEngine();
    initMidiVisualizer();
    
    // Form and modals
    initContactForm();
});

/* ==========================================================================
   NAVIGATION ROUTING
   ========================================================================== */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Transition sections
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    // Trigger reflow for transition
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(15px)';
                    setTimeout(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    section.classList.remove('active');
                }
            });
            
            // Adjust header style based on section
            const header = document.getElementById('main-header');
            if (targetId !== 'welcome') {
                header.style.width = '95%';
                header.style.top = '10px';
            } else {
                header.style.width = '90%';
                header.style.top = '15px';
            }
        });
    });

    // Handle hash links if any
    const hash = window.location.hash.substring(1);
    if (hash) {
        const matchingBtn = document.querySelector(`.nav-btn[data-target="${hash}"]`);
        if (matchingBtn) matchingBtn.click();
    }
}

/* ==========================================================================
   DESKTOP WIDGETS
   ========================================================================== */
function initWidgets() {
    // 1. Working Analog Clock
    const hourHand = document.getElementById('clock-hour');
    const minuteHand = document.getElementById('clock-minute');
    const secondHand = document.getElementById('clock-second');
    
    function updateClock() {
        const now = new Date();
        const hr = now.getHours();
        const min = now.getMinutes();
        const sec = now.getSeconds();
        const ms = now.getMilliseconds();
        
        // Use smooth transitions for hands
        const hrDeg = ((hr % 12) * 30) + (min * 0.5);
        const minDeg = (min * 6) + (sec * 0.1);
        const secDeg = (sec * 6) + (ms * 0.006); // Smooth sweep seconds
        
        hourHand.style.transform = `rotate(${hrDeg}deg)`;
        minuteHand.style.transform = `rotate(${minDeg}deg)`;
        secondHand.style.transform = `rotate(${secDeg}deg)`;
    }
    
    setInterval(updateClock, 30);
    updateClock();

    // 2. CPU & Memory fluctuations
    const cpuRing = document.getElementById('cpu-ring');
    const memRing = document.getElementById('mem-ring');
    const cpuValueText = document.getElementById('cpu-value');
    const memValueText = document.getElementById('mem-value');
    
    const maxOffset = 188.4; // 2 * PI * r (r=30)
    let currentCpu = 15;
    let currentMem = 35;
    
    function updateProgressRing(ring, percent) {
        const offset = maxOffset - (percent / 100) * maxOffset;
        ring.style.strokeDashoffset = offset;
    }
    
    function simulateMetrics() {
        // Base fluctuation
        const targetCpu = Math.floor(10 + Math.random() * 25);
        const targetMem = Math.floor(30 + Math.random() * 10);
        
        // Interpolate slowly
        currentCpu += (targetCpu - currentCpu) * 0.15;
        currentMem += (targetMem - currentMem) * 0.15;
        
        cpuValueText.textContent = `${Math.round(currentCpu)}%`;
        memValueText.textContent = `${Math.round(currentMem)}%`;
        
        updateProgressRing(cpuRing, currentCpu);
        updateProgressRing(memRing, currentMem);
    }
    
    setInterval(simulateMetrics, 1000);
    simulateMetrics();
}

/* ==========================================================================
   BACKGROUND FLOATING AERO BUBBLE CANVAS
   ========================================================================== */
let globalSpawnBurst = null; // Allows contact form to spawn burst

function initBackgroundCanvas() {
    const canvas = document.getElementById('bubble-canvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const bubbles = [];
    const maxBubbles = 45;
    
    const mouse = { x: -1000, y: -1000, active: false };
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });
    
    window.addEventListener('mouseleave', () => {
        mouse.active = false;
    });
    
    class Bubble {
        constructor(isBurst = false, originX = 0, originY = 0) {
            this.reset(isBurst, originX, originY);
        }
        
        reset(isBurst = false, originX = 0, originY = 0) {
            this.r = Math.random() * 28 + 6;
            this.x = isBurst ? originX : Math.random() * width;
            this.y = isBurst ? originY : height + this.r + Math.random() * 200;
            
            // Floating velocities
            this.vy = -(Math.random() * 0.9 + 0.4);
            this.vx = Math.random() * 0.6 - 0.3;
            
            if (isBurst) {
                // Shoot out in direction
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.r = Math.random() * 12 + 4;
            }
            
            // Frutiger Aero high-saturated color tints
            const colors = [
                'rgba(0, 188, 255, ',   // Sky blue
                'rgba(118, 185, 0, ',   // Lime green
                'rgba(0, 242, 254, ',   // Teal
                'rgba(255, 255, 255, '  // Pure white
            ];
            this.colorBase = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = Math.random() * 0.25 + 0.15;
            this.decay = isBurst ? Math.random() * 0.01 + 0.005 : 0;
            
            // Oscillation path
            this.wobbleSpeed = Math.random() * 0.02 + 0.01;
            this.wobbleRange = Math.random() * 2;
            this.wobbleAngle = Math.random() * Math.PI;
        }
        
        update() {
            this.y += this.vy;
            this.x += this.vx;
            
            // Decelerate bursts
            if (this.decay > 0) {
                this.vx *= 0.97;
                this.vy *= 0.97;
                this.alpha -= this.decay;
                if (this.alpha <= 0) return false;
            } else {
                // Wave movement wobble
                this.wobbleAngle += this.wobbleSpeed;
                this.x += Math.sin(this.wobbleAngle) * (this.wobbleRange * 0.08);
            }
            
            // Deflection/Repulsion from mouse
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                const limit = 150;
                
                if (dist < limit) {
                    const force = (limit - dist) / limit;
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * force * 3;
                    this.y += Math.sin(angle) * force * 3;
                }
            }
            
            // Recycle standard bubbles reaching top
            if (this.decay === 0 && this.y < -this.r) {
                this.reset();
            }
            return true;
        }
        
        draw() {
            // Shadow
            ctx.shadowColor = 'rgba(0, 120, 215, 0.05)';
            ctx.shadowBlur = 8;
            
            // Body gradient (Frutiger Aero glossy bubble)
            const grad = ctx.createRadialGradient(
                this.x - this.r * 0.35, this.y - this.r * 0.35, this.r * 0.1,
                this.x, this.y, this.r
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, this.colorBase + this.alpha + ')');
            grad.addColorStop(0.9, this.colorBase + (this.alpha * 0.6) + ')');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            
            // White glossy reflection streak at the top-left edge
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.ellipse(
                this.x - this.r * 0.35, 
                this.y - this.r * 0.35, 
                this.r * 0.22, 
                this.r * 0.1, 
                -Math.PI / 4, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            // Highlight crescent border (glass specular detail)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r - 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Seed initial bubbles
    for (let i = 0; i < maxBubbles; i++) {
        const b = new Bubble();
        b.y = Math.random() * height; // Distribute across height initially
        bubbles.push(b);
    }
    
    // Function to trigger a decorative burst of bubbles from a point
    globalSpawnBurst = function(x, y) {
        for (let i = 0; i < 35; i++) {
            bubbles.push(new Bubble(true, x, y));
        }
    };
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const active = bubbles[i].update();
            if (!active) {
                bubbles.splice(i, 1); // Delete decayed burst bubbles
            } else {
                bubbles[i].draw();
            }
        }
        
        // Maintain minimum count
        while (bubbles.filter(b => b.decay === 0).length < maxBubbles) {
            bubbles.push(new Bubble());
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

/* ==========================================================================
   WEB AUDIO ENGINE & JUCE PLUGIN SIMULATOR
   ========================================================================== */
let audioCtx = null;
let synthEngine = {
    osc: null,
    filter: null,
    gainNode: null,
    analyser: null,
    poweredOn: false,
    freq: 440,
    cutoff: 2000,
    resonance: 5,
    volume: 0.7,
    waveType: 'sine'
};

function initAudioEngine() {
    const soundToggle = document.getElementById('sound-toggle');
    const powerBtn = document.getElementById('synth-power-toggle');
    
    // Guard: skip if interactive elements are removed from page
    if (!soundToggle || !powerBtn) return;
    
    // UI elements to update values
    const freqVal = document.getElementById('val-pitch');
    const cutoffVal = document.getElementById('val-cutoff');
    const resVal = document.getElementById('val-resonance');
    const volVal = document.getElementById('val-volume');
    
    // Bind click/toggle listeners
    soundToggle.addEventListener('click', () => {
        toggleGlobalSound();
    });
    
    powerBtn.addEventListener('click', () => {
        if (!audioCtx) {
            // Lazy load audio context on user click
            setupAudioNodes();
        }
        
        synthEngine.poweredOn = !synthEngine.poweredOn;
        if (synthEngine.poweredOn) {
            powerBtn.classList.add('active');
            soundToggle.classList.add('audio-on');
            soundToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sound Engine: On';
            
            // Resume Audio Context if suspended
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            // Set up active nodes
            startSynthSynth();
        } else {
            powerBtn.classList.remove('active');
            stopSynthSynth();
        }
    });

    function toggleGlobalSound() {
        powerBtn.click();
    }
    
    function setupAudioNodes() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            synthEngine.analyser = audioCtx.createAnalyser();
            synthEngine.analyser.fftSize = 256;
            
            synthEngine.filter = audioCtx.createBiquadFilter();
            synthEngine.filter.type = 'lowpass';
            
            synthEngine.gainNode = audioCtx.createGain();
            
            // Connections: Synth -> Filter -> Gain -> Analyser -> Output
            synthEngine.filter.connect(synthEngine.gainNode);
            synthEngine.gainNode.connect(synthEngine.analyser);
            synthEngine.analyser.connect(audioCtx.destination);
        } catch (e) {
            console.error('Web Audio API not supported in browser:', e);
        }
    }
    
    function startSynthSynth() {
        if (!audioCtx) return;
        
        if (synthEngine.osc) {
            try { synthEngine.osc.stop(); } catch(e){}
        }
        
        synthEngine.osc = audioCtx.createOscillator();
        synthEngine.osc.type = synthEngine.waveType;
        synthEngine.osc.frequency.setValueAtTime(synthEngine.freq, audioCtx.currentTime);
        
        synthEngine.filter.frequency.setValueAtTime(synthEngine.cutoff, audioCtx.currentTime);
        synthEngine.filter.Q.setValueAtTime(synthEngine.resonance, audioCtx.currentTime);
        
        // Synthesizer Gain
        synthEngine.gainNode.gain.setValueAtTime(synthEngine.volume, audioCtx.currentTime);
        
        synthEngine.osc.connect(synthEngine.filter);
        synthEngine.osc.start();
        
        // Visual indicator on Status widget
        document.getElementById('widget-status').querySelector('.status-indicator').className = 'status-indicator online';
        document.getElementById('widget-status').querySelector('.status-txt').textContent = 'DSP ACTIVE';
    }
    
    function stopSynthSynth() {
        if (synthEngine.osc) {
            try {
                synthEngine.osc.stop();
                synthEngine.osc.disconnect();
            } catch (e) {}
            synthEngine.osc = null;
        }
        
        // Reset status widget
        document.getElementById('widget-status').querySelector('.status-indicator').className = 'status-indicator offline';
        document.getElementById('widget-status').querySelector('.status-txt').textContent = 'DSP Offline';
    }
    
    // Waveform switcher listeners
    const waveBtns = document.querySelectorAll('.vst-wave-btn');
    waveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            waveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            synthEngine.waveType = btn.getAttribute('data-type');
            if (synthEngine.osc && synthEngine.poweredOn) {
                synthEngine.osc.type = synthEngine.waveType;
            }
        });
    });
    
    /* ==========================================================================
       VST KNOB DRAGGING INTERACTION
       ========================================================================== */
    const knobs = document.querySelectorAll('.vst-knob');
    knobs.forEach(knob => {
        let startY = 0;
        let startVal = 0;
        const min = parseFloat(knob.getAttribute('data-min'));
        const max = parseFloat(knob.getAttribute('data-max'));
        const range = max - min;
        
        // Calculate initial rotation based on data-value
        let currentVal = parseFloat(knob.getAttribute('data-value'));
        let rotationDegrees = ((currentVal - min) / range) * 270 - 135; // Map to -135deg to +135deg
        knob.querySelector('.knob-indicator').style.transform = `translateX(-50%) rotate(${rotationDegrees}deg)`;
        
        // Drag listener
        knob.addEventListener('mousedown', (e) => {
            startY = e.clientY;
            startVal = parseFloat(knob.getAttribute('data-value'));
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });
        
        // Touch support
        knob.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startVal = parseFloat(knob.getAttribute('data-value'));
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
            e.preventDefault();
        });
        
        // Scroll support
        knob.addEventListener('wheel', (e) => {
            const step = range * 0.05; // 5% scroll step
            const currentVal = parseFloat(knob.getAttribute('data-value'));
            let newVal = currentVal + (e.deltaY < 0 ? step : -step);
            newVal = Math.max(min, Math.min(max, newVal));
            
            updateKnobValue(knob, newVal, min, max, range);
            e.preventDefault();
        }, { passive: false });
        
        function onMouseMove(e) {
            const deltaY = startY - e.clientY; // drag up increases value
            const speed = range / 200; // sensitivity divisor
            let newVal = startVal + deltaY * speed;
            newVal = Math.max(min, Math.min(max, newVal));
            
            updateKnobValue(knob, newVal, min, max, range);
        }
        
        function onTouchMove(e) {
            const deltaY = startY - e.touches[0].clientY;
            const speed = range / 200;
            let newVal = startVal + deltaY * speed;
            newVal = Math.max(min, Math.min(max, newVal));
            
            updateKnobValue(knob, newVal, min, max, range);
            e.preventDefault();
        }
        
        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        function onTouchEnd() {
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }
    });
    
    function updateKnobValue(knob, value, min, max, range) {
        // Format value representation
        let displayVal = Math.round(value);
        if (knob.id === 'knob-volume') {
            displayVal = Math.round(value);
            synthEngine.volume = value / 100;
            if (synthEngine.gainNode && synthEngine.poweredOn) {
                synthEngine.gainNode.gain.setValueAtTime(synthEngine.volume, audioCtx.currentTime);
            }
            volVal.textContent = displayVal;
        } else if (knob.id === 'knob-pitch') {
            synthEngine.freq = value;
            if (synthEngine.osc && synthEngine.poweredOn) {
                synthEngine.osc.frequency.setValueAtTime(value, audioCtx.currentTime);
            }
            freqVal.textContent = displayVal;
        } else if (knob.id === 'knob-cutoff') {
            synthEngine.cutoff = value;
            if (synthEngine.filter && synthEngine.poweredOn) {
                synthEngine.filter.frequency.setValueAtTime(value, audioCtx.currentTime);
            }
            cutoffVal.textContent = displayVal;
        } else if (knob.id === 'knob-resonance') {
            displayVal = (value).toFixed(1);
            synthEngine.resonance = value;
            if (synthEngine.filter && synthEngine.poweredOn) {
                synthEngine.filter.Q.setValueAtTime(value, audioCtx.currentTime);
            }
            resVal.textContent = displayVal;
        }
        
        // Save back attribute
        knob.setAttribute('data-value', value);
        
        // Rotate indicator
        const rotationDegrees = ((value - min) / range) * 270 - 135;
        knob.querySelector('.knob-indicator').style.transform = `translateX(-50%) rotate(${rotationDegrees}deg)`;
    }
    
    /* ==========================================================================
       SYNTH OSCILLOSCOPE DRAWING
       ========================================================================== */
    const oscCanvas = document.getElementById('synth-oscilloscope');
    const oscCtx = oscCanvas.getContext('2d');
    const dataArray = new Uint8Array(128);
    
    function drawOscilloscope() {
        const width = oscCanvas.width;
        const height = oscCanvas.height;
        
        requestAnimationFrame(drawOscilloscope);
        
        oscCtx.fillStyle = '#020617';
        oscCtx.fillRect(0, 0, width, height);
        
        // Draw grid lines
        oscCtx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
        oscCtx.lineWidth = 1;
        oscCtx.beginPath();
        // center line
        oscCtx.moveTo(0, height / 2); oscCtx.lineTo(width, height / 2);
        // subdivisions
        for (let i = 1; i < 4; i++) {
            const x = (width / 4) * i;
            oscCtx.moveTo(x, 0); oscCtx.lineTo(x, height);
        }
        oscCtx.stroke();
        
        // Fetch wave data
        if (synthEngine.poweredOn && audioCtx && synthEngine.analyser) {
            synthEngine.analyser.getByteTimeDomainData(dataArray);
            
            oscCtx.strokeStyle = '#00f2fe';
            oscCtx.lineWidth = 2.5;
            oscCtx.shadowColor = 'rgba(0, 242, 254, 0.7)';
            oscCtx.shadowBlur = 6;
            
            oscCtx.beginPath();
            const sliceWidth = width / dataArray.length;
            let x = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * (height / 2);
                
                if (i === 0) {
                    oscCtx.moveTo(x, y);
                } else {
                    oscCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            oscCtx.lineTo(width, height / 2);
            oscCtx.stroke();
            oscCtx.shadowBlur = 0; // Reset shadow
        } else {
            // Synthesizer is powered off -> Draw quiet idle noise wave
            oscCtx.strokeStyle = 'rgba(0, 188, 255, 0.35)';
            oscCtx.lineWidth = 1.5;
            
            oscCtx.beginPath();
            const time = Date.now() * 0.004;
            for (let x = 0; x < width; x++) {
                // Simulate soft combined sine noise
                const y = (height / 2) + Math.sin(x * 0.04 + time) * 3 * Math.cos(x * 0.01 + time * 0.5);
                if (x === 0) oscCtx.moveTo(x, y);
                else oscCtx.lineTo(x, y);
            }
            oscCtx.stroke();
        }
    }
    
    drawOscilloscope();
}

/* ==========================================================================
   VR MIDI SIMULATOR & KEYBOARD
   ========================================================================== */
function initMidiVisualizer() {
    const vrCanvas = document.getElementById('vr-midi-canvas');
    
    // Guard: skip if visualizer canvas is removed from page
    if (!vrCanvas) return;

    const vrCtx = vrCanvas.getContext('2d');
    const keys = document.querySelectorAll('.piano-key');
    const indicator = document.getElementById('midi-input-indicator');
    
    let width = vrCanvas.width = vrCanvas.offsetWidth;
    let height = vrCanvas.height = vrCanvas.offsetHeight;
    
    const spawnedBubbles = [];
    
    // Resize support
    window.addEventListener('resize', () => {
        width = vrCanvas.width = vrCanvas.offsetWidth;
        height = vrCanvas.height = vrCanvas.offsetHeight;
    });
    
    // Note synthesizer helper (secondary audio context for piano trigger)
    let midiSynthCtx = null;
    function playMidiNoteTone(freq) {
        if (!audioCtx || audioCtx.state === 'suspended') return; // Only play if global Sound Engine is enabled
        
        try {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            
            // Dynamic envelope
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.03); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2); // Decay/Release
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.8);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 1.3);
        } catch(e) {
            console.error('MIDI Synth play error:', e);
        }
    }
    
    class MidiVisualParticle {
        constructor(pitch, noteName) {
            this.noteName = noteName;
            this.r = Math.random() * 8 + 4;
            
            // Map pitch note (60 to 72) to horizontal viewport coordinate
            const step = width / 14;
            this.x = step * (pitch - 59) + (Math.random() * 10 - 5);
            this.y = height + this.r;
            
            // Launch particle upwards with perspective scale
            this.vy = -(Math.random() * 2 + 1);
            this.vx = (Math.random() * 0.4 - 0.2);
            
            this.scale = 0.5;
            this.alpha = 1.0;
            this.maxLife = Math.random() * 50 + 80;
            this.life = this.maxLife;
            
            // Set note color gradient
            const colorPalette = {
                'C': '#00bcff', // blue
                'C#': '#00f2fe',
                'D': '#0ea5e9',
                'D#': '#0284c7',
                'E': '#76b900', // green
                'F': '#a3e635',
                'F#': '#84cc16',
                'G': '#facc15', // yellow
                'G#': '#fbbf24',
                'A': '#f59e0b',
                'A#': '#ea580c', // orange
                'B': '#ff6a00'
            };
            this.color = colorPalette[noteName] || '#fff';
        }
        
        update() {
            this.y += this.vy;
            this.x += this.vx;
            
            // Particle expands and fades as it rises (3D projection simulation)
            this.scale += 0.008;
            this.life--;
            this.alpha = this.life / this.maxLife;
            
            return this.life > 0;
        }
        
        draw() {
            const currentRadius = this.r * this.scale;
            
            // Particle glow aura
            vrCtx.shadowColor = this.color;
            vrCtx.shadowBlur = 12 * this.scale;
            
            // Sphere linear gradient
            const grad = vrCtx.createRadialGradient(
                this.x - currentRadius * 0.3, this.y - currentRadius * 0.3, currentRadius * 0.1,
                this.x, this.y, currentRadius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, this.color);
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            
            vrCtx.fillStyle = grad;
            vrCtx.beginPath();
            vrCtx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            vrCtx.fill();
            
            // Highlight specular dot
            vrCtx.shadowBlur = 0;
            vrCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            vrCtx.beginPath();
            vrCtx.ellipse(
                this.x - currentRadius * 0.3, 
                this.y - currentRadius * 0.3, 
                currentRadius * 0.2, 
                currentRadius * 0.1, 
                -Math.PI / 4, 
                0, 
                Math.PI * 2
            );
            vrCtx.fill();
            
            // Glow trail line mapping to virtual floor
            vrCtx.strokeStyle = this.color;
            vrCtx.lineWidth = 0.5 * this.alpha;
            vrCtx.beginPath();
            vrCtx.moveTo(this.x, this.y);
            vrCtx.lineTo(this.x, height);
            vrCtx.stroke();
        }
    }
    
    function triggerNoteAction(noteNum, keyEl) {
        if (keyEl) {
            keyEl.classList.add('active');
            setTimeout(() => keyEl.classList.remove('active'), 250);
        }
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[noteNum % 12];
        
        // Trigger HUD feedback
        indicator.textContent = `NOTE IN: ${noteName}${Math.floor(noteNum / 12) - 1}`;
        indicator.classList.add('active');
        setTimeout(() => indicator.classList.remove('active'), 250);
        
        // Synthesize physical frequency: f = 440 * 2^((d - 69)/12)
        const frequency = 440 * Math.pow(2, (noteNum - 69) / 12);
        playMidiNoteTone(frequency);
        
        // Spawn VR particle
        spawnedBubbles.push(new MidiVisualParticle(noteNum, noteName));
        
        // Also trigger background decorative bubble burst if user clicks on things
        if (globalSpawnBurst) {
            const rect = vrCanvas.getBoundingClientRect();
            globalSpawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }
    
    // Bind click events on piano keys
    keys.forEach(key => {
        key.addEventListener('mousedown', () => {
            const noteNum = parseInt(key.getAttribute('data-note'));
            triggerNoteAction(noteNum, key);
        });
    });
    
    // Bind computer keyboard letters to trigger matching keys
    const keyMap = {
        'a': { note: 60, el: document.querySelector('.piano-key[data-key="a"]') },
        'w': { note: 61, el: document.querySelector('.piano-key[data-key="w"]') },
        's': { note: 62, el: document.querySelector('.piano-key[data-key="s"]') },
        'e': { note: 63, el: document.querySelector('.piano-key[data-key="e"]') },
        'd': { note: 64, el: document.querySelector('.piano-key[data-key="d"]') },
        'f': { note: 65, el: document.querySelector('.piano-key[data-key="f"]') },
        't': { note: 66, el: document.querySelector('.piano-key[data-key="t"]') },
        'g': { note: 67, el: document.querySelector('.piano-key[data-key="g"]') },
        'y': { note: 68, el: document.querySelector('.piano-key[data-key="y"]') },
        'h': { note: 68, el: document.querySelector('.piano-key[data-key="h"]') },
        'u': { note: 69, el: document.querySelector('.piano-key[data-key="u"]') },
        'j': { note: 71, el: document.querySelector('.piano-key[data-key="j"]') },
        'k': { note: 72, el: document.querySelector('.piano-key[data-key="k"]') }
    };
    
    window.addEventListener('keydown', (e) => {
        // Only trigger if focus is not on contact form inputs
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        
        const map = keyMap[e.key.toLowerCase()];
        if (map) {
            triggerNoteAction(map.note, map.el);
        }
    });
    
    // Animation loop for VR perspective viewport
    function drawVrSpace() {
        requestAnimationFrame(drawVrSpace);
        
        // Radial starfield background
        const grad = vrCtx.createRadialGradient(width/2, height/2, 5, width/2, height/2, width);
        grad.addColorStop(0, '#091522');
        grad.addColorStop(1, '#020509');
        vrCtx.fillStyle = grad;
        vrCtx.fillRect(0, 0, width, height);
        
        // Draw grid lines perspective to center
        vrCtx.strokeStyle = 'rgba(0, 188, 255, 0.12)';
        vrCtx.lineWidth = 1;
        vrCtx.beginPath();
        for (let i = 0; i <= 10; i++) {
            const xOffset = (width / 10) * i;
            vrCtx.moveTo(xOffset, height);
            vrCtx.lineTo(width / 2, height / 2.5); // Perspective vanishing point
        }
        vrCtx.stroke();
        
        // Horizon line
        vrCtx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
        vrCtx.beginPath();
        vrCtx.moveTo(0, height / 2.5);
        vrCtx.lineTo(width, height / 2.5);
        vrCtx.stroke();
        
        // Update and draw active MIDI bubbles
        for (let i = spawnedBubbles.length - 1; i >= 0; i--) {
            const active = spawnedBubbles[i].update();
            if (!active) {
                spawnedBubbles.splice(i, 1);
            } else {
                spawnedBubbles[i].draw();
            }
        }
    }
    
    drawVrSpace();
}

/* ==========================================================================
   CONTACT FORM VALIDATION & MODAL feedback
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const modal = document.getElementById('contact-success-modal');
    
    // Form fields
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const msgInput = document.getElementById('contact-message');
    
    // Modal buttons
    const closeIcon = document.getElementById('modal-close-icon');
    const closeBtn = document.getElementById('modal-close-btn');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        
        // Name Validation
        if (!nameInput.value.trim()) {
            setInputError(nameInput, true);
            isValid = false;
        } else {
            setInputError(nameInput, false);
        }
        
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
            setInputError(emailInput, true);
            isValid = false;
        } else {
            setInputError(emailInput, false);
        }
        
        // Message Validation
        if (msgInput.value.trim().length < 10) {
            setInputError(msgInput, true);
            isValid = false;
        } else {
            setInputError(msgInput, false);
        }
        
        // Success Handler
        if (isValid) {
            // open glass Dialog modal
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            
            // Trigger bubble explosion from submit button coordinate
            const rect = document.getElementById('btn-submit-contact').getBoundingClientRect();
            if (globalSpawnBurst) {
                globalSpawnBurst(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            // Reset form
            form.reset();
        }
    });
    
    function setInputError(input, hasError) {
        const group = input.closest('.form-group');
        if (hasError) {
            group.classList.add('invalid');
        } else {
            group.classList.remove('invalid');
        }
    }
    
    // Modal dismissal handlers
    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
    
    closeIcon.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

/* ==========================================================================
   PASSWORD LOGON SCREEN CHECK
   ========================================================================== */
function initLogonScreen() {
    const logonScreen = document.getElementById('logon-screen');
    const logonForm = document.getElementById('logon-form');
    const passwordInput = document.getElementById('logon-password');
    const errorMessage = document.getElementById('logon-error');
    const logonCard = logonScreen.querySelector('.logon-card');

    // Check if user already unlocked the site in this session
    if (sessionStorage.getItem('portfolio_unlocked') === 'true') {
        logonScreen.style.display = 'none';
        return;
    }

    logonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;

        // Correct password check
        if (enteredPassword === 'aero2026') {
            sessionStorage.setItem('portfolio_unlocked', 'true');
            logonScreen.classList.add('fade-out');
            
            // Spawn a celebratory bubble burst in the background!
            if (globalSpawnBurst) {
                globalSpawnBurst(window.innerWidth / 2, window.innerHeight / 2);
            }
            
            // Remove from layout after fade animation finishes
            setTimeout(() => {
                logonScreen.style.display = 'none';
            }, 600);
        } else {
            // Apply shake animation to card
            logonCard.classList.add('shake');
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();

            // Clear shake class so it can be re-triggered
            setTimeout(() => {
                logonCard.classList.remove('shake');
            }, 500);
        }
    });
}
