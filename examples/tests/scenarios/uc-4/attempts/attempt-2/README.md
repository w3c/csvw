This attempt tries to address the issues from attempt-1 by inventing new metadata syntax and by breaking down the CSV files into smaller documents.

### How it works

In this scenario, a central authority (GOV.UK) has defined a schema for the publication of organogram information. It publishes four files (found within the `gov.uk` directory):

  * [`schema.json`](gov.uk/schema.json) is the schema for all packages of organogram information. It defines the structure of a number of files, including those published by the central authority (GOV.UK) but also those that need to be published by those supplying data in order to complete the package. More about this below.

  * [`departments.csv`](gov.uk/departments.csv) is a very simple CSV file that just lists the recognised central government departments. It could contain additional information other than their names, but doesn't.

  * [`professions.csv`](gov.uk/professions.csv) is a similarly simple CSV file containing the recognised professions.

  * [`grades.csv`](gov.uk/grades.csv) is another simple CSV file containing standard senior civil service grades.

Now the HEFCE wants to publish its organogram information. It does this on a six monthly basis. There are two kinds of information that it needs to publish: some that is different on each publication (the actual organogram data) and some that stays more or less the same (reference files). The reference files are kept separate from the other files, in the `hefce.gov.uk` directory. They are:

  * [`organisation.csv`](hefce.gov.uk/organisation.csv) is a basic CSV file with just one row relating the organisation to its parent department
  * [`units.csv`](hefce.gov.uk/units.csv) is a basic CSV file with one row per unit in the organisation, relating that to the organisation
  * [`job-titles.csv`](hefce.gov.uk/job-titles.csv) is a basic CSV file that just lists the job titles used within the organisation
  * [`junior-grades.csv`](hefce.gov.uk/junior-grades.csv) has some structured data about the different junior grades, including their salary bands

The main data itself is in the `source` directory.

The schema file, `schema.json`, defines a set of resources and the links between them. Some of the resources have an `@id` property which points to the centrally defined lists in the `gov.uk` directory, eg:

    {
		"@id": "departments.csv",
		"name": "departments",
		"columns": [{
			"name": "department",
			"title": "Department",
			"description": "The full name of a UK government department.",
			"required": true
		}]
	}

Some of them do not have an `@id`: these definitions are for files that are described in the metadata file. So where the `schema.json` file describes a resource like:

    {
		"name": "organisation",
		"columns": [{
			"name": "organisation",
			"title": "Organisation",
			"description": "Full name of organisation, this could be a repeat of the parent department or alternatively the name of an NDPB, Agency, etc.",
			"required": true
		}, {
			"name": "department",
			"title": "Parent Department",
			"description": "The full name of the parent or sponsor department.",
			"reference": "departments#department",
			"required": true
		}]
	}

The `metadata.json` file that refers to the schema contains:

	"tableSchema": "gov.uk/schema.json",
	"resources": [{
		"@id": "hefce.gov.uk/organisation.csv",
		"name": "organisation"
	}, ... ]

The resource described in the `metadata.json` file is matched to the resource described in the `schema.json` file through the `name` property. The `@id` property always points to an actual CSV file which adheres to the column descriptions defined in the schema file.

There are many cross-references between CSV files in this package. Where a column references a column in another file, the `reference` property on the column description provides the dereference. For example, in the `hefce.gov.uk/organisation.csv` CSV file, the `Parent Department` column points to a value in the `Department` column in the `gov.uk/departments.csv` file.

In `schema.json`, the `gov.uk/departments.csv` file is named `departments` and the `Department` column is named `department`:


    {
		"@id": "departments.csv",
		"name": "departments",
		"columns": [{
			"name": "department",
			"title": "Department",
			"description": "The full name of a UK government department.",
			"required": true
		}]
	}

In `metadata.json`, the definition of the `Parent Department` column includes a `reference` property that points to this resource + column through the syntax `departments#department` (ie *resource-name*#*column-name*):

    {
		"name": "organisation",
		"columns": [{
			"name": "organisation",
			"title": "Organisation",
			"description": "Full name of organisation, this could be a repeat of the parent department or alternatively the name of an NDPB, Agency, etc.",
			"required": true
		}, {
			"name": "department",
			"title": "Parent Department",
			"description": "The full name of the parent or sponsor department.",
			"reference": "departments#department",
			"required": true
		}]
	}

A validator or a authoring tool can use this reference to check the values in the `Parent Department` column in `hefce.gov.uk/organisation.csv` and make sure they are values that appear in the `Department` column in `gov.uk/departments.csv`.