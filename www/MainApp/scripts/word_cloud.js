var app = new Vue({
    delimiters: ['[[', ']]'],
    el: '#main',
    data: {
        fear_item: null,
        modal_fear_item: null,
    },
    mounted: function() {
        var self = this;

        var min_links = getUrlParameter("min_links");
        var max_words = getUrlParameter("max_words");
        if (min_links == null) {
            min_links = 2;
        }
        if (max_words == null) {
            max_words = 50;
        }

        $.getJSON( "/get_word_cloud/", {min_links: min_links, max_words: max_words}, function( data ) {
            console.log(data);
            var num_words = data.length;
            console.log("Num words = " + num_words);

            const scale = d3.scaleOrdinal(d3.schemeCategory10);
            function color(d) {
                return scale(d.wordIndex/num_words);
            }

            function drag(simulation) {

                function dragstarted(d) {
                    if (!d3.event.active) {
                        simulation.alphaTarget(0.3).restart();
                    }
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function dragended(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }

            var width = 640,
                height = 480;

            // Dictionary of fear_item private keys to index in nodes array
            var pkToIndexDict = {}
            var wordToIndexDict = {}

            var nodes = [
                {
                    x:width/3,
                    y: "50%",
                    group:0,
                    word:"Mapping Fear",
                    isRoot:true
                },
            ]
            var links = [];

            var currentIndex = 1;
            for (var i = 0; i < data.length; i++) {
                var word = data[i].word;
                nodes[currentIndex] = {
                    "word": word,
                    "wordIndex": i,
                    "numChildren": data[i].fear_items.length,
                    // "groupTotal": i+1,
                    // "count": 1,
                    // "isWord": true,
                }
                wordToIndexDict[word] = currentIndex;
                links.push({ source: 0, target: currentIndex });
                currentIndex++;
            }

            for (var i = 0; i < data.length; i++) {
                var word_cloud_datum = data[i];
                var word = word_cloud_datum.word;
                var fear_items = word_cloud_datum.fear_items;

                var sourceIndex = wordToIndexDict[word];

                for (var j = 0; j < fear_items.length; j++) {
                    var fear_item = fear_items[j];
                    if (!(fear_item.pk in pkToIndexDict)) {
                        // fear_item.groupTotal = i;
                        // fear_item.count = 1;
                        nodes[currentIndex] = fear_item;
                        pkToIndexDict[fear_item.pk] = currentIndex;
                        currentIndex++;
                    }
                    // else {
                    //     nodes[wordToIndexDict[fear_item.pk]].groupTotal += i;
                    //     nodes[pkToIndexDict[fear_item.pk]].groupTotal += i;
                    //     nodes[pkToIndexDict[fear_item.pk]].count += 1;
                    // }

                    var targetIndex = pkToIndexDict[fear_item.pk]
                    links.push({ source: sourceIndex, target: targetIndex });
                }
            }

            console.log(nodes);
            console.log(links);

            var width = $("#cloud-div").width();
            var height = $("#cloud-div").height();

            const simulation = d3.forceSimulation(nodes)
                // .force("link", d3.forceLink(links).id(d => d.id))
                .force("link", d3.forceLink(links))
                .force("charge", d3.forceManyBody().strength(function(d) {
                        if (d.word) {
                            return -350;
                        }
                        else {
                            return -120;
                        }
                    })
                )
                .force("center", d3.forceCenter(width/2, height/2));

            const svg = d3.select("#cloud-div").append("svg")
                .style("background-color", "white")
                .attr("height", "100%")
                .attr("width", "100%");
            var container = svg.append("g");

            // Retrieve the template data from the HTML (jQuery is used here).
            var template = $('#tooltip-template').html();

            // Compile the template data into a function
            var templateScript = Handlebars.compile(template);

            /* Initialize tooltip */
            const tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
                console.log(d);
                return templateScript({
                    fear_item: d.fields,
                    fear_text_present: d.fields.fear_text.length > 1,
                    fear_text: d.fields.fear_text.split('\n'),
                    fear_colors_text_present: d.fields.fear_colors_text.length > 1,
                    fear_colors_text: d.fields.fear_colors_text.split('\n'),
                });
            });

            tip.direction(function(d) {
                var transformStr = container.attr("transform");
                var translate = [0,0];
                if (transformStr) {
                    translate = transformStr.substring(transformStr.indexOf("(")+1, transformStr.indexOf(")")).split(",");
                    translate = translate.map(function(d) {
                        return parseInt(d);
                    })
                }

                var y = d.y + translate[1];
                console.log(d.y, translate[1]);
                console.log(y)
                if (y < 250) {
                    return 's';
                }
                else {
                    return 'n';
                }
            })

            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on("zoom", function() { container.attr("transform", d3.event.transform); })
            );
            /* Invoke the tip in the context of your visualization */
            svg.call(tip);

            const link = container.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => Math.sqrt(d.value));

            const node = container.selectAll("g.node")
                .data(nodes)
                .join("g")
                .attr("class", function(d) {
                    // Is word node
                    if (d.word) {
                        return "node word-node";
                    }
                    // Is fear item node
                    else if (d.fields) {
                        return "node fear-node";
                    }
                })
                .style("cursor", "pointer")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .call(drag(simulation))
                .filter(".word-node")
                .append("text")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.word;
                })
                .style("font-size", function(d) {
                    var font_size = Math.cbrt(d.numChildren) * 10;
                    return font_size + "px";
                })
                .attr("fill", function(d) {
                    return color(d);
                });

            var adjlist = [];

            links.forEach(function(d) {
                adjlist[d.source.index + "-" + d.target.index] = true;
                adjlist[d.target.index + "-" + d.source.index] = true;
            });

            function neigh(a, b) {
                return a == b || adjlist[a + "-" + b];
            }

            function focus(d) {
                var index = d3.select(d3.event.target).datum().index;
                if (d.fields) {
                    self.fear_item = d.fields;
                }
                container.selectAll(".node").style("opacity", function(o) {
                    if (o.index == 0 && o.index !== index) { // ROOT
                        return 0.1;
                    }

                    return neigh(index, o.index) ? 1 : 0.1;
                });
                link.style("opacity", function(o) {
                    if (o.source.index == 0 && index != 0) { // ROOT
                        return 0.1;
                    }

                    return o.source.index == index || o.target.index == index ? 1 : 0.1;
                });
            }

            function unfocus() {
               container.selectAll(".node").style("opacity", 1);
               link.style("opacity", 1);
            }

            container.selectAll(".fear-node")
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

            container.selectAll(".node").on("click", function(d) {
                focus(d);

                if (d3.event.shiftKey) {
                    self.modal_fear_item = d.fields;
                    console.log(self.modal_fear_item);
                    $("#fear-description-modal").modal();
                    $("#fear-description-modal").modal('show');
                }

                d3.event.stopPropagation();
            });

            svg.on("click", function(d) {
                unfocus();
                // console.log("container!!");
            });

                // .append("circle")
                // .attr("stroke", "#fff")
                // .attr("stroke-width", 1.5)
                // .attr("r", 5)
                // .attr("cx", 0)
                // .attr("cy", 0)
                // .attr("fill", function(d) {
                //     // Is word node
                //     if (d.word) {
                //         return "black";
                //     }
                //     // Is fear item node
                //     else if (d.fields) {
                //         return color(d);
                //     }
                // });

            var imageWidth = 25;
            var imageRadius = imageWidth/2;

            container.selectAll(".fear-node")
                .append("clipPath")
                .attr('id', function(d, i) {
                    return "clip" + i
                })
                .append("circle")
                .attr("r", imageRadius);


            container.selectAll(".fear-node")
                .append("image")
                .attr("href",  function(d) {
                    return "/media/" + d.fields.image_1_tb;
                })
                .attr("class", "fear-image")
                .attr("x", function(d) { return -imageRadius;})
                .attr("y", function(d) { return -imageRadius;})
                .attr("height", imageWidth)
                .attr("width", imageWidth)
                .attr("clip-path", function(d, i) {
                    return "url(#clip" + i + ")"
                });

            node.append("title")
                .text(d => d.id);

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                container.selectAll("g.node")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            });

        });
    }
})
