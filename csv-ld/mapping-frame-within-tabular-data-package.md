# CSV-LD meets dataprotocols.org/tabular-data-package

_(contributed by Jeremy as a rough idea)_

Having done some experimentation with Gregg's CSV-LD mapping frame for my 
[simple weather observation example](https://github.com/w3c/csvw/blob/gh-pages/examples/simple-weather-observation.md#csv-ld-mapping-frame-guestimate) 
it struck me that this is operating in a similar space to the 
[JSON Table Schema](http://dataprotocols.org/json-table-schema/) from dataprotocols.org.

Looking at the two side-by-side, here are some suggestions.

We want our metadata annotation to be able to describe multiple CSV files; see [WG meeting minutes](http://dataprotocols.org/json-table-schema/)
... quoting JeniT: 

> I took it as a strength that a metadata file would describe several CSV files, as that matched current usage.

The [Tabular Data Package spec](http://dataprotocols.org/tabular-data-package/), the renamed Simple Data Format, says:

> Each \[CSV file in the data package\] MUST have an entry in the resources array in the datapackage.json file.

The use of "datapackage.json" follows the [Standard Path](http://w3c.github.io/csvw/syntax/#standard-path) 
mechanism to locate the metadata; we have other alternatives to locate the metadata too.

However, it occurs to me that we could include the _mapping frame_ within the resources array ...

Let's assume that my simple weather observation example CSV was provided with filename: `site22580943-2013-dec.csv` 

_(my example only has two observations - but imagine it held hourly observations for Exeter Airport for the 
entire month of December 2013!)_

`site22580943-2013-dec.csv`:

```
id,Date-time,Air temperature (Cel),Dew-point temperature (Cel)
20131213T0800Z,2013-12-13T08:00:00Z,11.2,10.2
20131213T0900Z,2013-12-13T09:00:00Z,12.0,10.2
```

Then my datapackage.json file might look like this:

`datapackage.json`:

```
{
    "name": "Weather observations for site 22580943 (Exeter Airport, UK)",
    "resources": [{
        "path": "site22580943-2013-dec.csv",
        "csv-mapping-frame": {
            "@context": {
                "@base": "http://data.example.org/wow/data/weather-observations/",
                "ssn": "http://purl.oclc.org/NET/ssnx/ssn#",
                "time": "http://www.w3.org/2006/time#",
                "xsd": "http://www.w3.org/2001/XMLSchema#",
                "qudt": "http://qudt.org/1.1/schema/qudt#",
                "def-op": "http://data.example.org/wow/def/observed-property#",
                "phenomenonTime": {
                    "@id": "ssn:observationSamplingTime",
                    "@type": "time:Instant"
                },
                "datetime": { "@id": "time:inXSDDateTime", "@type": "xsd:dateTime" },
                "result": { "@id": "ssn:observationResult", "@type": "ssn:SensorOutput" },
                "value": { "@id": "qudt:numericValue", "@type": "xsd:double" }
            },
            "@id": "site/22580943/date-time/{id}",
            "@type": "ssn:Observation",
            "phenomenonTime": {"datetime": "{Date-time}"},
            "result": {
                "def-op:airTemperature_C": {"value": "{Air temperature (Cel)}"},
                "def-op:dewPointTemperature_C": {"value": "{Dew-point temperature (Cel)}"}
            }
        }
    }]
}
```

More objects could be added to the `resources` array to describe additional CSV files.

Note that I have introduced a new key `csv-mapping-frame` to distinguish this from the `schema` 
key already used in the Tabular Data Package spec to reference a 
[JSON Table Schema](http://dataprotocols.org/json-table-schema/) instance for the target CSV file.

JSON Table Schema provides for annotating the columns (referred to within the spec as "fields") using a 
`field-descriptor` key: `name`, `title`, `description` etc. ... currently I don't yet see how to do this 
in the CSV-LD mapping frame. There is also explicit support for geospatial elements (`geopoint` and 
`geojson`) and expression of foreign keys (reference to the data package where those keys are defined) 
that would be interesting to consider.

The Tabular Data Package spec already provides a mechanism to describe tabular text files that _don't_ 
conform to the standard CSV syntax using a `dialect` key that conforms to the that described in the 
[CSV Dialect Description Format](http://dataprotocols.org/csv-dialect/). This appears to provide a great 
basis for our work - but may need some additions to deal with emerging issues like i18n (column/row 
transposition, ordering direction etc.).  

Additionally, note that the `path` key in the datapackage.json file could just as easily refer to a 
CSV file available at a URL.
