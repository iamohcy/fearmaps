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
});
