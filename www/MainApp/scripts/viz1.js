var app = new Vue({
    delimiters: ['[[', ']]'],
    el: '#fear-description-div',
    data: {
        fear_item: null,
        fear_items: [null, null, null],
    },
    mounted: function() {
        setupCSRF();

        var MAX_NUM_SAMPLES = 3;

        function getRandomItem(array) {
            var index = Math.floor(Math.random()*array.length);
            var item = array[index];
            array.splice(index, 1); // Remove the item from the array
            return item;
        }

        function splitFearText(fearText) {
            return fearText.replace(/(\r\n|\n|\r)/gm, "<br />");
            // htmlString = ""
            // splitText = fearText.split("/n");
            // for (var i in splitText) {
            //     htmlString += "<p>";
            //     htmlString += splitText[i];
            //     htmlString += "</p>";
            // }
            // return htmlString;
        }

        $.getJSON( "/fear_items/", function( data ) {
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
                var fearItem = blendedFearItems[i];
                var fearItemData = fearItem.fields;
                var imageIndex = 0;
                var image_tb = fearItemData.image_1_tb;
                if (fearItemData.image_2_tb.length > 0) {
                    imageIndex = (Math.random() >= 0.5) ? 0 : 1;
                    if (imageIndex === 1) {
                        image_tb = fearItemData.image_2_tb;
                    }
                }

                $('.image-'+i).attr('src',"/media/" + image_tb);
                $('#blend-image-'+i).attr('pk', fearItem.pk);
                $('#blend-image-'+i).attr('imageIndex', imageIndex);
                $("#image-" + i + "-text").html(splitFearText(fearItem.fields.fear_text));
                $("#sub-image-div-" + i).attr("pk", fearItem.pk);
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
            var timeline = gsap.timeline({repeat: -1, repeatDelay: 0, onRepeat:function(){
                replacementIndex = (replacementIndex + 1) % MAX_NUM_SAMPLES;
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
                    var imageIndex = 0;
                    var image_tb = fearItemData.image_1_tb;
                    if (fearItemData.image_2_tb.length > 0) {
                        imageIndex = (Math.random() >= 0.5) ? 0 : 1;
                        if (imageIndex === 1) {
                            image_tb = fearItemData.image_2_tb;
                        }
                    }

                    $('.image-'+replacementIndex).attr('src',"/media/" + image_tb);
                    $('#blend-image-'+replacementIndex).attr('pk', newFearItem.pk);
                    $('#blend-image-'+replacementIndex).attr('imageIndex', imageIndex);
                    $("#image-" + replacementIndex + "-text").html(splitFearText(newFearItem.fields.fear_text));
                    $("#sub-image-div-" + replacementIndex).attr("pk", newFearItem.pk);
                }

                // replacementIndex = (replacementIndex + 1) % MAX_NUM_SAMPLES;
            }

            for (var i = 0; i < opacityCombinations.length; i++) {
                var combination = opacityCombinations[i];
                for (var j = 0; j < MAX_NUM_SAMPLES; j++) {
                    timeline.to("#blend-image-" + j, {
                        opacity: combination[j],
                        duration: DURATION,
                        ease: "power0",
                        onComplete: checkForReplace,
                        onCompleteParams: [j, combination[j]],
                    }, i * DURATION);
                }
            }

            var hovering = false;
            $("#blended-image-div").mouseenter(function(e) {
                hovering = true;
                timeline.pause();
            });

            $("#blended-image-div").mouseleave(function(e) {
                hovering = false;
                timeline.resume();
            })

            $(document).keypress(function(e) {
                // 32 = Spacebar
                var compositeData = {};
                var pk = 0;
                var opacity = 0;
                var src = "";
                if (e.which == 32 && hovering) {
                    for (var i = 0; i < MAX_NUM_SAMPLES; i++) {
                        pk = $("#blend-image-"+i).attr("pk");
                        opacity = $("#blend-image-"+i).css("opacity");
                        src = $("#blend-image-"+i).attr("src");
                        imageIndex = $("#blend-image-"+i).attr("imageIndex");
                        // compositeData[i] = {
                        //     pk: pk,
                        //     opacity: opacity,
                        // };
                        compositeData["pk-" + i] = pk;
                        compositeData["opacity-" + i] = opacity;
                        compositeData["imageIndex-" + i] = imageIndex;

                        $('#captured-image-'+i).css('opacity', opacity);
                        $('#captured-image-'+i).attr('src', src);
                    }
                    $("#captured-image-div").css("display", "block");
                    animateCSS('#captured-image-div', 'fadeIn');

                }
                $.ajax({
                    type: "POST",
                    url: "/add_composite/",
                    // data: JSON.stringify({"data":compositeData}),
                    data: compositeData,
                    success: function(data) {
                        if (data["success"]) {
                            $("#capture-success-modal").modal("show");
                            setTimeout(function(){
                                $("#capture-success-modal").modal('hide');
                            }, 1000);
                        }
                        console.log(data);
                    },
                    dataType: 'json'
                });
            });
        });
    } // mounted
});


