This README is for the W3C CSV Working Group's test suite.
This test suite contains xxx kinds of tests:

* JSON Direct Mapping (csvt:JsonToRdfTest) - the result of processing
  a CSV to JSON.

* RDF Direct Mapping (csvt:CsvToRdfTest) - the result of processing
  a CSV to RDF (Turtle).

The manifest.ttl file in this directory lists all of the tests in the
CSV WG's test suite. Each test is one of the above tests. All
tests have a name (mf:name) and an input (mf:action). Evaluation
tests have an expected result (mf:result).

• An implementation passes a Mapping test if it parses the input
  into a form which can be directly compared with the expected result.

The home of the test suite is <http://w3c.github.io/csvw/tests/>.
The base IRI for parsing each file is the
retrieval IRI for that file. For example, the test test001j and
test001r require relative IRI resolution against a base of
<http://w3c.github.io/csvw/tests/test001.csv>.
