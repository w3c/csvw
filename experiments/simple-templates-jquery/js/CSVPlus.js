/*
Dependencies:
- PapaParse: http://papaparse.com, CSV parser.
- URI.js: https://medialize.github.io/URI.js/, URI library. The site gives the option of a custom build; this uses just the basic module.
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

  // Filters that the current implementation recognizes for templates. The 
  // list has to be defined by the WG, eventually. These are just examples.
  var filters = {
    "upper"    : function(val, meta)           { return val.toUpperCase(); },
    "lower"    : function(val, meta)           { return val.toLowerCase(); },
    "replace"  : function(val, meta, from, to) { return val.replace(new RegExp(from), to); },
    "concat"   : function(val, meta, str)      { return val + str; }
  }

  /* =========================================================================== */
  /*  Various helper functions                                                   */
  /* =========================================================================== */ 
  //
  //
  // Merge the various metadata objects into one 
  var mergeMeta = function(m1, m2, m3, m4) {
    // The metadata can include other objects, ie, extension should be "deep"
    return $.extend(true, {}, m1, m2, m3, m4);
  }

  // Default metadata: to be used when no metadata is specified whatsoever.
  // It lists the column names, whether from the first row or creating a column name on the fly
  // (this depends on user setting, ie, whether the first row is indeed column names)
  // Additional metadatata may be added, this will depend on the WG's final spec.
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

  //
  // Extract the current templates, if any, from the metadata. This depends on the user's option
  // that determines what the output format should be
  // Default case is to return no template in Javascript object
  var get_template_data = function(options, meta) {
    // The (user's) option dictates the required output format
    // The metadata contains (possibly) the template for different formats
    var retval = { url: "", format: JAVASCRIPT_FORMAT };
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

  // Collect a row into an object with column names (as specified in the metadata) 
  //    as keys and cells as values
  // The row is then processed through a callback function
  var process_rows = function(data, meta, callback) {
    data.forEach( function(data_row) {
      row = {}
      meta.schema.columns.forEach( function(col, index) {
        row[col.name] = data_row[index];
      })
      callback(row);      
    })
  }

  // Extract the arguments from a tag, ie, if a filter looks like
  // filter("a","b","c"), then extract an array of the form [a,b,c] from the
  // '"a","b","c"' string.
  var get_args = function( args_string, args_array ) {
    if( args_string.length === 0 ) return false;
    if( args_string[0] === ",") {
      args_string = args_string.slice(1).trim();
    }

    // String must begin with a quote:
    if( args_string[0] !== "'" && args_string[0] !== '"' ) return false;

    // Try to match...
    var reg = /(["'])(.*?)\1/;
    var matched = args_string.trim().match(reg);

    if( matched !== null ) {
      args_array.push(matched[2]);

      get_args( matched.input.slice(matched[0].length), args_array )
    } else {
      return false;
    }
    return true;
  } 


  /* =========================================================================== */
  /* Mini mustache implementation                        */
  /* =========================================================================== */
  //
  //
  // The full template has to be cut into a series of templates
  // - global templates
  // - per-row templates to be repeated
  // The result is an array of template texts with a flag on whether it is
  // global or not.
  // The objects returned in the array are of the form:
  // {
  //    repeat:   [boolean], true means this is a template for rows, ie, to be repeated for all of them)
  //    template: [string], the Mustache template itself     
  // }
  var split_template = function(template) {
    var set_global = function(t) {
      retval.push({ repeat:false, template:t })
    };
    // console.log(template);
    var retval       = [];
    var templ = template;
    while( templ !== "" ) {
      // Careful with the regexp: 
      //   - [\s\S] must be used to allow for a multiline template, ie, to match over new lines
      //   - '?' must be used in the group to avoid a greedy match, ie, to ensure all 
      //     row templates are handled properly
      var a = templ.match( /{{#rows}}([\s\S]*?){{\/rows}}/m );
      if( a === null ) {
        set_global(templ);
        break;
      } else {
        // See if there is a global portion:
        if( a.index > 0 ) {
          set_global(templ.slice(0, a.index));
        }
        // See if there is local portion
        if( a[1] !== "" ) {
          retval.push({
            repeat:  true,
            template: a[1],
          })
        }
        // get the rest of the string...
        templ = templ.slice(a.index + a[0].length);     
      }
    }
    return retval;
  }

  //
  // Process one mustache tag, ie, something like {{a.b.c.d}} (but without the mustaches)
  // The first symbol should be used to get a value; all the others are filters.
  // The implementation does not handle escape characters... :-(
  // @param tag  : the tag itself
  // @param view : a mapping object providing a value for a pure symbol (not a filter)                                                             
  // @param meta      : metadata associated to the CSV file                                                            
  var process_one_tag = function(tag, view, meta) {
    var tags = tag.split('.');

    // Start by getting the base value
    var retval  = view[tags[0].trim()];

    // Go through the filters, if any
    for( i = 1; i < tags.length; i++ ) {
      var filter = tags[i].trim();
      // see if there are argumnets attached to the filter
      var with_args = filter.split('(');
      if( with_args.length === 1 ) {
        // There are no arguments, just a simple filter
        retval = filters[filter](retval)
      } else {
        // There are arguments to handle;
        var func     = filters[with_args[0]];

        var all_args = [];
        get_args( with_args[1],all_args );

        // To call the filter, the argument should be preceded with the previous value
        // in the filter and the meta
        all_args.unshift(meta);
        all_args.unshift(retval);

        // The filter can be invoked now:
        retval = func.apply(this, all_args);
      }
    }
    return retval;
  };

  //
  // Process a template, without the {{#rows}}...{{\#rows}} sections. The function goes through the templates recursively,
  // by taking the templates from left-to-right and concatenating the results.
  // @param template  : the template itself
  // @param view      : a mapping object providing a value for a pure symbol (not a filter) 
  // @param meta      : metadata associated to the CSV file                                                            
  var render_templates = function(template, view, meta) {
    var matched = template.match(/{{.*?}}/m);
    if( matched == null ) {
      // No template given, we are done; this also means the end of the line
      return template;
    } else {
      // There is a match on the left of the string...
      var begin  = template.slice(0, matched.index);
      var middle = process_one_tag(matched[0].slice(2, -2), view, meta);
      var end    = template.slice(matched.index + matched[0].length);
      return begin + middle + render_templates(end, view);
    }
  };

  /* =========================================================================== */
  /*  The core, ie, converting the CSV data                                      */
  /*   (the core of the standard implementation...)                              */
  /* =========================================================================== */
  // This is called when there is no template, ie, this is the default conversion
  // of a CSV file. At present, all it does is to output the data in JSON or JAVASCRIPT
  // array of object; each object is a row with column names serving as keys and cells
  // as values. The exact format is still to be defined by the WG. 
  var convertCSV_default = function(data, meta, target_format) {
    var retval = []
    process_rows(data, meta, function(row) {
      retval.push(row);
    });
    return target_format === JSON_FORMAT ? JSON.stringify(retval, null, 2) : retval;
  };

  //
  // Convert the CSV through the tempating (if any)
  // @param data: the CSV data itself, an array of array (latter being a row from the file)
  // @param meta: metadata object, as defined in the spec
  // @param template: template string. If "" (ie, no template) a default Javascript object is generated
  // @param target_format: can be JSON, Turtle, Javascript, ... Determines whether the result
  //   should either be a Javascript object or a JSON string. 
  //   Note: Turtle has no real meaning here, because the data is simply returned verbatim.
  //   Maybe it is unnecessary to have it here; to be
  //   seen if it is used elsewhere explicitly...
  var convertCSV = function(data, meta, template, target_format) {
    // There is no template: the default is to get the rows and columns in JSON
    if( template === "" ) {
      return convertCSV_default(data, meta, target_format);
    } else {
      // Cut the template into global/repeat portion
      // the result is an array of separate templates
      var templates = split_template(template);

      // The 'global' template is used on a view, in mustache jargon
      // containing only the top level keys from the metadata. This
      // can be set once and for all
      var global_mview = {};
      Object.keys(meta).forEach( function(key) {
        if( typeof meta[key] === "string" ) global_mview[key] = meta[key];
      });

      // The main processing cycle: Go through the templates and perform 
      // each individually. The results are concatenated into one string to be returned
      var result = "";
      templates.forEach( function(tstruct) {
        // The major switch: is the template to be repeated or not?
        if( tstruct.repeat === true ) {
          process_rows(data, meta, function(row) {
            // result += Mustache.render(tstruct.template, row);
            result += render_templates(tstruct.template, row, meta);
          });
        } else {
          // Just apply the template against the global view and append the outcome
          // to the result string
          // result += Mustache.render(tstruct.template, global_mview);
          result += render_templates(tstruct.template, global_mview, meta);
        }
      });

      if( target_format === JSON_FORMAT || target_format === JAVASCRIPT_FORMAT ) {
        var j_result = eval( '(' + result + ')' );
        return target_format === JSON_FORMAT ? JSON.stringify(j_result,null,2) : j_result;
      } else {
        return result;
      }
    }
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

            var required_template = get_template_data(settings, final_meta);
            get_template(required_template.url)
              .done( function(template) {
                // We finally arrived at the core: make the conversion of the CSV content to whatever the user wants...
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

