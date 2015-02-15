
/*
* This is not yet complete. Two missing items:
*
* - Handling of "resources", which may mean 'reorganizing' one of the metadata to merge to include a "resources" 
* with an array of single element
* - The whole mechanism of importing a metadata file through a URI.
*
* Ivan Herman
*/


/**
 * 
 * Merge metadata objects 
 * @class MetadataMerge
*/
MetadataMerge = (function() {
	/**
	*   Constants for the various property categories. (By defining these in a calls, the interpreter shouts if it is misspelled
	*
	* @property property categories
	* @private
	*/
	var property_categories = {
		ARRAY            : "array" ,
		// These are the 'sub' categories of ARRAY, requiring individual care
		ARRAY_columns    : "array columns",
		ARRAY_templates  : "array templates",
		ARRAY_resources  : "array resources",

		LINK_SINGLE      : "link single",
		LINK_ARRAY       : "link array",

		COLUMN_REFERENCE : "column reference",

		URI_TEMPLATE     : "URItemplate",

		OBJECT_SINGLE    : "object single",
		OBJECT_ARRAY     : "object array",

		NATURAL_LANGUAGE : "natural language",

		ATOMIC_SINGLE    : "atomic single",
		ATOMIC_ARRAY     : "atomic array"
	}

	/**
	* Categorization of the properties, per the specification
	*
	* @property properties
	* @private
	*/
	var properties = {
		"@language"         : property_categories.ATOMIC_SINGLE,
		"@base"             : property_categories.LINK_SINGLE,
		"resources"         : property_categories.ARRAY_resources,
		"tableSchema"       : property_categories.OBJECT_SINGLE,
		"tableDirection"   : property_categories.ATOMIC_SINGLE,
		"dialect"           : property_categories.OBJECT_SINGLE,
		"templates"         : property_categories.ARRAY_templates,
		"@type"             : property_categories.ATOMIC_SINGLE,
		"@id"               : property_categories.LINK_SINGLE,
		"tableSchema"       : property_categories.OBJECT_SINGLE,
		"notes"             : property_categories.OBJECT_ARRAY,
		"encoding"          : property_categories.ATOMIC_SINGLE,
		"lineTerminator"    : property_categories.ATOMIC_SINGLE,
		"quoteChar"         : property_categories.ATOMIC_SINGLE,
		"doubleQuote"       : property_categories.ATOMIC_SINGLE,
		"skipRows"          : property_categories.ATOMIC_SINGLE,
		"commentPrefix"     : property_categories.ATOMIC_SINGLE,
		"header"            : property_categories.ATOMIC_SINGLE,
		"headerRowCount"    : property_categories.ATOMIC_SINGLE,
		"delimiter"         : property_categories.ATOMIC_SINGLE,
		"skipColumns"       : property_categories.ATOMIC_SINGLE,
		"headerColumnCount" : property_categories.ATOMIC_SINGLE,
		"skipBlankRows"     : property_categories.ATOMIC_SINGLE,
		"skipInitialSpace"  : property_categories.ATOMIC_SINGLE,
		"trim"              : property_categories.ATOMIC_SINGLE,
		"targetFormat"      : property_categories.LINK_SINGLE,
		"templateFormat"    : property_categories.LINK_SINGLE,
		"title"             : property_categories.NATURAL_LANGUAGE,
		"source"            : property_categories.ATOMIC_SINGLE,
		"columns"           : property_categories.ARRAY_columns,
		"primaryKey"        : property_categories.ATOMIC_ARRAY, 
		"foreignKeys"       : property_categories.OBJECT_ARRAY,
		"urlTemplate"       : property_categories.URI_TEMPLATE,
		"name"              : property_categories.ATOMIC_SINGLE,
		"required"          : property_categories.ATOMIC_SINGLE,
		"null"              : property_categories.ATOMIC_ARRAY,
		"language"          : property_categories.ATOMIC_SINGLE,
		"textDirection"     : property_categories.ATOMIC_SINGLE,
		"separator"         : property_categories.ATOMIC_SINGLE,
		"format"            : property_categories.ATOMIC_SINGLE,
		"datatype"          : property_categories.ATOMIC_SINGLE,
		"length"            : property_categories.ATOMIC_SINGLE,
		"minLength"         : property_categories.ATOMIC_SINGLE,
		"maxLength"         : property_categories.ATOMIC_SINGLE,
		"minimum"           : property_categories.ATOMIC_SINGLE,
		"maximum"           : property_categories.ATOMIC_SINGLE,
		"minInclusive"      : property_categories.ATOMIC_SINGLE,
		"maxInclusive"      : property_categories.ATOMIC_SINGLE,
		"minExclusive"      : property_categories.ATOMIC_SINGLE,
		"maxExclusive"      : property_categories.ATOMIC_SINGLE
	}

	var default_language = "und";

	/* ----------- */

	/**
	* Merge two objects into an array; the two objects may be either single objects or arrays themselves.
	*
	* @method merge_into_arrays
	* @param {Object} a - object to merge into
	* @param {Object} b - object to merge with
	* @return {Array} containing all values
	* @private
	*/
	var merge_into_arrays = function(a,b) {
		left  = CSVPlus.Utils.isArray(a) ? a : [a];
		right = CSVPlus.Utils.isArray(b) ? b : [b];
		return left.concat(right);
	}

	/**
	* Merge the language structure "b" into "a". See the specification for more details
	*
	* @method merge_lang_structures
	* @param {Object} a - object to merge into
	* @param {Object} b - object to merge with
	* @return {Object} containing all values
	* @private
	*
	*/
	var merge_lang_structures = function(a,b) {
		var key;
		for( key in b ) {
			a[key] = (key in a) ? merge_into_arrays(a[key],b[key]) : b[key]
		}
		return a;
	}

	/**
	* Return the merge result of the values "a" and "b", depending on the property type. E.g., merge of two arrays, to atomic values, etc. 
	* The method is invoked from ``merge_structures``, and it can also (recursively) invoke ``merge_structures`` in case "a" and "b" are objects
	* themselves.
	*
	* @method merge_values
	* @param {Object} a - object to merge into
	* @param {Object} b - object to merge with
	* @param {String} property_type - one of the values defined in ``property_categories``
	* @return {Object} merged value (it can be an object, and atomic value, or an array of these)
	* @private
	*
	*/
	var merge_values = function(a, b, property_type) {
		switch( property_type ) {
			case property_categories.LINK_SINGLE :
			case property_categories.URI_TEMPLATE :
			case property_categories.COLUMN_REFERENCE :
			case property_categories.ATOMIC_SINGLE :
				return a;

			case property_categories.OBJECT_ARRAY :
			case property_categories.LINK_ARRAY :
			case property_categories.ATOMIC_ARRAY :
				return merge_into_arrays(a, b);

			case property_categories.ARRAY_columns :
				// both A and B should be an array of objects. If, at any stage, there 
				// is an exception this means the assumption is wrong, and a fallback occurs
				// When debugged, this should be put into a try { ... } !
				for( var i = 0; i < b.length; i++ ) {
					col_a = a[i];
					col_b = b[i];
					if( a[i].name === b[i].name ) {
						merge_structures(a[i], b[i]);
					}
				}
				return a;

			case property_categories.ARRAY_templates :
				var additionals = [];
				for( var i = 0; i < b.length; i++ ) {
					var templ_b = b[i];
					// Check if the same template description exists in 'a'
					var handled = false;
					for( var j = 0; j < a.length; j++ ) {
						templ_a = a[j];
						if( templ_a.targetFormat === templ_b.targetFormat && templ_a.templateFormat === templ_b.templateFormat ) {
							merge_structures(templ_a, templ_b);
							handled = true;
							break;
						}
					}
					if( !handled ) {
						// This is a new template
						additionals.push(templ_b);
					}
				}
				// Add those that were not merged
				return a.concat(additionals);

			case property_categories.ARRAY_resources :
				var additionals = [];
				for( var i = 0; i < b.length; i++ ) {
					var templ_b = b[i];
					// Check if the same template description exists in 'a'
					var handled = false;
					for( var j = 0; j < a.length; j++ ) {
						templ_a = a[j];
						if( templ_a["@id"] === templ_b["@id"] ) {
							merge_structures(templ_a, templ_b);
							handled = true;
							break;
						}
					}
					if( !handled ) {
						// This is a new template
						additionals.push(templ_b);
					}
				}
				// Add those that were not merged
				return a.concat(additionals);

			case property_categories.NATURAL_LANGUAGE :
				if( CSVPlus.Utils.isString(a) ) {
					if( CSVPlus.Utils.isString(b) ) {
						return [a,b];
					} else if( CSVPlus.Utils.isArray(b) ) {
						return [a].concat(b);
					} else {
						var as = {};
						as[default_language] = a;
						return merge_lang_structures(as, b);
					}

				} else if( CSVPlus.Utils.isArray(a) ) {
					if( CSVPlus.Utils.isString(b) ) {
						return a.concat([b]);
					} else if( CSVPlus.Utils.isArray(b) ) {
						return a.concat(b)
					} else {
						var as = {};
						as[default_language] = a;
						return merge_lang_structures(ATOMIC_SINGLE, b);
					}

				} else {
					if( CSVPlus.Utils.isString(b) ) {
						var bs = {};
						bs[default_language] = a;
						return merge_lang_structures(a, bs)
					} else if( CSVPlus.Utils.isArray(b) ) {
						var bs = {};
						bs[default_language] = a;
						return merge_lang_structures(a, bs)
					} else {
						return merge_lang_structures(a, b);
					}
				}

			case property_categories.OBJECT_SINGLE :
				var as1 = CSVPlus.Utils.isString(a);
				var as2 = CSVPlus.Utils.isString(b);
				return (as1 || as2) ? a : merge_structures(a, b, default_language);
		}
	}

	/**
	* Merge "b" into "a" and return "a"; both are objects, either the full metadata or a structured part thereof.
	* The method also sets the default language, based on the (possible) ``@language`` property.
	*
	* @method merge_structures
	* @param {Object} a - object to merge into
	* @param {Object} b - object to merge with
	* @return {Object} merged structure
	* @private
	*
	*/
	var merge_structures = function(a, b) {
		if( "@language" in a && default_language === "und" ) {
			default_language = a["@language"];
		} else if( "@language" in b ) {
			default_language = b["@language"];
			a["@language"] = default_language;
		}

		var key;
		for( key in b ) {
			if( key === "@language" ) continue;
			if( !(key in a) ) {
				a[key] = b[key];
			} else if( key in properties ) {
				a[key] = merge_values(a[key], b[key], properties[key]) 
			} else {
				var av = a[key];
				var bv = b[key]
				if( CSVPlus.Utils.isHash(av) && CSVPlus.Utils.isHash(bv) ) {
					a[key] = merge_values(av, bv, property_categories.OBJECT_SINGLE)

				} else if( (CSVPlus.Utils.isHash(av) && CSVPlus.Utils.isArray(bv)) || 
				           (CSVPlus.Utils.isArray(av) && CSVPlus.Utils.isHash(bv)) ) {
					a[key] = merge_values(av, bv, property_categories.OBJECT_ARRAY)

				} else if( CSVPlus.Utils.isAtomic(av) && CSVPlus.Utils.isAtomic(bv) ) {
					a[key] = merge_values(av, bv, property_categories.ATOMIC_SINGLE)

				} else if( (CSVPlus.Utils.isAtomic(av) && CSVPlus.Utils.isArray(bv)) || 
				           (CSVPlus.Utils.isArray(av) && CSVPlus.Utils.isAtomic(bv)) ) {
					a[key] = merge_values(av, bv, property_categories.ATOMIC_ARRAY)

				} else {
					/* this should not happen, just here to avoid exceptions */
					a[key] = merge_values(av, bv, property_categories.ATOMIC_SINGLE)
				}
			}
		}
		return a;
	}

	// This is the visible interface
	return {
		/**
		* Import (and merge) a metadata object into another one
		* 
		* @method merge
		* @param {Object} a - the metadata object to merge the other object into
		* @param {Object} b - the metadata object to be merged 
		* @return {Object} - the updated "a" object
		*/
		merge : function(a, b) {
			return merge_structures(a, b)
		},

		/**
		* Merge a sequence of metadata objects into the first one, and return the results
		* 
		* This method may become obsolete if the 'import' mechanism is used, which is not (yet) the case for now...
		*
		* @param {Array of Object} objs - a variable number of objects, with the first object being the one to be merged into. 
		* @param {String} default_language - default language. If missing, "und" is used
		* @return {Object} - the new metadata object
		*/
		accumulate: function(objs) {
		  	// console.log(JSON.stringify( objs, null, 2 ))
			var t = {};
			for( var index = 0; index < objs.length; index++ ) {
				var next = objs[index];
				merge_structures(t, next)
			}
			return t;
		}
	};
})();

