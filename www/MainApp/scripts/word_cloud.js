var app = new Vue({
    delimiters: ['[[', ']]'],
    el: '#description-div',
    data: {
        fear_item: null,
    },
    mounted: function() {
        var self = this;
        $.getJSON( "/get_word_cloud/", function( data ) {

            const scale = d3.scaleOrdinal(d3.schemeCategory10);
            function color(d) {
                return scale(d.groupTotal/d.count);
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
                    "groupTotal": i+1,
                    "count": 1,
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
                        fear_item.groupTotal = i;
                        fear_item.count = 1;
                        nodes[currentIndex] = fear_item;
                        pkToIndexDict[fear_item.pk] = currentIndex;
                        currentIndex++;
                    }
                    else {
                        nodes[pkToIndexDict[fear_item.pk]].groupTotal += i;
                        nodes[pkToIndexDict[fear_item.pk]].count += 1;
                    }

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
                            return -250;
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
            svg.call(
                d3.zoom()
                    .scaleExtent([.1, 4])
                    .on("zoom", function() { container.attr("transform", d3.event.transform); })
            );

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
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .call(drag(simulation))
                .filter(".word-node")
                .append("text")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.word;
                })
                .style("font-size", "10px")
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
                    return neigh(index, o.index) ? 1 : 0.1;
                });
                link.style("opacity", function(o) {
                    return o.source.index == index || o.target.index == index ? 1 : 0.1;
                });
            }

            function unfocus() {
               container.selectAll(".node").style("opacity", 1);
               link.style("opacity", 1);
            }

            container.selectAll(".node").on("mouseover", focus).on("mouseout", unfocus);

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
