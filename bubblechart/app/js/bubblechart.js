(function(global) {

    "use strict";
    var mainPoints, callPoints, putPoints, forecastData, shadingData, radius;

    function pointsFor(x, y, r, points, svg, cssClass) {
        var circles = svg.append("g").attr("class", "points");
        circles.selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("class", cssClass)
            .attr("r", function(d) { return r(d.volume); })
            .attr("cx", function(d) { return x(d.time); })
            .attr("cy", function(d) { return _.isFunction(y) ? y(d.price) : d.y; });
    }

    function downArrow(svg, x, y, width, height) {

        var w = (width / 2);
        var h = (height / 2);
        var startX = x - w;
        var startY = y - h;
        var data = [
        {x: startX + (w/2), y: startY},
        {x: startX + width - (w/2), y: startY},
        {x: startX + width - (w/2), y: startY + height - (height / 3)},
        {x: startX + width, y: startY + height - (height / 3)},
        {x: x, y: startY + height},
        {x: startX, y: startY + height - (height / 3)},
        {x: startX + (w/2), y: startY + height - (height / 3)},
        {x: startX + (w/2), y: startY}
        ];

        var lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        svg.append("path")
            .attr("d", lineFunction(data))
            .attr("fill", "black");
    }

    function upArrow(svg, x, y, width, height) {
        var w = (width / 2);
        var h = (height / 2);
        var startX = x - w;
        var startY = y + h;
        var data = [
        {x: startX + (w/2), y: startY},
        {x: startX + width - (w/2), y: startY},
        {x: startX + width - (w/2), y: startY - height + (height / 3)},
        {x: startX + width, y: startY - height + (height / 3)},
        {x: x, y: startY - height},
        {x: startX, y: startY - height + (height / 3)},
        {x: startX + (w/2), y: startY - height + (height / 3)},
        {x: startX + (w/2), y: startY}
        ];

        var lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        svg.append("path")
            .attr("d", lineFunction(data))
            .attr("fill", "black");
    }

    /**
    * Draws a line graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.BubbleChart = function (data, configs) {
        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        // Adding defaults to the configs
        _.defaults(configs || {}, {
            width: $(window).width(),
            height: $(window).height(),
            strikes_mode: false,
            default_radius: 10,
            optionVolumeScale: 0.1
        });

        var margin = _.defaults(configs.margins || {}, {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        });

        // Declaring data and adding defaults
        var width = configs.width - margin.left - margin.right,
            height = configs.height - margin.top - margin.bottom,
            strikesMode = !configs.useOptionPrice,
            radius = configs.default_radius,
            optionVolumeScale = configs.optionVolumeScale,
            x, y, r;

        if (_.isUndefined(configs.selector)){
            throw "Please, set the selector where the graph should show up.";
        }

        // Defining limits
        var xStart = _.min(data.times);
        var xEnd = _.max(data.times);
        var minPrice = _.min(data.prices);
        var maxPrice = _.max(data.prices);
        var strikeMinPrice = minPrice;
        var strikeMaxPrice = maxPrice;

        _.each(data.callPricesByStrike, function(option, key) {
            var strike = parseInt(key, 10);
            if (strike < minPrice || strike > maxPrice) {
                return;
            }
            strikeMaxPrice = Math.max(strikeMaxPrice, _.max(option.price) + strike);
        });

        _.each(data.putPricesByStrike, function(option, key) {
            var strike = parseInt(key, 10);
            if (strike < minPrice || strike > maxPrice) {
                return;
            }
            strikeMinPrice = Math.min(strikeMinPrice, strike - _.min(option.price));
        });

        // Creating scales and Axises
        x = d3.scale.linear().range([margin.left, width - margin.right]);
        y = d3.scale.linear().range([height - margin.bottom, margin.top]);
        r = d3.scale.linear().range([0, radius]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function(d) {
                return moment(d).format("HH:mm");
            });

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .outerTickSize(0);

        x.domain([xStart, xEnd]);
        y.domain([Math.floor(strikeMinPrice), Math.ceil(strikeMaxPrice)]);
        r.domain([0, _.max(data.volume)]);

        var svg = d3.select(configs.selector).append("svg")
            .attr("viewBox", "0 0 " + configs.width + " " + configs.height)
            .attr("xmlns","http://www.w3.org/2000/svg");

        var mainSvg = svg.append("g")
            .attr("class", "mainSvg")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var textSvg = svg.append("g")
            .attr("class", "text-svg")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        mainPoints = _.map(data.prices, function(price, i) {
            return {
                price: price,
                time: data.times[i],
                volume: data.volume[i]
            };
        });

        mainSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + y(data.meanPrice) + ")")
            .call(xAxis)
            .select("path")
            .attr("marker-end", function(d) { return "url(#axisRightArrow)"; });

        pointsFor(x, y, r, mainPoints, mainSvg, 'underlying-price-point');

        _.each(data.callPricesByStrike, function(value, key) {
            var strike = parseInt(key, 10);
            var callY = y;

            if (strike < minPrice || strike > maxPrice) {
                return;
            }

            if (strikesMode) {
                callY = null;
            }

            var callPoints = _.compact(_.map(value.price, function(price, i) {
                var volume = value.volume[i] / optionVolumeScale;
                price = strike + price;
                if (price < strikeMinPrice || price > strikeMaxPrice) {
                    return null;
                }
                return {
                    price: price,
                    time: value.time[i],
                    volume: volume,
                    y: y(strike) + r(volume)
                };
            }));

            if (!callPoints.length) {
                return;
            }

            mainSvg.append("line")
                .attr("class", "x axis call")
                .attr("x1", x(xStart))
                .attr("y1", y(strike))
                .attr("x2", x(xEnd))
                .attr("y2", y(strike));

            var css = 'call-' + strike + '-volume-point';
            pointsFor(x, callY, r, callPoints, mainSvg, css, strike);

            textSvg.append("text")
                .attr("class", "strike-text")
                .attr("transform", "translate(" + (x(xStart) - 20) + ", " + (y(strike) + 5) + ")")
                .style("text-anchor", "start")
                .text(strike);
        });

        _.each(data.putPricesByStrike, function(value, key) {
            var strike = parseInt(key, 10);
            var putY = y;

            if (strike < minPrice || strike > maxPrice) {
                return;
            }

            if (strikesMode) {
                putY = null;
            }

            var putPoints = _.compact(_.map(value.price, function(price, i) {
                var volume = value.volume[i] / optionVolumeScale;
                price = strike - price;
                if (price < strikeMinPrice || price > strikeMaxPrice) {
                    return null;
                }
                return {
                    price: price,
                    time: value.time[i],
                    volume: volume,
                    y: y(strike) - r(volume)
                };
            }));

            if (!putPoints.length) {
                return;
            }

            var css = 'put-' + strike + '-volume-point';
            pointsFor(x, putY, r, putPoints, mainSvg, css, strike);
        });

        textSvg.append("text")
            .attr("class", "underlying-text")
            .attr("transform", "translate(" + x(xStart) + ", 0)")
            .style("text-anchor", "start")
            .text(data.underlying);

        textSvg.append("text")
            .attr("class", "underlying-company-name-text")
            .attr("transform", "translate(" + x(xStart) + ", 15)")
            .style("text-anchor", "start")
            .text(data.underlyingCompanyName);

        textSvg.append("text")
            .attr("class", "time-text")
            .attr("transform", "translate(" + x(xEnd) + ", 0)")
            .style("text-anchor", "end")
            .text(moment(data.time).format('HH:mm:ss'));

        textSvg.append("text")
            .attr("class", "daily-price-text")
            .attr("transform", "translate(" + (x((xStart + xEnd) / 2.0) - 10) + ", 0)")
            .style("text-anchor", "end")
            .text(data.price);

        textSvg.append("text")
            .attr("class", "daily-price-change-text")
            .attr("transform", "translate(" + (x((xStart + xEnd) / 2.0) + 10) + ", 0)")
            .style("text-anchor", "start")
            .text(data.priceChange);

        if (data.priceChange < 0 ) {
            downArrow(textSvg, x((xStart + xEnd) / 2.0), 0, 8, 20);
        } else { 
            upArrow(textSvg, x((xStart + xEnd) / 2.0), 0, 8, 20);
        }

         // Lower table
        var body = textSvg.append("foreignObject")
            .attr("class", "footer-text")
            .attr("x", x(xStart))
            .attr("y", height - 200)
            .attr("width", width - margin.left - margin.right)
            .attr("height", 200);

        body.append("xhtml:div")
            .text("&Delta;t = 60 minutes");
        body.append("xhtml:div")
            .text("IV = 60 minutes");
        body.append("xhtml:div")
            .text("&Delta;t = 60 minutes");
        body.append("xhtml:div")
            .text("&Delta;t = 60 minutes");

        
        var defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "forecastArrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 3)
            .attr("orient", "auto")
            .append("path")
            .attr("class", 'forecastArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");

        // Need a separate marker in order to color differently
        // http://stackoverflow.com/a/16665510
        defs.append("marker")
            .attr("id", "axisRightArrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 4)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 9)
            .attr("orient", "0")
            .append("path")
            .attr("class", 'axisArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");

        defs.append("marker")
            .attr("id", "axisUpArrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 4)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 9)
            .attr("orient", "270")
            .append("path")
            .attr("class", 'axisArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");

        defs.append("marker")
            .attr("id", "axisDownArrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 4)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 9)
            .attr("orient", "90")
            .append("path")
            .attr("class", 'axisArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");

    };
}(window));
