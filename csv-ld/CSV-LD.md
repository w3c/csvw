# CSV-LD Working Notes
There are many parallels between the goals of JSON-LD and the CSV on the Web efforts:

* Both JSON and CSV are common formats for representing data on the web,
* Both are open formats, unencumbered by propriatary Intellectual Property restrictions,
* Both are used for publishing simple data, where the "schema" is often application-specific,
* Both have communitites that have different expectations for how to represent tabular data,
* Both are often used as intermediate formats for transforming into a native representation.

JSON-LD had as one of it's design goals to allow zero-edit use of existing JSON to obtain a reasonable representation of JSON as Linked Data. I think that we should have a similar objective for CSV. A principle mechanism in JSON-LD was the use of a _Context_; this allowed simple terms to be given IRIs and values to be given datatypes. CSV has a similar issue, where column names typically identify entities or properties of those entities, and values have an assumed type. In some cases (e.g., Excel), the format may also allow a native representation of a given datatype, which is also the case in JSON, but for a limited set of datatypes.

## Simple JSON-LD mapping
One way in which JSON-LD can achieve zero edits is by allowing a JSON-LD Context to be specified externally, and applied to a given JSON document; this can be done algorithmically, when a specific transformation is invoked by specifying the context as an argument. It can also be done by adding the context to the JSON, which allows the rest of the data to be left untouched. Another mechanism is through the use of an HTTP Link header:

    GET /ordinary-json-document.json HTTP/1.1
    Host: example.com
    Accept: application/ld+json,application/json,*/*;q=0.1

    ====================================

    HTTP/1.1 200 OK
    ...
    Content-Type: application/json
    Link: <http://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"

    {
      "name": "Gregg Kellogg",
      "homepage": "http://greggkellogg.net/",
      "image": "http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png"
    }

In one use case, a CSV may represent multiple entities, with one line per entity description and each column represents a property of that entity, for example, the above JSON could be represented as follows:

<table>
  <tr><th>name</th><th>homepage</th><th>image</th></tr>
  <tr><td>Gregg Kellogg</td><td>http://greggkellogg.net/</td><td>http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png</td></tr>
</table>

In such case, using the JSON-LD context to interpret the tabular data is clear. Alternatively, CSV could be transformed directly to JSON by turning each row into a JSON object using the column names and data values appropriately, and the JSON-LD algorithms may be used directly.

By specifying a ''CSV-LD mapping frame'' through a Link header, a mapping from CSV records using the mapping frame gives a CSV-LD knowledgeable client the ability to transform teh accompanying CSV into JSON-LD, and therefore into RDF.

    GET /ordinary-json-document.json HTTP/1.1
    Host: example.com
    Accept: text/ld+csv,*/*;q=0.1

    ====================================

    HTTP/1.1 200 OK
    ...
    Content-Type: text/ld+csv
    Link: &lt;http://example/mapping.jsonld&gt;; rel=&quot;http://www.w3.org/ns/csv-ld#mapping&quot;; type=&quot;application/ld+json&quot;

    name,homepage,image
    "Gregg Kellogg",http://greggkellogg.net/,http://www.gravatar.com/avatar/42f948adff3afaa52249d963117af7c8.png

The mapping file is referenced in the Link header and known to be a CSV-LD mapping frame due to the type attribute of that Link header. This is a file formatted as JSON-LD which is used to specify how each record is transformed into a JSON-LD node using the column names from the CSV to identify members of the JSON and replacing the associated null value with the field from each record processed. The `http://example/mapping.jsonld` file could then be represented as follows:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "@vocab": "http://schema.org/",
        "homepage": {"@type": "@id"},
        "image": {"@type": "@id"},
      },
      "name": null,
      "homepage": null,
      "image": null
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

## Structured Content
Much data on the web, including both CSV and JSON, includes more structure in the form of embedded entity descriptions. For example, the following JSON-LD can be used to describe a simple FOAF relationship:

    {
    ...
      "@type": "Person",
      "name": "Manu Sporny",
      "knows":
      {
        "@type": "Person",
        "name": "Gregg Kellogg",
      }
    ...
    }

JSON-LD allows such data to be algorithmically "flattened":

    [{
      "@id": "_:manu",
      "@type": "Person",
      "name": "Manu Sporny",
      "knows": {"@id": "_:gregg"}
    }, {
      "@id": "_:gregg",
      "@type": "Person",
      "name": "Gregg Kellogg",
      "knows": {"@id": "_:manu"}
    }]

The corresponding tabular representation could then be the following:

<table>
  <tr><th>@id</th><th>@type</th><th>name</th><th>knows</th></tr>
  <tr><td>_:manu</td><td>Person</td><td>Manu Sporny</td><td>_:gregg</td></tr>
  <tr><td>_:gregg</td><td>Person</td><td>Gregg Kellogg</td><td>_:manu</td></tr>
</table>

Of course, with multiple datatypes, this becomes more difficult, and does not really represent the way that CSV is commonly used.

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

## Entity Mapping
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
          "doap_id": "http://greggkellogg.net/foaf#me",
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

CSV-LD uses the concept of a [JSON-LD Frame](http://json-ld.org/spec/latest/json-ld-framing/) to specify the structure of a JSON-LD document to represent each record of a CSV. Such a _CSV-LD mapping frame_ takes advantage of embedded nodes to reverse the record joining used in the example:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "doap": "http://usefulinc.com/ns/doap#",
        "doap_id": "@id",
        "doap_name": "doap:name",
        "doap_developer": {"@id": "doap:developer", "@type": "@id"},
        "foaf_id": "@id",
        "foaf_name": "foaf:name"
      },
      "doap_id": null,
      "doap_name": null,
      "doap_developer": {
        "foaf_id": null,
        "foaf_name": null
      }
    }

By applying each record using the mapping results in the following document (note that the common context is extracted, and each record is added to the `@graph` array):

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "foaf": "http://xmlns.com/foaf/0.1/",
        "doap": "http://usefulinc.com/ns/doap#",
        "doap_id": "@id",
        "doap_name": "doap:name",
        "doap_developer": {"@id": "doap:developer", "@type": "@id"},
        "foaf_id": "@id",
        "foaf_name": "foaf:name"
      },
      "@graph": [{
        "doap_id": "http://rubygems.org/gems/json-ld",
        "doap_name": "JSON::LD",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf",
        "doap_name": "RDF.rb",
        "doap_developer": {"foaf_id": "http://ar.to/#self", "foaf_name": "Arto Bendiken"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf",
        "doap_name": "RDF.rb",
        "doap_developer": {"foaf_id": "http://bhuga.net/#ben", "foaf_name": "Ben Lavender"}
        ]
      }, {
        "doap_id": "http://rubygems.org/gems/rdf",
        "doap_name": "RDF.rb",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-aggregate-repo",
        "doap_name": "RDF::AggregateRepo",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-json",
        "doap_name": "RDF::JSON",
        "doap_developer": {"foaf_id": "http://ar.to/#self", "foaf_name": "Arto Bendiken"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-microdata",
        "doap_name": "RDF::Microdata",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-n3",
        "doap_name": "RDF::N3",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-rdfa",
        "doap_name": "RDF::RDFa",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }, {
        "doap_id": "http://rubygems.org/gems/rdf-rdfxml",
        "doap_name": "RDF::RDFXML",
        "doap_developer": {"foaf_id": "http://greggkellogg.net/foaf#me", "foaf_name": "Gregg Kellogg"}
      }]
    }

If re-framed, using the JSON-LD framing algorithm, it would essentially reproduce the same framed document shown before, consolidating embedded nodes as necessary.
## Representing Multiple Values
Two rows in a table might vary by just one a couple of column values. This often represents a join with a one-to-many mapping. In this case, values may be duplicated in other columns, which are not intended to represent duplicate values. For RDF, this does not represent a problem, as multiple statements having the same subject-predicate-object are effectively removed when added to an RDF graph.

## Representing Lists
List data represents instances where order matters, and it is possible for values to be duplicated within a list. Unlike the RDF data model, JSON-LD does have native representation for lists. By using different column names for consecutive values in a list, the associated fields can be placed in a JSON-LD list definition, and the ordered values will be preserved.

Alternatively a micro-syntax within a given table-cell could indicate multiple values of a list. For example, this could be with embedded newline characters separating each element of the list. However, this would require some extra mechanism for identifying such columns, and ensuring the content is properly escaped.

## Composite Primary Keys
In many cases, CSV files are generated without primary keys, but multiple records may still refer to the same entity. CSV-LD introduces the concept of a `idTemplate`, which can be used to format a value from one or more fields within the CSV. By defining a term to be of type `@idTemplate`, that term may be used any place a key or string value may be used within JSON, and the processor will evaluate that term relative to the current record. For example, consider the following:

    {
      "@context": {
        "@extension": "http://www.w3.org/ns/csv-ld",
        "region_id": {"@id": "_:{Sales Region}", "@type": "@idTemplate"}
      },
      "@id": "region_id",
      ...
    }

By declaring `region\_id` to be of type `@idTemplate`, the processor knows that the `@id` field defines a template that should be applied to the current record to come up with the value to use in it's place. A substitution is specified using `{Column Name}` within the string. This is replaced with the value of the associated field(s) in the current record, after suitable normalization such as IRI escaping. Multiple such substitutions may be used within an _idTemplate_, and a record may use many _idTemplates_.

## Field Micro-Syntaxes
In many cases, CSV files use specific formatting for different fields, for example a date may be formatted using an American or European convention. In this case, turning this into reasonable Linked Data where the field values can be represented using standard XSD data formats is desirable. Extending a JSON-LD term definition with additional information about field micro-syntaxes may be useful. However, if a node definition already indicates the type is `xsd:date` or `xsd:dateTime`, processing software could automatically process information using standard parsers for these types.

Another common field micro-syntax is to have embedded sub-field separators. For example, a field may be quoted and contain comma-separated values. By indicating this in the node definition, processing software could separate each value and apply them as separate values using the JSON array notation. This would allow preservation of multiple values within JSON-LD, or even allow the order of these values to be maintained in a list.

## Inline Context Reference/Definition
Typical use would indicate using an external context definition as a JSON-LD document, however it may be desirable to contain the reference within the body of the CSV. Moreover, it may be desirable to be able to include an entire context definition within the CSV itself.

One way to do this might be to allow a special case where the value of the first column is `@context`, regardless of the column label. (Alternatively, something like `$context` might be more CSV/Excel like, but escaping will be an issue whatever is chosen). In this case, context definitions could use pre-defined column mappings, or additional columns who's labels correspond with JSON-LD context elements. For example, consider the following hypothetical example:

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
  <td>@context</td>
  <td colspan=3>http://example/context.jsonld</td>
  <td></td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>foaf</td>
  <td></td>
  <td></td>
  <td colspan=3>http://xmlns.com/foaf/0.1/</td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>doap</td>
  <td></td>
  <td></td>
  <td colspan=3>http://usefulinc.com/ns/doap#</td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td colspan=2>doap_developer</td>
  <td></td>
  <td>doap:developer</td>
  <td>@id</td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>doap_id</td>
  <td></td>
  <td></td>
  <td>@id</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>doap_name</td>
  <td></td>
  <td></td>
  <td>doap:name</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>foaf_id</td>
  <td></td>
  <td></td>
  <td>@id</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td>foaf_name</td>
  <td></td>
  <td></td>
  <td>foaf:name</td>
  <td></td>
  <td></td>
  <td></td>
 </tr>
 <tr>
  <td>@context</td>
  <td></td>
  <td></td>
  <td></td>
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