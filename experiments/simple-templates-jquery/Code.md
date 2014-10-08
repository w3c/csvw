# The code details #
(This section is not really of interest as for the decision the WG has to take on whether to use a template language of not. It is just if you want to look at the details...)

The code is provided as an extension to jQuery, all in the [`js/CSVPlus.js`](js/CSVPlus.js) file. See the separate [documentation](doc/classes/CSVPlus.html) for further details.
   
The code depends on external modules

- [PapaParse](http://papaparse.com) CSV parser
- [URI.js](https://medialize.github.io/URI.js/) to manipulate URI-s
- [rdf_interface](https://github.com/antoniogarrote/rdfstore-js) offering a simple (in memory) RDF interface with an NT serializer

The code is *very* rough at the edges (e.g., managing errors) and is probably not very efficient for larger CSV files...


