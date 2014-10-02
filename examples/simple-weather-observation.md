Simple weather observation example
==================================

Example based on simple weather observation of air temperature and dew-point temperature at 
fixed point location, with intent to map the tabular data to [Semantic Sensor Network (SSN)][ssn] 
and [Quantities, Units, Dimensions and Types (QUDT)][qudt] ontologies. The data is taken from 
the Met Office’s crowd-sourcing [Weather Observation Website][wow] application, hence the "_wow_" 
element used in path segments. I’ve stuck with "_example.org_" domain because the Met Office does 
not yet publish its data like this and I want to avoid confusion.

  [ssn]: http://www.w3.org/2005/Incubator/ssn/ssnx/ssn
  [qudt]: http://qudt.org
  [wow]: http://wow.metoffice.gov.uk
 
<h2 id="tabular-encoding">Tabular encoding</h2>
 
<table>
  <tr><th>Date-time</th><th>Air temperature (Cel)</th><th>Dew-point temperature (Cel)</th></tr>
  <tr><td>2013-12-13T08:00:00Z</td><td>11.2</td><td>10.2</td></tr>                
  <tr><td>2013-12-13T09:00:00Z</td><td>12.0</td><td>10.2</td></tr>
</table>
 
<h2 id="rdf-encoding">RDF encoding</h2>

(RDF is provided in TTL encoding)
 
First of all, let’s establish a base URI for the dataset and uniquely identify each observation 
instance based on the site number where the observation occurred (in this case, number _22580943_; 
Exeter Airport, UK) and the time of the observation:
 
    @base               <http://data.example.org/wow/data/weather-observations/> .
    @prefix ssn:        <http://purl.oclc.org/NET/ssnx/ssn#> .
     
    <site/22580943/date-time/20131213T0800Z> a ssn:Observation .
    <site/22580943/date-time/20131213T0900Z> a ssn:Observation .
     
I’ve chosen to use a slightly simplified version of the ISO 8601 syntax for the date-time 
identifier element; this may prove to be impractical for the translation (e.g. if the conversion 
does not support string manipulation) but it does provide a “cleaner” URI!
 
Second, let’s assume that because every observation in this tabular data set relates to the same 
point location and sensor, this “metadata” (e.g. ssn:featureOfInterest and ssn:observedBy properties) 
is provided as annotation at the table level – and is out of scope of this particular example.
 
The actual weather observations themselves, using 
[locally defined object properties for the observed quantity](#local-object-property-definitions) (e.g. `def-op:airTemperature_C`
and `def-op:dewPointTemperature_C`) are encoded as follows:
 
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
     
<h2 id="relationships">Interpretting column headings</h2>

From this example, you can see that the relationship between the row subject (e.g. the observation 
instance) and the values provided within the row is comprised of multiple triples by way of blank nodes.
 
Using [LDPath][] syntax:
* column `Date-time` maps to `ssn:observationSamplingTime/time:inXSDDateTime`
* column `Air temperature (Cel)` maps to `ssn:observationResult/def-op:airTemperature_C/qudt:numericValue`
* column `Dew-point temperature (Cel)` maps to `ssn:observationResult/def-op:dewPointTemperature_C/qudt:numericValue`

  [LDPath]: http://marmotta.apache.org/ldpath/language.html 

<h2 id="json-ld-encoding">JSON-LD encoding</h2>

The data expressed in JSON-LD (_please forgive errors owing to manual conversion!_) becomes:
 
    {
      "@context": {
          "@base": "http://data.example.org/wow/data/weather-observations/",
          "ssn":  "http://purl.oclc.org/NET/ssnx/ssn#",
          "time": "http://www.w3.org/2006/time#",
          "xsd": "http://www.w3.org/2001/XMLSchema#", 
          "qudt": "http://qudt.org/1.1/schema/qudt#",
          "def-op": "http://data.example.org/wow/def/observed-property#",
          "phenomenonTime": { "@id": "ssn:observationSamplingTime", "@type": "time:Instant"},
          "datetime": { "@id": "time:inXSDDateTime", "@type": "xsd:dateTime" },
          "result": { "@id": "ssn:observationResult", "@type": "ssn:SensorOutput" },
          "value": { "@id": "qudt:numericValue", "@type": "xsd:double" }
      },
      "@graph": [{
          "@id": "site/22580943/date-time/20131213T0800Z",
          "@type": "ssn:Observation",
          "phenomenonTime": { "datetime": "2013-12-13T08:00:00Z" },
          "result": {
              "def-op:airTemperature_C": { "value": "11.2" },
              "def-op:dewPointTemperature_C": { "value": "10.2" }
          }
      }, {
          "@id": "site/22580943/date-time/20131213T0900Z",
          "@type": "ssn:Observation",
          "phenomenonTime": { "datetime": "2013-12-13T09:00:00Z" },
          "result": {
              "def-op:airTemperature_C": { "value": "12.0" },
              "def-op:dewPointTemperature_C": { "value": "10.2" }
          }
      }]
    }
 
<h2 id="transformation">CSV -to- JSON-LD transformation</h2>

Assuming a lack of string-manipulation functions to convert the ISO 8601 date-time string 
into _simple_ local identifier (e.g. `2013-12-13T08:00:00Z` to `20131213T0800Z`), an easy
method to establish the local identifier string is to execute a pre-processing step prior 
to the generic transformation. 

The need for pre-processing of text-based tabular data seems fairly common, thus
solution(s) established by the CSVW WG for transformation should consider the inclusion of
a simple processing pipeline.

<h3 id="pre-proc">String-manipulation pre-processing step</h3>

Pre-processing step:
* insert new leading column for local identifier: `id`
* for each _data_ row, convert ISO 8601 date-time string to local identifier (e.g. 
`2013-12-13T08:00:00Z` to `20131213T0800Z`) and insert into `id` column

The processed table would be:

<table>
  <tr><th>id</th><th>Date-time</th><th>Air temperature (Cel)</th><th>Dew-point temperature (Cel)</th></tr>
  <tr><td>20131213T0800Z</td><td>2013-12-13T08:00:00Z</td><td>11.2</td><td>10.2</td></tr>                
  <tr><td>20131213T0900Z</td><td>2013-12-13T09:00:00Z</td><td>12.0</td><td>10.2</td></tr>
</table>

<h3 id="mapping-frame">CSV-LD mapping frame (guestimate)</h3>

Looking at [Gregg’s CSV-LD proposal][csv-ld], I think that the _mapping frame_ for this 
example would be:

  [csv-ld]: https://github.com/w3c/csvw/blob/gh-pages/csv-ld/CSV-LD.md
 
    {
      "@context": {
          "@base": "http://data.example.org/wow/data/weather-observations/",
          "ssn":  "http://purl.oclc.org/NET/ssnx/ssn#",
          "time": "http://www.w3.org/2006/time#",
          "xsd": "http://www.w3.org/2001/XMLSchema#", 
          "qudt": "http://qudt.org/1.1/schema/qudt#",
          "def-op": "http://data.example.org/wow/def/observed-property#",
          "phenomenonTime": { "@id": "ssn:observationSamplingTime", "@type": "time:Instant"},
          "datetime": { "@id": "time:inXSDDateTime", "@type": "xsd:dateTime" },
          "result": { "@id": "ssn:observationResult", "@type": "ssn:SensorOutput" },
          "value": { "@id": "qudt:numericValue", "@type": "xsd:double" }
      }, 
      "@id": "site/22580943/date-time/{id}",
      "@type": "ssn:Observation",
      "phenomenonTime": { "datetime": "{Date-time}" },
      "result": {
          "def-op:airTemperature_C": { "value": "{Air temperature (Cel)}" },
          "def-op:dewPointTemperature_C": { "value": "{Dew-point temperature (Cel)}" }
      }
    }

<h3 id="jsonld2ntriples">Further transformation of JSON-LD to other RDF encodings</h3>

Given the [standard API defined for conversion of JSON-LD to other RDF encodings]
(http://www.w3.org/TR/json-ld-api/#rdf-serialization-deserialization-algorithms), JSON-LD may provide
a useful step to serialising RDF into encodings such as [ntriples](http://www.w3.org/TR/n-triples/) or 
[TTL](http://www.w3.org/TR/turtle/). A processing pipeline could be extended to include these subsequent
rdf serialization steps.

<h2 id="local-object-property-definitions">Local object property definitions</h2>

Note that I created some local (OWL) object property definitions as sub-properties of 
qudt:value that are tightly bound to specific quantity kinds (e.g. air temperature and dew-point 
temperature) and unit of measurement (e.g. Celsius). Whilst this is not a central element of the 
example, it is important to show that these assertions can be easily included in the resulting RDF 
by inference from OWL axioms rather than having to express it in the data itself.
 
    @prefix def-op:     <http://data.example.org/wow/def/observed-property#> .
    @prefix owl:        <http://www.w3.org/2002/07/owl#> .
    @prefix xsd:        <http://www.w3.org/2001/XMLSchema#> . 
    @prefix rdfs:       <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix qudt:       <http://qudt.org/1.1/schema/qudt#> .
     
    def-op:airTemperature_C
        a owl:ObjectProperty ;
        rdfs:label "Air temperature (Celsius)"@en ;
        rdfs:subPropertyOf qudt:value ;
        rdfs:range def-op:AirTemperatureQuantityValue_Cel .
     
    def-op:AirTemperatureQuantityValue_Cel
        a owl:Class ;
        rdfs:label "Air temperature quantity value expressed in Celsius"@en ;
        rdfs:subClassOf qudt:QuantityValue ;
        rdfs:subClassOf [
            a owl:Restriction ;
            owl:onProperty qudt:unit ;
            owl:hasValue <http://qudt.org/vocab/unit#DegreeCelsius> ] ;
        rdfs:subClassOf [ 
            a owl:Restriction ;
            owl:onProperty qudt:valueQuantity ;
            owl:cardinality "1"^^xsd:int ] ;
        rdfs:subClassOf [ 
            a owl:Restriction ;
            owl:onProperty qudt:valueQuantity ;
            owl:allValuesFrom def-op:AirTemperatureQuantity ] . 
     
    def-op:AirTemperatureQuantity
        a owl:Class ;
        rdfs:label "Air temperature quantity"@en ;
        rdfs:subClassOf qudt:Quantity ;
        rdfs:subClassOf [
            a owl:Restriction ;
            owl:onProperty qudt:quantityKind ;
            owl:hasValue <http://codes.wmo.int/common/c-15/me/airTemperature> ] .  
     
    def-op:dewPointTemperature_C
        a owl:ObjectProperty , qb:MeasureProperty ;
        rdfs:label "Dew-point temperature (Celsius)"@en ;
        rdfs:subPropertyOf qudt:value ;
        rdfs:range def-op:DewPointTemperatureQuantityValue_Cel .
         
    def-op:DewPointTemperatureQuantityValue_Cel
        a owl:Class ;
        rdfs:label "Dew-point temperature quantity value expressed in Celsius"@en ;
        rdfs:subClassOf qudt:QuantityValue ;
        rdfs:subClassOf [ 
            a owl:Restriction ;
            owl:onProperty qudt:unit ;
            owl:hasValue <http://qudt.org/vocab/unit#DegreeCelsius> ] ;
        rdfs:subClassOf [ 
            a owl:Restriction ;
            owl:onProperty qudt:valueQuantity ;
            owl:cardinality "1"^^xsd:int ] ;
        rdfs:subClassOf [ 
            a owl:Restriction ;
            owl:onProperty qudt:valueQuantity ;
            owl:allValuesFrom def-op:DewPointTemperatureQuantity ] .
     
    def-op:DewPointTemperatureQuantity
        a owl:Class ;
        rdfs:label "Dew-point temperature quantity"@en ;
        rdfs:subClassOf qudt:Quantity ;
        rdfs:subClassOf [
            a owl:Restriction ;
            owl:onProperty qudt:quantityKind ;
            owl:hasValue <http://codes.wmo.int/common/c-15/me/dewPointTemperature> ] .
     
