(function() { 

    var clients = [];

    function buildOptions() {
        $('select#clients option').remove();
        clients.forEach(function(d){ 
            var option = $('<option>').attr('value', d).text(d);
            $('select#clients').append(option);
        });
    }

    function updateValues() {
        data.forEach(function(d) {
            if (d.clients && d.clients.length) {
                var value = 0;
                d.clients.forEach(function(client) {
                    value += client[1];
                });
                d.value = value;
            }else{
                d.value = 0;
            }
        });
    }

    function iterateClients(onClient) {
        data.forEach(function(d) {
            if (d.clients && d.clients.length) {
                d.clients.forEach(onClient);
            }
        });
    }

    $(document).ready(function () {
        var format = d3.time.format("%m/%d/%y");
        var formFormat = d3.time.format("%Y-%m-%d");

        iterateClients(function(client) { 
            if (clients.indexOf(client[0]) < 0) {
                clients.push(client[0]);
            }
        });

        clients.sort();
        buildOptions();
        updateValues();

        $('form').submit(function(e) {
            e.preventDefault();
            e.stopPropagation();
            var name = $('#name').val();
            var date = $('#date').val();
            date = formFormat.parse(date);
            var amount = parseInt($('#amount').val());
            var type = $('#type').val();

            if (clients.indexOf(name) < 0) {
                var obj = _.find(data, {date: date, key: type});
                if (obj) {
                    if (!obj.clients) {
                        obj.clients = [];
                    }
                    obj.clients.push([name, amount]);
                    clients.push(name);
                    clients.sort();
                } else {
                    data.push({
                        date: date,
                        key: type,
                        clients: [[name, amount]]
                    });
                    var secondType = 'Setup';
                    if ( type  === 'Setup') {
                        secondType = 'Monthly';
                    }
                    data.push({
                        date: date,
                        key: secondType,
                        clients: []
                    });
                }
            } else {
                var obj = _.find(data, {date: date, key: type});
                if (obj) {
                    var clientArr = _.filter(obj.clients, function(client) {
                        return client[0] === name;
                    });
                    if (clientArr.length) {
                        clientArr[0][1] = amount;
                    } else {
                        obj.clients = [[name, amount]];
                    }
                } else {
                    data.push({
                        date: date,
                        key: type,
                        clients: [[name, amount]]
                    });
                    var secondType = 'Setup';
                    if ( type  === 'Setup') {
                        secondType = 'Monthly';
                    }
                    data.push({
                        date: date,
                        key: secondType,
                        clients: []
                    });
                }
            }
            data = _.sortBy(data, 'date');
            buildOptions();
            updateValues();
            updateGraph(data);
        });

        $('button#select_client').click(function() {
            var removableClient = $('option:selected').val();
            data.forEach(function(d) {
                if (d.clients && d.clients.length) {
                    var newClients = [];
                    d.clients.forEach(function(client) { 
                        if (client[0] !== removableClient) {
                            newClients.push(client);
                        }
                    });
                    d.clients = newClients;
                }
            });
            clients.splice(clients.indexOf(removableClient), 1);
            buildOptions();
            updateValues();
            updateGraph(data);
        });


        data.forEach(function (d) {
            d.date = format.parse(d.date);
        });

        var margin = {top: 40, right: 35, bottom: 20, left: 45},
            width = 960 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

        var formatDollar = d3.format("$0,000");

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));

        y.domain([0, d3.max(data, function (d) {
            return d.y0 + d.y;
        })]);

        var z = d3.scale.category20c();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.days).ticks(5);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(formatDollar);

        var stack = d3.layout.stack()
            .offset("zero")
            .values(function (d) { return d.values; })
            .x(function (d) { return d.date; })
            .y(function (d) { return d.value; });

        var nest = d3.nest()
            .key(function (d) { return d.key; });

        var area = d3.svg.area()
            .interpolate("monotone")
            .x(function (d) { return x(d.date); })
            .y0(function (d) { return y(d.y0); })
            .y1(function (d) { return y(d.y0 + d.y); });

        var svg = d3.select(".vis").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        var vis = svg.append("g");

        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
            return d.key + " : " + d.value; 
        });

        tip.direction(function(d) {
            var up = y(d.y + d.y0);
            if (up < 40) {
                return 's';
            }
            var left = x(d.date);
            if (left < 40) {
                return 'e';
            } else if ( left > (width - 40)) {
                return 'w';
            }
            return 'n';
        })

        vis.call(tip);

        function updateGraph(data) {
            var stack = d3.layout.stack()
                .offset("zero")
                .values(function (d) { return d.values; })
                .x(function (d) { return d.date; })
                .y(function (d) { return d.value; });

            var layers = stack(nest.entries(data));

            x.domain(d3.extent(data, function (d) {
                return d.date;
            }));
            xAxis.scale(x);

            y.domain([0, d3.max(data, function (d) {
                return d.y0 + d.y;
            })]);
            yAxis.scale(y);

            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            //vis.selectAll("path").remove();
            var paths = vis.selectAll("path").data(layers);

            paths.enter()
                .append("path")
                .attr("class", "layer")
                .style("fill", function (d, i) { return z(i); })
                .attr("d", function(d) {
                    var empty = [];
                    d.values.forEach(function(d) {
                        empty.push({
                            date: d.date,
                            y: 0,
                            y0: 0
                        });
                    });
                    return area(empty);
                })
                .transition()
                .duration(2000)
                .attr("d", function (d) {
                    return area(d.values);
                });

            vis.selectAll("path")
                .data(layers)
                .transition()
                .duration(2000)
                .attr("d", function (d) {
                    return area(d.values);
                });


            //vis.selectAll("circle").remove();
            var node = vis.selectAll("circle").data(data);
            node.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y(0); })
                .attr("r", 0)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .transition()
                .duration(2000)
                .attr("r", function (d) {
                    if ((d.y0 + d.y) > 0) {
                        return 2;
                    } else {
                        return 0;
                    }
                })
                .attr("cy", function (d) {
                    return y(d.y0 + d.y);
                })
                .attr("cx", function (d) {
                    return x(d.date);
                });

            vis.selectAll("circle").data(data)
                .transition()
                .duration(2000)
                .attr("r", function (d) {
                    if ((d.y0 + d.y) > 0) {
                        return 2;
                    } else {
                        return 0;
                    }
                })
                .attr("cy", function (d) {
                    return y(d.y0 + d.y);
                })
                .attr("cx", function (d) {
                    return x(d.date);
                });

            node.exit().remove();
        }

        updateGraph(data);

    });
}).call(null);
