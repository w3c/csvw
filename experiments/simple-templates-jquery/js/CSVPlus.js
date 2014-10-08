/**
* Experimental CSV+ extension to jQuery, including location of the CSV+ metadata and a mustache-like simple
* template to convert the CSV data into a javascript object, JSON, Turtle, XML, or any other text.
*
* * Author: Ivan Herman
* * Licence: © Copyright W3C® SOFTWARE NOTICE AND LICENSE <http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>, Ivan Herman, 2014
* 
* @module CSVPlus
* @main CSVPlus
* @author Ivan Herman
* @license W3C
*/

/*
Dependencies:
- PapaParse: http://papaparse.com, CSV parser.
- URI.js: https://medialize.github.io/URI.js/, URI library. The site gives the option of a custom build; this uses just the basic module.
*/

/*
 * @class CSVPlus
 * @static
*/


/* ======================================================================================= */
/*              jQuery extension to access CSV data                                        */
/* ======================================================================================= */  

/**
 * Extension jQuery (a.k.a. $)to handle CSV+ files.
 *
 * @class $
 * @static
 */
(function($) {

  /* ======================================================================================= */
  /*              Output format strings                                                      */
  /* ======================================================================================= */
  /**
  *
  * Constants to be used for the output format: ``JSON``, ``JAVASCRIPT``, ``TURTLE``, ``XML``.
  *
  * @class $.CSV_format
  * @static
  * @final
  * @for $
  */
  $.CSV_format = {
    JSON : "json",
    JAVASCRIPT : "javascript",
    TURTLE : "turtle",
    RDF : "rdf",
    XML : "xml"
  };  

  /* ======================================================================================= */  
  // Filters that the current implementation recognizes for templates. The 
  // list has to be defined by the WG, eventually. These are just examples.
  /**
  * Filters that the current implementation recognizes for templates. The list has to be defined by
  * the WG, eventually. Each of the filters is invoked with the arguments:
  * * ``var`` - String
  * * ``context`` - Template context object containing:
  *   * ``column_name``: name of the column (used in the ``{{name}}`` part of the template tag)
  *   * ``meta``: (cumulative) metadata object
  *   * ``row``: array of the row being processed by the template process
  *   * ``row_index``: index of the row being processed
  *   * ``target_format``: target format of the template (i.e., "json", "turtle", "xml", etc. )
  * * ``string1`` (optional) - additional string provided in the template
  * * ``string2`` (optional) - additional string provided in the template
  * * …
  * * ``stringn`` (optional) - additional string provided in the template
  * The filter returns a string to be used as a replacement.
  *
  * At the moment, the following filters are defined:
  * * upper - convert to upper case
  * * lower - convert to lower case
  * * number - convert the string into a number
  * * row_number - return the index of the data row being processed (starting with 1)
  * * replace - replace the regexp (in ``string1``) with the string value in ``string2``
  * * concat - concatenate ``val`` with ``string1``
  * * preconcat - concatenate ``string1`` with ``val``
  * * URI_encode - encode the string following RFC3986 (to be used as a URI component)
  *
  * @property builtin_filters
  * @type Array
  * @static
  * @final
  * @private
  * @for $
  */
  var builtin_filters = {
    "upper"      : function(val, context)           { return val.toUpperCase(); },
    "lower"      : function(val, context)           { return val.toLowerCase(); },
    "number"     : function(val, context)           { return 1*val; },
    "row_number" : function(val, context)           { return context.row_index + 1 },
    "replace"    : function(val, context, from, to) { return val.replace(new RegExp(from), to); },
    "concat"     : function(val, context, str)      { return val + str; },
    "preconcat"  : function(val, context, str)      { return str + val; },
    "URI_encode" : function(val, context)           { return URI.encode(val); }
  }
  , filters = {}
  ;

  /* =========================================================================== */
  /*  Various helper functions                                                   */
  /* =========================================================================== */ 
  //
  //
  // Merge the various metadata objects into one 
  /**
  * Merge the various objects into one; the priority is right to left, i.e., key-value pairs on the
  * right override, if any, a similar key value on the left.
  *
  * Used to merge the various metadata objects
  *
  * @method mergeMeta
  * @private
  * @param {Object} m1 - Lowest priority object
  * @param {Object} m2 - Object
  * @param {Object} m3 - Object
  * @param {Object} m4 - Highest priority object
  * @return {Object} - New class consisting of the merge incoming objects
  */
  var mergeMeta = function(m1, m2, m3, m4) {
    // The metadata can include other objects, ie, extension should be "deep"
    return $.extend(true, {}, m1, m2, m3, m4);
  }

  /**
  * Default metadata: to be used when no metadata is specified whatsoever.
  * It lists the column names, whether from the first row or creating a column name on the fly
  * (this depends on user setting, ie, whether the first row is indeed column names).
  *
  * Additional metadatata items may be added, this will depend on the WG's final spec.
  *
  * @method default_meta
  * @private
  * @param {Array} data - row of raw data, as extracted from the CSV files
  * @param {String} url - url of the CSV data
  * @param {boolean} headers - Whether the first row in the data give the column headers; if ``false``, 
  *    the column names are generated as described in the data model document. Note that if the value is ``true``,
  *    the first row in ``data`` will be removed.
  * @return {Object} - New metadata
  */
  var default_meta = function(data, url, headers) {
    // The default metadata just includes the names of the columns
    var retval = {
      "@id"   : url,
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

  /**
  * Extract the current templates, if any, from the metadata. This depends on the user’s option
  * that determines what the output format should be.
  *
  * Default case is to return no template in Javascript object
  *
  * @method get_template_data
  * @private
  * @param {Object} options - User’s options object
  * @param {Object} meta - CSV metadata
  * @return {Object} - template data of the form:
  * * ``url``: URL of the template file. Default is empty
  * * ``format``: output format (ie, Javascript, JSON, etc.). Default is JAVASCRIPT_FORMAT
  */
  var get_template_data = function(options, meta) {
    // The (user's) option dictates the required output format
    // The metadata contains (possibly) the template for different formats
    var retval = { url: "", format: options.format };
    // See if there is a template to be extracted. If not, the template will be returned as ""
    if( meta.template !== undefined ) {
      if( $.isArray(meta.template) ) {
        for( var i = 0; i < meta.template.length; i++ ) {
          if( meta.template[i].url !== undefined && meta.template[i].format === options.format ) {
            retval.url = meta.template[i].url;
            break;
          }          
        }
      } else {
        if( meta.template.url !== undefined && meta.template.format === options.format ) {
          retval.url = meta.template.url;
        }
      }
    }
    return retval;
  }

  /**
  * Turn a data row into an object with column names (as specified in the metadata) as keys and cells as values.
  * The row is then processed through a callback function. The method performs these actions for each row in the 
  * data separately
  *
  * @method process_rows
  * @private
  * @param {Array} data - current data row
  * @param {Object} meta - CSV metadata
  * @param {Function} callback - callback called with two arguments:
  * * row: the data row Array
  * * context: object containing:
  *   * ``meta``: the CSV metadata
  *   * ``row_index``: the index of the row within the whole CSV file
  *   * ``row``: the current data row Array
  */
  var process_rows = function(data, meta, callback) {
    data.forEach( function(data_row, rindex) {
      context = {
        meta      : meta,
        row_index : rindex,
        row       : data_row
      };
      row = {}
      meta.schema.columns.forEach( function(col, cindex) {
        row[col.name] = data_row[cindex];
      })
      callback(row, context);      
    })
  }

  /**
  * Extract the arguments from a tag, ie, if a filter looks like
  * ``filter("a","b","c")``, then extract an array of the form ``[a,b,c]`` from the
  * ``"a","b","c"`` string.
  * 
  * The method is used recursively to fill the incoming (initially empty) array.
  *
  * @method get_args
  * @private
  * @param {String} arg_string - the string to be parsed
  * @param {Array} args_array - the array to be filled with the individual arguments
  */
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
  /* =========================================================================== */
  /* =========================================================================== */

  /* =========================================================================== */
  /* Mini mustache implementation                                                */
  /* =========================================================================== */

  /**
  * The full template has to be cut into a series of separate templates
  *  * global templates
  *  * per-row templates to be repeated
  * 
  * The result of the processing is an array of templates with a flag on whether it is
  * global or not. The objects returned in the array are of the form:
  * * ``repeat`` (boolean): true means this is a template for rows, i.e,, to be repeated for all the rows
  * * ``template``: the template itself.
  *
  * @method split_template
  * @private
  * @param {String} template - The full template
  * @return {Array} - objects of the form described above.
  */
  var split_template = function(template) {
    var set_global = function(t) {
      retval.push({ repeat:false, template:t })
    };
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

  /**
  * Process one (optionally filtered) mustache tag, i.e., the content of something like ``{{a.b.c.d}}`` 
  * The first symbol should be used to get a value; all the others are filters.
  *
  * (The implementation does not handle escape characters... :-()
  *
  * @method process_one_tag
  * @private
  * @param {String} tag  - The tag itself
  * @param {Object} view - A mapping object providing a value for the (first) symbol                                                             
  * @param {Object} context - Object containing:
  * @param {Object} context.meta - Metadata associated to the CSV file
  * @param {Object} context.index - Index of the row being processed, if applicable, -1 otherwise 
  * @param {Object} context.row - Full row being processed, if applicable, ``null`` otherwise
  * @return {String} - value of the tag, i.e., the value from ``view``, possibly ran through the chain of filters
  */                                                        
  var process_one_tag = function(tag, view, context) {
    var tags = tag.split('.');

    // Start by getting the base value
    var col_name        = tags[0].trim();
    var retval          = col_name === "" ? "" : view[col_name];
    var final_context   = $.extend({
      column_name : col_name
    }, context);

    // Go through the filters, if any
    for( i = 1; i < tags.length; i++ ) {
      var filter = tags[i].trim();
      // see if there are argumnets attached to the filter
      var with_args = filter.split('(');
      if( with_args.length === 1 ) {
        // There are no arguments, just a simple filter
        retval = filters[filter](retval, final_context)
      } else {
        // There are arguments to handle;
        var func     = filters[with_args[0]];

        var all_args = [];
        get_args( with_args[1],all_args );

        // To call the filter, the argument should be preceded with the previous value
        // in the filter and the meta
        all_args.unshift(final_context);
        all_args.unshift(retval);

        // The filter can be invoked now:
        retval = func.apply(this, all_args);
      }
    }
    return retval;
  };

  /**
  * Process a template, i.e., find all the tags, process them individually (through the ``process_one_tag`` method)
  * and return the concatenated result.
  * Process a template, without the {{#rows}}...{{\#rows}} sections. The function goes through the templates recursively,
  * by taking the templates from left-to-right and concatenating the results.
  *
  * @method render_template
  * @private
  * @param {String} template  - The full template
  * @param {Object} view - A mapping object providing a value for the (first) symbol                                                             
  * @param {Object} context - Object containing:
  * @param {Object} context.meta - Metadata associated to the CSV file
  * @param {Object} context.index - Index of the row being processed, if applicable, -1 otherwise 
  * @param {Object} context.row - Full row being processed, if applicable, ``null`` otherwise
  * @return {String} - value of the full template
  */                                                     
  var render_template = function(template, view, context) {
    var matched = template.match(/{{.*?}}/m);
    if( matched == null ) {
      // No template given, we are done; this also means the end of the line
      return template;
    } else {
      // There is a match on the left of the string...
      var begin  = template.slice(0, matched.index);
      var middle = process_one_tag(matched[0].slice(2, -2), view, context);
      var end    = template.slice(matched.index + matched[0].length);
      return begin + middle + render_template(end, view, context);
    }
  };

  /**
  * Convert the CSV data with templates.
  *
  * @method c_templates
  * @private
  * @param {Array} data - The CSV data itself, an array of array (latter being a row from the file)
  * @param {Object} meta - Metadata object, as defined in the spec
  * @param {String} template - Template string. 
  * @param {Sring} target_format - can be JSON, Turtle, Javascript,…
  * @param {Array} warnings - array of warnings that may have to be extended if an error occurs
  * @return {String or Object} - Converted data. If the ``target_format`` argument is JAVASCRIPT, the retun is an Object,
  * otherwise a string with the converted value in the ``target_format`` syntax.
  *
  */
  var c_templates = function(data, meta, template, target_format, warnings) {
    // There is no template: the default is to get the rows and columns in JSON
    // Cut the template into global/repeat portion
    // the result is an array of separate templates
    var templates = split_template(template);

    // The 'global' template is used on a "view" (in mustache jargon)
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
        process_rows(data, meta, function(row, context) {
          result += render_template(tstruct.template, $.extend({}, global_mview, row), $.extend({target_format:target_format}, context));
        });
      } else {
        // Just apply the template against the global view and append the outcome
        // to the result string
        context = {
          meta          : meta,
          target_format : target_format,
          row_index     : null,
          col_index     : null,
          row           : null
        };
        result += render_template(tstruct.template, global_mview, context);
      }
    });

    if( target_format === $.CSV_format.JSON || target_format === $.CSV_format.JAVASCRIPT ) {
      try {
        var j_result = eval( '(' + result + ')' );
        return target_format === $.CSV_format.JSON ? JSON.stringify(j_result,null,2) : j_result;          
      } catch(e) {
        warnings.push("Template (Javascript) syntax error in: " + e.message)
        return result;
      }
    } else {
      return result;
    }
  }

  /* =========================================================================== */
  /* =========================================================================== */
  /* =========================================================================== */

  /* =========================================================================== */
  /* Default RDF/JSON conversion                                                 */
  /* =========================================================================== */

  /**
  * Objects referring to the default conversion functions for Javascript and JSON
  * 
  * @property js_conversions
  * @private
  */
  var js_conversions = {
    start : function( state, data, meta, warnings ) {
      state.obj = {
        "@id"   : state["@id"],
        "@base" : state["@base"],
        "@rows" : []
      };
      state.current = state.obj;
      if( "@context" in state ) {
        state.obj["@context"] = state["@context"];
      };
    },

    end : function( state, meta, target_format, warnings ) {
      state.retval = target_format === $.CSV_format.JSON ? JSON.stringify( state.obj, null, 2 ) : state.obj;
    },

    add_type : function( state, type ) {
      state.current["@type"] = type;
    },

    add_core_property : function( state, term, value, uri, isid ) {
      state.current[term] = value;
    },

    new_row: function( state, rid ) {
      state.current = {};
      state.obj["@rows"].push(state.current);
      if( rid !== undefined ) {
        state.current["@id"] = rid;
      }
    },

    add : function( state, key, val ) {
      var v = ("datatype" in val && val.datatype == "integer" ) ? 1*val.value : val.value;
      state.current[key.value] = v;
    },
  };

  /**
  * Objects referring to the default conversion functions for RDF and Turtle/NT
  * 
  * @property rdf_conversions
  * @private
  */
  var rdf_conversions = {
    start : function( state, data, meta, warnings ) {
      state.graph = new RDFJSInterface.Graph();
      state.rdf   = new RDFJSInterface.RDFEnvironment();

      state.rdf.setPrefix("csv", "http://www.w3.org/ns/csvw#");
      state.rdf.setDefaultPrefix(state["@base"]);

      state.current = state.rdf.createNamedNode(state["@id"]);
    },

    end : function( state, meta, target_format, warnings ) {
      state.retval = target_format === $.CSV_format.TURTLE ? state.graph.toNT() : state.graph;
    },

    add_type : function( state, type ) {
      state.graph.add(state.rdf.createTriple( state.current,
                                              state.rdf.createNamedNode("rdf:type"),
                                              state.rdf.createNamedNode("csv:" + type) ));
    },

    add_core_property : function( state, term, value, uri, isid ) {
      var p = state.rdf.createNamedNode( uri !== undefined ? uri : ":" + term );
      var o = isid ? state.rdf.createNamedNode(value) : state.rdf.createLiteral(value);
      state.graph.add(state.rdf.createTriple( state.current,p,o ));
    },

    new_row: function( state, rid ) {
      if( rid === undefined ) {
        state.current = state.rdf.createBlankNode();
      } else {
        state.current = state.rdf.createNamedNode(":" + rid)
      }
    },

    add : function( state, predicate, object ) {
      // See how the URI for the predicate is set up
      if( "prefix" in predicate ) {
        var p = state.rdf.createNamedNode(predicate.prefix + ":" + predicate.value)
      } else {
        var p = state.rdf.createNamedNode(predicate.value)
      }

      if( object.isuri ) {
        var o = state.rdf.createNamedNode(object.value)
      } else {
        if( "datatype" in object ) {
          var d = state.rdf.createNamedNode("xsd:" + object.datatype)
          var o = state.rdf.createLiteral(object.value, null, d);
        } else {
          var o = state.rdf.createLiteral(object.value);
        }
      }
      state.graph.add(state.rdf.createTriple( state.current,p,o ));
    },
  };

  /**
  * Object referring to the conversion function objects, keyed through the possible formats
  *
  * @property conversions
  * @private
  */
  var conversions = {};
  conversions[$.CSV_format.JSON]       = js_conversions;
  conversions[$.CSV_format.JAVASCRIPT] = js_conversions;
  conversions[$.CSV_format.TURTLE]     = rdf_conversions;
  conversions[$.CSV_format.RDF]        = rdf_conversions;

  /**
  * The core global properties that are defined by the group, i.e., not dependent on
  * DCMI or schema.org 
  *
  * @property core_properties
  */
  var core_properties = [
    "creator",
    "license",
    "created",
    "modified",
    "description"
  ];

  /**
  * Resolve core property. The property is looked up in the (possible) 
  * ``@context`` structure to see if a URI is assigned to it and, if yes,
  * whether it is specified as having a URI as a value/object
  *
  * @method resolve_core_property
  * @private
  * @param {Sring} term - the term to be looked up
  * @param {Object} meta - Metadata object, as defined in the spec
  * @return {Object} with values of 'uri' (if an URI is assigned to the term) and a 'id' boolean value on 
  * whether the value should be a URI or a string. The former defaults to ``undefined``, the latter to ``false``.
  *
  */
  var resolve_core_property = function( term, meta ) {
    var retval = {
      uri: undefined,
      isid: false
    }
    if( "@context" in meta ) {
      var context = meta["@context"];
      if( term in context ) {
        // bingo...
        var cval = context[term];
        if( typeof cval === "string" ) {
          retval.uri = cval;
        } else {
          retval.uri  = "@id" in cval ? cval["@id"] : undefined;
          retval.isid = ("@type" in cval) && (cval["@type"] === "@id");
        }
      }
    }
    return retval;
  }

  /**
  * Create a default conversion.
  * This is called when there is no template, ie, provides the default conversion
  * of a CSV file. This is the conversion that is defined, as a standard, by the WG.
  *
  * This method implements the overall structure in a final format agnostic way. The ``target_format`` argument
  * is used to choose among the possible conversion function sets, using the ``conversions`` object.
  * 
  *
  * @method c_default
  * @private
  * @param {Array} data - The CSV data itself, an array of array (latter being a row from the file)
  * @param {Object} meta - Metadata object, as defined in the spec
  * @param {Sring} target_format - can be JSON, Turtle, Javascript,…
  * @return {String or Object} - Converted data. If the ``target_format`` argument is JAVASCRIPT, the return is an Object; if it is RDF,
  * the return is a Graph as defined by the rdf_interface package; otherwise a string with the converted value in the ``target_format`` syntax.
  *
  */
  var c_default = function(data, meta, target_format, warnings) {
    var conv_functions = conversions[target_format];
    // This object is shared by all conversion functions as a common state, and also stores
    // the final output
    var url = new URI(meta["@id"]).normalize().toString();
    var state = {
      retval  : undefined,
      "@id"   : url,
      "@base" : url + "#",
    };
    if( "@context" in meta ) {
      state["@context"] = meta["@context"];
      // TODO: this has to be refined with a proper URI handling
      if( state["@context"]["@base"] !== undefined ) {
        state["@base"] = new URI( state["@context"]["@base"] ).normalize().toString();
      }
    } 

    // Start: set up the environment
    conv_functions.start( state, data, meta, warnings );

    // Set the 'Table' type
    conv_functions.add_type( state, "Table" );

    // Get the global, core properties into the output
    for( var i = 0; i < core_properties.length; i++ ) {
      var term = core_properties[i];
      if( term in meta ) {
        // Get the characteristics of the term from the (possible) @context
        var term_c = resolve_core_property( term, meta);
        conv_functions.add_core_property( state, term, meta[term], term_c.uri, term_c.isid )        
      }
    }

    // Establish the final column names (or URIs) and primary keys (if any)
    var col_names    = [];
    var primary_keys = [];
    var primaryKey   = "primaryKey" in meta.schema ? ($.isArray(meta.schema.primaryKey) ? meta.schema.primaryKey : [meta.schema.primaryKey]) : [];

    meta.schema.columns.forEach( function(col, index) {
      // This structure anticipates on the URI templates a bit
      col_names.push({
        name  : col.name,
        uri   : new URI(col.name).normalize().toString(),
        isURI : false,
        index : index
      });
      // Check the primary key

      if( "@id" in col ) {
        // Check if that id is present in the defined keys
        var i = $.inArray(col["@id"], primaryKey);
        if( i >= 0 ) {
          primary_keys[i] = index;
        }
      }
    });

    // Go through each row:
    data.forEach( function(data_row, rindex) {
      // Establish the subject/@id to be used for that row.
      if( "primaryKey" in meta.schema ) {
        // establish the subject
        var rid_array = [];
        primary_keys.forEach( function(key,index) {
          rid_array.push(data_row[key]);
        })
        var rid = new URI( rid_array.join("-") ).normalize().toString();
        // console.log(rid);
        conv_functions.new_row(state, rid);
      } else {
        conv_functions.new_row(state)
      }
      // Set the row type
      conv_functions.add_type(state, "Row");
      // Set the row number as a signal
      conv_functions.add(state, {value: "row", prefix: "csv"}, {value: rindex, isuri: false, datatype: "integer"});
      // Go through the individual cells now
      data_row.forEach( function(cell, cindex) {
        var predicate = {
          value  : col_names[cindex].uri,
          prefix : "",
        };
        // This is where the datatype issue will come in!
        var subject = {
          value : cell,
          isuri : false,
        }
        conv_functions.add(state, predicate, subject);
      })
    });


    // End: close the processing altogether. This may involve a serialization, depending on the target format
    conv_functions.end( state, meta, target_format, warnings );

    // Just return the generated output:
    return state.retval;
  };


  /* ============================================================================== */
  /* ============================================================================== */
  /* ============================================================================== */

  /* ============================================================================== */
  /**
  * Main conversion entry point. In reality, this is just a switch between the 'direct'
  * i.e., default mapping as defined by the standard, and the templated version if a template
  * has been added to the metadata.
  *
  * @method convertCSV
  * @private
  * @param {Array} data - The CSV data itself, an array of array (latter being a row from the file)
  * @param {Object} meta - Metadata object, as defined in the spec
  * @param {String} template - Template string. If ``""`` (ie, no template) a default Javascript object is generated
  * @param {Sring} target_format - can be JSON, Turtle, Javascript,…
  * @param {Array} warnings - array of warnings that may have to be extended if an error occurs
  * @return {String or Object} - Converted data. If the ``target_format`` argument is JAVASCRIPT, the retun is an Object,
  * otherwise a string with the converted value in the ``target_format`` syntax.
  *
  */
  var convertCSV = function(data, meta, template, target_format, warnings) {
    // There is no template: the default is to get the rows and columns in JSON
    return ( template === "" ) ? c_default(data, meta, target_format, warnings) : c_templates(data, meta, template, target_format, warnings);
  }

  /* =========================================================================== */
  /* =========================================================================== */
  /* =========================================================================== */

  /* =========================================================================== */
  /**  
  *  Public interface, as a jQuery extension. The function
  * 
  * 1. Fetches the CSV content (in memory, i.e., it is very inefficient for large CSV files)
  * 1. Retrieves and combines the metadata associated to the CSV (i.e., trough the link response header, and at the well known places; see the specification)
  * 1. Retrieves the associated templates (if any), based on the requested output format
  * 1. Converts the CSV content into either a Javascript object or a text file with a specified syntax (JSON, Turtle, XML) and makes the result available through asyncrhonous callbacks 
  *
  *  The method can either be used as an asynchronous function through callbacks, or as a Deferred object.
  * 
  * @example
  * Simple, asynchronous usage:

       $.getCSV("http://www.example.org", function(csv_data) {
         // display the CSV data; by default, the data is a javascript object
         display(csv_data.data["Col1"]);
         display(csv_data.data["Col2"]);
         ...
       });
   
  * Using JSON output, and display the result in a ``<pre>`` element

       var request = { url: "http://www.example.org", format: "json"};
       $.getCSV(request, function(csv_data) {
         $("div#example").append("<pre>" + massage(csv_data.data) + "</pre>");
       });

  * Same, but using the “Promise” style, and adding an error handling

       var request = { url: "http://www.example.org", format: "json"};
       $.getCSV(request)
         .done(function(csv_data) {
           $("div#example").append("<pre>" + massage(csv_data.data) + "</pre>");
         })
         .fail( function(status,error) {
          console.log(status + " " + error);
         });
  *       
  *
  * @method $.getCSV
  * @async
  * @param {String or Object} options - identification of the CSV. If it is a string, it is the URL of the CSV file. If it is an object, it has the following (optional) fields:
  * @param {String} options.url - URL of csv file (required),
  * @param {String} options.delimiter - CSV delimiter character (optional, default is ``""``, ie, auto-detect)
  * @param {String} options.comments - Specifies a comment character (like ``"#"``) to skip lines; ``false`` if no comment is allowed (optional, default is '#')
  * @param {String} options.format - Expected output format (can be "json", "javascript", "turtle", etc.; default is "javascript")
  * @param {Object} options.filters - Object providing user-defined filters; each key denotes a (template) filter function. 
  * A filter is invoked with the arguments:
  * * ``var`` - String
  * * ``context`` - Template context object containing:
  *     * ``column_name``: name of the column (used in the ``{{name}}`` part of the template tag)
  *     * ``meta``: (cumulative) metadata object
  *     * ``row``: array of the row being processed by the template process
  *     * ``row_index``: index of the row being processed
  *     * ``target_format``: target format of the template (i.e., "json", "turtle", "xml", etc. )
  * * ``string1`` (optional) - additional string provided in the template
  * * ``string2`` (optional) - additional string provided in the template
  * * …
  * * ``stringn`` (optional) - additional string provided in the template
  *
  * The filter returns a string to be used as a replacement.
  * @param {Function} [success] - Callback to process the result, called with an input argument, i.e., result object
  * @param {Function} [failure] - Callback to process in case of HTTP errors. Function two arguments: HTTP Status code and error message
  * @return {Promise Object} - A promise with the result object of the form:
  * * ``data``: result of the CSV conversion in the format required by the options
  * * ``meta``: the (combined) metadata of the CSV content
  * * ``errors``: array of error or warning messages (including possible CSV parsing errors)
  *
  * 

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
      format: $.CSV_format.JAVASCRIPT,
      download: false,
      filters: {}
    },options);
    filters = $.extend(settings.filters, builtin_filters);

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
        var embedded_meta = default_meta(pcsv.data, url, headers);

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
                try {
                  retval.resolve(JSON.parse(m));
                } catch(e) {
                  final_warnings.push("JSON syntax error in " + murl + ": " + e.message);
                  retval.resolve({});
                }
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
                var final_data = convertCSV(pcsv.data, final_meta, template, required_template.format, final_warnings);
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

