#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home)

## CONFIGURATION ##

# First, we need a running copy of RMLProcessor

RMLPROC=$HOME/working/csv/RMLProcessor # From https://github.com/mmlab/RMLProcessor/tree/development


# FULL PATH TO THIS DIR:

DIR=$HOME/working/csv/git/csvw/examples/tests/scenarios/chinook/attempts/attempt-1

 RMLFILE=chinook.rml.ttl 	          		# An RML mapping file, expressing CSV to RDF templates. 
 OUTFILE=../../output/_output_attempt-1.nt.txt 		# File for output RDF graph (W3C N-Triples format)

## END CONFIGURATION



cd $RMLPROC; mvn -e exec:java -f $RMLPROC/pom.xml  -Dexec.args="$DIR/$RMLFILE $DIR/$OUTFILE"
