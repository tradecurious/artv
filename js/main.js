// Listserv Form Handler — records signups in the Supabase mailing_list table
const SUPABASE_URL = 'https://dnkdbwxsygtptwbemydc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_a2n4QNMl1NcgkG__6-GHcg_e2YZHYnZ';

document.getElementById('listservForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = this;
    const email = document.getElementById('email').value.trim().toLowerCase();
    if (!email) return;

    const button = document.querySelector('.btn-subscribe');
    const originalLabel = button ? button.textContent : '';
    if (button) { button.disabled = true; button.textContent = 'Subscribing…'; }

    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/mailing_list', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ email: email })
        });

        // 409 = duplicate key; treat an already-subscribed address as success
        if (res.ok || res.status === 409) {
            form.reset();
            showListservMessage('Thank you for joining the mailing list!', true);
        } else {
            showListservMessage('Something went wrong. Please try again, or email team@vthepeople.org.', false);
        }
    } catch (err) {
        showListservMessage('Something went wrong. Please try again, or email team@vthepeople.org.', false);
    } finally {
        if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
});

function showListservMessage(text, ok) {
    let msg = document.getElementById('listservMessage');
    if (!msg) {
        msg = document.createElement('p');
        msg.id = 'listservMessage';
        document.querySelector('.listserv-form-wrapper').insertAdjacentElement('afterend', msg);
    }
    msg.textContent = text;
    msg.style.cssText = 'margin-top:16px;font-size:1rem;color:' + (ok ? '#7fd1a0' : '#f0a5a5') + ';';
}

// Carousel animation - start on scroll with 2-second delay
const carousel = document.getElementById('speakersCarousel');
const navLeftBtn = document.querySelector('.carousel-nav-left');
const navRightBtn = document.querySelector('.carousel-nav-right');

let carouselOffset = 0;
const cardWidth = 280 + 40; // card width + gap
let carouselAnimationStarted = false;

if (carousel) {
    // Intersection Observer to start animation when carousel comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !carouselAnimationStarted) {
                carouselAnimationStarted = true;
                // Start animation after 2 second delay
                setTimeout(() => {
                    carousel.style.animation = 'carousel-scroll 40s linear infinite';
                }, 2000);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(carousel);
}

if (navLeftBtn && navRightBtn && carousel) {
    navLeftBtn.addEventListener('click', () => {
        carouselOffset = Math.max(carouselOffset - cardWidth, 0);
        carousel.style.transform = `translateX(-${carouselOffset}px)`;
        carousel.style.animation = 'none';
    });

    navRightBtn.addEventListener('click', () => {
        const maxOffset = carousel.scrollWidth - carousel.parentElement.clientWidth;
        carouselOffset = Math.min(carouselOffset + cardWidth, maxOffset);
        carousel.style.transform = `translateX(-${carouselOffset}px)`;
        carousel.style.animation = 'none';
    });

    // Pause carousel on speaker image hover
    document.querySelectorAll('.speaker-image-container').forEach(imageContainer => {
        imageContainer.addEventListener('mouseenter', () => {
            if (carouselAnimationStarted) {
                carousel.style.animationPlayState = 'paused';
            }
        });

        imageContainer.addEventListener('mouseleave', () => {
            if (carouselAnimationStarted) {
                carousel.style.animationPlayState = 'running';
            }
        });
    });

    // Resume animation after section leave
    const container = document.querySelector('.speakers-carousel-container');
    container.addEventListener('mouseleave', () => {
        if (carouselAnimationStarted) {
            carousel.style.animationPlayState = 'running';
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
