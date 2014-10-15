#!/bin/bash

# Chinook is a free sample database.
# 
# See http://chinookdatabase.codeplex.com/releases/view/55681
# 
# This script will download the SQLlite version, then convert
# the following tables to CSV:
#   Album          Employee       InvoiceLine    PlaylistTrack
#   Artist         Genre          MediaType      Track        
#   Customer       Invoice        Playlist   

mkdir -p tmp csv

echo "First get zip from http://chinookdatabase.codeplex.com/downloads/get/557747 and unpack into ./tmp"
echo "You'll need ChinookDatabase1.4_CompleteVersion.zip or at least Chinook_Sqlite.sqlite "
echo "Writing CSVs to ./csv/"
ls -l csv/

/usr/bin/sqlite3 ./tmp/Chinook_Sqlite.sqlite <<!
.headers on
.mode csv

.output csv/Album.csv
select * from Album;

.output csv/Employee.csv
select * from Employee;

.output csv/InvoiceLine.csv
select * from InvoiceLine;

.output csv/PlaylistTrack.csv
select * from PlaylistTrack;

.output csv/Artist.csv
select * from Artist;

.output csv/Genre.csv
select * from Genre;

.output csv/MediaType.csv
select * from MediaType;

.output csv/Track.csv
select * from Track;

.output csv/Customer.csv
select * from Customer;

.output csv/Invoice.csv
select * from Invoice;

.output csv/Playlist.csv
select * from Playlist;

!

#   Album          Employee       InvoiceLine    PlaylistTrack
#   Artist         Genre          MediaType      Track        
#   Customer       Invoice        Playlist   
