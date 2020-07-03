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
            $('.image-'+i).attr('src',"/media/" + blendedFearItems[i].fields.image_1_tb);
            $("#image-" + i + "-text").html(blendedFearItems[i].fields.fear_text);
        }

        var opacityCombinations = [
            [0,1,1],
            [1,0,1],
            [1,1,0],
            [1,1,1],
        ]

        var replacementIndex = 0;
        var DURATION = 5;
        var tl = gsap.timeline({repeat: -1, repeatDelay: 0, onRepeat:function(){
            // console.log(allFearItems.length, previousFearItems.length);
        }});
        for (var i = 0; i < opacityCombinations.length; i++) {
            var combination = opacityCombinations[i];
            for (var j = 0; j < MAX_NUM_SAMPLES; j++) {
                tl.to("#blend-image-" + j, {opacity: combination[j], duration: DURATION, ease: "power0"}, i * DURATION);
            }

            // Second last one, change first image!
            if (opacityCombinations[i][replacementIndex] == 0) {
                tl.add( function(){
                    // We've emptied the array, replace it back with the old popped items
                    if (allFearItems.length == 0) {
                        allFearItems = previousFearItems;
                        previousFearItems = [];
                    }

                    var newFearItem = getRandomItem(allFearItems);
                    previousFearItems.push(newFearItem);
                    blendedFearItems[replacementIndex] = newFearItem;
                    $('.image-'+replacementIndex).attr('src',"/media/" + newFearItem.fields.image_1_tb);
                    $("#image-" + i + "-text").html(newFearItem.fields.fear_text);

                    replacementIndex = (replacementIndex + 1) % MAX_NUM_SAMPLES;
                } )
            }
        }
    });



});
