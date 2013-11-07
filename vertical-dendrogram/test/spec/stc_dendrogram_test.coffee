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

$container = $('<div/>').attr('height', 500)

describe "dendrogram", ->
  beforeEach ->
    runs =>
      require ['d3', "stc_dendrogram"], (@d3, @graph)=>
        spyOn(@d3.layout, 'tree').andCallThrough()

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
        expect(@d3.layout.tree).toHaveBeenCalled()

