// Initialize Supabase client
const SUPABASE_URL = 'https://dnkdbwxsygtptwbemydc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRua2Rid3hzeWd0cHR3YmVteWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjMyMDEsImV4cCI6MjA4NTg5OTIwMX0.hAWLFTJApDZDi4P1WlqzlME7ILFg5wvj58qyBDnUR30';

let supabase;

// Initialize Supabase when library is ready
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized successfully');
        return true;
    } else {
        console.error('❌ Supabase library not loaded');
        return false;
    }
}

// Try to initialize immediately
initSupabase();

// Listserv Form Handler
const form = document.getElementById('listservForm');
console.log('📝 Form element found:', !!form);

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🚀 Form submit handler called');

        // Re-initialize Supabase if needed
        if (!supabase) {
            initSupabase();
        }

        const email = document.getElementById('email').value;
        const submitBtn = document.querySelector('.btn-subscribe');
        const originalText = submitBtn.textContent;

        console.log('Form submitted with email:', email);
        console.log('Supabase client initialized:', !!supabase);

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';

        try {
            if (!supabase) {
                throw new Error('Supabase not configured. Please set up your credentials in main.js');
            }

            console.log('Attempting to insert email into Supabase...');

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

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Supabase error details:', error);

                // Check if it's a duplicate email error
                if (error.code === '23505') {
                    alert('This email is already subscribed!');
                } else if (error.code === '42P01') {
                    alert('Database table not found. Please run the setup SQL in your Supabase dashboard first.');
                    console.error('Table "mailing_list" does not exist. Run supabase_setup.sql in your Supabase SQL Editor.');
                } else {
                    throw error;
                }
            } else {
                console.log('Email successfully added:', data);

                // Clear the form
                this.reset();

                // Show success message
                alert('Thank you for joining our mailing list!');
            }
        } catch (error) {
            console.error('Error submitting email:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            alert('There was an error subscribing. Please check the browser console (F12) for details.');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
} else {
    console.error('❌ Form element not found!');
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
