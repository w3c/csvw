# RDF Data Cube: multi-measure observation approach #

In our definition of the [tabular data model][tabular-data-model] we state that:

_Tabular data is data that is structured into rows, each of which contains information about some thing._

... that is, each row describes an object. 

[tabular-data-model]: http://www.w3.org/TR/tabular-data-model/

The RDF Data Cube 'multi-measure' approach seems well aligned to our definition of tabular, row-oriented data: each `qb:Observation` (data cube observation) comprises a number of measure components. So we can treat the `qb:Observation` as the subject of each row.

The [dataset structure definition][dsd] for this example is provided [here](data-structure-definition.ttl).

[dsd]: http://www.w3.org/TR/vocab-data-cube/#dsd

The key points to note are:
- the dataset is described with a single dimension `ex:refPeriod` (reference period).
- `yyyy` and `mm` are combined to form an interval to express the ordinal value of the reference period dimension.
- `tmax`, `tmin`, `af`, `rain` and `sun` are specified as measure components (but ... defining the concepts to which the measure components relate is beyond the scope of this example). 
- unit of measurement is defined with attachment at the `qb:MeasureComponent`, thus removing the need to express the unit of measure for each observation value within the [abbreviated form of the RDF Data Cube][qb-abbrev].
- the location (expressed using `dct:spatial`) is asserted as an attribute component which is attached at the dataset level, once again simplifying the abbreviated form of the RDF Data Cube.
- an attribute is provided for each of the measure components to qualify the observation value (e.g. `ex:tmax-qualifier`); these attributes map to columns in the CSV dataset with no name. The qualifier may indicate that the observation value has been estimated or, in the case of sunshine duration, indicate that an alternative instrument was used for the measurement. The qualifier `*` indicates an estimated value whilst `#` indicates the use of an alternative instrument.
- the column used to express the `Provisional` flag has no name in the CSV dataset; the property is mapped to `ex:qc-status` (quality control status) which is coded according to a code list (`skos:ConceptScheme`) with values `ex:qcStatus-provisional` and  `ex:qcStatus-approved`.
- both qualifier and quality control status attributes may be missing from a given observation value.

[qb-abbrev]: http://www.w3.org/TR/vocab-data-cube/#normalize 

On the subject of missing values (as specified using the token `---`) there are four options:
- just omit the value
- add a 'property-missing' attribute component to each `qb:Observation` which, say, might provide an array of all the measure components that are absent plus an associated 'nil-reason' (e.g. `http://www.opengis.net/def/nil/OGC/0/missing`)
- define the range of each measure component as the union of a real value and a 'property missing' indicator - however this approach is fatally flawed as it breaks OWL-DL (even with OWL2 punning) because need to mix `owl:ObjectProperty` and `owl:DatatypeProperty` 
- introduce a structured object for each measure component allowing either the real value or 'property missing' indicator to be provided - but this adds additional complexity to the mapping from the CSV dataset as the value of each cell is mapped through two steps to the _value_ of an object.

In this example, we will take the simple option and just omit the missing values.

The RDF (expressed using the terse-triple-language, ttl) for the dataset and a couple of sample observations are provided below. 

For reference, the data from the CSV file for these observations is:

yyyy,mm,tmax,,tmin,,af,,rain,,sun,,
1978,9,17.5,,11.3,,0,,26.7,,---,,
1978,10,15.6,,10.7,,0,,20.4,,---,,

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

_(The eagle-eyed amongst you will notice that the coordinates of Camborne as defined by Ordnance Survey don't quite match those expressed within the CSV. This is because the location where the observation occurs is actually a representative sampling point for the Camborne area - not the centroid of the geographic area. Ontologies such as SSN and O&M deal with this properly, so we'll wait until experiment 4 before fixing this issue!)_

Mapping from the CSV dataset to this 'abbreviated form' of an RDF Data Cube observation is relatively simple. That said, there are a few points to note:
- the first five rows (before the header-line) need to be ignored (assumption that the dataset metadata is taken verbatim from the CSV metadata?)
- the header-line contains only _some_ column names; additional names need to be added via the CSV metadata
- the seventh row (following the header-line) can be ignored as the units of measure are already specified in the dataset structure description (however, is it possible or desirable to take the units of measure from the CSV dataset itself?)
- the cell values from columns `yyyy` and `mm` are combined to form a primary key for each row
- the URI for each row is created using a URI-template (?) that incorporates the cell values from columns `yyyy` and `mm`
- cells with empty values need to be skipped over
- the `---` missing value token needs to be interpreted as an empty cell and therefore skipped over 
- the cell values for attribute components (e.g. `*`, `#` or `Provisional`) need to be converted to their associated concepts