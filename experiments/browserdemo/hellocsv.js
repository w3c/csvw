

 function escHTML(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

 var rowToHtml = function( row ) {
   var result = "";
   for (key in row) {
     result += key + ": " + row[key] + "<br/>\n"
   }
   return result;
 }
 var rowToJSONLD = function( row, meta ) {
   console.log("Converting row using meta: ", meta);
   var result = "";
   result = "{"
   var i=0;
   var len = Object.keys(row).length;
   for (key in row) {
     i = i+1;
     // result += " [" + i + "/"+ len + "] ";
     result += key + ": " + row[key] ;
     if (i < len) { result += ","; }
     result += "\n"
   }
   result += "}\n"
   return result;
 }

function importData(metafile, datafile) {

   var loadCSV = function() {
   queue()
   .defer(d3.json, metafile)
   .defer(d3.csv, datafile)
   //.defer(fs.stat, __dirname + "/../package.json")
   .await(function(error, jsonMetaMap, rows) {
     console.log(jsonMetaMap, rows);
     // for (f in rows) { console.log(rows[f]);  }
     d3.select("div#preview").html("<b>CSV data:</b><br/>" + rowToHtml( rows[0] ));
     d3.select("div#jsondata").html("<b>CSV data:</b><br/>" + escHTML(rowToJSONLD( rows[0], jsonMetaMap )));
   });
   }

d3.select("body").append("div").attr("id", "preview").style("margin", "5px");
d3.select("body").append("div").attr("id", "jsondata").style("margin", "5px");
loadCSV()

}




/*
https://github.com/mbostock/d3/wiki/CSV
http://localhost:8000/helloworld.html
http://bl.ocks.org/hlvoorhees/9d58e173825aed1e0218
https://github.com/mbostock/queue
http://bl.ocks.org/d3noob/fa0f16e271cb191ae85f#treedata.csv */
// http://stackoverflow.com/questions/1293367/how-to-detect-if-javascript-files-are-loaded
// http://bl.ocks.org/mapsam/6090056
