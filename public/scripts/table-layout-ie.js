$(function(){
  var rows = $('.table-layout>.table-layout-row.expand');
  var cols = $('.table-layout>.table-layout-col.expand, .table-layout>.table-layout-row>.table-layout-col.expand');
  if (rows.length === 0 && cols.length === 0) return;
  var owh = $(window).height();
  var oww = $(window).width();
  
  rows.each(function(){
    var $this = $(this);
    $this.data('minHeight', $this.height());
    $parent = $this.parent();
    var ph = $parent.height();
    var pph = $parent.parent().height();
    if (ph < pph) {
      var dh = $parent.data('deltaHeight');
      if (dh == null) {
        var count = $parent.children('.table-layout-row.expand').length;
        dh = (pph - ph) / count;
        $parent.data('deltaHeight', dh);
        $parent.data('expandedRowCount', count);
      }
      $this.height($this.height()+dh);
    }
    $this.data('trackedHeight', $this.height());
  });
  
  $('.table-layout .table-layout').css('height', '100%');
  
  cols.each(function(){
    var $this = $(this);
    $this.data('minWidth', $this.width());
    $parent = $this.parent();
    var dw = $parent.data('deltaWidth');
    if (dw == null) {
      var aw = $parent.data('availWidth');
      if (aw == null) {
        aw = $parent.width();
        $parent.children('.table-layout-col').each(function(){ aw -= $(this).width(); });
        $parent.data('availWidth', aw);
      }
      var count = $parent.children('.table-layout-col.expand').length;
      dw = aw / count;
      $parent.data('deltaWidth', dw);
      $parent.data('expandedColCount', count);
      console.log('aw:'+aw);
    }
    console.log('dw:'+dw);
    if (dw > 0) $this.width($this.width()+dw);
    $this.data('trackedWidth', $this.width());
  });
  
  $(window).resize(function expand() {
    var wh = $(window).height();
    var ww = $(window).width();
    var dh = wh - owh;
    var dw = ww - oww;
    owh = wh;
    oww = ww;
    
    if (dh !== 0 ) rows.each(function(){
      var $this = $(this);
      var h = $this.data('trackedHeight');
      var minh = $this.data('minHeight');
      //console.log('ds: '+ds);
      //console.log('h: ' + (h + dh +ds));
      dh = dh / $this.parent().data('expandedRowCount');
      var th = h + dh;
      $this.data('trackedHeight', th);
      if (th < minh) $this.height(minh);
      else $this.height(th);
    });
    
    if (dw !== 0) cols.each(function(){
      var $this = $(this);
      var w = $this.data('trackedWidth');
      var minw = $this.data('minWidth');
      dw = dw / $this.parent().data('expandedColCount');
      var tw = w + dw;
      $this.data('trackedWidth', tw);
      if (tw < minw) $this.width(minw);
      else $this.width(tw);
    });
  });
  
});