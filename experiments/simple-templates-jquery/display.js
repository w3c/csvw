$(document).ready( function() {
  var massage = function(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var capitalize = function(val, context) {
    var uval = val.toLowerCase();
    return uval[0].toUpperCase() + uval.slice(1);
  }

  $("div#json").each(function(index) {
    var dataset = $(this).prop('dataset');
    var url     = dataset.url;
    var target  = $(this);
    var request = { url: dataset.url, format: $.CSV_format.JSON, filters: { capitalize: capitalize } };
    $.getCSV(request)
      .done( function(csv_data) {
        if( csv_data.errors.length !== 0 ) {
          target.append("<p>Error in processing the data:</p><ul>");
          csv_data.errors.forEach(function(e) {
            target.append("<li>" + e + "</li>");
          });
          target.append("</ul>");
        } else {
          target.append("<pre>" + massage(csv_data.data) + "</pre>"); 
          $("div#meta").append("<pre>" + JSON.stringify(csv_data.meta,null,2) + "</pre>")          
        }
      })
      .fail( function(status, error) {
        target.append("<p>CSV access failed: '" + status + ", " + error + "'</p>")
      });
  });
  $("div#turtle").each(function(index) {
    var dataset = $(this).prop('dataset');
    var url     = dataset.url;
    var target  = $(this);
    var request = { url: dataset.url, format: "turtle", filters: { capitalize: capitalize }};
    $.getCSV(request)
      .done( function(csv_data) {
        // console.log(csv_data);
        if( csv_data.errors.length !== 0 ) {
          target.append("<p>Error in processing the data:</p><ul>");
          csv_data.errors.forEach(function(e) {
            target.append("<li>" + e + "</li>");
          });
          target.append("</ul>");
        } else {
          target.append("<pre>" + massage(csv_data.data) + "</pre>"); 
        }
      })
      .fail( function(status, error) {
        target.append("<p>CSV access failed: '" + status + ", " + error + "'</p>")
      });
  });
});


