# global define, stoicReady, _ 

# jshint indent: false, unused: false 
stoicReady 1, ->
  "use strict"
  define "stc_dendrogram", ["d3", "utils"], (d3, utils) ->
    perspective = identifier: "stc_dendrogram"
    perspective.bind = ($scope, $container, demoData) ->
      self = this
      try
        clean = (node) ->
          node = _(node).cloneDeep()
          delete node.x0
          delete node.x
          delete node.y0
          delete node.y
          delete node.hasChildren
          delete node.children
          delete node._children
          delete node.parent
          delete node.parentLink
          delete node.depth
          delete node.color
          node

        $content = $("<div>").addClass("stc-dendrogram-perspective").addClass("dendrogram").appendTo($container)
        $content.height $container.outerHeight()
        $content.width $container.outerWidth()
        $container.css
          "overflow-x": "auto"
          "overflow-y": "auto"

        
        # The following fields are hard-coded for that demo purposes
        parentField = "parentId"
        iconField = "icon"
        positionField = "position"
        colorField = "color"
        data = undefined
        d3content = d3.select($content.get(0))
        space = 160
        canClick = true
        centerNode = undefined
        centerNodeName = undefined
        top = 100
        ratio = 1
        duration = 500
        okToDrag = false
        nodes = undefined
        _w = $content.outerWidth()
        _h = $content.outerHeight() - 20
        dragging = null
        elementSelected = undefined
        nodeSelected = undefined
        oldH = _h
        newH = undefined
        blankNode = {}
        nodeCentral = undefined
        
        #========================================== DATABASE LISTENER
        self.onRecordUpdate = (record) ->

        # Disabled on that demo
        self.onRecordCreate = (record) ->
        
        # Disabled on that demo
        self.onRecordRemove = (id) ->
        
        # Disabled on that demo
        
        #========================================== LAYOUT DEFINITION
        tree = d3.layout.tree().size([_h, _w]).sort((a, b) ->
          d3.ascending getPosition(a), getPosition(b)
        )
        diagonal = d3.svg.diagonal().projection((d) ->
          [d.x, d.y]
        )
        
        #========================================== SVG CONSTRUCTION
        vis = d3content.append("svg:svg").attr("width", "100%").attr("height", "100%").append("svg:g").attr("transform", "translate(" + 10 + "," + top + ")")
        g = $content.children("svg").children("g:first-child")
        
        #========================================== COLORS FROM CSS
        fullColor = utils.getColor(".COLORS.blue")
        emptyColor = utils.getColor(".COLORS.white")
        
        #========================================== UTILITY FUNCTIONS
        getName = (d) ->
          name = d.name
          (if (name) then name else "")

        # Trim a name by ending it with '…'
        compact = (name) ->
          size = 16
          if name.length <= size
            name
          else
            name.substring(0, size) + "…"

        setName = (d, name) ->
          d.name = name
          update d

        getColor = (d) ->
          if colorField
            setColor d, fullColor  unless d[colorField]
            utils.getColor d[colorField]
          else
            fullColor

        setColor = (d, color) ->
          d[colorField] = color

        getPosition = (d) ->
          d[positionField] = utils.hash(getName(d))  unless d[positionField]
          d[positionField]

        setPosition = (d, pos, persist) ->
          d[positionField] = pos  if pos isnt getPosition(d)

        getMidPosition = (up, down) ->
          unless up
            getPosition(down) / 2
          else unless down
            getPosition(up) * 2
          else
            (getPosition(up) + getPosition(down)) / 2

        getParentId = (d) ->
          if d.parent
            getId d.parent
          else
            (if (d[parentField]) then d[parentField] else "")

        getId = (d) ->
          (if (d and d.id) then d.id else null)

        moveSvg = (callback) ->
          oldHeight = $content.height()
          newHeight = top + (maxY + 1) * space
          if newHeight >= _h
            $content.stop()
            $content.animate
              height: newHeight
            , duration
            if newHeight > oldHeight
              $container.animate
                scrollDown: newHeight
              , duration
          else if newHeight < _h
            $content.animate
              height: _h
            , duration
          newPos = (if (newHeight > _h / 2 and maxY > 1) then minY * space + top else top)
          d3g = d3.select(g[0])
          trans = getTranslationXY(d3g)
          if newPos isnt trans.y
            d3g.transition().duration(duration).attr("transform", "translate(" + trans.x + "," + newPos + ")").each "end", callback
          else callback()  if callback

        yTranslation = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/
        getTranslationXY = (d) ->
          parts = yTranslation.exec(d.attr("transform"))
          x: parseInt(parts[1], 10)
          y: parseInt(parts[2], 10)

        removeNode = (d, callback) ->
          if d.parent and d.parent.children
            p = d.parent
            c = p.children
            l = p.children.length
            i = 0

            while i < l
              if getId(c[i]) is getId(d)
                c.splice i, 1
                break
              i++
            update d, callback

        addNode = (d, newParent) ->
          d.parent = newParent
          d[parentField] = clean(newParent).id or null
          d.depth = newParent.depth + 1
          unless newParent.hasChildren
            newParent.hasChildren = true
            newParent.children = [d]
            update newParent
          else if not newParent.children and not newParent._children
            computeChildren newParent, ->
              onCircleClick newParent

          else if not newParent.children and newParent._children
            newParent._children.push d
            onCircleClick newParent
            canClick = true
          else if newParent.children
            newParent.children.push d
            update newParent

        computeRoot = (d, callback) ->
          k = 0
          nb = 0
          id = ((if (d) then getId(d) else null))
          children = _(demoData).filter((node) ->
            node[parentField] is id
          ).value()
          l = children.length
          centerNodeName = root.name
          if d
            centerNodeName = getName(d)
            centerNode = d
          temp = $("<span>").text(compact(centerNodeName)).appendTo($content)
          top = 25 + temp.height()
          temp.remove()
          
          # case1: One unique ancestor
          if id is null and l is 1
            child = children[0]
            root.id = child.id
            computeRoot child, callback
          
          # case2: Multiple ancestors
          else if l > 0
            children.forEach (child) ->
              
              # Set the hasChildren attribute to the new children
              computeHasChildren child, ->
                child.parent = root
                root.children.push child
                callback()  if ++nb is l


          else
            callback()

        
        # fetch and assign the children to a node (and hide them)
        computeChildren = (d, callback) ->
          try
            
            # Only compute children if it has not been before
            if d.hasChildren and not d.children and not d._children
              id = getId(d) or null
              nb = 0
              children = _(demoData).filter((node) ->
                node[parentField] is id
              ).value()
              l = children.length
              children.forEach (child) ->
                
                # Set the hasChildren attribute to the new children
                computeHasChildren child, ->
                  if ++nb is l
                    d._children = children
                    callback()


            else
              callback()
          catch err
            self.error err

        
        # Simplified function for demo purposes
        computeHasChildren = (d, callback) ->
          hasChildren = _(demoData).filter((node) ->
            node[parentField] is d.id
          ).value().length > 0
          d.hasChildren = hasChildren
          callback hasChildren

        toggleAll = (d) ->
          if d.children or d.children
            d.children.forEach toggleAll
            toggle d

        toggle = (d) ->
          if d.children
            d._children = d.children
            d.children = null
          else
            d.children = d._children
            d._children = null
          console.log d

        getIcon = (d) ->
          d[iconField]  if iconField and d[iconField]

        setIcon = (d, icon) ->
          d[iconField] = icon

        createIcon = (d, element) ->
          
          #jshint bitwise: false
          toLeft = not d.toLeft ^ d.hasChildren
          
          #jshint bitwise: true
          foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")
          $(element).children("foreignObject").remove()
          $fo = $(foreignObject)
          $body = $(document.createElement("body")) # you cannot create bodies with .apend("<body />") for some reason
          $fo.attr("x", (if (toLeft) then "0.5em" else "-1.7em")).attr("y", "-0.85em").attr("width", "2em").attr("height", "2em").append $body
          $body.css
            "background-color": "transparent"
            color: getColor(d)
            overflow: "hidden"
            padding: 0

          $body.append "<i class=\"" + getIcon(d) + "\"></i>"
          $fo.appendTo element
          $fo

        onCircleClick = (d, callback) ->
          try
            if canClick
              canClick = false
              toggle d
              update d, ->
                canClick = true
                callback()  if callback

          catch e
            self.error e

        maxY = 0
        minY = 0
        update = (source, callback) ->
          try
            
            # Compute the new tree layout.
            nodes = tree.nodes(root)
            console.log "New nodes:", nodes
            root.x = _w / 2 - space
            nb = 0
            d = undefined
            len = nodes.length
            maxY = 0
            hasChildren = ->
              d.y = d.depth * space
              d.x = d.x * ratio + space
              
              # d.dy = null;
              # d.dx = null;
              maxY = d.depth  if d.depth > maxY
              if ++nb is len
                moveSvg()
                nodesComputed root, source, nodes, callback

            i = 0

            while i < len
              d = nodes[i]
              computeHasChildren d, hasChildren
              i++
          catch e
            self.error e

        nextUp = undefined
        nextDown = undefined
        nextPlace = undefined
        currentRow = 0
        dragAndDrop = (d, x, y) ->
          newNextUp = undefined
          newNextDown = undefined
          row = undefined
          diff = undefined
          oldDiffD = undefined
          oldDiffU = undefined
          row = Math.ceil((y - space / 2) / space)
          if row isnt 0
            if currentRow isnt row
              currentRow = row
              newNextUp = null
              newNextDown = null
            oldDiffD = 10000
            oldDiffU = -10000
            nodes.forEach (node) ->
              if Math.abs(currentRow) is node.depth and not node.isBlank
                diff = node.x - y
                if diff > 0 and diff < oldDiffD
                  newNextDown = node
                  oldDiffD = diff
                else if diff < 0 and diff > oldDiffU
                  newNextUp = node
                  oldDiffU = diff

            if (getId(newNextUp) isnt getId(nextUp) or getId(newNextDown) isnt getId(nextDown)) and (newNextUp or newNextDown)
              
              # A new valid position !
              nextUp = newNextUp
              nextDown = newNextDown
              nextPlace = nextUp or nextDown
              removeNode blankNode
              blankNode =
                isBlank: true
                parent: nextPlace.parent
                depth: nextPlace.depth
                id: "___blank"
                x: 0
                y: 0
                x0: 0
                y0: 0

              setPosition blankNode, getMidPosition(nextUp, nextDown)
              addNode blankNode, nextPlace.parent

        dx = 0
        dy = 0
        initPos = undefined
        timerDrag = undefined
        elementDragged = undefined
        nodesComputed = (root, source, nodes, onEndCallback, onClickCallback) ->
          try
            end = false
            
            # Update the nodes
            node = vis.selectAll("g.node.right").data(nodes.slice(1), (d) ->
              getId d
            )
            
            # Edit the classes so it is not fetched by tree.nodes()
            nodeEnter = node.enter().append("svg:g").attr("class", "node right").attr("transform", (d) ->
              "translate(" + source.x0 + "," + source.y0 + ")"
            ).attr("opacity", (d) ->
              (if (d.isBlank) then 0 else 1)
            ).on("click", (d, i, onClickCallback) ->
              if canClick
                elementSelected.classed "highlighted", false  if elementSelected
                elementSelected = d3.select(this)
                elementSelected.classed "highlighted", true
                nodeSelected = d
                id = getId(d)
                if d.hasChildren
                  unless d.children
                    computeChildren d, ->
                      onCircleClick d, onClickCallback

                  else
                    onCircleClick d, onClickCallback
            ).call(d3.behavior.drag().on("drag", (d) ->
              elementDragged = d3.select(this)  unless elementDragged
              unless dragging
                dx = 0
                dy = 0
                dragging = d
                initPos = getTranslationXY(elementDragged)
                elementDragged.attr "class", "node"
                $(this).css "pointer-events", "none"
                d3.select(d.parentLink).attr "opacity", 0
                removeNode d
              dx += d3.event.dx
              dy += d3.event.dy
              if dragging
                dragAndDrop d, initPos.x + dx, initPos.y + dy
                elementDragged.attr "transform", "translate(" + (initPos.x + dx) + "," + (initPos.y + dy) + ")"
            ).on("dragend", (d) ->
              if dragging
                $(this).css "pointer-events", "auto"
                elementDragged.attr "class", "node right"
                d3.select(this).attr("opacity", 1).transition().duration(duration / 2).attr "opacity", 0
                dragging = null
                elementDragged = null
                if nextPlace
                  setPosition d, getMidPosition(nextUp, nextDown), true
                  addNode d, nextPlace.parent
                else
                  addNode d, d.parent
                removeNode blankNode
            )).each((d) ->
              createIcon d, this  if getIcon(d)
            )
            nodeEnter.append("svg:circle").attr("r", 1e-6).style("stroke", (d) ->
              getColor d
            ).style "fill", (d) ->
              (if (not d.children and d.hasChildren) then getColor(d) else emptyColor)

            nodeEnter.append("svg:title").text getName
            
            #.style('fill', function(d) {var c = getColor(d); if(c === fullColor) {c = '';} return c;})
            
            #.attr('class', function(d) { return getIcon(d); })
            nodeEnter.append("svg:text").attr("x", (d) ->
              s = (if (getIcon(d)) then 25 else 10)
              (if d.hasChildren then -s else s)
            ).attr("dy", ".35em").attr("text-anchor", (d) ->
              (if d.hasChildren then "end" else "start")
            ).attr("transform", (d) ->
              (if d.hasChildren then "rotate(0)" else "rotate(30)")
            ).text((d) ->
              compact getName(d)
            ).style "fill-opacity", 1e-6
            
            # Transition nodes to their new position.
            nodeUpdate = node.transition().duration(duration).attr("transform", (d) ->
              "translate(" + d.x + "," + d.y + ")"
            ).each((d) ->
              createIcon d, this  if getIcon(d)
            ).each("end", ->
              unless end
                end = true
                onEndCallback source  if typeof onEndCallback is "function"
            )
            nodeUpdate.select("circle").attr("r", 4.5).style("stroke", (d) ->
              getColor d
            ).style "fill", (d) ->
              (if (not d.children and d.hasChildren) then getColor(d) else emptyColor)

            nodeUpdate.select("text").text((d) ->
              compact getName(d)
            ).style "fill-opacity", 1
            
            # Transition exiting nodes to the parent's new position.
            nodeExit = node.exit().transition().duration(duration).attr("transform", (d) ->
              "translate(" + source.x + "," + source.y + ")"
            ).each("end", ->
              unless end
                end = true
                onEndCallback source  if typeof onEndCallback is "function"
            ).remove()
            nodeExit.select("circle").attr "r", 1e-6
            nodeExit.select("text").style "fill-opacity", 1e-6
            
            # Update the links…
            link = vis.selectAll("path.link.right").data(tree.links(nodes), (d) ->
              getId d.target
            )
            
            # Enter any new links at the parent's previous position.
            link.enter().insert("svg:path", "g").attr("class", "link right").attr("d", (d) ->
              o =
                x: source.x0
                y: source.y0

              diagonal
                source: o
                target: o

            ).attr("opacity", (d) ->
              (if (d.target.isBlank) then 0 else 1)
            ).each((d) ->
              d.target.parentLink = this
            ).transition().duration(duration).attr "d", diagonal
            
            # Transition links to their new position.
            link.transition().duration(duration).attr("d", diagonal).attr "opacity", (d) ->
              (if (d.target.isBlank) then 0 else 1)

            
            # Transition exiting nodes to the parent's new position.
            link.exit().transition().duration(duration).attr("d", (d) ->
              o =
                x: source.x
                y: source.y

              diagonal
                source: o
                target: o

            ).remove()
            
            # Stash the old positions for transition.
            nodes.forEach (d) ->
              d.x0 = d.x
              d.y0 = d.y

          catch e
            self.error e

        
        #================================== INITIALIZATION
        onNodeCentralClicked = ->
          canClick = true
          unless isNodeCentralClicked
            minY = 0
            maxY = 0
          isNodeCentralClicked = not isNodeCentralClicked

        isNodeCentralClicked = false
        nodeCentral = vis.append("svg:g").attr("id", "nodeCentral").attr("class", "node root").attr("transform", ->
          "translate(" + (_w / 2) + "," + 0 + ")"
        ).on("click", (d) ->
          if canClick
            elementSelected.classed "highlighted", false  if elementSelected
            elementSelected = d3.select(this)
            elementSelected.classed "highlighted", true
            nodeSelected = null
            canClick = false
            circleCentral.transition().duration(500).style "fill", (d) ->
              (if not isNodeCentralClicked then fullColor else emptyColor)

            toggle root
            update root, ->
              onNodeCentralClicked()

        )
        $content.find("#nodeCentral").hide()
        circleCentral = nodeCentral.append("svg:circle").attr("r", 4.5).style("stroke", fullColor).style("fill", emptyColor)
        onRootsComputed = ->
          nodeCentral.append("svg:title").text centerNodeName
          
          #.attr('transform', 'rotate(' + 30 + ')')
          nodeCentral.append("svg:text").attr("x", ->
            (if (getIcon(root)) then -25 else -10)
          ).attr("dy", ".35em").attr("text-anchor", "end").text(compact(centerNodeName)).attr("opacity", 1e-6).transition().duration(duration / 2).attr "opacity", 1

        
        #=========================================================== PERSPECTIVE CREATION ENTRY POINT
        rootId = _(demoData).find(parentId: null).id
        rootName = _(demoData).find(parentId: null).name
        root =
          id: rootId
          name: rootName
          children: []
          hasChildren: true
          x0: _w / 2
          y0: 0

        computeRoot root, ->
          console.log root
          $content.find("#nodeCentral").show()
          update root, onRootsComputed

      catch err
        perspective.error err

    perspective.unbind = (callback) ->
      
      # Unbind all custom listeners and clean if needed
      callback()

    perspective


