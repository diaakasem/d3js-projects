$(document).ready(function() {
    d3.json("data/config-example.json", function(err, configs) {
        if (err) {
            throw err;
        }
        d3.json("data/input-example.json", function(err, data) {
            if (err) {
                throw err;
            }
            BubbleChart(data, configs);
        });
    });
});
