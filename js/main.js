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
