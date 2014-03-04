(function(global) {

    "use strict";
    var renderData, forecastData, shadingData;

    /**
    * Draws a line graph using d3js
    * @param data The array of object to use to draw the graph
    * @param configs of the graph
    */
    global.ComplexLine = function (data, configs) {
        // Default configs
        if (_.isUndefined(configs)) {
            configs = {margin: {}};
        }

        shadingData = [];

        var margin = _.extend({top: 20, right: 20, bottom: 30, left: 50}, configs.margin),
            width = (configs.width || $(window).width()) - margin.left - margin.right,
            height = (configs.height || $(window).height()) - margin.top - margin.bottom;

        var payoutX = d3.scale.linear().range([0, width]);
        var payoutY = d3.scale.linear().range([height, 0]);

        // TODO: change this to 1/3 of the view
        var pdfX = d3.scale.linear().range([0, width]);
        var pdfY = d3.scale.linear().range([height, 0]);

        var payoutXAxis = d3.svg.axis().scale(payoutX).orient("bottom");
        var payoutYAxis = d3.svg.axis().scale(payoutY).orient("left");

        var pdfXAxis = d3.svg.axis().scale(pdfX).orient("bottom");
        var pdfYAxis = d3.svg.axis().scale(pdfY).orient("left");

        var linePayout = d3.svg.line()
            .x(function(d) { return payoutX(d.price); })
            .y(function(d) { return payoutY(d.payout); })
            .interpolate("linear");

        var linePdf = d3.svg.line()
            .x(function(d) { return pdfX(d.price); })
            .y(function(d) { return pdfY(d.pdf); })
            .interpolate("monotone");

        var shadedPayout = d3.svg.line()
            .x(function(d) { return payoutX(d.price); })
            .y(function(d) { return payoutY(d.payout); })
            .interpolate("linear");

        var shadedPdf = d3.svg.line()
            .x(function(d) { return pdfX(d.price); })
            .y(function(d) { return pdfY(d.pdf); })
            .interpolate("monotone");

        payoutX.domain([data.scale.minPrice, data.scale.maxPrice]);
        payoutY.domain([data.scale.minPayout, data.scale.maxPayout]);

        pdfX.domain([data.scale.minPrice, data.scale.maxPrice]);
        pdfY.domain([0, 1]);

        var svg = d3.select(configs.selector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var mainSvg = svg.append("g")
            .attr("class", "mainSvg")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var pdfSvg = mainSvg.append("g").attr("class", "pdfSvg");
        var forecastSvg = mainSvg.append("g").attr("class", "forecastSvg");
        var payoutSvg = mainSvg.append("g").attr("class", "payoutSvg");

        // Used to mark the area of hover
        var payoutRect = payoutSvg.append('rect')
            .attr('x', payoutX(_.min(data.prices)))
            .attr('y', 0)
            .style('fill', 'blue')
            .style('opacity', 0)
            .attr('width', payoutX(_.max(data.prices)) - payoutX(_.min(data.prices)))
            .attr('height', margin.top + height);

        payoutSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + payoutY(0) + ")")
            .call(payoutXAxis)
            .attr("marker-end", function(d) { return "url(#forecastArrow)"; });

        payoutSvg.append("text")
            .attr("class", "xText")
            .attr("transform", "translate(" + width + "," + (payoutY(0) + 20) + ")")
            .style("text-anchor", "end")
            .text("Price (USD)");

        payoutSvg.append("g")
            .attr("class", "y axis")
            .call(payoutYAxis)
            .attr("marker-end", function(d) { return "url(#forecastArrow)"; });

        payoutSvg.append("text")
            .attr("class", "yText")
            .attr("transform", "translate(0," + (height / 2) + "), rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "center")
            .text("Return (USD)");

        renderData = _.map(data.prices, function(price, i) {
            return {
                price: price,
                pdf: data.pdf[i],
                cdf: data.cdf[i],
                payout: data.payout[i]
            };
        });

        var lastArray = [];
        _.each(renderData, function(point, i) {
            if (point.payout >= 0) {
                lastArray.push(point);
            } else {
                if (lastArray.length) {
                    shadingData.push(lastArray);
                    lastArray = [];
                }
            }
        });
        if (lastArray.length) {
            shadingData.push(lastArray);
            lastArray = [];
        }
        var lastArray = _.last(shadingData);
        var firstArray = _.first(shadingData);
        var lastPoint = _.last(lastArray);
        var firstPoint = _.first(firstArray);
        lastArray.push({
            payout: 0,
            price: lastPoint.price,
            pdf: 0,
            cdf: lastPoint.cdf
        });

        firstArray.unshift({
            payout: 0,
            price: firstPoint.price,
            pdf: 0,
            cdf: lastPoint.cdf
        });

        payoutSvg.append("path")
            .datum(renderData)
            .attr("class", "linePayout")
            .attr("d", linePayout);

        pdfSvg.append("path")
            .datum(renderData)
            .attr("class", "linePdf")
            .attr("d", linePdf);

        _.each(shadingData, function(points) {

            payoutSvg.append("path")
                .datum(points)
                .attr("class", "shadedPayout")
                .attr("d", shadedPayout);

            pdfSvg.append("path")
                .datum(points)
                .attr("class", "shadedPdf")
                .attr("d", shadedPdf);
        });


        /**********************************
         * Hover line and tooltip
         **********************************/

        var hoverLineGroup = svg.append("g").attr("class", "hoverLine");
        var lineHover = hoverLineGroup
            .append("line")
            .attr("class", "lineHover")
            .attr("x1", 0).attr("x2", 0) 
            .attr("y1", margin.top).attr("y2", height + margin.top );

        hoverLineGroup.append('circle')
            .attr("class", "pdfCircle")
            .attr("opacity", 1)
            .attr("r", 5)
            .attr("cx", 0)
            .attr("cy", 0);

        hoverLineGroup.append('circle')
            .attr("class", "payoutCircle")
            .attr("opacity", 1)
            .attr("r", 5)
            .attr("cx", 0)
            .attr("cy", 0);

        var tooltip = d3.select(configs.selector)
            .append("div")
            .attr("class", "tooltip")               
            .style("opacity", 0);

        hoverLineGroup.style("opacity", 1e-6);

        /**
         * Formats a single entry in the tooltip
         */
        function formatEntry(key, value) {
            var html = '<div class="entry">';
            html += '<span class="left">' + key + '</span>';
            html += '<span class="right">' + value + '</span>';
            html += "</div>";
            return html;
        }

        /**
         * Sets the tooltip html content with the data relative to the passed
         * point
         */
        function setTooltip(point) {
            var html = '';
            html += formatEntry('Price', '$' + point.price.toFixed(2));
            html += formatEntry('ROM', (point.payout / data.margin).toFixed(2) + "%");
            html += formatEntry('Prob >', (1 - point.cdf).toFixed(2) + "%");
            html += formatEntry('Prob <', point.cdf.toFixed(2) + "%");
            html += formatEntry('SD', ((point.price - data.forecast) / data.sd).toFixed(2));
            tooltip.html(html);
            tooltip.transition().duration(200).style("opacity", 0.9);
        }

        function mouseover(d) {
            hoverLineGroup.style("opacity", "1");
        }

        function mouseout(d) {
            hoverLineGroup.style("opacity", 1e-6);
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        }

        var find = _.memoize(function (price) {
            var begin = 0, end = renderData.length - 1;
            var pivot, e;
            while(true) {
                pivot = Math.round((begin + end) / 2);
                e = renderData[pivot];
                if (end === pivot || begin === pivot) {
                    break;
                }
                if (e.price === price) {
                    break;
                }
                if (e.price < price) { begin = pivot; }
                if (e.price > price) { end = pivot; }
            }
            return renderData[begin];
        });

        function mousemove(d) {
            if (!d3.event) {
                return;
            }
            var x = d3.event.pageX - margin.left - 8;
            var price = payoutX.invert(x);
            var point = find(price);
            hoverLineGroup.attr('transform', 'translate(' + (payoutX(point.price) + margin.left) + ', 0)');
            hoverLineGroup.select(".payoutCircle").attr("cy", (payoutY(point.payout) + margin.top));
            hoverLineGroup.select(".pdfCircle").attr("cy", (pdfY(point.pdf) + margin.top));
            setTooltip(point);

            tooltip.style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px");    
        }

        payoutRect.on('mousemove', mousemove)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        /***************************
         * Forecast Related Charting
         ***************************/
        forecastData = _.map(data.forecastLine.prices, function(price, i) {
            var bold = (i >= data.forecastLine.startPriceIndex && i <= data.forecastLine.endPriceIndex);
            if (!bold) {
                return null;
            }
            return {
                price: price,
                payout: data.forecastLine.payout
            };
        });
        forecastData = _.compact(forecastData);

        var forecastMinPrice = _.min(data.forecastLine.prices);
        var forecastMaxPrice = _.max(data.forecastLine.prices);
        var forecastY = payoutY(data.forecastLine.payout);
        var forecastX = d3.scale.linear().range([payoutX(forecastMinPrice), payoutX(forecastMaxPrice)]);
        forecastX.domain([forecastMinPrice, forecastMaxPrice]);
        var forecastXAxis = d3.svg.axis().scale(forecastX).orient("bottom");
        forecastXAxis.tickValues(data.forecastLine.prices);
        var lineForecast = d3.svg.line()
            .x(function(d) { return forecastX(d.price); })
            .y(function(d) { return forecastY; })
            .interpolate("linear");

        svg.append("defs").selectAll("marker")
            .data(["forecastArrow"])
            .enter().append("marker")
            .attr("id", function(d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 3)
            .attr("orient", "auto")
            .append("path")
            .attr("class", 'forecastArrow')
            .attr("d", "M0,-5L10,0L0,5L2.5,0");

        forecastSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + forecastY + ")")
            .call(forecastXAxis);

        forecastSvg.append("path")
            .datum(forecastData)
            .attr("class", "forecastLine")
            .attr("d", lineForecast)
            .attr("marker-end", function(d) { return "url(#forecastArrow)"; });

        forecastSvg.append("circle")
            .attr("class", "forecastDot")
            .attr("r", '5')       
            .attr("cx", forecastX(data.forecastLine.prices[data.forecastLine.startPriceIndex]))
            .attr("cy", forecastY);

        forecastSvg.append("text")
            .attr("class", 'forecastText')
            .attr("x", forecastX(forecastMaxPrice) + 20)
            .attr("y", forecastY + 10)
            .text("F");

        forecastSvg.append("text")
            .attr("class", 'forecastSubText')
            .attr("x", forecastX(forecastMaxPrice) + 30)
            .attr("y", forecastY + 16)
            .text(data.forecastLine.forecastLevel);
    };
}).call(null, window);
