// Email Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }
});

function handleEmailSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const feedback = document.getElementById('form-feedback');

    // Validate email
    if (!email || !isValidEmail(email)) {
        showFeedback(feedback, 'Please enter a valid email address.', 'error');
        return;
    }

    // Simulate form submission (in production, this would hit a backend service)
    feedback.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing up...';

    setTimeout(function() {
        // Success message
        showFeedback(
            feedback,
            '✓ Thank you! Check your email to confirm your subscription.',
            'success'
        );

        // Reset form
        form.reset();

        // Clear feedback after 5 seconds
        setTimeout(function() {
            feedback.innerHTML = '';
        }, 5000);
    }, 1500);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFeedback(element, message, type) {
    element.innerHTML = message;
    element.className = type;
}

// Smooth scroll enhancement
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
