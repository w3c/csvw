# Graph Templating


The page describes the idea of graph fragment templating and applies it to the example in:

https://github.com/w3c/csvw/blob/gh-pages/examples/simple-weather-observation.md

The data:
<table>
  <tr><th>Date-time</th><th>Air temperature (Cel)</th><th>Dew-point temperature (Cel)</th></tr>
  <tr><td>2013-12-13T08:00:00Z</td><td>11.2</td><td>10.2</td></tr>                
  <tr><td>2013-12-13T09:00:00Z</td><td>12.0</td><td>10.2</td></tr>
</table>

in a CSV file is, with some quotes (not necessary but makes things safe):

    "Date-time", "Air temperature (Cel)", "Dew-point temperature (Cel)" 
    "2013-12-13T08:00:00Z",11.2,10.2
    "2013-12-13T09:00:00Z",12.0,10.2
 
## Metadata

Suppose we have some basic metadata: (`--` are comments).

    primary key : <site/22580943/date-time/{sample-time}>

    column1: 
      short name: sample-time
      -- the "site/22580943/" is built in.
      -- short names give a way to refer to the column.

    column2:
       short name: air-temp
       predicate: def-op:airTemperature_C
       datatype : xsd:double
       -- predicate for column and datatype.

    column3:
       short name: dew-point
       datatype : xsd:double
       -- no predicate given: we'll create one.

No graph fragment template is provided.

## Basic Conversion

Just from that information a conversion might generate some RDF: for one row:

    <site/22580943/date-time/20131213T0800Z>
       def-op:airTemperature_C 11.2e0 ;
       :dewPointTemperatureCel 10.2e0 .
    <site/22580943/date-time/20131213T0900Z>
       def-op:airTemperature_C 12.0e0 ;
       :dewPointTemperatureCel 10.2e0 .

Notes:
* Uses datatypes and given predicate names.
* Generates a predicate name `:dewPointTemperatureCel` for the one not explicitly supplied.
* A fudge in generating the primary key.  The output string needs converting."2013-12-13T08:00:00Z" to "20131213T0800Z".  This is a separate topic.  The whole functions-on-fields-string is orthogonal and important.

## Shaping the data

That's quite basic. The example paints a different picture:
(this is a small section, the RDF from one line of the CSV file; see 
[the full RDF](https://github.com/w3c/csvw/blob/gh-pages/examples/simple-weather-observation.md#rdf-encodinglink)
in the for full example).

    <site/22580943/date-time/20131213T0800Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "2013-12-13T08:00:00Z"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "11.2"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "10.2"^^xsd:double ] ] .


This has adds structure to the output and additional triples not directly due to any column.

The graph fragment template approach is to define a template for the RDF for each row:

    <site/22580943/date-time/{sample-time}>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{sample-time}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{air-temp}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{dew-point}"^^xsd:double ] ] .

This could be provided by the user doing the conversion CSV to RDF or in
the metadata file (by link or directly). When provided by the publisher,
this can be a starting point or used as-is.

A template can be applied by taking each row, applying it to the template by text substitution
and emitting the text. A processor may choose to perform additional checking (e.g. RDF syntax)
but this is not required for conformance.

Notes:
* uses `{sample-time}` twice for different purposes: primary key and triple object.

together with a way to insert the prefixes (a prologue block of text would be enough).

    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .

## Basic RDF by Template

We don't have to define two separate mechanisms for the two case above.  We can define
a graph fragment template can be generated from the metadata alone.  It might look like:

    <site/22580943/date-time/{sample-time}>
       def-op:airTemperature_C 11.2e0 "{air-temp}"^^xsd:double ;
       :dewPointTemperatureCel "{dew-point}"^^xsd:double .
