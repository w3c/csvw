# Historical weather observation experiment #
This example provides a transformation of a [historical weather observation dataset for Camborne][1] into an [RDF Data Cube][2] using the ['multi-measure' approach][3].

[1]: http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt
[2]: http://www.w3.org/TR/vocab-data-cube/
[3]: http://www.w3.org/TR/vocab-data-cube/#h4_dsd-mm-obs

## Describing the source dataset ##

### Raw data (fixed width) ###
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

(a [local copy of the fixed-width text formatted camborne data](cambornedata.txt) is provided for convenience)

### Conversion to CSV format ###

As can be seen, the raw data is actually fixed-format rather than CSV. 

For reference, the column titles (in line 6) are interpreted as follows:
- `yyyy`: year
- `mm`: month
- `tmax`: mean daily maximum temperature
- `tmin`: mean daily minimum temperature
- `af`: number of days of air front
- `rain`: total rain accumulation
- `sun`: total sunshine duration

Each of the _data_ columns (e.g. `tmax`, `tmin`, `af`, `rain` and `sun`) have a complementary column (of single-digit width) within which the `*` character is used to denote estimated values. These columns don't have titles. Furthermore, the column used to indicate _provisional_ status of the observation also has no column title. 

The fixed-format data has been converted to CSV format using Microsoft Excel as per the [instructions][4] provided with the dataset - including the additional columns for the observation status.

[4]: http://www.metoffice.gov.uk/climate/uk/about/station-data/import

When parsing the CSV and associated metadata description, column titles from the CSV file are validated against the [titles specified in the metadata description][5]. Zero-length (empty) strings are not permitted. To work around this, the additional _untitled_ columns are given titles in both CSV and metadata description comprising a single white-space character.  

[5]: http://www.w3.org/TR/tabular-data-model/Overview.html#dfn-column-titles

Finally, note that later in the conversion process we want to combine the values from the `yyyy` and `mm` columns to create a date-time string compliant with ISO 8601 _Representations of dates and times_. To do this, the values in the `mm` (month) column must consistently have two digits (e.g. include a trailing zero for months 1 to 9, January to September). The values of `mm` column have been formated accordingly during the translation from fixed-format text to CSV.

A snippet of the resulting CSV (see [http://example.org/cambornedata.csv](cambornedata.csv)) is provided below:


```
Camborne,,,,,,,,,,,,
Location 1627E 407N 87m amsl,,,,,,,,,,,,
Estimated data is marked with a * after the  value.,,,,,,,,,,,,
Missing  data (more than 2 days missing in month) is  marked by  ---.,,,,,,,,,,,,
"Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.",,,,,,,,,,,,
yyyy,mm,tmax, ,tmin, ,af, ,rain, ,sun, , 
,,degC,,degC,,days,,mm,,hours,,
1978,09,17.5,,11.3,,0,,26.7,,---,,
1978,10,15.6,,10.7,,0,,20.4,,---,,
1978,11,12.6,,7.6,,0,,56.3,,---,,
1978,12,9.2,,5,,5,,276.7,,---,,
1979,01,6.5,,0.9,,13,,134.8,,---,,
1979,02,6.7,,1.9,,5,,133,,---,,
1979,03,8.8,,3.6,,2,,143.8,,105,,
1979,04,10.6,,5.5,,0,,65.9,,161.1,,
1979,05,12.4,,5.8,,0,,82.3,,227,,
1979,06,16,,10.4,,0,,43.2,,192.5,,
1979,07,18.2,,12.1,,0,,27.9,,198.9,,
...
2013,09,17.3,,12.4,,0,,62,,114.4,#,
2013,10,15.8,,11.7,,0,,160.8,,76.5,#,
2013,11,11,,6.7,,0,,94.4,,60.1,#,
2013,12,10.7,,5.9,,0,,175.6,,44.5,#,
2014,01,10,,5.1,,0,,218.4,,43,#,
2014,02,9.6,,4.7,,0,,190.4,,85.1,#,
2014,03,10.3,,5.7,,0,,67,,94.1,#,
2014,04,12.3,,7.4,,0,,81.4,,154.9,#,Provisional
2014,05,14.5,,9,,0,,70,,183.2,#,Provisional
2014,06,17.8,,11.6,,0,,64.8,,265.9,#,Provisional
2014,07,20.3,,14.3,,0,,28.6,,204.7,#,Provisional
2014,08,18.6,,12.5,,0,,92.8,,200.2,#,Provisional
```

### Characteristics of the observation dataset for Camborne and its CSV encoding ###

A significant amount of contextual information is known about the observation dataset for Camborne and its CSV encoding. Details of this information and RDF encodings are provided in [JSON-LD](http://www.w3.org/TR/json-ld/) below.

The observation dataset for Camborne is published by the [Met Office](http://www.metoffice.gov.uk).

```
  "dc:publisher": [{
    "schema:name": "Met Office",
    "schema:url": {"@id": "http://www.metoffice.gov.uk"}
  }]
```

Both the fixed-format text- and CSV-formatted files ([http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt](cambornedata.txt) and [http://example.org/cambornedata.csv](cambornedata.csv)) can be considered as _distributions_ of a _dataset_ - as specified in the [W3C Data Catalog vocabulary DCAT](http://www.w3.org/TR/vocab-dcat/). Furthermore, the CSV-formatted file is derived from the fixed-format text formatted file. This relationship can be specified using the [W3C PROV-O](http://www.w3.org/TR/prov-o/) term `prov:wasDerivedFrom`.

```
  "dcat:distribution": [{
    "@id": "http://example.org/cambornedata#distribution-txt",
    "dc:title": "Camborne data (fixed-width text format)",
    "dc:format": {"@value": "text/plain"},
    "dcat:license": {"@id": "http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/"},
    "dcat:downloadURL": {"@id": "http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt"}
  }, {
    "@id": "http://example.org/cambornedata#distribution-csv",
    "dc:title": "Camborne data (CSV format)",
    "dc:format": {"@value": "text/csv"},
    "dcat:downloadURL": {"@id": "cambornedata.csv"},
    "prov:wasDerivedFrom": {"@id": "http://example.org/cambornedata#distribution-txt"}
  }]
```

Camborne is a geographic location - with OSGB Northing and Easting plus Altitude coordinates specified in the "metadata" header-rows: `Location 1627E 407N 87m amsl`. We can precisely relate the dataset to a geographical location - using both coordinates and an [Ordnance Survey](http://www.ordnancesurvey.co.uk/) [NamedPlace](http://data.ordnancesurvey.co.uk/ontology/50kGazetteer/NamedPlace).

```
  "dc:spatial": [{
    "@id": "http://data.ordnancesurvey.co.uk/id/50kGazetteer/42095"
  }, { 
    "@id": "http://example.org/cambornedata#point-location",
    "@type": "http://www.w3.org/2003/01/geo/wgs84_pos#Point",
    "http://www.w3.org/2003/01/geo/wgs84_pos#alt": 87.0,
    "http://www.w3.org/2003/01/geo/wgs84_pos#lat": 49.770856,
    "http://www.w3.org/2003/01/geo/wgs84_pos#lon": 7.533833
  }]
```

The header-rows of the CSV file contain some contextual information. We can capture this information using the [notes annotation](http://www.w3.org/TR/tabular-data-model/#dfn-table-notes) specified in the [tabular data model](http://www.w3.org/TR/tabular-data-model/) and the [Open Annotation data model](http://www.openannotation.org/spec/core/) currently under development within the [Web Annotations Working Group](http://www.w3.org/annotation/).

```
  "notes": [{
    "@type": "oa:Annotation",
    "oa:hasTarget": {"@id": "cambornedata.csv#row=1-5"},
    "oa:hasBody": {
      "@type": "oa:EmbeddedContent",
      "rdf:value": "The first five rows of the CSV file contain the following descriptive metadata:\r\f\r\fCamborne\r\fLocation 1627E 407N 87m amsl\r\fEstimated data is marked with a * after the  value.\r\fMissing data (more than 2 days missing in month) is  marked by  ---.\r\fSunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.",
      "dc:format": {"@value": "text/plain"}
    }
  }, {
    "@type": "oa:Annotation",
    "oa:hasTarget": {"@id": "cambornedata.csv#row=7"},
    "oa:hasBody": {
      "@type": "oa:EmbeddedContent",
      "rdf:value": "The seventh row of the CSV file defines the units of measure used for the observed values.",
      "dc:format": {"@value": "text/plain"}
    }
  }]
```

The first 5 lines of the CSV file are descriptive metadata, the header row (containing the column titles) is line 6 with additional attributes (e.g. unit of measurement) for some columns provided in line 7. We can direct the parsing of the CSV file to cater for the extra rows using a [dialect description](http://www.w3.org/TR/tabular-metadata/#dialect-descriptions) as specified in the [CSVW metadata vocabulary](http://www.w3.org/TR/tabular-metadata/).

```
  "dialect": {
   "skipRows": 5,
   "headerRowCount": 2
  }
```

The token `---` is used to indicate missing data. We can cater for this using the [null annotation](http://www.w3.org/TR/tabular-data-model/#dfn-column-null) as specified in the [tabular data model](http://www.w3.org/TR/tabular-data-model/).

```
    "null": "---"
```

Combinations of `yyyy` (year) and `mm` (month) values should be unique for each row in the CSV file. This can be checked by specifying a composite [primary key](http://www.w3.org/TR/tabular-data-model/#dfn-row-primary-key) using values from both columns - noting that the column `name` is used within the primary key definition.

```
  "tableSchema": {
    "columns": [{
      "name": "year",
      "titles": [ "yyyy", "Year" ],
      ...
    }, {
      "name": "month",
      "titles": [ "mm", "Month"],
      ...
    },
      ...
    ],
    "primaryKey": [ "year", "month" ]
```

Furthermore, each row is describing a single entity that can be uniquely identified using the year and month. Using a URI Template, as defined in [RFC 6570](https://tools.ietf.org/html/rfc6570), we can set the [about URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-about-url) annotation that is used as the subject of each triple arising from the cell values.

```
    "aboutUrl": "http://example.org/cambornedata#record-{year}-{month}"
```

### Describing the columns within the CSV file ###

Each column is described in the metadata description ...

```
    "columns": [ ... ]
```

The first two columns provide the year and month associated with the observation for the current row. Below, we can see:

* the `name` of each column - which MUST be unique
* an array of `titles` - the first of which MUST match the title from the header row of the CSV file
* a supplmentary description for the column - provided using the property `dc:description`
* specification of the datatype - in both cases `integer`

Given that the observation values are attributable to an entire month, we want to specify a reference period for the observation. We use the [property URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-property-url) annotation to indicate that the RDF predicate of the triple for cells in this column is `http://purl.org/linked-data/sdmx/2009/dimension#refPeriod`. We use a URI Template to construct the [value URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-value-url) annotation that becomes the object for the RDF triples resulting from the cells in this column.

Note that URI Template combines both `year` and `month` values to construct a date-time value for the specific month. No triples are required from the `month` column - so the [suppress output](http://www.w3.org/TR/tabular-data-model/#dfn-table-suppress-output) property is set. 

```
    {
      "name": "year",
      "titles": [ "yyyy", "Year" ],
      "dc:description": "Year of observation",
      "datatype": "integer",
      "required": true,
      "propertyUrl": "http://purl.org/linked-data/sdmx/2009/dimension#refPeriod",
      "valueUrl": "http://reference.data.gov.uk/id/gregorian-interval/{year}-{month}-01T00:00:00/P1M"
    }, {
      "name": "month",
      "titles": [ "mm", "Month"],
      "dc:description": "Month of observation",
      "datatype": "integer",
      "required": true,
      "suppressOutput": true,
      "rdfs:comment": "'year' and 'month' columns are combined to form the URI for the 'refPeriod'; an instance of w3time:Interval"
    }
```

Each of the _data_ columns (e.g. `tmax`, `tmin`, `af`, `rain` and `sun`) and their complementary columns follow a similar pattern. Points of interest include:

* the property used to relate the data value and the observation status (e.g. `http://example.org/cambornedata#tmax` and `http://example.org/cambornedata#tmax-obsStatus`) to the observation is specified using the [property URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-property-url) annotation. These properties are defined as part of the data structure definition (see below)
* the [value URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-value-url) annotation for the observation status refers to `http://purl.org/linked-data/sdmx/2009/code#obsStatus-E` - a value from the [SDMX](http://sdmx.org) [code list for observation status values](http://purl.org/linked-data/sdmx/2009/code#obsStatus) representing "Estimated value". Only if there is a value in the observation status column for that row will an RDF triple be generated; the data uses a "*" character to indicate _estimated_ with an empty string (e.g. a `null` value) indicating a _normal_ value and therefore no triple being generated.


Note the `titles` value for `tmax_obsStatus` is specified as " " in order to match the title in the CSV file.

```
    {
      "name": "tmax",
      "titles": "Maximum temperature",
      "dc:description": "Mean daily maximum temperature",
      "datatype": "decimal",
      "propertyUrl": "http://example.org/cambornedata#tmax"
    }, {
      "name": "tmax_obsStatus",
      "titles": " ",
      "dc:description": "status of the observed value of mean daily maximum temperature",
      "propertyUrl": "http://example.org/cambornedata#tmax-obsStatus",
      "valueUrl": "http://purl.org/linked-data/sdmx/2009/code#obsStatus-E"
    }
```

The data value for sunshine hours may be qualified with a "#" character to indicate that an alternative measurement instrument has been used: "Kipp and Zonen" in place of the normal "Campbell Stokes" instrument. Here a boolean value used to indicate whether or not the alternative instrument has been used: `true` for "Kipp and Zonen" and `false` for "Campbell Stokes". The datatype [format](http://www.w3.org/TR/2015/WD-tabular-data-model-20150416/#dfn-datatype-format) annotation specifies the string "#" as representing `true` and "-" for `false`. 

```
    {
      "name": "sun",
      "titles": "Sunshine duration",
      "dc:description": "Total sunshine duration",
      "datatype": "decimal",
      "propertyUrl": "http://example.org/cambornedata#sun"
    }, {
      "name": "sun_alternative_instrument",
      "titles": " ",
      "dc:description": "assertion of whether the 'Kipp & Zonen' instrument is used in place of the normal 'Campbell Stokes' instrument for recording sunshine duration",
      "rdfs:comment": "a value of 'true' indicates use of 'Kipp & Zonen' instrument",
      "datatype": {"base": "boolean", "format": "#|-"},
      "propertyUrl": "http://example.org/cambornedata#sun-alternative-instrument"
    }
```

The column indicating _provisional_ status for the entire observation record is similar to the observation status for each data value. However, in this case, a URI Template is specified from which the [value URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-value-url) annotation is created. Here, the URI Template `{obsStatus:1}` uses only the first character from the cell value - in this case "P" for `Provisional`, thus the object of the RDF triple would be the code-list term `http://purl.org/linked-data/sdmx/2009/code#obsStatus-P` for "Provisional value".

```
    {
      "name": "obsStatus",
      "titles": " ",
      "dc:description": "status of the observation result",
      "datatype": "string",
      "default": "Approved",
      "propertyUrl": "http://purl.org/linked-data/sdmx/2009/attribute#obsStatus",
      "valueUrl": "http://purl.org/linked-data/sdmx/2009/code#obsStatus-{obsStatus:1}"
    }
```

Finally, we need to relate the observation record to the camborne dataset itself. We have run out of _real_ columns to use in order to create this triple (one triple per column). To achieve this, we create a [virtual column](http://www.w3.org/TR/tabular-data-model/#dfn-virtual-column). The [virtual](http://www.w3.org/TR/tabular-data-model/#dfn-column-virtual) annotation is set to `true`, the [property URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-property-url) annotation is `qb:dataSet` and the [value URL](http://www.w3.org/TR/tabular-data-model/#dfn-cell-value-url) annotation refers to the URL of the tabular dataset: `http://example.org/cambornedata`.

```
    {
      "name": "dataset_ref",
      "rdfs:comment": "this 'virtual' column allows the qb:Observation instance that is the subject of the current row to be related to the qb:dataset",
      "virtual": true,
      "propertyUrl": "qb:dataSet",
      "valueUrl": "http://example.org/cambornedata"
    }
```

Note that in the metadata description, we can use `qb:dataSet` rather than `http://purl.org/linked-data/cube#dataSet` because the RDF Data Cube vocabulary is specified within the [RDFa 1.1 Initial Context](http://www.w3.org/2011/rdfa-context/rdfa-1.1) with default prefix `qb`.

### RDF Data Cube data structure definition ###

In this example, we have adopted the ['multi-measure' approach][3] with each row from the CSV data file describing an [Observation](http://www.w3.org/TR/vocab-data-cube/#ref_qb_Observation). As defined above, the subject of each row (i.e. the observation) is identified using the following URI Template: `http://example.org/cambornedata#record-{year}-{month}`.

To express the tabular data as an RDF Data Cube we need to provide a [data structure definition](http://www.w3.org/TR/vocab-data-cube/#dsd) comprising a set of [ComponentProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_ComponentProperty) instances.


```
  "qb:structure": {
    "@id": "http://example.org/cambornedata#dsd",
    "@type": "qb:DataStructureDefinition",
    "rdfs:comment": "RDF Data Cube data structure definition for historical monthly observations (multi-measure approach)",
    "qb:component": [ ... ]
  }
```

Each of the [property URLs](http://www.w3.org/TR/tabular-data-model/#dfn-cell-property-url) defined in the table schema (one for each column in the tabular data where output is not suppressed) is mapped to a [ComponentProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_ComponentProperty).

The _year_ and _month_ values - which are combined to specify the _reference period_ ([http://purl.org/linked-data/sdmx/2009/dimension#refPeriod](http://purl.org/linked-data/sdmx/2009/dimension#refPeriod)) - are mapped to a [DimensionProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_DimensionProperty).

```
        "qb:dimension": {
          "@id": "http://purl.org/linked-data/sdmx/2009/dimension#refPeriod",
          "@type": "qb:DimensionProperty",
          "rdfs:label": "reference period for observation value",
          "rdfs:range": {
            "@id": "http://www.w3.org/2006/time#Interval"
          }
        }
```

Note that supplementary information describing the property (e.g. `rdfs:label` and `rdfs:range`) has been included in the definition.

The properties relating _data_ values to the [Observation](http://www.w3.org/TR/vocab-data-cube/#ref_qb_Observation) are mapped to [MeasureProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_MeasureProperty) instances; for example, `tmax`. Again, note that the description of the property has been embedded in the data structure definition. 

```
        "qb:measure": {
          "@id": "http://example.org/cambornedata#tmax",
          "@type": [
            "owl:DatatypeProperty",
            "qb:MeasureProperty"
          ],
          "http://def.seegrid.csiro.au/ontology/om/om-lite#uom": {
            "@id": "http://qudt.org/vocab/unit#DegreeCelsius"
          },
          "rdfs:label": "mean daily maximum temperature",
          "rdfs:range": {
            "@id": "xsd:decimal"
          },
          "skos:notation": "tmax"
        }
```

Of particular interest, note that the unit of measurement - as specified in row 7 of the CSV file - is provided in the property description. As shown below, the unit of measurement ([http://def.seegrid.csiro.au/ontology/om/om-lite#uom](http://def.seegrid.csiro.au/ontology/om/om-lite#uom)) is declared as an [AttributeProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_AttributeProperty) that is attached directly to the [MeasureProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_MeasureProperty).

```
        "qb:attribute": {
          "@id": "http://def.seegrid.csiro.au/ontology/om/om-lite#uom",
          "@type": "qb:AttributeProperty",
          "rdfs:label": "unit of measurement"
        },
        "qb:componentAttachment": {
          "@id": "qb:MeasureProperty"
        },
        "qb:componentRequired": true
```

The properties relating the complementary _observation status_ values to the [Observation](http://www.w3.org/TR/vocab-data-cube/#ref_qb_Observation) are mapped to [AttributeProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_AttributeProperty) instances; for example `tmax-obsStatus`. Here we can see how values from the column are related to a specific controlled vocabulary: `"qb:codeList": { "@id": "http://purl.org/linked-data/sdmx/2009/code#obsStatus" }`.

```
        "qb:attribute": {
          "@id": "http://example.org/cambornedata#tmax-obsStatus",
          "@type": [
            "owl:ObjectProperty",
            "qb:AttributeProperty",
            "qb:CodedProperty"
          ],
          "qb:codeList": {
            "@id": "http://purl.org/linked-data/sdmx/2009/code#obsStatus"
          },
          "rdfs:label": "status of the observed value of mean daily maximum temperature",
          "rdfs:range": {
              "@id": "http://purl.org/linked-data/sdmx/2009/code#ObsStatus"
          }
        }
```

Finally, the location information for the dataset `dc:spatial` is specified mapped to an [AttributeProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_AttributeProperty) that is attached to the [DataSet](http://www.w3.org/TR/vocab-data-cube/#ref_qb_DataSet). 

```
        "qb:attribute": {
          "@id": "dc:spatial"
        },
        "qb:componentAttachment": {
          "@id": "qb:DataSet"
        },
        "qb:componentRequired": true
```

### Metadata description ###

All the information described above is contextual information - metadata - about the CSV file and can all be included in the metadata description of the CSV file: [cambornedata.csv-metadata.json](cambornedata.csv-metadata.json) - which must be provided in [JSON-LD](http://www.w3.org/TR/json-ld/) format. For convenience in this self-contained example, descriptions of all the resources, including properties and data structure definition, are included in a single file. In real implementations, it is likely that these resources would be published in separate documents and referenced from the metadata description. 

### Standard-mode output from conversion ###

Example output from the [standard mode conversion to RDF](http://www.w3.org/TR/csv2rdf/#dfn-standard-mode) is provided below. Only in [standard mode](http://www.w3.org/TR/csv2rdf/#dfn-standard-mode) is the ancilliary information from the metadata description included in the output; [minimal mode](http://www.w3.org/TR/csv2rdf/#dfn-minimal-mode) conversion includes only the information gleaned from the cells of the tabular data.

The RDF output from the conversion is in the [abbreviated](http://www.w3.org/TR/vocab-data-cube/#dfn-abbreviated) data cube form - as defined in the [W3C RDF Data Cube Recommendation](http://www.w3.org/TR/vocab-data-cube/#normalize).

* [Turtle](http://www.w3.org/TR/turtle/) format: [cambornedata-standard.ttl](cambornedata-standard.ttl)
* [JSON-LD](http://www.w3.org/TR/json-ld/) format: [cambornedata-standard.json](cambornedata-standard.json)

### Cut-down example (only 4 rows of data) ###

Given that the historical weather observation dataset for Camborne includes 439 rows of data, it is a little easier to see what is going on with a cut down example. [cambornedata-snippet.csv](cambornedata-snippet.csv) contains only 4 rows of data:

```
Camborne,,,,,,,,,,,,
Location 1627E 407N 87m amsl,,,,,,,,,,,,
Estimated data is marked with a * after the  value.,,,,,,,,,,,,
Missing  data (more than 2 days missing in month) is  marked by  ---.,,,,,,,,,,,,
"Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.",,,,,,,,,,,,
yyyy,mm,tmax, ,tmin, ,af, ,rain, ,sun, , 
,,degC,,degC,,days,,mm,,hours,,
1978,09,17.5,,11.3,,0,,26.7,,---,,
2007,06,17.3,,12.2,,0,,117,,154.9,,
2014,03,10.3,,5.7,,0,,67,,94.1,#,
2014,04,12.3,,7.4,,0,,81.4,,154.9,#,Provisional
```

The metadata description is amended to refer to the differently named file: [cambornedata-snippet.csv-metadata.json](cambornedata-snippet.csv-metadata.json).

The [standard mode](http://www.w3.org/TR/csv2rdf/#dfn-standard-mode) output is below:

* [Turtle](http://www.w3.org/TR/turtle/) format: [cambornedata-snippet-standard.ttl](cambornedata-snippet-standard.ttl)
* [JSON-LD](http://www.w3.org/TR/json-ld/) format: [cambornedata-snippet-standard.json](cambornedata-snippet-standard.json)

### RDF Data Cube Normalisation ###

As defined in the [W3C RDF Data Cube Recommendation](http://www.w3.org/TR/vocab-data-cube/#normalize), the [abbreviated](http://www.w3.org/TR/vocab-data-cube/#dfn-abbreviated) data cube can be _normalized_. In this particular example, the only material difference achieved through normalization of the data cube is the addition of the `rdf:type` assertions for instances of [qb:Observation](http://www.w3.org/TR/vocab-data-cube/#ref_qb_Observation) and [qb:DataSet](http://www.w3.org/TR/vocab-data-cube/#ref_qb_DataSet). The  _attached components_ `dc:spatial` and `http://def.seegrid.csiro.au/ontology/om/om-lite#uom`, attached to the [DataSet](http://www.w3.org/TR/vocab-data-cube/#ref_qb_DataSet) and [MeasureProperty](http://www.w3.org/TR/vocab-data-cube/#ref_qb_MeasureProperty) instances respectively, are already specified in the RDF output by the CSV conversion process.

The [normalized](http://www.w3.org/TR/vocab-data-cube/#dfn-normalized) data cube is output below in [Turtle](http://www.w3.org/TR/turtle/) format:

* [cambornedata-snippet-normalized.ttl](cambornedata-snippet-normalized.ttl)

For reference, see the [differences between standard output and the normalized data cube](cambornedata-snippet-standard-to-normalized-diff.txt).

