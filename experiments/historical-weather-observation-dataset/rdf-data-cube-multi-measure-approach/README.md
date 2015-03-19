# RDF Data Cube: multi-measure observation approach #

In our definition of the [tabular data model][tabular-data-model] we state that:

_Tabular data is data that is structured into rows, each of which contains information about some thing._

... that is, each row describes an object. 

[tabular-data-model]: http://www.w3.org/TR/tabular-data-model/

The RDF Data Cube 'multi-measure' approach seems well aligned to our definition of tabular, row-oriented data: each `qb:Observation` (data cube observation) comprises a number of measure components. So we can treat the `qb:Observation` as the subject of each row.

The [dataset structure definition][dsd] (`exd:dsd`) for this example is provided [here](def/historical-data.ttl).

[dsd]: http://www.w3.org/TR/vocab-data-cube/#dsd

> Note: for readability, the following prefixes are used in here
> - `exd:` is used to represent `http://www.example.org/def/historical-data#`
> - `dc:` is used to represent `http://purl.org/dc/terms/`
> - `qb:` is used to represent `http://purl.org/linked-data/cube#`
> - `sdmx-attribute` is used to represent `http://purl.org/linked-data/sdmx/2009/attribute#`
> - `sdmx-code` is used to represent `http://purl.org/linked-data/sdmx/2009/code#`

The intent for this experiment is to generate the [abbreviated RDF Data Cube output](output/cambornedata-abbreviated.ttl) without resorting to use of a supplementary [transformation definition][t-def].

[t-def]: http://w3c.github.io/csvw/metadata/index.html#transformation-definitions

The key points to note are:
- The dataset is described with a single dimension `ex:refPeriod` (reference period).
- `yyyy` and `mm` are combined to form an interval to express the ordinal value of the reference period dimension.
- `tmax`, `tmin`, `af`, `rain` and `sun` are specified as measure components (but ... defining the concepts to which the measure components relate is beyond the scope of this example). 
- Unit of measurement is defined with attachment at the `qb:MeasureComponent`, thus removing the need to express the unit of measure for each observation value within the [abbreviated form of the RDF Data Cube][qb-abbrev].
- The location (expressed using `dc:spatial`) is asserted as an attribute component which is attached at the dataset level, once again simplifying the abbreviated form of the RDF Data Cube.
- The token `---` used for declaring missing values is specified as a `null`; output is omitted in these cases. 
- An attribute is provided for each of the measure components `tmax`, `tmin`, `af` and `rain` to qualify the observation value; the value `*` is used to indicate that the observed value is _estimated_. These attributes relate to columns in the CSV dataset without titles. These columns are mapped to specific properties (e.g. `exd:tmax-obsStatus`), each of which are designated as sub-types of `sdmx-attribute:obsStatus`. The term `sdmx-code:obsStatus-E` is used in the output to indicate that values are estimated.
- An attribute is also provided for the measure component `sun`; in this case indicating which type of instrument was used. This attribute is mapped to the  The value `#` indicates use of an automatic Kipp & Zonen sensor whilst an empty value indicates use of Campbell Stokes recorder. Again, the column in the CSV dataset has no title. It is mapped to the property `exd:sun-alternative-instrument` which has a boolean range. A value of `#` indicates `true`. 
- Finally, an attribute is used to express whether the observation data is `Provisional`. The column has no title in the CSV dataset and is mapped to property `sdmx-attribute:obsStatus` (values are coded according to a code list `sdmx-code:obsStatus`). In the output, the term `sdmx-code:obsStatus-P` is used to indicate provisional values whilst term `sdmx-code:obsStatus-A` is used to indicate approved values.

> Note: It would be useful to be able to _assert_ that data is missing (e.g. where the value `---` is used) - rather than simply have an absence of a value (which, in the "open world" model of RDF, doesn't really assert much at all!). However, mapping occurences of the value `---` to a term such as `http://www.opengis.net/def/nil/OGC/0/missing` instead of reporting the actual cell value requires conditional processing which is beyond the capabilities of the standard conversion algorithm and would require the use of a [transformation definition][t-def]

> Note: It may be possible that both `*` and `#` values are used to qualify sunshine duration measurements - albeit that this doesnot occur in the Camborne dataset used here. For simplicity, it is assumed that the "estimated" qualifier `*` cannot be applied to the sunshine duration measurement as this would, again, require conditional processing to be applied in the conversion (e.g. `if ( value == "*" ) then ... , elseif ( value == "#") then ... `).

> Note: use of the value `#` to indicate that an alternative instrument has been used for recording sunshine duration is complex; the `#` (`U+0023`) is a reserved character in the URI Templates [RFC 6570][rfc6570] used within the tabular data model. If the specific tokens were used to indicate the type of instrument used (e.g. `KZ` for "Kipp & Zonen" and `CS` for "Campbell Stokes"; a _default_ value could be used to insert the value `CS` where the cell value is empty) these could be mapped to URLs for those instruments using URI Templates (e.g. `http://example.org/instrument/{sun-instrument}`). The limitation of URI Templates is that they operate on _variables_ which contain the value from the cell - which in this case is `#`!

[qb-abbrev]: http://www.w3.org/TR/vocab-data-cube/#normalize 
[rfc6570]: https://tools.ietf.org/html/rfc6570

[Source CSV](source/cambornedata.csv) - extract of the full dataset containing only four rows

Mapping from the CSV dataset to this 'abbreviated form' of an RDF Data Cube observation is relatively simple. That said, there are a few points to note:
- the first five rows (before the header-line) need to be ignored
- the header-line contains only _some_ column titles; additional names need to be added via the CSV metadata
- the seventh row (following the header-line) can be ignored as the units of measure are already specified in the dataset structure description
- the cell values from columns `yyyy` and `mm` are combined to form a primary key for each row
- the URI for each `qb:observation` is created using a URI-template (?) that incorporates the cell values from columns `yyyy` and `mm`
- cells with empty values need to be skipped over
- the `---` missing value token needs to be interpreted as an empty cell and therefore skipped over 
- the cell values for attribute components (e.g. `*`, `#` or `Provisional`) need to be converted to their associated concepts

> Note: The property `headerRowCount` is set as `2` as there are two header rows after the first five rows of descriptive metadata. As a result, values from both header rows will be used as titles for the columns. In this case, the second header row provides details on units of measurement. This does not affect the output as titles are not used.

> Note: In the original CSV file, the `month` value was provided without trailing zeros for January through September. This makes processing the values to create an ISO 8601 compliant date-time difficult because the trailing zeros _are_ required. For the sake of this experiment, we assume that when converting from fixed-format to CSV, values in the `month` column are provided consistently in the two-digit `mm` format.

[CSV+ metadata description](source/cambornedata.csv-metadata.json)

Details of the output from a _standard mode_ conversion can be found [here](output/README.md).


