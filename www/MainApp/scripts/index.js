$(function() {

    var DURATION = 3;
    var tl = gsap.timeline({repeat: -1, repeatDelay: 0});
    tl.to(".image1", {opacity: 0, duration: DURATION, ease: "power0"});
    tl.to(".blended_image", {opacity: 0, duration: DURATION, ease: "power0"});
    tl.to(".blended_image", {opacity: 1, duration: DURATION, ease: "power0"});
    tl.to(".image1", {opacity: 1, duration: DURATION, ease: "power0"});

    $('[data-toggle="tooltip"]').tooltip();

});

