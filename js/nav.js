// Mobile navbar toggle
document.querySelectorAll('.site-nav').forEach(function (nav) {
    var toggle = nav.querySelector('.site-nav-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('.site-nav-links a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
});
