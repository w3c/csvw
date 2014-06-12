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
are anticipated. Also, I've introduced a few new terms to the vocabulary which seem to be missing:
* `short-name`: used to map column heading from CSV to a more useful form; and
* `template`: used to describe the CSV transformation template.

The template definition in the CSV metadata should also specify the Content-Type created by a target 
transformation - a given CSV metadata doc might include references to multiple transformation templates; and 
users should be able to ask for _one_ of those by name. I've used `hasFormat` to specify this.
 
File: `wx-obs-dec2013-site22580943.csvm`:
 

    {
       "name": "wx-obs-dec2013-site22580943",
       "title": "Weather observations for site 22580943 (Exeter Airport, UK)",
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
       "resources": [{
           "name": "wx-obs-dec2013-site22580943",
           "path": "site22580943-2013-dec.csv",
           "modified": "2013-12-31",
           "schema": {"fields": [
               {
                   "name": "Date-time",
                   "short-name": "datetime",
                   "title": "Date-time",
                   "description": "Date-time that the observation occurred.",
                   "type": "dateTime",
                   "format": "YYYY-MM-DDThh:mm:ssZ",
                   "constraints": {
                       "required": true
                   }
               },
               {
                   "name", "Air temperature (Cel)",
                   "short-name": "air-temp",
                   "title": "Air temperature (Celsius)",
                   "description": "Air temperature quantity value expressed in Celsius.",
                   "type": "double",
                   "constraints": {"required": true}
               },
               {
                   "name": "Dew-point temperature (Cel)",
                   "short-name": "dew-point-temp",
                   "title": "Dew-point temperature (Celsius)",
                   "description": "Dew-point temperature quantity value expressed in Celsius.",
                   "type": "double",
                   "constraints": {"required": true}
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
* `short-name` is used in the template rather than the real column name to avoid pesky embedded whitespace.
* The values in the `date-time` column are used for two purposes: firstly to create part of the unique identifier
for the observation entity, and secondly to provide the date-time value for the `ssn:observationSamplingTime/time:inXSDDateTime`
property. The former usage needs a simplified version of the date-time syntax, whilst the latter uses the 
standard ISO 8601 syntax.
* To convert the ISO 8601 syntax into the simplified form required for the identifier, a REGEXP (probably with errors!)
is used to capture the bits of the ISO 8601 syntax that are necessary. Embedding a REGEXP in a URI Template appears to be 
beyond what is permitted in [RFC 6570][4] - but it's included anyway to illustrate the idea.
* Alternatively, one may want to pre-process the CSV to parse the ISO 8601 syntax into a delimited list from which 
values can be easily extracted; e.g. `2013-12-13T08:00:00Z` could be separated into the individual `YYYY`, `MM`, 
`DD`, `hh`, `mm` and `ss` elements, using a semi-colon `;` as the list delimiter: `2013;12;13;08;00;00`. Further 
consideration of pre-processing steps is not provided here.
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
    
    <site/22580943/date-time/{datetime:/^(\d{2})-(\d{2})-(\d{2}T\d{2}):(\d{2}):(\d{2}Z)$/}>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{datetime}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{air-temp}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{dew-point-temp}"^^xsd:double ] ] .


[3]: http://w3c.github.io/csvw/csv2rdf/
[4]: http://tools.ietf.org/html/rfc6570

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
