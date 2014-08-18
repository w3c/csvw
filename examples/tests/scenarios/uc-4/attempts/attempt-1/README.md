This attempt is for a single basic metadata file, with no templates, and the outputs that might be generated from it.

Since this example includes two related CSV files, this example:

  * introduces a syntax for metadata files describing multiple CSV files, following that used in datapackage, with a top-level object having a `resources` property that holds an array of descriptions of the separate CSV files

### Issues

  * In this use case, the CSV files always come in pairs, each with a separate schema, and always related to each other. This speaks to having the schemas defined in the same file rather than in separate files, as shown here.