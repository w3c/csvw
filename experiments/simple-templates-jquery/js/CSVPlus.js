/*
Dependencies:
- PapaParse: http://papaparse.com, CSV parser.
- URI.js: https://medialize.github.io/URI.js/, URI library. The site gives the option of a custom build; this uses just the basic module.
- mustache.js: https://github.com/janl/mustache.js, a Mustache implementation in Javascript
*/


/* ======================================================================================= */
/*              jQuery extension to access CSV data                                        */
/* ======================================================================================= */  
(function($) {
  // Names for the target formats. The WG will have to define what those names are
  var JSON_FORMAT       = "json";
  var JAVASCRIPT_FORMAT = "javascript";
  var TURTLE_FORMAT     = "turtle";
  var XML_FORMAT        = "xml";

  /* =========================================================================== */
  /*  The core, ie, converting the CSV data                                      */
  /*   (the core of the standard implementation...)                              */
  /* =========================================================================== */  
  var convertCSV = function(data, meta, template, target_format) {
    // There is no template: the default is to get the rows and columns in JSON
    if( template === "" ) {
      var retval = []
      for( var i = 0; i < data.length; i++ ) {
        row = {}
        for( var j = 0; j < meta.schema.columns.length; j++ ) {
          row[meta.schema.columns[j].name] = data[i][j];
        }
        retval.push(row);
      }
      return JSON.stringify(retval,null,2);
    } else {
      // Transform the data to make it compatible with mustache
      mview = { rows: [] };
      // Go through the data, line-by-line
      for( var i = 0; i < data.length; i++ ) {
        // the 'mustache' "view" object has to be created
        row = {}
        for( var j = 0; j < meta.schema.columns.length; j++ ) {
          row[meta.schema.columns[j].name] = data[i][j];
        }
        mview.rows.push(row);
      }

      if( target_format === JSON_FORMAT || target_format === JAVASCRIPT_FORMAT ) {
        var result = eval( '(' + Mustache.render(template,mview) + ')' );
        if( target_format === JSON_FORMAT ) {
          return JSON.stringify(result,null,2);
        } else {
          return result;
        }              
      } else {
        return Mustache.render(template,mview);
      }
    }
  }

  /* =========================================================================== */
  /*  Various helper functions                                                   */
  /* =========================================================================== */  
  var mergeMeta = function( m1, m2, m3, m4) {
    // The metadata can include other objects, ie, extension should be "deep"
    return $.extend(true, {}, m1, m2, m3, m4);
  }

  var default_meta = function(data, headers) {
    // The default metadata just includes the names of the columns
    var retval = {
      schema : {
        columns : []
      }
    };
    if( headers ) {
      // The first row of the data contains the header names
      for( var i = 0; i < data[0].length; i++ ) {
        retval.schema.columns.push({ name : data[0][i], "@type" : "Column" });
      }
      // Remove the first row from the real data
      data.shift();
    } else {
      // The length of the first row in the data is what counts
      for( var i = 0; i < data[0].length; i++ ) {
        retval.schema.columns.push({ name : "Column " + (i+1), "@type" : "Column" });
      }      
    }
    return retval;
  } 

  var get_template_data = function(options, meta) {
    // The (user's) option dictates the required output format
    // The metadata contains (possibly) the template for different formats
    var retval = { url: "", format: JSON_FORMAT };
    // See if there is a template to be extracted. If not, the template will be returned as ""
    if( meta.template !== undefined ) {
      if( $.isArray(meta.template) ) {
        for( var i = 0; i < meta.template.length; i++ ) {
          if( meta.template[i].url !== undefined && meta.template[i].format === options.format ) {
            retval.url = meta.template[i].url;
            retval.format = meta.template[i].format;
            break;
          }          
        }
      } else {
        if( meta.template.url !== undefined && meta.template.format === options.format ) {
          retval.url = meta.template.url;
          retval.format = meta.template.format;
        }
      }
    }
    return retval;
  }

  /* =========================================================================== */
  /*  Public interface, a.k.a. the jQuery extension                              */
  /* =========================================================================== */  
  /* Configuration options:
    @param options: either a string (giving the URL of the CSV file), or an object
     with options:
       url:         URL of csv file (required),
       delimiter:   delimiter character 
                    (optional, default is "", ie, auto-detect)
       comments:    specify a comment character (like "#") to skip lines; false if no comment is allowed
                    (optional, default is '#')
       format:      expected output format (can be "json", "javascript", "turtle", etc.; default is "javascript")
    @param success: fallback to process the result. Function with one result argument
                    (optional)
    @param failure: fallback to process in case of HTTP failure. Function two arguments: HTTP Status code and error message.
                    (optional)

    "result" is an object:
       data:        result of CSV conversion in the format required by the options
       meta:        the (combined) metadata of the CSV content
       errors:      array of error and warning messages (including possible CSV parsing errors)

    The function returns a promise, ie, can be used as a deferred object, too.
  */
  $.getCSV = function(options, success, failure) {
    var result = $.Deferred();

    var final_warnings = [];
    /* ----------------------- get all the input arguments --------------------- */
    // Get the URI of the file
    var url;
    if( typeof options == "string" ) {
      // We just got a single string that is supposed to be the final url
      url = options
    } else {
      if( options.url === undefined ) {
        // there is an error, still to be finalized how it should be handled
      } else {
        url = options.url;
      }
    }

    if( success === undefined || typeof success !== "function" ) {
      var success_callback = function(){};
    } else {
      var success_callback = success;
    }

    if( failure === undefined || typeof failure !== "function" ) {
      var failure_callback = function(){};
    } else {
      var failure_callback = failure;
    }

    /* ----------------------- Set the parser's options --------------------- */
    // The defaults come, partially, from papaparse.js
    var settings = $.extend({
      delimiter: "",  // empty: auto-detect
      header: false,
      dynamicTyping: false,
      comments: '#',
      keepEmptyRows: false,
      format: JAVASCRIPT_FORMAT,
      download: false
    },options);

    /* ----------------------- Start CSV processing ----------------------- */
    // Processing is part of a jQuery deferred structure on reading the CSV file
    $.get(url)
      .done(function(data, status, xhr) {

        // By getting here, the CSV data itself is available. The big deal
        // is to find the metadata!

        // Metadata #1: the file contains the header by default, but
        // it may be switched off explicitly through a header
        // As an aside, the Content-type header may also contain encoding information,
        // to be used by the CSV Parser 
        /*---- The return header may contain relevant information ----*/
        var content_type = xhr.getResponseHeader('Content-Type');
        var parameters = content_type.split(";");
        // No headers?
        var headers = true;
        for( var i = 0; i < parameters.length; i++ ) {
          if( parameters[i].search('header=absent') >= 0 )  {
            headers = false;
            break;
          }
        }
        // Encoding not in UTF-8?
        for( var i = 0; i < parameters.length; i++ ) {
          if( parameters[i].search('charset=') >= 0 )  {
            settings.encoding = parameters[i].split('=')[1];
            break;
          }
        }

        /*----- Parse the CSV data -----*/
        var pcsv = Papa.parse(data, settings);

        /*---- Find the reference to the various metadata ----*/
        /* Get the default metadata, ie, the column headers */
        var embedded_meta = default_meta(pcsv.data, headers);

        // Local metadata reference 
        var linked_meta_url = "";
        // Return header may indicate the (local) metadata URI
        var link_header = xhr.getResponseHeader("Link");
        if( link_header !== null ) {
          var lheader = link_header.split(";");
          if( lheader.length > 1 ) {
            for( var i = 0; i < lheader.length; i++ ) {
              if( lheader[i] === "rel=describedby" ) {
                linked_meta_url = lheader[0];
                break;
              }
            }
          }
        }

        // Local metadata reference: derived name in the same directory 
        var local_meta_url = new URI(url).normalize().suffix("csvm").toString();

        // Global metadata reference: standard name in the same directory 
        var global_meta_url = new URI(url).normalize().filename("metadata").suffix("csvm").toString();
        /* ---- */

        /* ---- Get the metadata; doing a bit of jquery/promises tricks to get, possibly, the access in parallel ---- */
        // Reused the patterns in "http://joseoncode.com/2011/09/26/a-walkthrough-jquery-deferred-and-promise/"
        var get_metadata = function(murl) {
          var retval = $.Deferred();
          if( murl === "" ) {
            // Nothing to retrieve here
            retval.resolve({})
          } else {
            $.get(murl)
              .done(function (m) {
                retval.resolve(JSON.parse(m));
              })
              .fail(function(xhr, status, error) {
                final_warnings.push("HTTP error " + xhr.status + " (" + error + ") for resource '" + murl + "'");
                retval.resolve({})
              });            
          }
          return retval.promise();
        };

        var get_template = function(turl) {
          var retval = $.Deferred();
          if( turl === "" ) {
            // Nothing to retrieve here
            retval.resolve("")
          } else {
            $.get(turl)
              .done(function (t) {
                retval.resolve(t);
              })
              .fail(function(xhr, status, error) {
                final_warnings.push("HTTP error " + xhr.status + " (" + error + ") for resource '" + turl + "'");
                retval.resolve("");
              });            
          }
          return retval.promise();
        };

        // The .done for the promise below fires when all the metadata are in
        // The following actions are then done:
        // - Merge all the metadata in a cascade
        // - Convert the incoming data into a Javascript Object ( ie, a JSON object per standard converted into an object...)
        // - Extract the template reference
        // - Call the user's call back
        // We are then done...
        $.when(get_metadata(linked_meta_url), get_metadata(local_meta_url), get_metadata(global_meta_url))
          .done(function(linked_meta, local_meta, global_meta){
            // These should be merged
            var final_meta = mergeMeta(embedded_meta, linked_meta, local_meta, global_meta);

            var required_template = get_template_data( settings, final_meta);
            get_template(required_template.url)
              .done( function(template) {
                var final_data = convertCSV(pcsv.data, final_meta, template, required_template.format);
                retval = {
                  data      : final_data,
                  meta      : final_meta,
                  errors    : final_warnings.concat(pcsv.errors)
                }
                success_callback(retval);
                result.resolve(retval);                
              })
          });
      })
      .fail( function(xhr, status, error) {
        failure_callback(xhr.status, error);
        result.reject(xhr.status, error);
      });    
    return result.promise();
  };
}(jQuery));

