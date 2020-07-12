    // var $container = $('#fear-image-div');
    // // initialize Masonry after all images have loaded
    // $container.imagesLoaded( function() {
    //     $container.masonry({
    //         // options
    //         columnWidth: '.grid-sizer',
    //         itemSelector: '.grid-item',
    //         percentPosition: true
    //     });
    // });

var app = new Vue({
    delimiters: ['[[', ']]'],
    el: '#fear-description-div',
    data: {
        fear_item: null,
    },
    mounted: function() {
        var self = this;
        var first_pk = $("#fear-collection-div .image_blend_div:first-child").attr("pk");
        $.getJSON( "/get_fear_item/", {"pk":first_pk}, function( data ) {
            self.fear_item = data[0].fields;
            // console.log(self.fear_item);
        });

        var DURATION = 3;
        var tl = gsap.timeline({repeat: -1, repeatDelay: 0});
        tl.to(".image1", {opacity: 0, duration: DURATION, ease: "power0"});
        tl.to(".blended_image", {opacity: 0, duration: DURATION, ease: "power0"});
        tl.to(".blended_image", {opacity: 1, duration: DURATION, ease: "power0"});
        tl.to(".image1", {opacity: 1, duration: DURATION, ease: "power0"});

        $(".image_blend_div").click(function() {
            var pk = $(this).attr("pk");

            $.getJSON( "/get_fear_item/", {"pk":pk}, function( data ) {
                self.fear_item = data[0].fields;
                // console.log(self.fear_item);
            });
        })

    }
})
