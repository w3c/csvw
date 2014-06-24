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
    "title": "Standard Occupational Classification (2010)",
    "publisher": [{
        "name": "US Bureau of Labor Statistics",
        "web": "http://www.bls.gov/ "
    }],
    "resources": [{
        "name": "soc-2010-csv",
        "path": "soc_structure_2010.csv",
        "schema": {"columns": [
            {
                "name": "soc-major-group-code",
                "title": "Major Group",
                "type": "string"
            },
            {
                "name": "soc-minor-group-code",
                "title": "Minor Group",
                "type": "string",
                "microsyntax": [{
                    "name": "soc-minor-group-code/major-group-element",
                    "regexp": "^(\\d{2})-\\d{4}$"
                }]
            },
            {
                "name": "soc-broad-group-code",
                "title": "Broad Group",
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
                "title": "Detailed Occupation",
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
                "title": "",
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

... the "detailed-occupation-template-ttl" should be triggered, based on the conditional match REGEXP, and provide the following TTL snippet:
```
ex:15-1199 a ex:SOC-DetailedOccupation ;
    skos:notation "15-1199" ;
    skos:prefLabel "Computer Occupations, All Other" ;
    skos:broader ex:15-0000, 
                 ex:15-1100, 
                 ex:15-1190 .
```


<h2>Next</h2>
