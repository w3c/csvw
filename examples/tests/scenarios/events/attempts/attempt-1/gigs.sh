#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home)

# This script assumes a working RMLProcessor installation including Maven, Java 1.7. ( build with:  mvn -e clean install)  
# See http://rml.io/RML_R2RML.html for details, and http://rml.io/RML_R2RML.html 
# "RML is defined as a superset of the W3C-standardized mapping language, R2RML, that maps data in relational databases to the RDF data model"
# publications: http://rml.io/RML_publications.html
# e.g. http://events.linkeddata.org/ldow2014/papers/ldow2014_paper_01.pdf

# The template/mapping file is expressed in RML
# This is a generalization of W3C R2RML that extends the notion of 'column' to include JSON and XML inputs, as well as CSV.
# Where R2RML requires SQL table names, here we need full path to a CSV file. This is stored in a source.properties 
# file which we generate (and delete afterwards). RML is expressed in RDF written in W3C Turtle format.
# 
# NOTE: Update DIR below to give full path where you have this directory.



## CONFIGURATION ##

RMLPROC=$HOME/working/csv/RMLProcessor # From https://github.com/mmlab/RMLProcessor/tree/development

DIR=$HOME/working/csv/git/csvw/examples/tests/scenarios/events/attempts/attempt-1 # Unix path to working folder containing:
 RMLFILE=mapping-events.rml.ttl          # An RML mapping file, expressing CSV to RDF templates. 
 OUTFILE=../../output/_output_attempt-1.nt.txt # File for output RDF graph (W3C N-Triples format)

## END CONFIGURATION

cd $RMLPROC; mvn -e exec:java -f $RMLPROC/pom.xml  -Dexec.args="$DIR/$RMLFILE $DIR/$OUTFILE"
