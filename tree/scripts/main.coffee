requirejs.config
  baseUrl: "scripts"
  paths:
    d3: "//cdnjs.cloudflare.com/ajax/libs/d3/3.3.9/d3.min"
    lodash: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.2.1/lodash.min"
  shim:
    d3:
      exports: 'd3'

module = (app)->
  app.load '../sample_data.csv', app.animate

# Start the main app logic.
requirejs ["app"], module

