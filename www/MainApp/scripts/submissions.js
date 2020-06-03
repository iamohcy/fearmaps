$(function() {
    var $container = $('#fear-image-div');
    // initialize Masonry after all images have loaded
    $container.imagesLoaded( function() {
        $container.masonry({
            // options
            columnWidth: '.grid-sizer',
            itemSelector: '.grid-item',
            percentPosition: true
        });
    });
});
