#!/usr/bin/env python

import re
import csv
import json

# Quick hack that works backwards from http://www.w3.org/TR/2015/CR-csv2rdf-20150716/#example-events-listing

# Demos a conversion specified in a CSV + a JSON (see cfg.), where the structure is:
# headers: ['Name', ' Start Date', ' Location Name', ' Location Address', ' Ticket Url']

cfg = {'csv_fn': 'events-listing.csv', 'json_fn': 'eg11.json', 'basehref': 'http://events.example.net/' }
prefixMap = {'schema': 'http://schema.org/'} # TODO
colsByTitle = {}
virtualCols = {}
foundCols = {}

verbose = False

with open(cfg['json_fn']) as data_file:
    mapping = json.loads(data_file.read())

colDefs = mapping['tableSchema']['columns'] # pick at some useful pieces
trim = bool( mapping['dialect'].get('trim','false'))
if verbose:
    print "trim mode?: %s " % trim

def expandTemplate(str, row_ix):
    "Expand a URI Template with row index numbers." # TODO: check for other spec'd fields
    return str.replace("{_row}", "%s" % row_ix )

def expandNS(s, prefixMap=prefixMap):
    "Expand namespace prefixes eg. 'schema:foo' becomes 'http://schema.org/foo', based on a map."
    return re.sub( "(\w+):(\w+)(\s*)", lambda match: "{0}{1}{2}".format( prefixMap.get(match.group(1), match.group(1)+":" ) , match.group(2), match.group(3) ), s).encode("utf-8")

def expandBaseHref(s, cfg=cfg):
    "Expand a potentially relative URI. A hack."
    return re.sub( "^#", lambda match: "{0}".format(cfg.get('basehref') +"#" ), s).encode("utf-8")

with open(cfg['csv_fn'], 'rb') as csvfile:

    myreader = csv.reader(csvfile, delimiter=',', quotechar='"')
    headers = myreader.next()
    if verbose:
        print "Headers from CSV: %s " % headers
    for f_ix, foundColName in enumerate(headers):
        foundCols[f_ix] = foundColName.strip()
        if verbose:
            print "Header found: '%s' " % foundColName

    for col in colDefs:
        workingTitle = col.get('titles', col['name'] )
        if verbose:
            print "Column name: %s title: %s " % ( col['name'], workingTitle )
        colsByTitle[workingTitle] = col
        isVirtual = col.get('virtual', 'false')
        if isVirtual == True:
            virtualCols[ col.get('name')] = col

    for row_i, tableRow in enumerate(myreader):
        print "\n\n"
        for col_j, cellValue in enumerate(tableRow):
            colTitle = foundCols.get(col_j, "N/A")
            decodedCellValue = cellValue.decode('utf-8') # assumes encoding. TODO.
            if verbose:
                print "Cell[row: %i col: %i]: %s" % (row_i, col_j, cellValue)
                print "ColTitle: %s " % colTitle
            cellSpec = colsByTitle.get( colTitle, {'errored': True } )
            # print "Cell spec: %s"  % cellSpec
            myrow_aboutUrl = expandTemplate(cellSpec.get('aboutUrl', "N/A"), row_i)
            myrow_propertyUrl = expandTemplate(cellSpec.get('propertyUrl', "N/A"), row_i)
            myrow_valueUrl = expandTemplate(cellSpec.get('valueUrl', decodedCellValue), row_i) #defaults
            # Emitting non-virtual cells as we are looping through actual cells
            # "datatype": "anyURI",
            dt = cellSpec.get('datatype','N/A')
            if dt == "anyURI":
                print "<%s> <%s> <%s> . # LinkTriple" % (expandBaseHref(myrow_aboutUrl), expandNS(myrow_propertyUrl), expandBaseHref(myrow_valueUrl))
            else:
                print "<%s> <%s> \"%s\" . # TextTriple" % (expandBaseHref(myrow_aboutUrl), expandNS(myrow_propertyUrl), myrow_valueUrl.encode("utf-8") )
                # todo: override

        # Now loop through virtual cols for this row ID and emit. Needless code duplication here too.
        print
        for k,v in virtualCols.items():
            if verbose:
                print "Virtual column: k=%s v=%s " % (k,v)
            virtualCellSpec = virtualCols.get(k, False)
            if virtualCellSpec:
                vrow_aboutUrl = expandTemplate(virtualCellSpec.get('aboutUrl', "N/A"), row_i)
                vrow_propertyUrl = expandTemplate(virtualCellSpec.get('propertyUrl', "N/A"), row_i)
                vrow_valueUrl = expandTemplate(virtualCellSpec.get('valueUrl', "NA"), row_i)
                print "<%s> <%s> <%s> . # VirtualTriple" % (expandNS(expandBaseHref(vrow_aboutUrl)),expandNS(vrow_propertyUrl),expandNS(expandBaseHref(vrow_valueUrl)))
            else:
                print "# ERROR: Failed to get VirtualCellSpec. %s " % virtualCellSpec



# Tests: is it an error to find valueUrl on a non-virtual column?
# gregg: If you had a column whos value was a URL, you might prefer to use valueUrl rather than a datatype of anyURI.
