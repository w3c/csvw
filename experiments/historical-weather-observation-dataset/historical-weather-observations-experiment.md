<h1>Historical weather observation experiment</h1>

<h2>Describing the source dataset</h2>
This experiement is based on a [historical weather observation dataset for Camborne][1]

[1]: http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt

<h3>Raw data (fixed width)</h3>
A snippet of the raw data is provided below:

```
Camborne
Location 1627E 407N 87m amsl
Estimated data is marked with a * after the value.
Missing data (more than 2 days missing in month) is marked by  ---.
Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.
   yyyy  mm   tmax    tmin      af    rain     sun
              degC    degC    days      mm   hours
   1978   9   17.5    11.3       0    26.7    ---
   1978  10   15.6    10.7       0    20.4    ---
   1978  11   12.6     7.6       0    56.3    ---
   1978  12    9.2     5.0       5   276.7    ---
   1979   1    6.5     0.9      13   134.8    ---
   1979   2    6.7     1.9       5   133.0    ---
   1979   3    8.8     3.6       2   143.8   105.0
   1979   4   10.6     5.5       0    65.9   161.1
   1979   5   12.4     5.8       0    82.3   227.0
   1979   6   16.0    10.4       0    43.2   192.5
   1979   7   18.2    12.1       0    27.9   198.9
...
   2013   9   17.3    12.4       0    62.0   114.4#
   2013  10   15.8    11.7       0   160.8    76.5#
   2013  11   11.0     6.7       0    94.4    60.1#
   2013  12   10.7     5.9       0   175.6    44.5#
   2014   1   10.0     5.1       0   218.4    43.0#
   2014   2    9.6     4.7       0   190.4    85.1#
   2014   3   10.3     5.7       0    67.0    94.1#
   2014   4   12.3     7.4       0    81.4   154.9#  Provisional
   2014   5   14.5     9.0       0    70.0   183.2#  Provisional
   2014   6   17.8    11.6       0    64.8   265.9#  Provisional
   2014   7   20.3    14.3       0    28.6   204.7#  Provisional
   2014   8   18.6    12.5       0    92.8   200.2#  Provisional
```

As can be seen, the raw data is actually fixed-format rather than CSV. 

For reference, the column titles (in line 6) are interpreted as follows:
- `yyyy`: year
- `mm`: month
- `tmax`: mean daily maximum temperature
- `tmin`: mean daily minimum temperature
- `af`: number of days of air front
- `rain`: total rain (accumulation)
- `sun`: total sunshine duration

<h3>Conversion to standard CSV format</h3>
[Instructions are provided describing how to import these historical weather observation datasets into Microsoft Excel][2]. Standard CSV format can be exported; a snippet of which is provided below:

[2]: http://www.metoffice.gov.uk/climate/uk/about/station-data/import

```
Camborne,,,,,,,,,,,,
Location 1627E 407N 87m amsl,,,,,,,,,,,,
Estimated data is marked with a * after the  value.,,,,,,,,,,,,
Missing  data (more than 2 days missing in month) is  marked by  ---.,,,,,,,,,,,,
"Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.",,,,,,,,,,,,
yyyy,mm,tmax,,tmin,,af,,rain,,sun,,
,,degC,,degC,,days,,mm,,hours,,
1978,9,17.5,,11.3,,0,,26.7,,---,,
1978,10,15.6,,10.7,,0,,20.4,,---,,
1978,11,12.6,,7.6,,0,,56.3,,---,,
1978,12,9.2,,5,,5,,276.7,,---,,
1979,1,6.5,,0.9,,13,,134.8,,---,,
1979,2,6.7,,1.9,,5,,133,,---,,
1979,3,8.8,,3.6,,2,,143.8,,105,,
1979,4,10.6,,5.5,,0,,65.9,,161.1,,
1979,5,12.4,,5.8,,0,,82.3,,227,,
1979,6,16,,10.4,,0,,43.2,,192.5,,
1979,7,18.2,,12.1,,0,,27.9,,198.9,,
...
2013,9,17.3,,12.4,,0,,62,,114.4,#,
2013,10,15.8,,11.7,,0,,160.8,,76.5,#,
2013,11,11,,6.7,,0,,94.4,,60.1,#,
2013,12,10.7,,5.9,,0,,175.6,,44.5,#,
2014,1,10,,5.1,,0,,218.4,,43,#,
2014,2,9.6,,4.7,,0,,190.4,,85.1,#,
2014,3,10.3,,5.7,,0,,67,,94.1,#,
2014,4,12.3,,7.4,,0,,81.4,,154.9,#,Provisional
2014,5,14.5,,9,,0,,70,,183.2,#,Provisional
2014,6,17.8,,11.6,,0,,64.8,,265.9,#,Provisional
2014,7,20.3,,14.3,,0,,28.6,,204.7,#,Provisional
2014,8,18.6,,12.5,,0,,92.8,,200.2,#,Provisional
```

There are a number of characteristics of this CSV file worth noting:
- The first 5 lines are descriptive metadata
- The header row (containing the column titles) is line 6
- Not all columns have titles; the additional columns inserted to capture qualification of the observation values do not provide a title (e.g. estimated "*", instrument type "#" and quality control status "Provisional")
- Additional attributes (e.g. unit of measurement) for some columns are provided in line 7; therefore ... 
- The data does not begin until line 8
- A primary key for each row may be comprised from concatenating the values of `yyyy` and `mm`
- The observation values are attributable to the entire month
- The token "---" is used to indicate missing data
- Observation values are considered to be 'measured' unless further qualified with a "*" in the following column in which case they are considered to be estimated
- Values of sunshine duration are measured using a Campbell Stokes recorded unless qualified with a "#" in the following column in which case they are measured using an automatic Kipp & Zonen sensor - the difference in measurement instrument affects how the data values are interpreted
- Rows marked with "Provisional" in the final column are yet to pass through quality control assessment

<h3>Assessment of the data</h3>
Each row of this dataset provides a set of observation values, potentially with further qualification, for the month specified by the values in columns `yyyy` and `mm`. Because the temporal domain is consistent within each row, it is tempting to treat the entire row as pertaining to a single observation event - as defined in [Observations and Measurements][om] (O&M) or the [Semantic Sensor Network ontology][ssno] (SSN). 

However, this is not the case as each observed property will have been measured using a different measuring instrument and / or procedure. Therefore we must treat the row as a aggregated set of values - effectively this is a 'productized' view of the data.

[om]: http://www.opengeospatial.org/standards/om
[ssno]: http://www.w3.org/2005/Incubator/ssn/ssnx/ssn

For each discrete observation value we know:
- the location - every observation value in this dataset is for Camborne ... in O&M and SSN this is termed `featureOfInterest`
- the quantity kind being measured ... in O&M and SSN this is termed `observedProperty`
- the unit of measurement
- the time for which the observation value is representative ... in O&M this is termed `phenomenonTime` and in SSN it is `observationSamplingTime`

O&M also provides a mechansim to capture data quality information - which would enable us to assert that a given result has been subject to a quality control process, albeit that we have no details of that process nor whether the 'raw' measured values were amended as the result of that assessment.

However, with the exception of the sunshine duration, we have no information on the provenance (lineage) of the observation values. We don't have information on the procedure used, the instrument used nor even the type of instrument.

<h2>Target RDF implementation; RDF Data Cube</h2>
The [RDF Data Cube vocabulary][qb] is designed to enable the publication of multi-dimensional data, such as statistics, on the web in such a way that it can be linked to related data sets and concepts. Given this design ethos, it seems that tabular data, having 2-dimensions, should be well aligned to the RDF Data Cube model.

[qb]: http://www.w3.org/TR/vocab-data-cube/

<h3>RDF Data Cube: multi-measure observation pattern</h3>
We start with the multi-measure observation approach at it seems more naturally aligned to row-oriented tabular data. In our definition of the [tabular data model][tabular-data-model] we state that:

_Tabular data is data that is structured into rows, each of which contains information about some thing._

... that is, each row describes an object. 

[tabular-data-model]: http://www.w3.org/TR/tabular-data-model/

In the multi-measure observation approach, the object that is described by the row is a `qb:Observation` instance, and the columns of the table relate to the component properties of the dataset - be they _dimension_, _measure_ or _attribute_ components.

There are four options for handling missing values:
- just omit the value
- add a 'property-missing' attribute component to each `qb:Observation` which, say, might provide an array of all the measure components that are absent plus an associated 'nil-reason' (e.g. `http://www.opengis.net/def/nil/OGC/0/missing`)
- define the range of each measure component as the union of a real value and a 'property missing' indicator - however this approach is fatally flawed as it breaks OWL-DL (even with OWL2 punning) because need to mix `owl:ObjectProperty` and `owl:DatatypeProperty` 
- introduce a structured object for each measure component allowing either the real value or 'property missing' indicator to be provided - but this adds additional complexity to the mapping from the CSV dataset as the value of each cell is mapped through two steps to the _value_ of an object.

In this example, we will take the simple option and just omit the missing values.

*DataSet Structure Definition*:
notes:
- this example provides a literal mapping from the information in the CSV dataset and does not attempt to introduce more sophisticated semantics from well-known ontologies for describing observation data such as O&M or SSN.
- the dataset is described with a single dimension `ex:refPeriod` (reference period).
- `yyyy` and `mm` are combined to form an interval to express the ordinal value of the reference period dimension.
- `tmax`, `tmin`, `af`, `rain` and `sun` are specified as measure components.
- defining the concepts to which the measure components relate is beyond the scope of this example. 
- unit of measurement is defined with attachment at the `qb:MeasureComponent`, thus removing the need to express the unit of measure for each observation value within the [abbreviated form of the RDF Data Cube][qb-abbrev].
- the location (expressed using `dct:spatial`) is asserted as an attribute component which is attached at the dataset level, once again simplifying the abbreviated form of the RDF Data Cube.
- an attribute is provided for each of the measure components to qualify the observation value; these attributes map to columns in the CSV dataset with no name. The qualifier may indicate that the observation value has been estimated or, in the case of sunshine duration, indicate that an alternative instrument was used for the measurement. The qualifier `*` indicates an estimated value whilst `#` indicates the use of an alternative instrument.
- the column used to express the `Provisional` flag has no name in the CSV dataset; the property is mapped to `ex:qc-status` (quality control status) which is coded according to a code list (`skos:ConceptScheme`) with values `ex:qcStatus-provisional` and  `ex:qcStatus-approved`.
- both qualifier and quality control status attributes may be missing from a given observation value.


[qb-abbrev]: http://www.w3.org/TR/vocab-data-cube/#normalize 

```
@prefix ex:       <http://www.example.org/def/historical-data#> .
@prefix rdf:      <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:     <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:      <http://www.w3.org/2002/07/owl#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .
@prefix skos:     <http://www.w3.org/2004/02/skos/core#> .
@prefix qb:       <http://purl.org/linked-data/cube#> .
@prefix qudt:	  <http://qudt.org/1.1/schema/qudt#> .
@prefix interval: <http://reference.data.gov.uk/def/intervals/> .

ex:dsd1 a qb:DataStructureDefinition ;
    rdfs:comment "historical monthly observations (multi-measure approach)"@en ;
    qb:component
        [ qb:dimension ex:refPeriod ],
        [ qb:measure   ex:tmax ] ,
        [ qb:measure   ex:tmin ] ,
        [ qb:measure   ex:af ] ,
        [ qb:measure   ex:rain ] ,
        [ qb:measure   ex:sun ] ,
        [ qb:attribute qudt:unit ;
                       qb:componentRequired "true"^^xsd:boolean ;
                       qb:componentAttachment qb:MeasureProperty ] ,
        [ qb:attribute ex:tmax-qualifier ] ,
        [ qb:attribute ex:tmin-qualifier ] ,
        [ qb:attribute ex:af-qualifier ] ,
        [ qb:attribute ex:rain-qualifier ] ,
        [ qb:attribute ex:sun-qualifier ] ,
        [ qb:attribute ex:qc-status ] ,
        [ qb:attribute dct:spatial ;
                       qb:componentRequired "true"^^xsd:boolean ;
                       qb:componentAttachment qb:DataSet ] .

ex:refPeriod  a owl:ObjectProperty, qb:DimensionProperty;
    rdfs:label "reference period for observation value"@en;
    rdfs:range interval:Interval . 

qudt:unit a owl:ObjectProperty, qb:AttributeProperty ;
    rdfs:label "unit of measurement"@en ;
    rdfs:range qudt:Unit .

ex:tmax a owl:DatatypeProperty, qb:MeasureProperty ;
	rdfs:label "mean daily maximum temperature"@en ;
	skos:notation "tmax" ;
	qudt:unit <http://qudt.org/vocab/unit#DegreeCelsius> ;
	rdfs:range xsd:decimal .

ex:tmax-qualifier a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "optional qualifier for value of mean daily maximum temperature"@en ;
    qb:codeList ex:qualifierCodeList ;
    rdfs:range ex:QualifierCodeListType .

ex:tmin a owl:DatatypeProperty, qb:MeasureProperty ;
    rdfs:label "mean daily minimum temperature"@en ;
	skos:notation "tmin" ;
	qudt:unit <http://qudt.org/vocab/unit#DegreeCelsius> ;
    rdfs:range xsd:decimal .

ex:tmin-qualifier a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "optional qualifier for value of mean daily minimum temperature"@en ;
    qb:codeList ex:qualifierCodeList ;
    rdfs:range ex:QualifierCodeListType .

ex:af a owl:DatatypeProperty, qb:MeasureProperty ;
    rdfs:label "number of days of air frost"@en ;
	skos:notation "af" ;
	qudt:unit <http://qudt.org/vocab/unit#Day> ;
    rdfs:range xsd:nonNegativeInteger .

ex:af-qualifier a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "optional qualifier for value of number of days of air frost"@en ;
    qb:codeList ex:qualifierCodeList ;
    rdfs:range ex:QualifierCodeListType .

ex:rain a owl:DatatypeProperty, qb:MeaureProperty ;
    rdfs:label "total rain accumulation"@en ;
	skos:notation "rain" ;
	qudt:unit <http://qudt.org/vocab/unit#Millimeter> ;
    rdfs:range xsd:decimal .

ex:rain-qualifier a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "optional qualifier for value of total rain accumulation"@en ;
    qb:codeList ex:qualifierCodeList ;
    rdfs:range ex:QualifierCodeListType .

ex:sun a owl:DatatypeProperty, qb:MeasureProperty ;
    rdfs:label "total sunshine duration"@en ;
	skos:notation "sun" ;
	qudt:unit <http://qudt.org/vocab/unit#Hour> ;
    rdfs:range xsd:decimal .

ex:sun-qualifier a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "optional qualifier for value of total sunshine duration"@en ;
    qb:codeList ex:qualifierCodeList ;
    rdfs:range ex:QualifierCodeListType .

ex:qc-status a owl:ObjectProperty, qb:AttributeProperty, qb:CodedProperty ;
    rdfs:label "quality control status"@en ;
    qb:codeList ex:qcStatusCodeList ;
    rdfs:range ex:QcStatusCodeType .

ex:qualifierCodeList a skos:ConceptScheme ;
    skos:prefLabel "Code list for qualification of observation values"@en ;
    skos:hasTopConcept ex:qualifier-estimate ;
    skos:hasTopConcept ex:qualifier-alternateInstrument .

ex:QualifierCodeListType a rdfs:Class, owl:Class ;
    rdfs:subClassOf skos:Concept ;
    rdfs:label "Class for members of observation value qualifier code list"@en .

ex:qualifier-estimate a ex:QualifierCodeListType ;
    skos:topConceptOf ex:qualifierCodeList ;
    skos:prefLabel "Estimated value"@en ;
    skos:notation "*" ;
    skos:inScheme ex:qualifierCodeList .

ex:qualifier-alternateInstrument a ex:QualifierCodeListType ;
    skos:topConceptOf ex:qualifierCodeList ;
    skos:prefLabel "Alternative instrument used to measure value"@en ;
    skos:notation "#" ;
    skos:inScheme ex:qualifierCodeList .

ex:qcStatusCodeList a skos:ConceptScheme ;
    skos:prefLabel "Code list for quality control status"@en ;
    skos:hasTopConcept ex:qcStatus-provisional ;
    skos:hasTopConcept ex:qcStatus-approved .

ex:QcStatusCodeType a rdfs:Class, owl:Class ;
    rdfs:subClassOf skos:Concept ;
    rdfs:label "Class for members of quality control status code list"@en .

ex:qcStatus-provisional a ex:qcStatusCodeType ;
    skos:topConceptOf ex:qcStatusCodeList ;
    skos:prefLabel "Provisional"@en ;
    skos:notation "Provisional" ;
    skos:inScheme ex:qcStatusCodeList .

ex:qcStatus-approved a ex:qcStatusCodeType ;
    skos:topConceptOf ex:qcStatusCodeList ;
    skos:prefLabel "Approved"@en ;
    skos:notation "" ;
    rdfs:comment "the default quality control status is approved"@en ;
    skos:inScheme ex:qcStatusCodeList .
```


*Dataset and individual observations (RDF Data Cube abbreviated form)*:
```
@prefix dcat: <http://www.w3.org/ns/dcat#>
@prefix dct:  <http://purl.org/dc/terms/> .
@prefix ex:   <http://www.example.org/def/historical-data#> .
@prefix qb:   <http://purl.org/linked-data/cube#> .

:cambornedata1 a qb:DataSet ;
    dct:title "Camborne data"@en ;
    dct:description "Historical observation weather data for Camborne"@en ;
    dcat:distribution 
        [ dcat:downloadURL <http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt> ; 
          dcat:license <http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/> ] ;
    dct:spatial <http://data.ordnancesurvey.co.uk/id/50kGazetteer/42095> ;
    qb:structure ex:dsd1 .

:record-1978-9 a qb:Observation ;
    qb:dataSet :cambornedata1 ;
    ex:refPeriod <http://reference.data.gov.uk/id/gregorian-interval/1978-09-01T00:00:00/P1M> ;
    ex:tmax 17.5 ;
    ex:tmin 11.3 ;
    ex:af 0 ;
    ex:rain 26.7  .

:record-1978-10 a qb:Observation ;
    qb:dataSet :cambornedata1 ;
    ex:refPeriod <http://reference.data.gov.uk/id/gregorian-interval/1978-10-01T00:00:00/P1M> ;
    ex:tmax 15.6 ;
    ex:tmin 10.7 ;
    ex:af 0 ;
    ex:rain 20.4 .
```

For information, details of the Camborne object, a `NamedPlace`, as defined by Ordnance Survey is provided below:
```
<http://data.ordnancesurvey.co.uk/id/50kGazetteer/42095> 
    a <http://data.ordnancesurvey.co.uk/ontology/50kGazetteer/NamedPlace> ;
    rdfs:label "Camborne" ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/northing> 40500 ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/easting> 164500 .
``` 

Mapping from the CSV dataset to this 'abbreviated form' of an RDF Data Cube observation is relatively simple. That said, there are a few points to note:
- the first five rows (before the header-line) need to be ignored (assumption that the dataset metadata is taken verbatim from the CSV metadata?)
- the header-line contains only _some_ column names; additional names need to be added via the CSV metadata
- the seventh row (following the header-line) can be ignored as the units of measure are already specified in the dataset structure description (however, is it possible or desirable to take the units of measure from the CSV dataset itself?)
- the cell values from columns `yyyy` and `mm` are combined to form a primary key for each row
- the URI for each row is created using a URI-template (?) that incorporates the cell values from columns `yyyy` and `mm`
- cells with empty values need to be skipped over
- the "---" missing value token needs to be interpreted as an empty cell and therefore skipped over 
- the cell values for attribute components (e.g. "*", "#" or "Provisional") need to be converted to their associated concepts


<h3>RDF Data Cube: measure dimension pattern</h3>
In the "measure dimension" approach each observation value is the object of a discrete `qb:Observation` instance. As an _object_ (rather than a _literal_), the qb:Observation instance may be explicitly identified with a name, and thus assertions made about that qb:Observation instance. 

The facility to make assertions about the `qb:Observation` instance and, by association, observation value is important as it allows one to indicate the provenance of that value - to describe the event resulting in the capture of that value.

>> qb:order ... date (1), measure-type (2)
>> the row aligns to a slice
>> mulit-step mappings; see SPARQL Property Paths (http://www.w3.org/TR/sparql11-query/#propertypaths) ... but in such a case, what does the 'datatype' of the column refer to? ... the entity at the end of the path? ... also, how does one assign an identifier to the entity at the beginning of the path?

<h3>next</h3>
use of qudt:QuantityKind for the range of the measure component ... use axioms to assert unit of measurement