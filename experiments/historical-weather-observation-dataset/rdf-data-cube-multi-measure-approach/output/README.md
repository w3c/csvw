The target output is an [abbreviated RDF Data Cube representation of the Camborne data](cambornedata-standard-qbAbbr.ttl) published using _standard mode_ conversion. _Standard mode_ is required because we want the _common properties_ from metadata description to propagate into the RDF output.

For information, details of the "Camborne" object, a `NamedPlace`, as defined by Ordnance Survey is provided below:

```
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<http://data.ordnancesurvey.co.uk/id/50kGazetteer/42095> 
    a <http://data.ordnancesurvey.co.uk/ontology/50kGazetteer/NamedPlace> ;
    rdfs:label "Camborne" ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/northing> 40500 ;
    <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/easting> 164500 .
``` 

> Note: The eagle-eyed amongst you will notice that the coordinates of Camborne as defined by Ordnance Survey don't quite match those expressed within the [CSV](../source/cambornedata.csv). This is because the location where the observation occurs is actually a representative sampling point for the Camborne area - not the centroid of the geographic area.

For completeness, a [normalized RDF Data Cube representation of the Camborne data](cambornedata-standard-qbAbbr.ttl) is also provided.

The data-cube normalization adds the following triples:
- The `Table` (`{"@id": "http://example.org/cambornedata"}`) is now specified as a `qb:DataSet`
- The subject described by each row is now specified as a `qb:Observation`
- The spatial attributes provided via the property `dc:spatial` and defined in the data-structure-definition are attached to each instance of `qb:Observation`

> Note: In this multi-measure approach, the unit of measurement attributes provided via the property `oml:uom` remain attached to the _measure component_ (e.g. a property of a property) and cannot directly be included in the normalized data-cube. For details of the unit of measurement for each measure value, one must refer to the property definition; e.g. for `exd:tmax`

```
@prefix exd:  <http://www.example.org/def/historical-data#> .
@prefix oml:  <http://def.seegrid.csiro.au/ontology/om/om-lite#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix qb:   <http://purl.org/linked-data/cube#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

exd:tmax a owl:DatatypeProperty, qb:MeasureProperty ;
	rdfs:label "mean daily maximum temperature"@en ;
	skos:notation "tmax" ;
	oml:uom <http://qudt.org/vocab/unit#DegreeCelsius> ;
	rdfs:range xsd:decimal .
```
