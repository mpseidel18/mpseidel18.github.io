/* ==========================================================================
   INTERACTIVE LOGIC AND GRAPHICS CONTROLLERS - app.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Logon screen lock
    initLogonScreen();

    // Navigation routing, canvases
    initNavigation();
    initBackgroundCanvas();


    // Form and modals
    initContactForm();
    initMediaControls();
});

/* ==========================================================================
   MEDIA SOUND TOGGLES
   Adds a per-video button to toggle muted state for project media elements.
   ========================================================================== */
function initMediaControls() {
    const containers = document.querySelectorAll('.project-media-container');

    containers.forEach(container => {
        const video = container.querySelector('video.project-media');
        if (!video) return;

        // Create controls wrapper
        const controls = document.createElement('div');
        controls.className = 'media-controls';

        // Play/Pause button
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'media-control media-play-toggle';
        playBtn.setAttribute('aria-label', 'Play or pause video');
        const playIcon = document.createElement('i');
        playIcon.className = video.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        playBtn.appendChild(playIcon);

        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (video.paused) {
                const p = video.play();
                if (p && typeof p.then === 'function') p.catch(() => { });
                playIcon.className = 'fa-solid fa-pause';
            } else {
                video.pause();
                playIcon.className = 'fa-solid fa-play';
            }
        });

        // Sound toggle button
        const soundBtn = document.createElement('button');
        soundBtn.type = 'button';
        soundBtn.className = 'media-control media-sound-toggle';
        soundBtn.setAttribute('aria-label', 'Toggle video sound');
        const soundIcon = document.createElement('i');
        soundIcon.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        soundBtn.appendChild(soundIcon);

        soundBtn.addEventListener('click', (e) => {
            e.preventDefault();
            video.muted = !video.muted;
            soundIcon.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            // Unmute may require a play interaction in some browsers
            if (!video.muted && video.paused) {
                const p = video.play();
                if (p && typeof p.then === 'function') p.catch(() => { });
            }
        });

        // Append buttons to wrapper and attach
        controls.appendChild(playBtn);
        controls.appendChild(soundBtn);
        container.appendChild(controls);

        // Update play icon on external play/pause events
        video.addEventListener('play', () => { playIcon.className = 'fa-solid fa-pause'; });
        video.addEventListener('pause', () => { playIcon.className = 'fa-solid fa-play'; });
    });
}

/* ==========================================================================
   NAVIGATION ROUTING
   ========================================================================== */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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

    // Update active nav button based on scroll position
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const header = document.getElementById('main-header');

        // Hide top bar when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastScrollY = currentScrollY;

        const sections = document.querySelectorAll('.content-section');
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        if (current) {
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === current) {
                    btn.classList.add('active');
                }
            });

            const header = document.getElementById('main-header');
            if (current !== 'welcome') {
                header.style.width = '95%';
                header.style.top = '10px';
            } else {
                header.style.width = '90%';
                header.style.top = '15px';
            }
        }
    });
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
    globalSpawnBurst = function (x, y) {
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
            // Encode the email content
            const subject = encodeURIComponent('New Message from Portfolio Website');
            const body = encodeURIComponent(`Name: ${nameInput.value}\nEmail: ${emailInput.value}\n\nMessage:\n${msgInput.value}`);

            // Open default email client
            window.location.href = `mailto:mariuspseidel@gmail.com?subject=${subject}&body=${body}`;

            // open glass Dialog modal
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');

            // Trigger bubble explosion from submit button coordinate
            const rect = document.getElementById('btn-submit-contact').getBoundingClientRect();
            if (globalSpawnBurst) {
                globalSpawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
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

    logonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;

        // The pre-computed SHA-256 hash of the correct password
        const correctHash = '93e9218a13f86aa3e8b568fcea1fcf1de67b3ca61a9344d77f2b5fb00f951f03';

        // If Web Crypto is available, compare SHA-256 hashes (so the cleartext password isn't stored directly).
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();

            // Hash entered password
            const enteredBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(enteredPassword));
            const enteredHash = Array.from(new Uint8Array(enteredBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            if (enteredHash === correctHash) {
                sessionStorage.setItem('portfolio_unlocked', 'true');
                logonScreen.classList.add('fade-out');
                if (globalSpawnBurst) globalSpawnBurst(window.innerWidth / 2, window.innerHeight / 2);
                setTimeout(() => { logonScreen.style.display = 'none'; }, 600);
                return;
            }
        } else {
            // Fallback for very old browsers lacking Web Crypto API
            alert('Your browser does not support secure login. Please update to a modern browser.');
            return;
        }

        // If we reach here, authentication failed
        logonCard.classList.add('shake');
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        setTimeout(() => { logonCard.classList.remove('shake'); }, 500);
    });
}

// Lightbox Functionality
const lightbox = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const galleryItems = document.querySelectorAll('.gallery-item img');

if (lightbox && lightboxImg) {
    galleryItems.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightbox.style.display = 'flex';
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
}
