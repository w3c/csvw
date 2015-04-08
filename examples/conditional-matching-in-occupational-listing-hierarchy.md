Conditional matching within occupational listing hierarchy example
==================================================================

This example builds on [Use Case #24 - Expressing a hierarchy within occupational listings][1] in which 
two examples of conditional matching are used in the generation of RDF output.

[1]: http://w3c.github.io/csvw/use-cases-and-requirements/#UC-ExpressingHierarchyWithinOccupationalListings

At time of writing this example, it seems sufficient to base the conditional matching on evaluation of 
a regular expression (REGEXP) against the given row being parsed.

The two examples are provided below.

<h2>Triggering a template if a column in the row being processed is not empty (or null)</h2>

data snippet (from [soc_structure_2010.csv][2]):
```
Major Group,Minor Group,Broad Group,Detailed Occupation,,,,,,
,,,,,,,,,
{snip}
15-0000,,,,Computer and Mathematical Occupations,,,,,
,15-1100,,,Computer Occupations,,,,,
{snip}
,,15-1190,,Miscellaneous Computer Occupations,,,,,
,,,15-1199,"Computer Occupations, All Other",,,,,
{snip}
```

[2]: http://w3c.github.io/csvw/use-cases-and-requirements/soc_structure_2010.csv 

Let's assume that I want to trigger a template to create "Detailed Occupation" entities - I 
only want to trigger this when the 4th column is populated. Note that I have used 
`conditional-match` within the template blocks to provide a REGEXP that is assessed against 
the _ENTIRE_ row to determine if the template is triggered. Again, I'm not wedded to the 
names or syntax - just trying to express the idea. 

*(Aside 1: in creating this example, I have blundered into the challenges of wanting to 
repeatedly use same `name` within microsyntax blocks ... I got around the need for uniqueness 
using `/` as a pseudo path separator, but it feels clunky and ends up with long names!)*

*(Aside 2: I also noticed that my REGEXP weren't valid when embedding them in JSON as the `\`
character needed escaping - hence the use of `\\` below ... I am assuming that any JSON 
processor will parse the literal _before_ trying to process the REGEXP)*

Here's the metadata description for the resource:

```json
{
    "name": "soc-2010",
    "titles": "Standard Occupational Classification (2010)",
    "publisher": [{
        "name": "US Bureau of Labor Statistics",
        "web": "http://www.bls.gov/ "
    }],
    "tables": [{
        "name": "soc-2010-csv",
        "path": "soc_structure_2010.csv",
        "tableSchema": {"columns": [
            {
                "name": "soc-major-group-code",
                "titles": "Major Group",
                "type": "string"
            },
            {
                "name": "soc-minor-group-code",
                "titles": "Minor Group",
                "type": "string",
                "microsyntax": [{
                    "name": "soc-minor-group-code/major-group-element",
                    "regexp": "^(\\d{2})-\\d{4}$"
                }]
            },
            {
                "name": "soc-broad-group-code",
                "titles": "Broad Group",
                "type": "string",
                "microsyntax": [
                    {
                        "name": "soc-broad-group-code/major-group-element",
                        "regexp": "^(\\d{2})-\\d{4}$"
                    },
                    {
                        "name": "soc-broad-group-code/minor-group-element",
                        "regexp": "^\\d{2}-(\\d{2})\\d{2}$"
                    }
                ]
            },
            {
                "name": "soc-detailed-occupation-code",
                "titles": "Detailed Occupation",
                "type": "string",
                "microsyntax": [
                    {
                        "name": "soc-detailed-occupation-code/major-group-element",
                        "regexp": "^(\\d{2})-\\d{4}$"
                    },
                    {
                        "name": "soc-detailed-occupation-code/minor-group-element",
                        "regexp": "^\\d{2}-(\\d{2})\\d{2}$"
                    },
                    {
                        "name": "soc-detailed-occupation-code/broad-group-element",
                        "regexp": "^\\d{2}-\\d{2}(\\d)\\d$"
                    }
                ]
            },
            {
                "name": "soc-title",
                "titles": "",
                "type": "string"
            },
            {"name": "empty(1)"},
            {"name": "empty(2)"},
            {"name": "empty(3)"},
            {"name": "empty(4)"},
            {"name": "empty(5)"}
        ]},
        "template": [
            {
                "conditional-match": "^\\d{2}-0{4},{4}\\.*",
                "name": "major-group-template-ttl",
                "description": "Template converting Major Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "major-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": "^,\\d{2}-\\d{2}0{2},{3}\\.*",
                "name": "minor-group-template-ttl",
                "description": "Template converting Minor Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "minor-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": "^,{2}\\d{2}-\\d{3}0,{2}\\.*",
                "name": "broad-group-template-ttl",
                "description": "Template converting Broad Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "broad-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": "^,{3}\\d{2}-\\d{4},\\.*",
                "name": "detailed-occupation-template-ttl",
                "description": "Template converting Detailed Occupation content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "detailed-occupation-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            }
        ]
    }]
}
```

(Apologies if the REGEXP has errors - not one of my strengths!)

My `detailed-occupation-csv-to-ttl-template.ttl` would be:
```
ex:{soc-detailed-occupation-code} a ex:SOC-DetailedOccupation ;
    skos:notation "{soc-detailed-occupation-code}" ;
    skos:prefLabel "{soc-title}" ;
    skos:broader ex:{soc-detailed-occupation-code/major-group-element}-0000, 
                 ex:{soc-detailed-occupation-code/major-group-element}-{soc-detailed-occupation-code/minor-group-element}00, 
                 ex:{soc-detailed-occupation-code/major-group-element}-{soc-detailed-occupation-code/minor-group-element}{soc-detailed-occupation-code/broad-group-element}0 .
```

Thus, given the input row below:
```
,,,15-1199,"Computer Occupations, All Other",,,,,
```

... the `detailed-occupation-template-ttl` should be triggered, based on the conditional match REGEXP, and provide the following TTL snippet:
```
ex:15-1199 a ex:SOC-DetailedOccupation ;
    skos:notation "15-1199" ;
    skos:prefLabel "Computer Occupations, All Other" ;
    skos:broader ex:15-0000, 
                 ex:15-1100, 
                 ex:15-1190 .
```

<h3>Alternative: conditional matching based on name rather than entire row<h3>

In this example, I've assumed that the conditional match is assessed against the entire row; whilst it's not impossible to deal with, I note that the need to potentially escape fields to count the columns is an added complexity! As an alternative, we might just match on `name` from a column or microsyntax element. See snippet below:

```json
    {
        "template": [
            {
                "conditional-match": {
                    "target": "soc-major-group-code",
                    "regexp": "^\\d{2}-0{4}$"
                    },
                "name": "major-group-template-ttl",
                "description": "Template converting Major Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "major-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": {
                    "target": "soc-minor-group-code",
                    "regexp": "^\\d{2}-\\d{2}0{2}$"
                    },
                "name": "minor-group-template-ttl",
                "description": "Template converting Minor Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "minor-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": {
                    "target": "soc-broad-group-code",
                    "regexp": "^\\d{2}-\\d{3}0$"
                    },
                "name": "broad-group-template-ttl",
                "description": "Template converting Broad Group content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "broad-group-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": {
                    "target": "soc-detailed-occupation-code",
                    "regexp": "^\\d{2}-\\d{4}$"
                    },
                "name": "detailed-occupation-template-ttl",
                "description": "Template converting Detailed Occupation content from SOC structure CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "detailed-occupation-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            }
        ]
    }    
```

<h2>Triggering a template given a specific value within a microsyntax element</h2>

data snippet (from [2010_Occupations.csv][3]):
```
O*NET-SOC 2010 Code,O*NET-SOC 2010 Title,O*NET-SOC 2010 Description
{snip}
15-1199.00,"Computer Occupations, All Other",All computer occupations not listed separately.
{snip}
15-1199.03,Web Administrators,"Manage web environment design, deployment, development and maintenance activities.[...]"
{snip}
```

[3]: http://w3c.github.io/csvw/use-cases-and-requirements/2010_Occupations.csv  

This time I want to trigger a one template if the Occupation is a main category (e.g. Code = `15-1199.00`), else I want to trigger a different category. A main category is denoted with the final two digits of the code being `00`. 

*(Aside 3: of course, as these two files are likely to be packaged together, I could have had just a single metadata description describing BOTH tables!)*

Here's the metadata description for the resource:

```json
{
    "name": "2010_Occupations",
    "titles": "O*NET-SOC Occupational listing for 2010",
    "publisher": [{
        "name": "O*Net Resource Center",
        "web": " http://www.onetcenter.org/ "
    }],
    "tables": [{
        "name": "2010_Occupations-csv",
        "path": "2010_Occupations.csv",
        "tableSchema": {"columns": [
            {
                "name": "onet-soc-2010-code",
                "titles": "O*NET-SOC 2010 Code",
                "description": "O*NET Standard Occupational Classification Code (2010).",
                "type": "string",
                "required": true,
                "unique": true,
                "microsyntax": [
                    {
                        "name": "soc-major-group",
                        "regexp": "^(\\d{2})-\\d{4}.\\d{2}$"
                    },
                    {
                        "name": "soc-minor-group",
                        "regexp": "^\\d{2}-(\\d{2})\\d{2}.\\d{2}$"
                    },
                    {
                        "name": "soc-broad-group",
                        "regexp": "^\\d{2}-\\d{2}(\\d)\\d.\\d{2}$"
                    },
                    {
                        "name": "soc-detailed-occupation",
                        "regexp": "^\\d{2}-\\d{3}(\\d).\\d{2}$"
                    }
                ]
            },
            {
                "name": "titles",
                "titles": "O*NET-SOC 2010 Title",
                "description": "Title of occupational classification.",
                "type": "string",
                "required": true
            },
            {
                "name": "description",
                "titles": "O*NET-SOC 2010 Description",
                "description": "Description of occupational classification.",
                "type": "string",
                "required": true
            }
        ]},
        "template": [
            {
                "conditional-match": "^\\d{2}-\\d{4}.00,\\.*",
                "name": "soc-occupation-category-template-ttl",
                "description": "Template converting SOC occupation category CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "soc-occupation-category-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": "^\\d{2}-\\d{4}.(?!00),\\.*",
                "name": "onet-soc-occupation-subcategory-template-ttl",
                "description": "Template converting O*NET SOC occupation sub-category CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "onet-soc-occupation-subcategory-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            }
        ]
    }]
}
```

My TTL templates would be ...

`soc-occupation-category-csv-to-ttl-template.ttl`:
```
ex:{onet-soc-2010-code} a ex:SOC-DetailedOccupation ;
    skos:notation "{onet-soc-2010-code}" ;
    skos:prefLabel "{title}" ;
    dct:description "{description}" ;
    skos:exactMatch ex:{soc-major-group}-{soc-minor-group}{soc-broad-group}{soc-detailed-occupation} ;
    skos:broader ex:{soc-major-group}-0000, 
                 ex:{soc-major-group}-{soc-minor-group}00, 
                 ex:{soc-major-group}-{soc-minor-group}{soc-broad-group}0 .
```

and `onet-soc-occupation-subcategory-csv-to-ttl-template.ttl`:
```
ex:{onet-soc-2010-code} a ex:ONETSOC-Occupation ;
    skos:notation "{onet-soc-2010-code}" ;
    skos:prefLabel "{title}" ;
    dct:description "{description}" ;
    skos:broader ex:{soc-major-group}-0000, 
                 ex:{soc-major-group}-{soc-minor-group}00, 
                 ex:{soc-major-group}-{soc-minor-group}{soc-broad-group}0,
                 ex:{soc-major-group}-{soc-minor-group}{soc-broad-group}{soc-detailed-occupation} .
```

Thus, the input row below:
```
15-1199.00,"Computer Occupations, All Other",All computer occupations not listed separately.
```

... would generate the following TTL snippet:
```
ex:15-1199.00 a ex:SOC-DetailedOccupation ;
    skos:notation "15-1199.00" ;
    skos:prefLabel "Computer Occupations, All Other" ;
    dct:description "All computer occupations not listed separately." ;
    skos:exactMatch ex:15-1199 ;
    skos:broader ex:15-0000, 
                 ex:15-1100, 
                 ex:15-1190 .
```

And this row:
```
15-1199.03,Web Administrators,"Manage web environment design, deployment, development and maintenance activities.[...]"
```

... would generate this TTL snippet:
```
ex:15-1199.03 a ex:ONETSOC-Occupation ;
    skos:notation "15-1199.03" ;
    skos:prefLabel "Web Administrators" ;
    dct:description "Manage web environment design, deployment, development and maintenance activities.[...]" ;
    skos:broader ex:15-0000, 
                 ex:15-1100, 
                 ex:15-1190,
                 ex:15-1199 .
```
<h3>Alternative: conditional matching based on name rather than entire row<h3>

As before, here is an alternative way to express the conditional match - assessing against a `name` from a microsyntax definition rather than the entire row:

```json
    {
        "template": [
            {
                "conditional-match": {
                    "target": "soc-detailed-occupation",
                    "regexp": "^00$"
                    },
                "name": "soc-occupation-category-template-ttl",
                "description": "Template converting SOC occupation category CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "soc-occupation-category-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            },
            {
                "conditional-match": {
                    "target": "soc-detailed-occupation",
                    "regexp": "^(?!00)$"
                    },
                "name": "onet-soc-occupation-subcategory-template-ttl",
                "description": "Template converting O*NET SOC occupation sub-category CSV content to SKOS/RDF (expressed in Turtle syntax).",
                "type": "template",
                "path": "onet-soc-occupation-subcategory-csv-to-ttl-template.ttl",
                "hasFormat": "text/turtle"
            }
        ]
    }
```
