# Conversion Scenarios

This note attempts to map out some of the ways in which conversion from CSV files (+ metadata) to other formats might happen and why.

## User-created configuration

### For Importing

Andrea downloads a set of CSV files that she's found on the web and she wants to import it into the MySQL database that she's using. She is using a third-party tool to do the import. She can perform a default import of each CSV file individually (so each CSV file becomes a table, and she then uses SQL commands to convert the data as necessary into columns with the correct types and cross-references between tables) but the tool can also be configured by supplying a descriptive (metadata) file for the CSV files.

She creates the metadata file to configure things like:

  * the names of the tables in the import
  * the names of the columns in those tables
  * the types of the columns
  * which are the primary keys and references between tables

To run the import, she points the tool at the metadata file and it creates the new tables and columns within her database, providing errors when the data doesn't match the schema that she's assumed.

### For Display

Bill is creating a web application in which he is displaying crimes within a city as a heatmap. The data is published by his local municipality on a routine basis and embeds it in his page using a web component. The web component enables Bill to simply point to the CSV file and indicate which columns should be used to provide longitude, latitude and label.

The municipality has included a metadata file that defines a conversion of the CSV file into a structured GeoJSON format, but the web component that Bill uses assumes a simple tabular structure and thus ignores the conversion supplied by the publisher in the metadata file.

## Publisher-created configuration

Clara is using some server-side software (like Jekyll) which automatically creates statically converted versions of contact information that she provides as CSV. This means that she can just author and update CSV files but her website can provide those files in a variety of formats for others to reuse (eg schema.org JSON for those that prefer it, vCard RDF for those that prefer that, HTML with embedded microdata for a readable page).

The server-side software uses the metadata file that Clara authors to work out how to do the conversions into other formats. She decides on what those conversions should look like to meet the existing standard formats for sharing contact information. The styling of the HTML page in particular needs to be customised to give the site the look and feel that she wants.

