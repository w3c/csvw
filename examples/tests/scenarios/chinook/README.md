"Chinook is a sample database available for SQL Server, Oracle, MySQL, etc. It can be created by running a single SQL script. 
Chinook database is an alternative to the Northwind database, being ideal for demos and testing ORM tools 
targeting single and multiple database servers."

See http://chinookdatabase.codeplex.com/releases/view/55681

chinook_tocsv.sh is a quick script that converts the Chinook free sample database
into CSV files. These are stored in csv/ so you shouldn't need the script.

For CSVW R2RML, see also http://rml.io/RML_examples.html (Flanders city example) for multiple CSV examples.



Chinook DB License is https://chinookdatabase.codeplex.com/license "Microsoft Public License (Ms-PL)"

![Chinook relational schema](https://raw.githubusercontent.com/w3c/csvw/gh-pages/examples/tests/scenarios/chinook/ChinookSchema.PNG "Chinook schema")

First 2 lines of each CSV file follow: 

##Album.csv
* AlbumId,Title,ArtistId
* 1,"For Those About To Rock We Salute You",1

##Artist.csv
* ArtistId,Name
* 1,AC/DC

##Customer.csv
* CustomerId,FirstName,LastName,Company,Address,City,State,Country,PostalCode,Phone,Fax,Email,SupportRepId
* 1,"Luís","Gonçalves","Embraer - Empresa Brasileira de Aeronáutica S.A.","Av. Brigadeiro Faria Lima, 2170","São José dos Campos",SP,Brazil,12227-000,"+55 (12) 3923-5555","+55 (12) 3923-5566",luisg@embraer.com.br,3

##Employee.csv
* EmployeeId,LastName,FirstName,Title,ReportsTo,BirthDate,HireDate,Address,City,State,Country,PostalCode,Phone,Fax,Email
* 1,Adams,Andrew,"General Manager",,"1962-02-18 00:00:00","2002-08-14 00:00:00","11120 Jasper Ave NW",Edmonton,AB,Canada,"T5K 2N1","+1 (780) 428-9482","+1 (780) 428-3457",andrew@chinookcorp.com

##Genre.csv
* GenreId,Name
* 1,Rock

##Invoice.csv
* InvoiceId,CustomerId,InvoiceDate,BillingAddress,BillingCity,BillingState,BillingCountry,BillingPostalCode,Total
* 1,2,"2009-01-01 00:00:00","Theodor-Heuss-Straße 34",Stuttgart,,Germany,70174,1.98

##InvoiceLine.csv
* InvoiceLineId,InvoiceId,TrackId,UnitPrice,Quantity
* 1,1,2,0.99,1

##MediaType.csv
* MediaTypeId,Name
* 1,"MPEG audio file"

##Playlist.csv
* PlaylistId,Name
* 1,Music

##PlaylistTrack.csv
* PlaylistId,TrackId
* 1,3402

## Track.csv
* TrackId,Name,AlbumId,MediaTypeId,GenreId,Composer,Milliseconds,Bytes,UnitPrice
* 1,"For Those About To Rock (We Salute You)",1,1,1,"Angus Young, Malcolm Young, Brian Johnson",343719,11170334,0.99
