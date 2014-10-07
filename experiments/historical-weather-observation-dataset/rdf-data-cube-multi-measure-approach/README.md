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

[Source CSV](source/cambornedata.csv) - extract of the full dataset containing only two rows
[Target RDF/turtle output](output/cambornedata-abbreviated.ttl) - abbreviated form of RDF Data Cube

Mapping from the CSV dataset to this 'abbreviated form' of an RDF Data Cube observation is relatively simple. That said, there are a few points to note:
- the first five rows (before the header-line) need to be ignored (assumption that the dataset metadata is taken verbatim from the CSV metadata?)
- the header-line contains only _some_ column names; additional names need to be added via the CSV metadata
- the seventh row (following the header-line) can be ignored as the units of measure are already specified in the dataset structure description (however, is it possible or desirable to take the units of measure from the CSV dataset itself?)
- the cell values from columns `yyyy` and `mm` are combined to form a primary key for each row
- the URI for each row is created using a URI-template (?) that incorporates the cell values from columns `yyyy` and `mm`
- cells with empty values need to be skipped over
- the `---` missing value token needs to be interpreted as an empty cell and therefore skipped over 
- the cell values for attribute components (e.g. `*`, `#` or `Provisional`) need to be converted to their associated concepts

The intent for this experiment is to generate the [abbreviated RDF Data Cube output](output/cambornedata-abbreviated.ttl) without resorting to external templating.

[CSV+ metadata](metadata.json) ... *DISCLAIMER: this is work in progress*

CSV metadata questions:

1. how to declare the dataset (table) to be @type `qb:DataSet`? ... the [metadata vocabulary](http://w3c.github.io/csvw/metadata/index.html) asserts that @type MUST be `Table`. Should I use `type`?
2. [DCAT](http://www.w3.org/TR/vocab-dcat/) attaches `dct:license` to a `dcat:Distribution` Class whereas [Jeni's example](https://github.com/w3c/csvw/blob/gh-pages/examples/tests/scenarios/uc-4/attempts/attempt-3/metadata.json) attaches `license` directly to the Table object. Should we follow the DCAT pattern? 
3. How to express the `dcat:distribution/dcat:downloadURL` property?
4. How to refer to the RDF Data Cube dataset structure definition? ... it's too big to go in the metadata & it's not a CSV so doesn't seem to fit in the  `resources` section.
5. Check URI template syntax ...
6. How to declare 'missing value' token?