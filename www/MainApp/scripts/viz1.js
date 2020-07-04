$(function() {


    var MAX_NUM_SAMPLES = 3;

    function getRandomItem(array) {
        var index = Math.floor(Math.random()*array.length);
        var item = array[index];
        array.splice(index, 1); // Remove the item from the array
        return item;
    }

    $.getJSON( "/fear_items", function( data ) {
        var allFearItems = data;
        var previousFearItems = [];
        var blendedFearItems = [];

        while ((allFearItems.length > 0) && (blendedFearItems.length < MAX_NUM_SAMPLES)) {
            var fearItem = getRandomItem(allFearItems)
            blendedFearItems.push(fearItem);
            previousFearItems.push(fearItem);
        }


        for (var i = 0; i < blendedFearItems.length; i++) {
            console.log(blendedFearItems[i]);
            var fearItemData = blendedFearItems[i].fields;
            var image_tb = fearItemData.image_1_tb;
            if (fearItemData.image_2_tb.length > 0) {
                image_tb = (Math.random() >= 0.5) ? fearItemData.image_1_tb : fearItemData.image_2_tb;
            }

            $('.image-'+i).attr('src',"/media/" + image_tb);
            $("#image-" + i + "-text").html(blendedFearItems[i].fields.fear_text);
        }

        var opacityCombinations = [
            [0,1,1],
            [1,0,1],
            [1,1,0],
            [1,1,1],
        ]

        var replacementIndex = -1;
        var DURATION = 5;
        // var DURATION = 0.5;
        var tl = gsap.timeline({repeat: -1, repeatDelay: 0, onRepeat:function(){
            replacementIndex = (replacementIndex + 1) % MAX_NUM_SAMPLES;

            // console.log(allFearItems.length, previousFearItems.length);
        }});

        var checkForReplace = function(imageIndex,opacity) {
            // Replace the image only when it's opacity has reached 0
            if (imageIndex === replacementIndex && opacity <= 0) {
                // We've emptied the array, replace it back with the old popped items
                if (allFearItems.length == 0) {
                    allFearItems = previousFearItems;
                    previousFearItems = [];
                }

                var newFearItem = getRandomItem(allFearItems);
                previousFearItems.push(newFearItem);
                blendedFearItems[replacementIndex] = newFearItem;

                var fearItemData = newFearItem.fields;
                var image_tb = fearItemData.image_1_tb;
                if (fearItemData.image_2_tb.length > 0) {
                    image_tb = (Math.random() >= 0.5) ? fearItemData.image_1_tb : fearItemData.image_2_tb;
                }

                $('.image-'+replacementIndex).attr('src',"/media/" + image_tb);
                $("#image-" + replacementIndex + "-text").html(newFearItem.fields.fear_text);
            }


            // replacementIndex = (replacementIndex + 1) % MAX_NUM_SAMPLES;
        }

        for (var i = 0; i < opacityCombinations.length; i++) {
            var combination = opacityCombinations[i];
            for (var j = 0; j < MAX_NUM_SAMPLES; j++) {
                tl.to("#blend-image-" + j, {
                    opacity: combination[j],
                    duration: DURATION,
                    ease: "power0",
                    onComplete: checkForReplace,
                    onCompleteParams: [j, combination[j]],
                }, i * DURATION);
                // tl.add( function(){

                // } )
            }

            // if (opacityCombinations[i][replacementIndex] == 0) {
            // }
        }
    });



});
