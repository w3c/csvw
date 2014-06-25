
Experimental Mapping tests

The purpose of this filetree is to explore a non-chaotic environment in which different kinds of mapping can be
tested.

It is not currently integrated with https://github.com/w3c/csvw/tree/gh-pages/tests and lives in a Git branch.

Nearby: .csv examples from the User Cases + Requirements doc are in
https://github.com/w3c/csvw/tree/gh-pages/use-cases-and-requirements

Note - this filetree isn't intended for implementations/scripts, but if you want to check in simple scripts, use a script/
subdirectory.

The goal is to balance pluralism against chaos. It should be possible to collect actual CSV files, associated with
(hopefully documented) practical use cases, and then apply different templating approaches to these. This should
let us compare e.g. how Django and XSLT might be applied to some problem.

Let's try to use the latest version of our Metadata spec, although we could explore variant designs.

The scenario/ dir holds a default metadata file; if you've more to add to the scenario in your attempted
approach, just copy/modify it in the per-attempt folder.

Note: duplicating copies of CSV files is absolutely fine. The Git repo will only keep one of each behind the scenes, and it
is probably simpler to have self-contained experiments than a complex cross-referencing structure.


Usage
=====

There are two kinds of thing here: "scenarios" and "attempts", each managed as a directory.

A scenario:

    tests/
    tests/scenarios/
    tests/scenarios/look-inside-art/
    tests/scenarios/look-inside-art/README.md # this describes the CSV file and goals for the mapping
    tests/scenarios/look-inside-art/source/rembrandt-paintings.csv

An attempt at this scenario:

    ./scenarios/look-inside-art/attempts
    ./scenarios/look-inside-art/attempts/attempt-1/source/rembrandt-paintings.csv # input file as above
    ./scenarios/look-inside-art/attempts/attempt-1/map-art.ttlt # a particular template format we're exploring
    ./scenarios/look-inside-art/attempts/attempt-1/meta.json # attempt-specific version of metadata file
    ./scenarios/look-inside-art/attempts/attempt-1/README.md # explains this approach to the scenario


A 'scenario' is a directory with:

* README.md file documenting the use case / scenario (ideally with a link to UC+R spec)
* 1 or more .csv files in source/ subdir
* 1 or more output files in output/ subdir representing idealised expected output (possibly several variations, target formats)
* The UC might not have a well-articulated sense for what its targets look like. That's ok. Prose in README is fine.
** suffixes should reflect target formats.
** unless syntax is important to the scenario, let's use NTriples (xyz.rdf.nt) and JSON-LD (xyz.rdf.json) for RDF mappings.
* 1 or more CSVW WG administrative metadata files: csvw_wg.json (or could use https://github.com/w3c/csvw/blob/gh-pages/tests/manifest.ttl)
** need more detail here
* 1 or more attempts/ directories

An 'attempt' is a self-contained directory encapsulating an 'attempt' at one mapping scenario:

* README.md documenting the attempt, with a link to CSVW wiki for the _approach_ taken (e.g. XSLT, Django, ...)
* 1 or more Metadata files, meta.json by default (best guess at what eventual public metadata file would look like)
* 1 or more .csv files, typically in source/ subdir (typically copied from the containing 'scenario')
* 1 or more output files, typically in output/ representing the normal output of this mapping approach.
* 1 or more mapping/template files that express a mapping
* 1 or more CSVW WG administrative metadata files

Each attempt explores a particular approach. This is the level at which notions such as 'direct' and 'indirect' mappings
would be articulated. Direct/indirect/other outputs and the template/mapping files that make them possible could all
live within a single 'attempt' folder.

To the extent we figure out common patterns they could be represented in .json/.ttl manifests.
