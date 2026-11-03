(function ($) {
    "use strict";

    $(document).ready(function () {

        // Vérification de Owl Carousel
        if ($.fn.owlCarousel) {
            $(".courses-carousel, .team-carousel, .testimonial-carousel, .related-carousel").each(function () {
                $(this).owlCarousel({
                    autoplay: true,
                    smartSpeed: 1500,
                    loop: true,
                    dots: false,
                    nav: true,
                    navText: [
                        '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                        '<i class="fa fa-angle-right" aria-hidden="true"></i>'
                    ],
                    responsive: {
                        0: { items: 1 },
                        576: { items: 2 },
                        768: { items: 3 },
                        992: { items: 4 }
                    }
                });
            });
        } else {
            console.error("❌ Erreur : Owl Carousel n'est pas chargé.");
        }

        // Back to top button
        $(window).scroll(function () {
            if ($(this).scrollTop() > 100) {
                $('.back-to-top').fadeIn('slow');
            } else {
                $('.back-to-top').fadeOut('slow');
            }
        });

        $('.back-to-top').click(function () {
            $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
            return false;
        });

        // Facts counter
        if ($.fn.counterUp) {
            $('[data-toggle="counter-up"]').counterUp({
                delay: 10,
                time: 2000
            });
        } else {
            console.error("❌ Erreur : CounterUp n'est pas chargé.");
        }
    });

})(jQuery);

