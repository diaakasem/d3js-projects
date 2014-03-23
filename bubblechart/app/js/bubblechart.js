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
            top: 50,
            right: 40,
            bottom: 20,
            left: 40
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

        // Creating scales and Axises
        x = d3.scale.linear().range([margin.left, width - margin.right]);
        y = d3.scale.linear().range([height - margin.bottom - 20, margin.top + 20]);
        r = d3.scale.linear().range([0, radius]);
        r.domain([0, _.max(data.volume)]);

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
            if (strikesMode) {
                var maxR = 2 * r(_.max(option.volume) / optionVolumeScale);
                var maxStrike = y.invert(y(strike) - maxR);
                strikeMaxPrice = Math.max(strikeMaxPrice, maxStrike);
            } else {
                strikeMaxPrice = Math.max(strikeMaxPrice, strike + _.max(option.price));
            }
        });

        _.each(data.putPricesByStrike, function(option, key) {
            var strike = parseInt(key, 10);
            if (strike < minPrice || strike > maxPrice) {
                return;
            }
            if (strikesMode) {
                var maxR = 2 * r(_.max(option.volume) / optionVolumeScale);
                var minStrike = y.invert(y(strike) + maxR);
                strikeMinPrice = Math.min(strikeMinPrice, minStrike);
            } else {
                strikeMinPrice = Math.min(strikeMinPrice, strike - _.min(option.price));
            }
        });

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function(d) {
                return moment(d).format("HH:mm");
            });

        x.domain([xStart, xEnd]);
        if (strikesMode) {
            y.domain([strikeMinPrice, strikeMaxPrice]);
        } else {
            y.domain([Math.floor(strikeMinPrice), Math.ceil(strikeMaxPrice)]);
        }

        var svg = d3.select(configs.selector).append("svg")
            //.attr("viewBox", -(margin.left) + " " + (-1 * margin.top ) + " " + (configs.width + margin.right) + " " + (configs.height + margin.bottom))
            .attr("viewBox", "0 0 " + configs.width + " " + (configs.height))
            .attr("xmlns","http://www.w3.org/2000/svg");

        var headerSvg = svg.append("g").attr("class", "header-svg")
            .attr("viewBox", margin.left + " 0 " +
                    (configs.width - margin.left) + " " +
                    margin.top);

        var mainSvg = svg.append("g")
            .attr("class", "main-svg")
            .attr("viewBox", margin.left + " " + margin.top + " " +
                    (configs.width - margin.left - margin.right) + " " +
                    (configs.height - margin.top - margin.bottom));

        var footerSvg = svg.append("g").attr("class", "text-svg")
            .attr("viewBox", margin.left + " " +
                    (configs.height - margin.bottom) + " " +
                    (configs.width - margin.left - margin.right) + " " +
                    margin.bottom);

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
            .attr("marker-start", function(d) { return "url(#axisLeftArrow)"; })
            .attr("marker-end", function(d) { return "url(#axisLeftArrow)"; });

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
                if (!strikesMode && (price < strikeMinPrice || price > strikeMaxPrice)) {
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

            mainSvg.append("text")
                .attr("class", "strike-text")
                .attr("transform", "translate(" + (x(xStart) - margin.left) + ", " + (y(strike) + 5) + ")")
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
                if (!strikesMode && (price < strikeMinPrice || price > strikeMaxPrice)) {
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

        // Mean Text
        mainSvg.append("text")
            .attr("class", "mean-value-text")
            .attr("transform", "translate(" + (x(xEnd) + margin.right) + ", " + (y(data.meanPrice)) + ")")
            .style("text-anchor", "start")
            .text((data.meanPrice || 0).toFixed(2));

        mainSvg.append("text")
            .attr("class", "mean-text")
            .attr("transform", "translate(" + (x(xEnd) + margin.right) + ", " + (y(data.meanPrice) + 15) + ")")
            .style("text-anchor", "start")
            .text("VWAP");

        // Company Underlying Text
        headerSvg.append("text")
            .attr("class", "underlying-text")
            .attr("transform", "translate(" + (x(xStart) - margin.left) + ", " + (margin.top - 15) + ")")
            .style("text-anchor", "start")
            .text(data.underlying);

        headerSvg.append("text")
            .attr("class", "underlying-company-name-text")
            .attr("transform", "translate(" + (x(xStart) - margin.left) + ", " + margin.top + ")")
            .style("text-anchor", "start")
            .text(data.underlyingCompanyName);

        // Time
        headerSvg.append("text")
            .attr("class", "time-text")
            .attr("transform", "translate(" + (x(xEnd) + margin.left + margin.right) + ", " + 10 + ")")
            .style("text-anchor", "end")
            .text(moment(data.time).format('HH:mm:ss'));

        headerSvg.append("text")
            .attr("class", "daily-price-text")
            .attr("transform", "translate(" + (x((xStart + xEnd) / 2.0) - 10) + ", " + 20 + ")")
            .style("text-anchor", "end")
            .text(data.price);

        headerSvg.append("text")
            .attr("class", "daily-price-change-text")
            .attr("transform", "translate(" + (x((xStart + xEnd) / 2.0) + 10) + ", " + 20 + ")")
            .style("text-anchor", "start")
            .text(data.priceChange);

        if (data.priceChange < 0 ) {
            downArrow(headerSvg, x((xStart + xEnd) / 2.0), 15, 8, 20);
        } else { 
            upArrow(headerSvg, x((xStart + xEnd) / 2.0), 15, 8, 20);
        }

         // Lower table
        var body = footerSvg.append("foreignObject")
            .attr("class", "footer-text")
            .attr("x", 0)
            .attr("y", configs.height - margin.bottom - 50)
            .attr("width", configs.width - margin.left)
            .attr("height", 50);

        function toFixed(float) {
            return (float * 100).toFixed(1);
        }
        var firstRow = body.append("xhtml:div")
            .attr("class", "first-row");

        var secondRow = body.append("xhtml:div")
            .attr("class", "second-row");

        firstRow.append("xhtml:span")
            .attr("class", "first-span")
            .html("&Delta;t = " + (data.timeStep / 1000 / 60) + " minutes");

        var secondSpan = firstRow.append("xhtml:span")
            .attr("class", "second-span");
        secondSpan.append("xhtml:span")
            .style("text-decoration", "overline")
            .html("IV");
        secondSpan.append("xhtml:sub")
            .html("c");
        secondSpan.append("xhtml:span")
            .text(" = " + toFixed(data.callVolatilityModel.meanIV) + " % ");

        secondRow.append("xhtml:span")
            .attr("class", "first-span")
            .html("&sigma; = " + toFixed(data.sigma) + " % ");

        var forthSpan = secondRow.append("xhtml:span")
            .attr("class", "forth-span");
        forthSpan.append("xhtml:span")
            .style("text-decoration", "overline")
            .html("IV");
        forthSpan.append("xhtml:sub")
            .html("p");
        forthSpan.append("xhtml:span")
            .text(" = " + toFixed(data.putVolatilityModel.meanIV) + " % ");

        var defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "axisLeftArrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 3)
            .attr("refY", -4)
            .attr("markerWidth", 20)
            .attr("markerHeight", 15)
            .attr("orient", 180)
            .append("path")
            .attr("class", 'forecastArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");
    };
}(window));
