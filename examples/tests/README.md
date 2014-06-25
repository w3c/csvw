
Experimental Mapping tests

The purpose of this filetree is to explore a non-chaotic environment in which different kinds of mapping can be 
tested.

It is not currently integrated with https://github.com/w3c/csvw/tree/gh-pages/tests and lives in a Git branch.



Usage
=====

There are two kinds of thing here: "scenarios" and "attempts", each managed as a directory. 

A 'scenario' is a directory with:

* README.md file documenting the use case / scenario (ideally with a link to UC+R spec)
* 1 or more .csv files in source/ subdir
* 1 or more output files in output/ subdir representing idealised expected output (possibly several variations, target formats)
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
