CSV metadata document and Template for simple weather observation example
=========================================================================

This is an extension of the earlier illustrative [example about a simple weather observation][1].

[1]: simple-weather-observation.md

<h2>The CSV data</h2>

For this example, let's assume that the CSV file is called `wx-obs-dec2013-site22580943.csv`.

A snippet of the the CSV data is provided below:

<table>
  <tr><th>Date-time</th><th>Air temperature (Cel)</th><th>Dew-point temperature (Cel)</th></tr>
  <tr><td>2013-12-13T08:00:00Z</td><td>11.2</td><td>10.2</td></tr>                
  <tr><td>2013-12-13T09:00:00Z</td><td>12.0</td><td>10.2</td></tr>
</table>

... or in plain CSV format:


    Date-time,Air temperature (Cel),Dew-point temperature (Cel)
    2013-12-13T08:00:00Z,11.2,10.2                
    2013-12-13T09:00:00Z,12.0,10.2
    {snip}


<h2>The CSV metadata</h2>

The metadata document below is based on the [Metadata Vocabulary for Tabular Data][2] - although a few errors
are anticipated. Also, I've introduced a new term `template` to the metadata vocabulary to provide an object that describes the CSV transformation template.

The template definition in the CSV metadata should also specify the Content-Type created by a target 
transformation - a given CSV metadata doc might include references to multiple transformation templates; and 
users should be able to ask for _one_ of those by name. I've used `hasFormat` to specify this.
 
File: `wx-obs-dec2013-site22580943.json`:
 

    {
       "name": "wx-obs-dec2013-site22580943",
       "titles": "Weather observations for site 22580943 (Exeter Airport, UK)",
       "keywords": [
           "Air temperature",
           "Dew-point temperature",
           "Exeter"
       ],
       "publisher": [{
           "name": "Met Office",
           "web": "http://www.metoffice.gov.uk"
       }],
       "license": "ogl",
       "tables": [{
           "name": "wx-obs-dec2013-site22580943",
           "path": "site22580943-2013-dec.csv",
           "modified": "2013-12-31",
           "tableSchema": {"columns": [
               {
                   "name": "datetime",
                   "titles": {
                       "en": "Date-time",
                       "fr": "Date et l'heure"
                   },
                   "description": "Date-time that the observation occurred.",
                   "type": "dateTime",
                   "format": "YYYY-MM-DDThh:mm:ssZ",
                   "required": true
               },
               {
                   "name": "air-temp",
                   "titles": {
                       "en": "Air temperature (Cel)",
                       "fr": "La température d'air (C)"
                   },
                   "description": "Air temperature quantity value expressed in Celsius.",
                   "type": "double",
                   "required": true
               },
               {
                   "name": "dew-point-temp",
                   "titles": {
                       "en": "Dew-point temperature (Cel)",
                       "fr": "Température du point de rosée (C)"
                   },
                   "description": "Dew-point temperature quantity value expressed in Celsius.",
                   "type": "double",
                   "required": true
               }
           ]},
           "template": {
               "name": "wx-obs-csv-to-ttl",
               "description": "Template converting CSV content to RDF (expressed in Turtle syntax). Uses Semantic Sensor Network (SSN) and QUDT ontologies.",
               "type": "template",
               "path": "wx-obs-csv-to-ttl.ttl",
               "hasFormat": "text/turtle"
           }
       }]
    }


[2]: http://w3c.github.io/csvw/metadata/index.html

<h2>The CSV to RDF(TTL) template</h2>

This is based on my understanding of the [Generating RDF from Tabular Data on the Web][3] document.

A few notes:
* `name` is used in the template rather than the column `title` to avoid pesky embedded whitespace.
* The values in the `date-time` column are used for two purposes: firstly to create part of the unique identifier
for the observation entity, and secondly to provide the date-time value for the `ssn:observationSamplingTime/time:inXSDDateTime`
property. The former usage needs a simplified version of the date-time syntax, whilst the latter uses the 
standard ISO 8601 syntax.
* To convert the ISO 8601 syntax into the simplified form required for the identifier, a REGEXP (probably with errors!)
is used to capture the bits of the ISO 8601 syntax that are necessary. Embedding a REGEXP in a URI Template appears to be 
beyond what is permitted in [RFC 6570][4] - but it's included anyway to illustrate the idea.
* Alternatives include:
** pre-processing the CSV to parse the ISO 8601 syntax into a delimited list from which values can be easily extracted; 
e.g. `2013-12-13T08:00:00Z` could be separated into the individual `YYYY`, `MM`, `DD`, `hh`, `mm` and `ss` elements, 
using a semi-colon `;` as the list delimiter: `2013;12;13;08;00;00`. Further consideration of pre-processing steps is 
not provided here.
** defining a standard mechanism in the CSV+ specification for parsing cell microsyntax 
(see [R-CellMicrosyntax requirement][5]). See [below][6] for an expansion of this idea.
* The template processing is assumed to follow a row-by-row processing model; the entire Template is applied for each
row. For simplicity, I am just "assuming" that the `base` and `prefix` statements in the Template are also included 
in the RDF resulting from the conversion. 

File: `wx-obs-csv-to-ttl.ttl`:


    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .
    
    <site/22580943/date-time/{datetime:/^(\d{4})-(\d{2})-(\d{2}T\d{2}):(\d{2}):(\d{2}Z)$/}>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{datetime}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{air-temp}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{dew-point-temp}"^^xsd:double ] ] .


[3]: http://w3c.github.io/csvw/csv2rdf/
[4]: http://tools.ietf.org/html/rfc6570
[5]: http://w3c.github.io/csvw/use-cases-and-requirements/index.html#R-CellMicrosyntax
[6]: #parsing-cell-microsyntax

<h2>The resulting RDF</h2>

(expressed in Turtle syntax)


    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .
     
    <site/22580943/date-time/20131213T0800Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "2013-12-13T08:00:00Z"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "11.2"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "10.2"^^xsd:double ] ] .
     
    <site/22580943/date-time/20131213T0900Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "2013-12-13T09:00:00Z"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "12.0"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "10.2"^^xsd:double ] ] .
            
            
<h2>Parsing cell microsyntax</h2>

The [R-CellMicrosyntax requirement][6] states:

<em>Microsyntax, therefore, requires manipulation of the text if processed. Typically, 
this will relate to conversion of lists into multiple-valued entries, but may also include 
reformatting of text to convert between formats (e.g. to convert a datetime value to a date, 
or locale dates to ISO 8601 compliant syntax).</em> 

In this "simple weather observation" example, the ISO 8601 date-time value needs to be 
simplified so that it can be incorporated in the unique identifier of the observation 
entity.

ISO 8601 syntax (no timezone offset): `YYYY-MM-DDThh:mm:ssZ`

Simplified syntax: `YYYYMMDDThhmmssZ`

Thus the following individual elements need to be extracted from the microsyntax:
* `YYYY`: four-digit year
* `MM`: two-digit month
* `DD`: two-digit day
* `hh`: two-digit hour
* `mm`: two-digit minute
* `ss`: two-digit second

Note: at this point, no thought has been given to how one would register a _callback function_,
_promise_ or other external processing agent (e.g. XSLT, SPARQL Construct, Javascript) for 
dealing with complex parsing issues that are beyond the scope of the CSV+ specification; when 
you need to, as @JeniT says, "_bug out_".

<h3>Single REGEXP extracting array of values</h3>

A regular expression can be defined that captures multiple values from a matching string. 
These values could be placed into an array, allowing each value to be addressed individually.

For example:
* regexp: `/^(\s+);(\s+);(\s+);(\s+)$/`
* string: `one;two;three;four`
* captured array of values: `("one", "two", "three", "four")`

One problem here is that [RFC 6570][4] does not appear to provide a mechanism to address
specific values in list variable; e.g.
* variable: `count := ("one", "two", "three", "four")`
* template 1: `{/count*}`
* expansion 1: `/one/two/three/four`
* template 2: `{?count*}`
* expansion 2: `?count=one&count=two&count=three&count=four`

As a work around, one might use an array-like syntax such as illustrated below:

* variable: `count := ("one", "two", "three", "four")`
* template 3: `{/count[0]}`
* expansion 3: `/one`
* template 4: `{/count[0,1]}`
* expansion 4: `/one,two`
* template 5: `{/count[0,2]*}`
* expansion 5: `/one/two/three`

However, this deviated from [RFC 6570][4] ... that said, let's proceed.

The following regular expression extracts six values from a matching ISO 8601 formatted string:

`/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/`

So we might define in the `columns` section of the metadata document a `microsyntax` object:

           "columns": [
               {
                   "name": "datetime",
                   "titles": {
                       "en": "Date-time",
                       "fr": "Date et l'heure"
                   },
                   "description": "Date-time that the observation occurred.",
                   "type": "dateTime",
                   "format": "YYYY-MM-DDThh:mm:ssZ",
                   "required": true,
                   "microsyntax": {
                       "name": "dtelements",
                       "regexp": "/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/"
                   }
               }
           ]

(the names used here are just for illustration; not concrete proposals)

So `date-time-element[0]` would be the `YYYY` element etc.

We might use these in the Template as follows:

    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .
    
    <site/22580943/date-time/{dtelements[0]}{dtelements[1]}{dtelements[2]}T{dtelements[3]}{dtelements[4]}{dtelements[5]}Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{datetime}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{air-temp}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{dew-point-temp}"^^xsd:double ] ] .

Note that the unmodified `date-time` cell-reference is still used to access the 
ISO 8601 formatted date for use in the `ssn:observationSamplingTime/time:inXSDDateTime`
property.

Note: one might deal with simple delimited lists using this mechanism ...

If the cell had the value `one;two;three;four` then the microsyntax block below could parse the string
such that `count[3]` equates to `four`.

    "microsyntax": {
        "name": "count",
        "list-delimiter": ";"
    }

<h3>Multiple REGEXP each extracting single value</h3>

An alternative method would be to define multiple microsyntax blocks in the metadata document; each
with their own unique variable name; e.g.

           "columns": [
               {
                   "name": "datetime",
                   "titles": {
                       "en": "Date-time",
                       "fr": "Date et l'heure"
                   },
                   "description": "Date-time that the observation occurred.",
                   "type": "dateTime",
                   "format": "YYYY-MM-DDThh:mm:ssZ",
                   "required": true,
                   "microsyntax": [{
                           "name": "YYYY",
                           "regexp": "/^(\d{4})-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/"
                       },{
                           "name": "MM",
                           "regexp": "/^\d{4}-(\d{2})-\d{2}T\d{2}:\d{2}:\d{2}Z$/"
                       },{
                           "name": "DD",
                           "regexp": "/^\d{4}-\d{2}-(\d{2})T\d{2}:\d{2}:\d{2}Z$/"
                       },{
                           "name": "hh",
                           "regexp": "/^\d{4}-\d{2}-\d{2}T(\d{2}):\d{2}:\d{2}Z$/"
                       },{
                           "name": "mm",
                           "regexp": "/^\d{4}-\d{2}-\d{2}T\d{2}:(\d{2}):\d{2}Z$/"
                       },{
                           "name": "ss",
                           "regexp": "/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:(\d{2})Z$/"
                       }
                   ]
               }
           ]

In this case, there is no need to use array syntax in the URI Template, but the 
microsyntax definition is a little more complex.

The Template would then be expressed as:

    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .
    
    <site/22580943/date-time/{YYYY}{MM}{DD}T{hh}{mm}{ss}Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{datetime}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{air-temp}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{dew-point-temp}"^^xsd:double ] ] .

Note: dealing with simple delimited lists would be almost identical to parsing a more complex string; 
each sub-element would need to be picked out individually. Fortunately, the number of sub-elements
in a given column should be regular for every row.

If the cell had the value `one;two;three;four` then the microsyntax block below could parse the string
such that `c4` equates to `four`.

    "microsyntax": [{
            "name": "c1",
            "regexp": "/^(\s+);\s+;\s+;\s+$/"
        },{
            "name": "c2",
            "regexp": "/^\s+;(\s+);\s+;\s+$/"
        },{
            "name": "c3",
            "regexp": "/^\s+;\s+;(\s+);\s+$/"
        },{
            "name": "c4",
            "regexp": "/^\s+;\s+;\s+;(\s+)$/"
        }
    ]
