/* ============================================
   FUTURISTIC JAVASCRIPT ENHANCEMENTS
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }

    // Intersection Observer for fade-in animations
    observeElements();

    // Smooth scroll enhancement
    enhanceSmoothScroll();

    // Particle cursor effect
    initParticleCursor();
});

/* ============================================
   EMAIL FORM HANDLER
   ============================================ */

function handleEmailSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const feedback = document.getElementById('form-feedback');
    const submitBtn = form.querySelector('button');

    // Validate email
    if (!email || !isValidEmail(email)) {
        showFeedback(feedback, '❌ Please enter a valid email address.', 'error');
        submitBtn.style.animation = 'shake 0.5s ease';
        setTimeout(() => submitBtn.style.animation = '', 500);
        return;
    }

    // Simulate form submission with loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Processing...';
    submitBtn.disabled = true;
    feedback.innerHTML = '<span class="spinner">⌛</span> Securing your spot...';

    setTimeout(function() {
        // Success message
        showFeedback(
            feedback,
            '🇺🇸 ✓ CONFIRMED! Check your email to join the movement.',
            'success'
        );

        submitBtn.textContent = '✓ Success!';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

        // Reset form
        form.reset();

        // Reset button after 3 seconds
        setTimeout(function() {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            feedback.innerHTML = '';
        }, 3000);
    }, 1500);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFeedback(element, message, type) {
    element.innerHTML = message;
    element.className = type;
    element.style.animation = 'slideInFeedback 0.5s ease';
}

/* ============================================
   INTERSECTION OBSERVER FOR ANIMATIONS
   ============================================ */

function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe fade-in-up elements
    document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });
}

/* ============================================
   ENHANCED SMOOTH SCROLL
   ============================================ */

function enhanceSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);

                // Smooth scroll with offset for fixed nav
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // Add a subtle highlight effect
                highlightElement(target);
            }
        });
    });
}

function highlightElement(element) {
    element.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.4)';
    setTimeout(() => {
        element.style.boxShadow = '';
    }, 1500);
}

/* ============================================
   PARTICLE CURSOR EFFECT
   ============================================ */

function initParticleCursor() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    let mouseX = 0;
    let mouseY = 0;

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Create particles on hover
        if (Math.random() > 0.9) {
            createParticle(mouseX, mouseY);
        }
    });

    function createParticle(x, y) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            alpha: 1,
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#fbbf24' : '#dc2626'
        };
        particles.push(particle);
    }

    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            p.vy += 0.1; // gravity

            if (p.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });

        requestAnimationFrame(animate);
    }

    animate();
}

/* ============================================
   KEYSTROKE ANIMATIONS
   ============================================ */

// Add wave effect to text on hover (optional)
document.querySelectorAll('.hero-title').forEach(element => {
    element.addEventListener('mouseenter', function() {
        const text = this.textContent;
        this.textContent = '';

        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.display = 'inline-block';
            span.style.animation = `wave 0.5s ease ${i * 0.05}s`;
            this.appendChild(span);
        }
    });
});

// Add wave keyframe if not already present
if (!document.querySelector('style#wave-animation')) {
    const style = document.createElement('style');
    style.id = 'wave-animation';
    style.textContent = `
        @keyframes wave {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        @keyframes slideInFeedback {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .spinner {
            display: inline-block;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

/* ============================================
   SCROLL INDICATOR
   ============================================ */

// Scroll progress indicator (optional)
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    document.documentElement.style.setProperty('--scroll-progress', scrolled + '%');
});

/* ============================================
   PERFORMANCE OPTIMIZATION
   ============================================ */

// Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add active link highlighting
function highlightActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-glow');

    window.addEventListener('scroll', debounce(() => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }, 100));
}

// Initialize active link highlighting if sections exist
if (document.querySelectorAll('section[id]').length > 0) {
    highlightActiveLink();
}

/* ============================================
   EASTER EGG: KONAMI CODE
   ============================================ */

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            triggerEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function triggerEasterEgg() {
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.innerHTML = '🇺🇸';
        confetti.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}%;
            top: -20px;
            font-size: 2rem;
            z-index: 10000;
            animation: confettiFall ${2 + Math.random() * 1}s ease-in forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }

    // Add confetti animation if not present
    if (!document.querySelector('style#confetti-animation')) {
        const style = document.createElement('style');
        style.id = 'confetti-animation';
        style.textContent = `
            @keyframes confettiFall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
