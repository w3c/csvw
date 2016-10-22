
var colmap;
var colsByTitle = {};
var virtualCols = {};
var foundCols = {};
var trim;
// TODO: stuff these into an object structure

var verbose = true;
verbose = false;

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
   colmap = meta;
   if (verbose)
       console.log("Converting row using meta: ", meta);
   var jsonld_row = [];
   var result = "";
   result = "{"
   var i=0;
   var len = Object.keys(row).length;
   for (key in row) {
     i = i+1;
     result += key + ":- " + row[key] ;
     if (i < len) { result += ","; }
     result += "\n"

     // Data conversion
     if (verbose)
         console.log("Doing row, processing col number ", i, " - fetching col template.");
   }
   result += "}\n" //*/
   return result;
 }

 // "Expand a URI Template with row index numbers."
 function expandTemplate(str, row_ix){     // TODO: check for other spec'd fields    return str.replace("{_row}", "%s" % row_ix )
    return str.replace("{_row}", row_ix )
 }

 function appendHtml(el, str) {
     var div = document.createElement('div');
     div.innerHTML = str;
     while (div.children.length > 0) {
       el.appendChild(div.children[0]);
     }
}

function expandNS(s, prefixMap) {
//    "Expand namespace prefixes eg. 'schema:foo' becomes 'http://schema.org/foo', based on a map."
    //return re.sub( "(\w+):(\w+)(\s*)", lambda match: "{0}{1}{2}".format( prefixMap.get(match.group(1), match.group(1)+":" ) , match.group(2), match.group(3) ), s).encode("utf-8")
    s = s.replace("schema:", "http://schema.org/");
    s = s.replace("rdf:", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    s = s.replace("rdfs:", "http://www.w3.org/2000/01/rdf-schema#");
    return s; // TODO
}

function expandBaseHref(s, cfg) {
    // "Expand a potentially relative URI. A hack."
    // return re.sub( "^#", lambda match: "{0}".format(cfg.get('basehref') +"#" ), s).encode("utf-8")
    return s; // TODO
}

function goGoGo(rows, mapping) {
  var foundCols = d3.keys(rows[0]);
  if (verbose) {
     console.log("Go go go!", rows, mapping);
      console.log("foundCols: ", foundCols);
  }

  // First let's examine our mapping.
  colDefs = mapping['tableSchema']['columns'] // pick at some useful pieces
  trim = mapping['dialect']['trim'] // fallible
  if (verbose) {
     console.log("colDefs: ", colDefs);
      console.log("trim mode?: ", trim);
  }
  for (coldef_ix in colDefs){
      col = colDefs[coldef_ix];
      workingTitle = col['titles'];
      if (!workingTitle) { workingTitle = col['name']; }
     if (verbose)
            console.log( "Column name: ",  col['name'],  " title:  ", workingTitle );
      colsByTitle[workingTitle] = col
      isVirtual = col['virtual'];
      if (!isVirtual in window) {
        isVirtual = 'false';
      }
      if (isVirtual == true) {
          virtualCols[ col['name'] ] = col
      }
  }

  // Now we loop through the rows

  json_factoids = [];

  for (row_ix in rows) {

    row = rows[row_ix];
    if (verbose) {
        console.log("Row: ", row_ix, row );
        console.log("Attempting to loop thru cols of row ", row_ix, " col count: ", Object.keys(row).length);
    }
    for (col_ix = 0; col_ix < Object.keys(row).length; col_ix += 1 )  { // through the concrete cols
      colTitle = foundCols[col_ix];
      cellSpec = colsByTitle[colTitle]; // find template for this col
      var cellval = row[colTitle];
      if (verbose) {
          console.log("col_ix = ", col_ix);
          console.log("Looked up col ", col_ix, " and found colTitle: ", colTitle);
          console.log("cellSpec for col ", col_ix, " named ", colTitle, " is: ", cellSpec);
          console.log("looked in row, ", row);
          console.log("Initial value is: ", cellval);
          console.log("############");
      }
      myrow_aboutUrl = expandTemplate(cellSpec['aboutUrl'], row_ix);       // CONCRETE CELL VALUES FIRST
      myrow_propertyUrl = expandTemplate(cellSpec['propertyUrl'], row_ix);
      myrow_valueUrl = expandTemplate(cellSpec['valueUrl'] || cellval, row_ix);
      dt = cellSpec['datatype'] || "rdfs:Literal";
      if (verbose)
          console.log(" ***** rough triple is ", myrow_aboutUrl, myrow_propertyUrl, myrow_valueUrl, dt);
      if (dt == "anyURI") {
          console.log("#anyURI");
          myFactoid = " {\"@id\": \"" + expandBaseHref(myrow_aboutUrl) + "\",\"" + expandNS(myrow_propertyUrl) + "\": \""+ expandBaseHref(myrow_valueUrl +"\"}\n" );
      } else {
            console.log("#misc.", dt);
            if (true) {
              myFactoid = " {\"@id\": \"" + expandBaseHref(myrow_aboutUrl) + "\",\"" + expandNS(myrow_propertyUrl) + "\": \""+ myrow_valueUrl +"\" }\n"   ;
            } else {
              // sort out datatyping later.
              myFactoid = " {\"@id\": \"" + expandBaseHref(myrow_aboutUrl) + "\",\"" +
                  expandNS(myrow_propertyUrl) + "\": {  \"@value\":  \""+ myrow_valueUrl +"\", \"@datatype\": \"" + dt["base"] + "\"} }\n"   ;
            }
      }

      json_factoids.push(myFactoid);
      if (verbose)
          console.log("JSON-LD Factoid:", myFactoid);
   } // real col loop

   // console.log("Virtual columns!" ,virtualCols);       // THEN VIRTUAL CELLS
   for (vcol_ix in virtualCols) {
//     console.log("Virtual column id: ",vcol_ix, " vcolSpec: ", virtualCols[vcol_ix]);
     virtualCellSpec = virtualCols[vcol_ix] || false;
     // console.log("Virtual cell spec: ", virtualCellSpec);
     if (virtualCellSpec) {
         vrow_aboutUrl = expandTemplate(virtualCellSpec['aboutUrl'], row_ix);
         vrow_propertyUrl = expandTemplate(virtualCellSpec['propertyUrl'], row_ix);
         vrow_valueUrl = expandTemplate(virtualCellSpec['valueUrl'] || "NA", row_ix);
         if (vrow_propertyUrl != "rdf:type") {
             myVirtualFactoid = " {\"@id\": \"" + expandBaseHref(vrow_aboutUrl) + "\",\"" + expandNS(vrow_propertyUrl) + "\": { \"@id\": \""+ expandNS(vrow_valueUrl +"\"} }\n" );
         } else {
             myVirtualFactoid = " {\"@id\": \"" + expandBaseHref(vrow_aboutUrl) + "\", \"" + "@type" + "\":  \""+ expandNS(vrow_valueUrl) +"\" }\n";
         }
         json_factoids.push(myVirtualFactoid);
        // console.log("Virtual triple: ", myVirtualFactoid)
     }
   } // vcol loop
  } // end row loop

  // EMIT all JSON-LD
  output = '<script type="application/ld+json">[ ';
  output += json_factoids.join(', ');
  output = output.concat( "]</"); // otherwise it looks like this script finishes
  output = output.concat("script>");

  appendHtml(document.body, output);
  console.log(output);

  // ... and inject it into our main HTML page.

}

function importData(metafile, datafile) {

   var loadCSV = function() {
   queue()
   .defer(d3.json, metafile)
   .defer(d3.csv, datafile)
   //.defer(fs.stat, __dirname + "/../package.json")
   .await(function(error, jsonMetaMap, rows) {
     console.log("Got jsonMetaMap and rows: ", jsonMetaMap, rows);
     // for (f in rows) { console.log(rows[f]);  }
     d3.select("div#preview").html("<b>CSV data:</b><br/>" + rowToHtml( rows[1] ));
     d3.select("div#jsondata").html("<b>CSV data first:</b><br/>" + escHTML(rowToJSONLD( rows[0], jsonMetaMap )));
     goGoGo(rows, jsonMetaMap);
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
