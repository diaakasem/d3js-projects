define ["d3", "lodash"], (d3, _) ->

  parent = d3.select("#chart")
  config =
    width: parent.style('width')[..-3]
    height: parent.style('height')[..-3]

  load = (path, cb)->
    days =
      name: "Days"
      children: []

    d3.csv path, (e, data)->
      map = (data, field)->
        data = _.filter data, field
        grouped = _.groupBy data, field
        _.map grouped, (arr, name)->
          name: name
          children: if arr.length > 0 then _.map(arr, (e)-> _.omit(e, field)) else []

      days.children = map data, 'DATE'
      _.each days.children, (date)->
        date.children = if date then map date.children, 'TIME' else []
        _.each date.children, (time)->
          time.children = if time then  map time.children, 'EVENTTYPE' else []
          _.each time.children, (eventtype)->
            eventtype.children = if eventtype then map eventtype.children, 'EVENT' else []
            _.each eventtype.children, (event)->
              event.children = if event  then map event.children, 'ADDITIONALDETAILS' else []
              _.each event.children, (details)->
                details.children = []


      cb days

  animate = (data)->
  
    w = config.width
    h = config.height
    i = 0
    duration = 500
    root = undefined

    update = (source) ->
      # Compute the new tree layout.
      nodes = tree.nodes(root).reverse()
      
      # Update the nodes…
      node = vis.selectAll("g.node").data(nodes, (d) ->
        d.id or (d.id = ++i)
      )
      nodeEnter = node.enter()
        .append("svg:g")
        .attr("class", "node")
        .attr "transform", (d)-> "translate(#{source.y0}, #{source.x0})"
      
      # Enter any new nodes at the parent's previous position.
      nodeEnter.append("svg:circle")
        .attr("r", 4.5)
        .style("fill", (d)-> (if d._children then "lightsteelblue" else "#fff"))
        .on "click", click
      
      nodeEnter.append("svg:text")
        .attr("x", 8)
        .attr("y", 3)
        .text (d) -> d.name
      
      # Transition nodes to their new position.
      nodeEnter.transition()
        .duration(duration)
        .attr("transform", (d) -> "translate(#{d.y}, #{d.x})")
        .style("opacity", 1)
        .select("circle")
        .style "fill", "lightsteelblue"

      node.transition()
        .duration(duration)
        .attr("transform", (d) -> "translate(#{d.y}, #{d.x})")
        .style "opacity", 1

      node.exit()
        .transition()
        .duration(duration)
        .attr("transform", (d)-> "translate(#{source.y}, #{source.x})")
        .style("opacity", 1e-6)
        .remove()

      # Update the links…
      link = vis.selectAll("path.link")
        .data(tree.links(nodes), (d) -> d.target.id)
      
      linkEnterExit = (d)->
        o =
          x: source.x0
          y: source.y0

        diagonal
          source: o
          target: o

      # Enter any new links at the parent's previous position.
      link.enter()
        .insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", linkEnterExit)
        .transition()
        .duration(duration)
        .attr "d", diagonal
      
      # Transition links to their new position.
      link.transition().duration(duration).attr "d", diagonal
      
      # Transition exiting nodes to the parent's new position.
      link.exit()
        .transition()
        .duration(duration)
        .attr("d", linkEnterExit)
        .remove()
      
      # Stash the old positions for transition.
      nodes.forEach (d) ->
        d.x0 = d.x
        d.y0 = d.y

    toggleAll = (d) ->
      if d.children
        d.children.forEach toggleAll
        toggle d

    toggle = (d)->
      if d.children
        d._children = d.children
        d.children = null
      else
        d.children = d._children
        d._children = null

    click = (d) ->
      toggle d
      update d

    tree = d3.layout.tree().size([h, w - 160])
    diagonal = d3.svg.diagonal().projection((d) -> [d.y, d.x])

    vis = d3.select("#chart")
      .append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .append("svg:g")
      .attr("transform", "translate(40,0)")

    exec = (json)->
      root = json
      json.x0 = 800
      json.y0 = 0
      root.children.forEach toggleAll
      update root

    d3.select(self.frameElement).style "height", "2000px"

    exec data
    
  render = (data)->
    width = config.width
    height = config.height

    cluster = d3.layout.cluster().size [height, width - 160]
    diagonal = d3.svg.diagonal().projection (d)-> [d.y, d.x]
    svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(40,0)")

    exec = (root)->
      nodes = cluster.nodes(root)
      links = cluster.links(nodes)
      link = svg.selectAll(".link").data(links).enter()
                .append("path")
                .attr("class", "link")
                .attr("d", diagonal)

      node = svg.selectAll(".node").data(nodes).enter()
                .append("g")
                .attr("class", "node")
                .attr "transform", (d)-> "translate(#{d.y}, #{d.x})"

      node.append("circle").attr "r", 4.5
      node.append("text").attr("dx", 8).attr("dy", 3).style("text-anchor", (d) ->
        (if d.children then "end" else "start")
      ).text (d) ->
        d.name

    d3.select(self.frameElement).style "height", "#{height}px"
    exec data

  load: load
  render: render
  animate: animate
  config: config
