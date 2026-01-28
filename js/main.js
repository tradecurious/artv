// Listserv Form Handler
document.getElementById('listservForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;

    // Here you would typically send the email to a backend service
    console.log('Email submitted:', email);

    // Clear the form
    this.reset();

    // Optional: Show a success message
    alert('Thank you for joining the listserv!');
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

    // Resume animation after button click
    const container = document.querySelector('.speakers-carousel-container');
    container.addEventListener('mouseleave', () => {
        if (carouselAnimationStarted) {
            carousel.style.animation = 'carousel-scroll 40s linear infinite';
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
