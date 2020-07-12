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
        modal_fear_item: null,
        current_pk:null,
    },
    mounted: function() {

        $.urlParam = function (name) {
            var results = new RegExp('[\?&]' + name + '=([^&#]*)')
                              .exec(window.location.search);

            return (results !== null) ? results[1] || 0 : false;
        }


        var self = this;
        var first_pk = $.urlParam('pk'); //edit
        if (first_pk) {
            $.getJSON( "/get_fear_item/", {"pk":first_pk}, function( data ) {
                self.current_pk = data[0].pk;
                self.modal_fear_item = data[0].fields;
                self.modal_fear_item.pk = self.current_pk;
                // console.log(self.modal_fear_item);

                // Highlight it
                $("#" + self.current_pk).addClass("selected-fear-item-div");

                // element which needs to be scrolled to
                var element = document.querySelector("[id='" + data[0].pk + "']");

                // scroll to element
                element.scrollIntoView();
                $("#fear-description-modal").modal();
            });
        }

        var DURATION = 3;
        var tl = gsap.timeline({repeat: -1, repeatDelay: 0});
        tl.to(".image1", {opacity: 0, duration: DURATION, ease: "power0"});
        tl.to(".blended_image", {opacity: 0, duration: DURATION, ease: "power0"});
        tl.to(".blended_image", {opacity: 1, duration: DURATION, ease: "power0"});
        tl.to(".image1", {opacity: 1, duration: DURATION, ease: "power0"});

        $(".image_blend_div").click(function() {
            var pk = $(this).attr("id");

            $.getJSON( "/get_fear_item/", {"pk":pk}, function( data ) {

                $("#" + self.current_pk).removeClass("selected-fear-item-div");

                self.modal_fear_item = data[0].fields;
                self.modal_fear_item.pk = data[0].pk;
                self.current_pk = data[0].pk
                console.log(self.modal_fear_item);

                $("#" + self.current_pk).addClass("selected-fear-item-div");

                $("#fear-description-modal").modal();
            });
        })

    }
})
