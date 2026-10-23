// Conference Videos: swap each card's placeholder title for the video's real
// YouTube title (minus the conference tag) once it can be fetched. If the
// lookup fails for any reason the placeholder written in the HTML stays.
(function () {
    var cards = document.querySelectorAll('.video-card[data-video-id]');
    if (!cards.length || typeof window.fetch !== 'function') return;

    var TAG = '#?\\s*v\\s*the\\s*people\\s*(?:conference)?\\s*(?:20\\d\\d)?';
    var SEP = '[\\s|:\\-\\u2013\\u2014\\u00b7]+';

    function cleanTitle(title) {
        return title
            .replace(new RegExp('^' + TAG + SEP, 'i'), '')              // "VthePeopleConference | Title"
            .replace(new RegExp(SEP + TAG + '\\s*$', 'i'), '')          // "Title | VthePeopleConference"
            .replace(new RegExp('\\s*[\\(\\[]\\s*' + TAG + '\\s*[\\)\\]]', 'ig'), '') // "Title (VthePeopleConference)"
            .replace(new RegExp(TAG + '(?=\\W|$)', 'ig'), '')           // anywhere else
            .replace(/\s{2,}/g, ' ')
            .replace(/^[\s|:\-–—·]+|[\s|:\-–—·]+$/g, '')
            .trim();
    }

    Array.prototype.forEach.call(cards, function (card) {
        var id = card.getAttribute('data-video-id');
        var target = card.querySelector('.video-title');
        if (!id || !target) return;

        var url = 'https://noembed.com/embed?url=' +
            encodeURIComponent('https://www.youtube.com/watch?v=' + id);

        fetch(url)
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                if (!data || typeof data.title !== 'string') return;
                var title = cleanTitle(data.title);
                if (title) target.textContent = title;
            })
            .catch(function () { /* keep the placeholder title */ });
    });
})();
