describe('dendrogram', function() { 
    it('should work', function() {
        assert.equal(-1, [1,2,3].indexOf(5));
    });
});
stoicReady(1, function() {
  define('stc_dendrogram_test', ['stc_dendrogram'], function(chart) {
      console.log('hi');
  });
});
