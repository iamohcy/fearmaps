$(window).load(function(){
    var $container = $('#fear-composite-div');
    // initialize Masonry after all images have loaded
    $container.imagesLoaded( function() {
        $container.masonry({
            // options
            columnWidth: '.grid-sizer',
            itemSelector: '.grid-item',
            percentPosition: true
        });
        $container.masonry();
    });

    $(".blended-image-container").click(function() {
        for (var i = 0; i < 3; i ++) {
            var subImage = $(this).find(".image-" + i);
            var opacity = subImage.css("opacity");
            var src = "/media/" + subImage.attr("image_lg");

            console.log(subImage, opacity, src);

            $("#blend-image-lg-" + i).attr("src", src);
            $("#blend-image-lg-" + i).css("opacity", opacity);
        }
        $("#composite-large-modal").modal();
    });

});
