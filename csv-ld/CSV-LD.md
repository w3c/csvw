# CSV-LD Working Notes
## Background
There are many parallels between the goals of JSON-LD and the CSV on the Web efforts:

* Both JSON and CSV are common formats for representing data on the web,
* Both are open formats, unencumbered by proprietary Intellectual Property restrictions,
* Both are used for publishing simple data, where the "schema" is often application-specific,
* Both have communities that have different expectations for how to represent tabular data,
* Both are often used as intermediate formats for transforming into a native representation.

JSON-LD had as one of it's design goals to allow zero-edit use of existing JSON to obtain a reasonable representation of JSON as Linked Data. I think that we should have a similar objective for CSV. A principle mechanism in JSON-LD was the use of a _Context_; this allowed simple terms to be given IRIs and values to be given datatypes. CSV has a similar issue, where _column names_ typically identify entities or properties of those entities, and values have an assumed type. In some cases (e.g., Excel), the format may also allow a native representation of a given datatype, which is also the case in JSON, but for a limited set of datatypes.

## Simple JSON-LD mapping
In one use case, a CSV may represent multiple entities, with one line per entity description and each column represents a property of that entity, for example, the above JSON could be represented as follows:

<table>
  <tr><th>name</th><th>homepage</th><th>image</th></tr>
  <tr><td>Gregg Kellogg</td><td>http://greggkellogg.net/</td><td>http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png</td></tr>
</table>

A _mapping frame_ can be described for mapping such a table to JSON-LD by interpreting the first row of the table as a set of field headers which can then be mapped to patterns contained within a _mapping frame_ document:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "@vocab": "http://schema.org/",
        "homepage": {"@type": "@id"},
        "image": {"@type": "@id"},
      },
      "name": "{name}",
      "homepage": "{homepage}",
      "image": "{image}"
    }

Processing begins by reading the first row from the table to map _column numbers_ to _column names_. Subsequent rows are read with each field substituted into the _mapping frame_ by replacing patterns containing a _column names_ with the value of that field. A _field reference_ is a component of a string contained within the _mapping frame_ which is the _column name_ surrounded by `{}`. For example, the _name_ member has the value `"{name}"`, when processing a row, the field from the first column has the _column name_ `name`. Every occurrence of `{name}` within the _mapping frame_ is substituted with the field value. Subsequently, fields are normalized based on the `@type` associated with a [term definition][] within the context. Using the template to transform the table shown above would then result in the following:

    [{
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "@vocab": "http://schema.org/",
        "homepage": {"@type": "@id"},
        "image": {"@type": "@id"},
      },
      "name": "Gregg Kellogg",
      "homepage": "http://greggkellogg.net/",
      "image": "http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png"
    }]

(Issue: should the mapping frame allow for more structure, so there can be a standard document portion describing document metadata?)

### CSV-LD patterns
CSV-LD is defined within a standard JSON-LD document where string values may take the form of a _pattern_. A _pattern_ is composed of one or more _field references_, which are used to replace the _field reference_ with the value of the field for each record. Examples of field references are the following:


    "term": "{term}"
    "{pred}": "{value}"
    "term": "{col1}/{col2}"
    "term": {"@value": "{col}", "@type": "xsd:integer"}
    "row": "{@rowno}"
    "term": "{@colno=1}"
    "termcol": "{term@colno}"

A _field reference_ may be used singly, or in combination with other field references within a pattern. A _field reference_ may be used in some structure such as an expanded value definition (although this may be redundant, if the term definition defines `@type`). The `@` form within a reference is used to extract metadata about the record or field: `@rowno` expands to the current row number from the table, `@colno=1` expands to the value of the field in the current record in the first column. `@term@colno` expands to the column number of the field referenced by `term`.

If a pattern resolves to a string in the form of an Boolean, Integer, Decimal, or Floating Point value (as defined by their XSD datatype definitions), the pattern is replaced with that value. However, if the term referencing defines a @type, or the pattern is contained within an expanded value form having an @type, that type is used to coerce the pattern.

If a pattern references an undefined field, the entire pattern evaluates to `null`, which when expanded in JSON-LD, causes the associated key/value to be removed. This can be useful when a single _mapping frame_ is used for multiple tables, where some tables may include different data than others.

If a pattern is used as the value of `@id`, and that pattern resolves to `null`, the entire node definition is replaced with `null`.

Note that a missing field is different from an empty field, and an empty field simply resolves to an empty substitution within the pattern.

(Note: this places an obvious restriction on column names which contain `@`. We can restrict it to specifically identified sub-patterns).

## Zero edit transformation
The above example assumes that a _mapping frame_ is already associated with a CSV file. To preserve the _zero-edit_ goals of CSV-LD, a templates may also be provided as part of an HTTP response.

By specifying a ''CSV-LD mapping frame'' through a Link header, a mapping from CSV records using the mapping frame gives a CSV-LD knowledgeable client the ability to transform the accompanying CSV into JSON-LD, and therefore into RDF.

    GET /ordinary-csv-document.csv HTTP/1.1
    Host: example.com
    Accept: text/csv,*/*;q=0.1

    ====================================

    HTTP/1.1 200 OK
    ...
    Content-Type: text/csv
    Link: &lt;http://example/mapping.jsonld&gt;; rel=&quot;http://www.w3.org/ns/csv-ld#mapping&quot;; type=&quot;application/ld+json&quot;

    name,homepage,image
    "Gregg Kellogg",http://greggkellogg.net/,http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png

The _Cmapping template_ is referenced in the Link header and known to be a CSV-LD mapping frame due to the type attribute of that Link header. This is a file formatted as JSON-LD which is used to specify how each record is transformed into a JSON-LD node using the column names from the CSV to identify members of the JSON and replacing the associated null value with the field from each record processed. The `http://example/mapping.jsonld` file could then be represented as follows:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "@vocab": "http://schema.org/",
        "homepage": {"@type": "@id"},
        "image": {"@type": "@id"},
      },
      "name": "{name}",
      "homepage": "{homepage}",
      "image": "{image}"
    }

(Note that the JSON-LD document is extended with concepts from CSV-LD using the `@extension` member of the `@context`).

Applying the mapping to each CSV record creates an array of node definitions:

    [
      {
        "@context": {
          "@extension": "http://www.w3.org/ns/csv-ld",
          "@vocab": "http://schema.org/",
          "homepage": {"@type": "@id"},
          "image": {"@type": "@id"},
        },
        "name": "Gregg Kellogg",
        "homepage": "http://greggkellogg.net/",
        "image": "http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png"
      }
    ]

As an optimization, the `context` can be extracted and each node placed within an array under `@graph`:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "@vocab": "http://schema.org/",
        "homepage": {"@type": "@id"},
        "image": {"@type": "@id"},
      },
      "@graph": [{
        "name": "Gregg Kellogg",
        "homepage": "http://greggkellogg.net/",
        "image": "http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png"
      }]
    }

## Direct Mapping
In the absence of a _mapping frame_ a CSV-LD processor will make a _direct mapping_ by automatically constructing a _mapping frame_ from the _column names_ or other. The default _mapping frame_ is constructed from the following:

    {
      "@context: {
        "@vocab": "http://path/to/document/",
        "csv": "http://w3c/future-csv-vocab/",
        "xsd": "http://www.w3.org/2001/XMLSchema#"
      },
      "row": {"@value": "{@rowno}", "@type": "xsd:integer"},
      "Column1": "{Column1}",
      "Column2": "{Column2}",
      ...
    }

Where each column name is used both as a property and within a pattern. This causes the column names to be used as properties relative to the current document.

If invoked without a header, the following definition is used:

    {
      "@context: {
        "@vocab": "http://w3c/future-csv-vocab/",
        "xsd": "http://www.w3.org/2001/XMLSchema#"
      },
      "row": {"@value": "{@rowno}", "@type": "xsd:integer"},
      "col1": "{@colno=1}",
      "col2": "{@colno=2}",
      ...
    }

In this case property names are taken from the `csv` namespace.

## Table Join representation
A common way to use CSV for data-dumps is as the result of a SQL (or SPARQL) JOIN. When joining data different columns contain data from different tables, or entities, with data repeated where there is a one-to-many relationship between the tables. For example consider the result of running the following SPARQL query on http://rdf.greggkellogg.net/sparql:

    PREFIX doap: <http://usefulinc.com/ns/doap#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT *
    WHERE {
      ?doap_id a doap:Project; doap:name ?doap_name; doap:developer ?foaf_id .
      ?foaf_id foaf:name ?foaf_name .
    }
    LIMIT 10

<table class="sparql">
  <tbody>
    <tr>
      <th>doap_id</th>
      <th>doap_name</th>
      <th>foaf_id</th>
      <th>foaf_name</th>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/json-ld</td>
      <td>JSON::LD</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf</td>
      <td>RDF.rb</td>
      <td>http://ar.to/#self</td>
      <td>Arto Bendiken</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf</td>
      <td>RDF.rb</td>
      <td>http://bhuga.net/#ben</td>
      <td>Ben Lavender</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf</td>
      <td>RDF.rb</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-aggregate-repo</td>
      <td>RDF::AggregateRepo</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-json</td>
      <td>RDF::JSON</td>
      <td>http://ar.to/#self</td>
      <td>Arto Bendiken</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-microdata</td>
      <td>RDF::Microdata</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-n3</td>
      <td>RDF::N3</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-rdfa</td>
      <td>RDF::RDFa</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
    <tr>
      <td>http://rubygems.org/gems/rdf-rdfxml</td>
      <td>RDF::RDFXML</td>
      <td>http://greggkellogg.net/foaf#me</td>
      <td>Gregg Kellogg</td>
    </tr>
  </tbody>
</table>

Note that the `doap_*` columns are replicated for `<http://rubygems.org/gems/rdf>`, as there are multiple values for the `doap:contributor` property. These columns represent the same entity and the `doap_name` column does not represent multiple (identical) values for that field. However, the `foaf_id` columns do represent multiple values. In some cases, the fact that the values are distinct indicates they are the same value, however it is also common for data to include multiple values with replication.

Data such as this does not readily transform to JSON-LD, and some for of _entity mapping_ is necessary, and this requires some extension to the JSON-LD context schema.

### Entity Mapping
The previous example shows a natural way of representing joined entities in CSV; in JSON-LD this is more naturally down using `embedding`:

    {
      "@context": {
        "foaf": "http://xmlns.com/foaf/0.1/",
        "doap": "http://usefulinc.com/ns/doap#",
        "doap_developer": {"@id": "doap:developer", "@type": "@id"},
        "doap_id": "@id",
        "doap_name": "doap:name"
        "foaf_id": "@id",
        "foaf_name": "foaf:name"
      },
      "@graph": [{
        "doap_id": "http://rubygems.org/gems/json-ld",
        "doap_developer": {
          "foaf_id": "http://greggkellogg.net/foaf#me",
          "foaf_name": "Gregg Kellogg"
        },
        "doap_name": "JSON::LD"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf",
        "doap_developer": [
          {"foaf_id": "http://ar.to/#self", "foaf_name": "Arto Bendiken"},
          {"foaf_id": "http://bhuga.net/#ben", "foaf_name": "Ben Lavender"},
          {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
        ],
        "doap_name": "RDF.rb"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-aggregate-repo",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"},
        "doap_name": "RDF::AggregateRepo"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-json",
        "doap_developer": {"foaf_id": "http://ar.to/#self", "foaf_name": "Arto Bendiken"},
        "doap_name": "RDF::JSON"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-microdata",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"},
        "doap_name": "RDF::Microdata"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-n3",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"},
        "doap_name": "RDF::N3"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-rdfa",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"},
        "doap_name": "RDF::RDFa"
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-rdfxml",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"},
        "doap_name": "RDF::RDFXML"
      }]
    }

CSV-LD uses a _mapping_frame_ to specify the structure of a JSON-LD document to represent each record of a CSV. Such a _CSV-LD mapping frame_ takes advantage of embedded nodes to reverse the record joining used in the example:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "doap": "http://usefulinc.com/ns/doap#"
      },
      "@id": "{doap_id}",
      "doap:name": "{doap_name}",
      "doap:developer": {
        "@id": "{foaf_id}",
        "foaf:name": "{foaf_name}"
      }
    }

By applying each record using the mapping results in the following document (note that the common context is extracted, and each record is added to the `@graph` array):

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "doap": "http://usefulinc.com/ns/doap#",
      },
      "@graph": [{
        "@id": "http://rubygems.org/gems/json-ld",
        "doap:name": "JSON::LD",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf",
        "doap:name": "RDF.rb",
        "doap:developer": {"@id": "http://ar.to/#self", "foaf:name": "Arto Bendiken"}
      }, {
        "@id": "http://rubygems.org/gems/rdf",
        "doap:name": "RDF.rb",
        "doap:developer": {"@id": "http://bhuga.net/#ben", "foaf:name": "Ben Lavender"}
        ]
      }, {
        "@id": "http://rubygems.org/gems/rdf",
        "doap:name": "RDF.rb",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-aggregate-repo",
        "doap:name": "RDF::AggregateRepo",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-json",
        "doap:name": "RDF::JSON",
        "doap:developer": {"@id": "http://ar.to/#self", "foaf:name": "Arto Bendiken"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-microdata",
        "doap:name": "RDF::Microdata",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-n3",
        "doap:name": "RDF::N3",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-rdfa",
        "doap:name": "RDF::RDFa",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }, {
        "@id": "http://rubygems.org/gems/rdf-rdfxml",
        "doap:name": "RDF::RDFXML",
        "doap:developer": {"@id": "http://greggkellogg.net/foaf#me", "foaf:name": "Gregg Kellogg"}
      }]
    }

If re-framed, using the JSON-LD framing algorithm, it would essentially reproduce the same framed document shown before, consolidating embedded nodes as necessary.

## Representing Multiple Values
Two rows in a table might vary by just one a couple of column values. This often represents a join with a one-to-many mapping. In this case, values may be duplicated in other columns, which are not intended to represent duplicate values. For RDF, this does not represent a problem, as multiple statements having the same subject-predicate-object are effectively removed when added to an RDF graph.

## Representing Lists
List data represents instances where order matters, and it is possible for values to be duplicated within a list. Unlike the RDF data model, JSON-LD does have native representation for lists. By using different column names for consecutive values in a list, the associated fields can be placed in a JSON-LD list definition, and the ordered values will be preserved.

Alternatively a micro-syntax within a given table-cell could indicate multiple values of a list. For example, this could be with embedded newline characters separating each element of the list. However, this would require some extra mechanism for identifying such columns, and ensuring the content is properly escaped.

## Composite Primary Keys
In many cases, CSV files are generated without primary keys, but multiple records may still refer to the same entity. By including multiple patterns within a single value, a composite value can be created. When this value is interpreted as an `@id`, it is normalized and used to create a single identifier.

Multiple primary keys may become important when a table does not include a unique identifier for a single record. In this case, multiple patterns may be used within a single value to create an identifier to uniquely identify the record. For example:

<table>
  <tr><th>First Name</th><th>Last Name</th><th>Parent</th></tr>
  <tr><td>Gregg</td><td>Kellogg</td><td>Berk</td></tr>
  <tr><td>Gregg</td><td>Kellogg</td><td>Laurie</td></tr>
</table>

A _mapping frame_ can be constructed which allocates a unique blank node identifier based on the `First Name` and `Last Name` columns, so that multiple records are kept together:

    {
      "@context": [
        "http://schema.org",
        {"@extension": "http://www.w3.org/ns/csv-ld""}
      ],
      "@id": "_:{First Name}{Last Name}",
      "givenName": "{First Name}",
      "familyName": "{Last Name}",
      "parent": {"name": "{Parent}"}
    }

Applying this table to the _mapping frame_ creates the following:

    {
      "@context": [
        "http://schema.org",
        {"@extension": "http://www.w3.org/ns/csv-ld""}
      ],
      "@graph": [{
        "@id": "_:GreggKellogg",
        "givenName": "Gregg",
        "familyName": "Kellogg",
        "parent": {"name": "Berk"}
      }, {
        "@id": "_:GreggKellogg",
        "givenName": "Gregg",
        "familyName": "Kellogg",
        "parent": {"name": "Laurie"}
      }]
    }

Flattening and re-framing this document can then consolidate identical records to create a embedded sub-records:

    {
      "@context": [
        "http://schema.org",
        {"@extension": "http://www.w3.org/ns/csv-ld""}
      ],
      "@id": "_:GreggKellogg",
      "givenName": "Gregg",
      "familyName": "Kellogg",
      "parent": [{"name": "Berk"}, {"name": "Laurie"}]
    }

## Field Micro-Syntaxes
In many cases, CSV files use specific formatting for different fields, for example a date may be formatted using an American or European convention. In this case, turning this into reasonable Linked Data where the field values can be represented using standard XSD data formats is desirable. Extending a JSON-LD term definition with additional information about field micro-syntaxes may be useful. However, if a node definition already indicates the type is `xsd:date` or `xsd:dateTime`, processing software automatically processes information using standard parsers for these datatypes.

Another common field micro-syntax is to have embedded sub-field separators. For example, a field may be quoted and contain comma-separated values. By indicating this in the node definition, processing software separates each value and applies it as separate values using the JSON array notation. This would allow preservation of multiple values within JSON-LD, or even allow the order of these values to be maintained in a list. For example, consider the following use case:

<table>
  <tr><th>Book1</th><th>Book2</th><th>Path</th></tr>  <tr><td>1</td><td>7680</td><td>"http://dbpedia.org/ontology/language,http://dbpedia.org/resource/English_language,http://dbpedia.org/ontology/language"</td></tr> <tr><td>1</td><td>2</td><td>"http://dbpedia.org/ontology/author,http://dbpedia.org/resource/Diana_Gabaldon,http://dbpedia.org/ontology/author"</td></tr> <tr><td>1</td><td>2</td><td>"http://dbpedia.org/ontology/country,http://dbpedia.org/resource/United_States,http://dbpedia.org/ontology/country"</td></tr>
</table>

The _Path_ column has a microsyntax using a comma-separated delimiter to separate different values. A CSV-LD mapping frame to transform this could be defined as follows:

    {
      "@context": {
        "@vocab": "http://example/",
        "Path": {"@type": "@id", "@container": "@set"}
      },
      "Book1": "{Book1}",
      "Book2": "{Book2}",
      "Path": ["{Path}"]
    }

Because `Path` is defined as `@container`: `@set`, the processor infers that the value is to be split using the default field separator. (Note: could use a _field reference_ syntax like "{Path@sep=,}" as well to indicate this). Transforming the document leads to the following:

    {
      "@context": {
        "@vocab": "http://example/",
        "Path": {"@type": "@id", "@container": "@set"}
      },
      "@graph": [{
        "Book1": "1",
        "Book2": "7680",
        "Path": [
          "http://dbpedia.org/ontology/language",
          "http://dbpedia.org/resource/English_language",
          "http://dbpedia.org/ontology/language"
        ]
      }, {
        "Book1": "1",
        "Book2": "2",
        "Path": [
          "http://dbpedia.org/ontology/author",
          "http://dbpedia.org/resource/Diana_Gabaldon",
          "http://dbpedia.org/ontology/author"
        ]
      }, {
        "Book1": "1",
        "Book2": "2",
        "Path": [
          "http://dbpedia.org/ontology/country",
          "http://dbpedia.org/resource/United_States",
          "http://dbpedia.org/ontology/country"
        ]
      }]
    }

Note, if such a micro-syntax is used as the node identifier (`@id`), then the result would be to replicate the node definition for each sub-field, mapping all the rest of the fields from the record.

## Inline Mapping Frame Reference
Typical use would indicate using an external _mapping frame_ as a JSON-LD document, however it may be desirable to contain the reference within the body of the CSV.

One way to do this might be to allow a special case where the value of the first column `@map`, regardless of the column label; this record must either precede the header row, or immediately follow it. For example, consider the following hypothetical example:

<table>
 <tr>
  <td>doap_id</td>
  <td>doap_name</td>
  <td>foaf_id</td>
  <td>foaf_name</td>
  <td>@id</td>
  <td>@type</td>
  <td>@container</td>
  <td>@language</td>
 </tr>
 <tr>
  <td>@map</td>
  <td colspan=3>http://example/frame.jsonld</td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/json-ld</td>
  <td>JSON::LD</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf</td>
  <td>RDF.rb</td>
  <td>http://ar.to/#self</td>
  <td colspan=2>Arto Bendiken</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf</td>
  <td>RDF.rb</td>
  <td>http://bhuga.net/#ben</td>
  <td colspan=2>Ben Lavender</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf</td>
  <td>RDF.rb</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-aggregate-repo</td>
  <td>RDF::AggregateRepo</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-json</td>
  <td>RDF::JSON</td>
  <td>http://ar.to/#self</td>
  <td colspan=2>Arto Bendiken</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-microdata</td>
  <td>RDF::Microdata</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-n3</td>
  <td>RDF::N3</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-rdfa</td>
  <td>RDF::RDFa</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>http://rubygems.org/gems/rdf-rdfxml</td>
  <td>RDF::RDFXML</td>
  <td>http://greggkellogg.net/foaf#me</td>
  <td colspan=2>Gregg Kellogg</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
</table>

In this case, if the value of the first column is `@context`, the record is presumed to specify something similar to a JSON-LD Context. If all but the first two columns are empty, the second column is presumed to be the URL of a remote context document. Otherwise, the subsequent columns are taken to be _term definitions_ with the second column being the term. Any other columns MUST be defined using JSON-LD keyword labels, and allow for expanded term definitions using `@id`, `@reverse`, `@type`, `@container` and `@language`. Processing is not defined at this time, but is equivalent to processing a JSON-LD context definition.
