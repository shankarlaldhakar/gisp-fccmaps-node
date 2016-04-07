'use strict';

// toggle off canvas right sidebar nav on small screens
var offCanvasMenu = {
    init: function() {

        $('.nav-browseBy').on('click', 'a', offCanvasMenu.toggleNav);
        $('.btn.hamburger').on('click', offCanvasMenu.toggleMenu)

        $(window)
            .on('resize', offCanvasMenu.resizeWin)
            .resize();

    },
    resizeWin: function() {
        var browseBy = $('.nav-browseBy'),
            btnVisible = $('.btn.hamburger').is(':visible');

        if (btnVisible) {
            $('.nav-secondary').find('nav').prepend(browseBy);

        } else {
            $('.nav-primary').append(browseBy);
        }
    },
    toggleMenu: function(e) {
        e.preventDefault();

        $('body').toggleClass('js-nav');
    },
    toggleNav: function(e) {
        var target = $(this).attr('href'),
            pointer = $('.nav-browseBy').find('.pointer');

        e.preventDefault();

        $(this).append(pointer);

        $('.js-browseBy').addClass('hide');
        $(target).removeClass('hide');
    }
};

// display alert when browsing to external sites
var extLinks = function(e) {

    var alertText = 'You are about to leave the FCC website and visit a third-party, non-governmental website that the FCC does not maintain or control. The FCC does not endorse any product or service, and is not responsible for, nor can it guarantee the validity or timeliness of the content on the page you are about to visit. Additionally, the privacy policies of this third-party page may differ from those of the FCC.',
        confirm = window.confirm(alertText);

    if (!confirm) {
        e.preventDefault();
    }

};

offCanvasMenu.init();
$('.link-ext').on('click', extLinks);