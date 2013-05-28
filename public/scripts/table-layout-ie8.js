$(function(){
  var nestedTables = $('.table-layout .table-layout');
  var windowHeight = $(window).height();
  var count = nestedTables.length;
  nestedTables.each(function(){
    var $this = $(this);
    var minHeight = $this.height();
    $this.data('minHeight', minHeight);
    $this.height($this.parent().height());
  });
  $(window).resize(function() {
    nestedTables.each(function(){
      var $this = $(this);
      var minHeight = $this.data('minHeight');
      var newWindowHeight = $(window).height();
      var delta = (newWindowHeight - windowHeight) / count;
      windowHeight = newWindowHeight;
      var h = $this.parent().height();
      if (delta < 0) {
        if (minHeight < h + delta) $this.height(h + delta);
      } else {
        $this.height(h);
      }
    });
  }); 
});