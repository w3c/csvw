This attempt is for a single basic metadata file, with no templates, and the outputs that might be generated from it.

### Notes

  * Since this example includes two related CSV files, this example introduces a syntax for metadata files describing multiple CSV files, following that used in datapackage, with a top-level object having a `resources` property that holds an array of descriptions of the separate CSV files
  * The description of the columns in the [original prose](http://www.w3.org/TR/csvw-ucr/Organogram-Visualisation-Tool-v1.0_10.pdf) includes notes about validation and interpretation which (it seems to me) don't really fit in the `description` for the column, so I've put them in `comment` instead.
  * See the Pay Floor column in the senior salaries for an example of a column that can either be an integer or take the value `N/D`; I've interpreted the latter to be a null value.
  * See the Valid? column in the senior salaries for an example of a column that has a boolean datatype whose string values are constrained to 1 or 0.

### Issues

  * In this use case, the CSV files always come in pairs, each with a separate schema, and always related to each other. This speaks to having the schemas defined in the same file rather than in separate files, as shown here.
  * In this use case, there are special codes used in some of the columns (eg the `Name` column or `Grade` column in the senior posts file). It would be nice if these special codes could be documented aside from as textual description, particularly as they have descriptions which could eg be displayed as tooltips. Could/should they be defined in a separate CSV file?
  * In the senior salaries file, if the unique post reference is `0` then the job title must be `Not in post` and the job function `N/A`. I'm not sure how to express this except through a textual comment.
  * In the senior salaries file, the `reports-to` column needs to hold one of the values in the unique post reference, or `XX` (which is equivalent to null). How should this constraint be expressed?
  * Does it make sense for a column to have both a null value and be required? Does a required value mean that there must be a string value in the column rather than that it must be non-null?
  * Both the senior salaries and the junior salaries schemas include columns that list parent departments. It would be nice if the definitions of these columns (or at least the list of departments) didn't have to be replicated across the two schemas. Could/should the possible values be defined in a separate CSV file?
  * The `reporting-to` column in the junior salaries CSV file points to an identifier used in the unique reference in the senior salaries CSV file. How should this constraint (and linkage) between the files be indicated?
  * In the Excel file that underlies the creation of these CSV files, there is a separate sheet for junior grades that provides both the name of the grade and the minimum/maximum pay for that grade. The values in the spreadsheet itself replicate the values from the appropriate lookup in the junior grade file. Should it be possible to validate against a lookup like this? Or should producers of the CSV files be encouraged to create a package which doesn't replicate information (ie by having the grade information provided only in a separate CSV file).
  
