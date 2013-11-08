demoData = [
  {id:'flags', name:'Flags', parentId:null},
    {id:'france', name:'France', parentId:'flags', color:'#FF0000', position: 1},
      {id:'fr_blue', name:'Parisian Blue', parentId:'france', color: '#0055A4', position: 1},
      {id:'fr_white', name:'Royal White', parentId:'france', color: '#ddd', position: 2},
      {id:'fr_red', name:'Republican Red', parentId:'france', color: '#EF4135', position: 3},
    {id:'usa', name:'United States', parentId:'flags', color:'#00A200', position: 2},
      {id:'usa_white', name:'White', parentId:'usa', color: '#ddd', position: 1},
      {id:'usa_red', name:'Old Glory Red', parentId:'usa', color: '#B22234', position: 2},
      {id:'usa_blue', name:'Old Glory Blue', parentId:'usa', color: '#3C3B6E', position: 3},
]

$container = $('<div/>').css
  'height': 500
  'width': 500

describe "dendrogram", ->
  beforeEach ->
    runs =>
      require ['d3', "stc_dendrogram"], (@d3, @graph)=>
        @treeLayout = @d3.layout.tree()
        spyOn(@d3.layout, 'tree').andCallFake =>
          spyOn(@treeLayout, 'size').andCallThrough()
          spyOn(@treeLayout, 'sort').andCallThrough()
          @treeLayout

        @diagonal = @d3.svg.diagonal()
        spyOn(@d3.svg, 'diagonal').andCallFake =>
          spyOn(@diagonal, 'projection').andCallThrough()
          @diagonal

    waitsFor -> @graph

  it "should not be null", ->
    runs ->
      expect(@graph).toBeDefined()

  it "should have a bind graph", ->
    runs ->
      expect(@graph.bind).toBeDefined()

  describe "layout", ->
    it "should have create a tree layout", ->
      runs ->
        @graph.bind {}, $container, demoData
        expect(@d3.layout.tree).toHaveBeenCalled()

    it "should have create a tree layout with the correct width and height", ->
      runs ->
        @graph.bind {}, $container, demoData
        expect(@treeLayout.size).toHaveBeenCalledWith([480, 500])

    it 'should have create a sorted tree layout', ->
      runs ->
        @graph.bind {}, $container, demoData
        expect(@treeLayout.sort).toHaveBeenCalledWith jasmine.any Function

  describe 'diagonal projection', ->
    it 'should be created', ->
      runs ->
        @graph.bind {}, $container, demoData
        expect(@d3.svg.diagonal).toHaveBeenCalled()

    it 'should create a projection', ->
      runs ->
        @graph.bind {}, $container, demoData
        expect(@diagonal.projection).toHaveBeenCalled()

