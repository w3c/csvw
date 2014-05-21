From https://github.com/w3c/csvw/blob/gh-pages/examples/simple-weather-observation.md

The CSV file is:

    "Date-time", "Air temperature (Cel)", "Dew-point temperature (Cel)" 
    "2013-12-13T08:00:00Z",11.2,10.2
    "2013-12-13T09:00:00Z",12.0,10.2
 
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

and just from that a conversion might generate some RDF:

    <site/22580943/date-time/20131213T0800Z>
       def-op:airTemperature_C 11.2e0 ;
       def-op:dewPointTemperatureCel 10.2e0 .

Notes:
* Uses datatypes and given predicate names.
* A fudge in generating the primary key.  The output string needs converting."2013-12-13T08:00:00Z" to "20131213T0800Z".  This is a separate topic.

That's quite basic. The example paints a different picture:
(small fragment -- see link for full example)

    <site/22580943/date-time/20131213T0800Z>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "2013-12-13T08:00:00Z"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "11.2"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "10.2"^^xsd:double ] ] .


This has structure to the output and addition triples not directly due to any column.
Some of the rdf:type information could be by ever increasing complexity in the metadata.

    <site/22580943/date-time/{sample-time}>
        a ssn:Observation ;
        ssn:observationSamplingTime [ time:inXSDDateTime "{sample-time}"^^xsd:dateTime ] ;
        ssn:observationResult [
            a ssn:SensorOutput ;
            def-op:airTemperature_C [ qudt:numericValue "{Air temperature (Cel)}"^^xsd:double ] ;
            def-op:dewPointTemperature_C [ qudt:numericValue "{Dew-point temperature (Cel)}"^^xsd:double ] ] .

Notes:
* uses full column names and short names.
* uses `{sample-time} twice for two purposes: primary key and triple object.

together with a way to insert the prefixes (a prologue block of text would be enough).

    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
    @prefix time:       <http://www.w3.org/2006/time#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .

