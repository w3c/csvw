# CSV+ implementation with minimal (mustache-like) templates #

Goal: to illustrate whether a very simple subset of mustache can be implemented easily in Javascript. The implementation is built on jQuery, and also implements the data model's definitions to get to metadata (except for metadata in a package). 

The metadata definition is extended with keys for templates. The [test metadata](simple_test/test.csvm) includes the following:

	"template" : [{
			"url"    : "simple_test/test-json.tmpl",
			"format" : "javascript"
		}, {
			"url"    : "simple_test/test-json.tmpl",
			"format" : "json"
		}, {
			"url"    : "simple_test/test-turtle.tmpl",
			"format" : "turtle"			
		}
	]

providing an access to various templates for different formats (the "javascript" format is really for javascript usage: it means that, instead of returning a JSON text, it returns the javascript object version thereof).

The template contains *only two* templating mechanisms:

- `{{#rows}}` - `{{\rows}}` (where `rows` is a fixed symbol) at the beginning of a line means that the full templates enclosed between these two lines are to be repeated for all rows of the CSV content.
- `{{name}}` has two possible roles:
	- if used *within* a `{{#rows}}` - `{{\rows}}` context, `{{name}}` refers to a column name, and the template is replaced with the content of the corresponding cell
	- if used *outside* a `{{#rows}}` - `{{\rows}}` context, `{{name}}` refers to a top-level key in the metadata **if its value is a string**; the template is replaced with the corresponding value

That is it. As an example, the template for turtle may look like:

	@prefix ex: <http://www.example.org> .
	ex:document
	  ex:author {{author}} ;
 	  ex:institution {{institution}} .

	{{#rows}}
	[] a ex:csvrow;
	  ex:first_column   {{First}} ;
	  ex:second_column  {{Second}} ;
 	  ex:third_column   {{Third}} .

	{{/rows}}

or for JSON may look like:

	{
		"@id"         : "test", 
		"author"      : "{{author}}",
		"institution" : "{{institution}}",
 		"@graph" : [
	{{#rows}} 	
			{ 
				"@type"         : "csvrow",
				"first column"  : "{{First}}",
				"second column" : "{{Second}}",
				"third column"  : "{{Third}}",
			},
	{{/rows}}
	 	]
	}	

The [test file](http://w3c.github.io/csvw/experiments/simple-templates-jquery/test.html) displays the accumulated metadata and the result of the conversion to Turtle and JSON, respectively for the test file [`simple_test/csv`](simple_test/test.csv). 

If no template is found, the function returns a straightforward output: an array of JSON/Javascript objects, each object consisting of the column names as keys and the corresponding cell values as values.

## Possible extensions ##
We should think twice before adding *any* extension to the pattern above. I see a possible one:

* keys to access, somehow, the datatype of a cell, as defined by the metadata spec (a special syntax may be needed to make it palatable to mustache, and the access to that datatype is actually more complex due to the 'cascading' style of the metadata spec.)

## The code details ##
(This section is not really of interest as for the decision the WG has to take on whether to use a template language of not. It is just if you want to look at the details...)

The code is provided as an extension to jQuery, all in the [`js/CSVPlus.js`](js/CSVPlus.js) file. The module implements the  `$.getCSV()` function that can be used as follows:

	$.getCSV(options_or_url, success, failure)
    @param options_or_url: either a string (giving the URL of the CSV file), or an object with options:
       url:         URL of csv file (required),
       delimiter:   delimiter character (optional, default is "", ie, auto-detect)
       comments:    specify a comment character (like "#") to skip lines; false if no comment is allowed (optional, default is '#')
       format:      expected output format (can be "json", "javascript", "turtle", etc.; default is "javascript")
       
    @param success: fallback to process the result. Function with one result argument. (optional)
    
    @param failure: fallback to process in case of HTTP failure. Function has two arguments: HTTP Status code and error message. (optional)

    "result" is an object:
       data:        result of CSV conversion in the format required by the options
       meta:        the (combined) metadata of the CSV content
       errors:      array of error and warning messages (including possible CSV parsing errors)

    The function returns a promise, ie, can be used as a deferred object, too.
   
The code depends on external modules

- [PapaParse](http://papaparse.com) CSV parser
- [URI.js](https://medialize.github.io/URI.js/) to manipulate URI-s
- [mustache.js](https://github.com/janl/mustache.js), a Mustache implementation in Javascript

The code is *very* rough at the edges (e.g., managing errors) and is probably very inefficient for larger CSV files...


