respecEvents.sub("save", function() {
  $("a").not( $("div.head a") ).each( function(index) {
    var href = $(this).attr("href");
    for( var i = 0; i < conversions.length; i++ ) {
      var to_be_replaced = conversions[i][0];
      var replacement    = conversions[i][1];
      if( href.indexOf(to_be_replaced) !== -1 ) {
        var new_href = href.replace(to_be_replaced,replacement);
        $(this).attr("href", new_href)
        if( $(this).text().indexOf(to_be_replaced) !== -1 ) {
          $(this).text(replacement);
        }
        break;
      }
    }
  })
});
