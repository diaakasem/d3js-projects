(function(global) {

    "use strict";
    var mainPoints, callPoints, putPoints, forecastData, shadingData;

    function pointsFor(x, y, r, points, svg, cssClass) {
        var circles = svg.append("g").attr("class", "points");
        circles.selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("class", cssClass)
            .attr("r", function(d) { return r(d.volume); })
            .attr("cx", function(d) { return x(d.time); })
            .attr("cy", function(d) { return y(d.price); });
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
        _.defaults(configs || {}, {width: $(window).width(), height: $(window).height()});
        var margin = _.defaults(configs.margins || {}, {top: 20, right: 20, bottom: 20, left: 20});
        var width = configs.width - margin.left - margin.right,
            height = configs.height - margin.top - margin.bottom;

        if (_.isUndefined(configs.selector)){
            throw "Please, set the selector where the graph should show up.";
        }

        var x = d3.scale.linear().range([margin.left, width - margin.right]);
        var y = d3.scale.linear().range([height - margin.bottom, margin.top]);
        // max radius is 20px
        var r = d3.scale.linear().range([0, 10]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickValues(data.strikes)
            .orient("top")
            .outerTickSize(0);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .outerTickSize(0);

        x.domain([_.min(data.times), _.max(data.times)]);
        y.domain([_.min(data.prices) - 2, _.max(data.prices) + 2]);
        r.domain([_.min(data.volume), _.max(data.volume)]);

        var svg = d3.select(configs.selector).append("svg")
            .attr("viewBox", "0 0 " + configs.width + " " + configs.height);

        var mainSvg = svg.append("g")
            .attr("class", "mainSvg")
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

        pointsFor(x, y, r, mainPoints, svg, 'underlying-price-point');

        _.each(data.callPricesByStrike, function(value, key) {
            var strike = parseInt(key, 10);
            var callY = d3.scale.linear().range([y(strike), y(strike + 1)]);
            callY.domain([_.min(value.price), _.max(value.price)]);
            var callPoints = _.map(value.price, function(price, i) {
                return {
                    price: price,
                    time: value.time[i],
                    volume: data.volume[i] || 100  // TODO: CHECK VOLUME WITH KEVIN
                };
            });
            var css = 'call-' + strike + '-volume-point';
            pointsFor(x, callY, r, callPoints, svg, css);

            var callXAxis = d3.svg.axis()
                .scale(x)
                .tickValues(data.strikes)
                .orient("top")
                .outerTickSize(0);

            mainSvg.append("g")
                .attr("class", "x axis put")
                .attr("transform", "translate(0, " + y(strike) + ")")
                .call(callXAxis)
                .select("path")
                .attr("marker-end", function(d) { return "url(#axisRightArrow)"; });
        });

        _.each(data.putPricesByStrike, function(value, key) {
            var strike = parseInt(key, 10);
            var putY = d3.scale.linear().range([y(strike), y(strike - 1)]);
            putY.domain([_.min(value.price), _.max(value.price)]);
            var putPoints = _.map(value.price, function(price, i) {
                return {
                    price: price,
                    time: value.time[i],
                    volume: data.volume[i] || 100  // TODO: CHECK VOLUME WITH KEVIN
                };
            });
            var css = 'put-' + strike + '-volume-point';
            pointsFor(x, putY, r, putPoints, svg, css);

            var putXAxis = d3.svg.axis()
                .scale(x)
                .tickValues(data.strikes)
                .orient("top")
                .outerTickSize(0);

            mainSvg.append("g")
                .attr("class", "x axis put")
                .attr("transform", "translate(0, " + y(strike) + ")")
                .call(putXAxis)
                .select("path")
                .attr("marker-end", function(d) { return "url(#axisRightArrow)"; });
        });


        //payoutSvg.append("text")
            //.attr("class", "xText")
            //.attr("transform", "translate(" + width + "," + (payoutY(0) + 20) + ")")
            //.style("text-anchor", "end")
            //.text("Price (USD)");

        //mainSvg.append("text")
            //.attr("class", "yText")
            //.attr("transform", "translate(-85," + (height / 2) + "), rotate(-90)")
            //.attr("y", 6)
            //.attr("dy", ".71em")
            //.style("text-anchor", "middle")
            //.text("Return (USD)");

            // TEXT
        //_.each(data.longStrikes, function(longStrike) {
            //var longTick = payoutSvg.append("g")
                //.attr("class", "longTick")
                //.attr("transform", "translate(" + payoutX(longStrike) + "," + (payoutY(0) - 1) + ")");

            //longTick.append("path")
                //.attr("transform", "translate(0,-5)")
                //.attr("d", d3.svg.symbol().type("triangle-down"));

            //longTick.append("text")
                //.attr("y", -14)
                //.style("text-anchor", "middle")
                //.text(longStrike.toFixed(2));
        //});

        //_.each(data.shortStrikes, function(shortStrike) {
            //var shortTick = payoutSvg.append("g")
                //.attr("class", "shortTick")
                //.attr("transform", "translate(" + payoutX(shortStrike) + "," + (payoutY(0) + 1) + ")");

            //shortTick.append("path")
                //.attr("transform", "translate(0,5)")
                //.attr("d", d3.svg.symbol().type("triangle-up"));

            //shortTick.append("text")
                //.attr("y", 14)
                //.attr("dy", ".71em")
                //.style("text-anchor", "middle")
                //.text(shortStrike.toFixed(2));
        //});

        //var forecastX = d3.scale.linear().range([payoutX(forecastMinPrice), payoutX(forecastMaxPrice)]);
        //forecastX.domain([forecastMinPrice, forecastMaxPrice]);
        //var forecastXAxis = d3.svg.axis().scale(forecastX).orient("bottom");
        //forecastXAxis.tickValues(data.forecastLine.prices);
        //var lineForecast = d3.svg.line()
            //.x(function(d) { return forecastX(d.price); })
            //.y(function(d) { return forecastY; })
            //.interpolate("linear");

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
