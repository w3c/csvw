This attempt looks at the conversion of data into other formats.

### Notes

  * I added an `Acronym` field to gov.uk/departments.csv to enable the generation of URLs, but given that the acronyms are usually uppercase and the portion of the URL should be lowercase, it's not really enough. I've used a template like `http://reference.data.gov.uk/id/department/{lowercase(acronym)}` which is a non-compliant [URI template](http://tools.ietf.org/html/rfc6570) to create URLs for each of the rows (given in `url` attributes in the XML output).

  * I added a `xmlRowElement` property in `gov.uk/schema.json` to give the name of the wrapper element for each row within each table.

  * The `gov.uk/grades.csv` file has only one column; in the XML I've omitted the wrapper element for the column and just placed the single value within the wrapper element for the row.