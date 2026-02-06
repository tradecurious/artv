// Initialize Supabase client
const SUPABASE_URL = 'https://dnkdbwxsygtptwbemydc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_a2n4QNMl1NcgkG__6-GHcg_e2YZHYnZ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listserv Form Handler
document.getElementById('listservForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const submitBtn = document.querySelector('.btn-subscribe');
    const originalText = submitBtn.textContent;

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    try {
        if (!supabase) {
            throw new Error('Supabase not configured. Please set up your credentials in main.js');
        }

        // Insert email into Supabase
        const { data, error } = await supabase
            .from('mailing_list')
            .insert([
                {
                    email: email,
                    subscribed_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            // Check if it's a duplicate email error
            if (error.code === '23505') {
                alert('This email is already subscribed!');
            } else {
                throw error;
            }
        } else {
            // Clear the form
            this.reset();

            // Show success message
            alert('Thank you for joining our mailing list!');
        }
    } catch (error) {
        console.error('Error submitting email:', error);
        alert('There was an error subscribing. Please try again later.');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

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
