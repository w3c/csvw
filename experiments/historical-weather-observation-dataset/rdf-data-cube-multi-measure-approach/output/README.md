The target output is an [abbreviated RDF Data Cube](cambornedata-abbreviated.ttl).

For information, details of the "Camborne" object, a `NamedPlace`, as defined by Ordnance Survey is provided below:

```
<http://data.ordnancesurvey.co.uk/id/50kGazetteer/42095> 
    a <http://data.ordnancesurvey.co.uk/ontology/50kGazetteer/NamedPlace> ;
    rdfs:label "Camborne" ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/northing> 40500 ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/easting> 164500 .
``` 

_(The eagle-eyed amongst you will notice that the coordinates of Camborne as defined by Ordnance Survey don't quite match those expressed within the [CSV](../source/cambornedata.csv). This is because the location where the observation occurs is actually a representative sampling point for the Camborne area - not the centroid of the geographic area. Ontologies such as SSN and O&M deal with this properly, so we'll wait until experiment 4 before fixing this issue!)_

For completeness, a [normalized_ version](cambornedata-normalized.ttl) of the data-cube observations is provided.

For the multi-measure approach this is not very interesting as it only adds the `dct:spatial` attribute; the unit of measurement attributes remain attached to the measure component properties themselves ... e.g. `ex:tmax`

```
ex:tmax a owl:DatatypeProperty, qb:MeasureProperty ;
	rdfs:label "mean daily maximum temperature"@en ;
	skos:notation "tmax" ;
	qudt:unit <http://qudt.org/vocab/unit#DegreeCelsius> ;
	rdfs:range xsd:decimal .
```
