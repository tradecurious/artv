// Countdown to the start of the livestream: opening remarks on
// Friday, October 2, 2026 at 4:45 PM Eastern (20:45 UTC).
(function () {
    var countdown = document.querySelector('.watch-countdown');
    if (!countdown) return;

    var START = Date.UTC(2026, 9, 2, 20, 45, 0);

    var fields = {};
    ['days', 'hours', 'minutes', 'seconds'].forEach(function (unit) {
        fields[unit] = countdown.querySelector('[data-unit="' + unit + '"]');
    });

    function pad(n) {
        return (n < 10 ? '0' : '') + n;
    }

    var timer = null;

    function tick() {
        var remaining = START - Date.now();
        if (remaining <= 0) {
            countdown.classList.add('is-live');
            if (timer) clearInterval(timer);
            return;
        }
        var total = Math.floor(remaining / 1000);
        fields.days.textContent = pad(Math.floor(total / 86400));
        fields.hours.textContent = pad(Math.floor((total % 86400) / 3600));
        fields.minutes.textContent = pad(Math.floor((total % 3600) / 60));
        fields.seconds.textContent = pad(total % 60);
    }

    tick();
    if (!countdown.classList.contains('is-live')) {
        timer = setInterval(tick, 1000);
    }
})();
