
Comparison of RML and W3C CSVW w.r.t. the Event CSV mapping example.

Dan Brickley <danbri@google.com>

1. RML version (Turtle notation)

This is what (R2)RML looks like for this mapping:



    @prefix rr: <http://www.w3.org/ns/r2rml#>.
    @prefix rml: <http://semweb.mmlab.be/ns/rml#> .
    @prefix ql: <http://semweb.mmlab.be/ns/ql#> .
    # CSV fields are: Name, StartDate, location_name, location_address, ticket_url
    <#myCSV> rml:source "https://raw.githubusercontent.com/w3c/csvw/gh-pages/examples/tests/scenarios/events/source/events-listing.csv"; rml:referenceFormulation ql:CSV .



    <#MusicEvent> rml:logicalSource <#myCSV>;
      rr:subjectMap [ rr:termType rr:BlankNode; rr:class schema:MusicEvent; ];
      rr:predicateObjectMap [ rr:predicate schema:name; rr:objectMap [ rml:reference "Name"; ] ];
      rr:predicateObjectMap [ rr:predicate schema:startDate; rr:objectMap [ rml:reference "StartDate";  rr:datatype schema:Date; ]  ];
      rr:predicateObjectMap [ rr:predicate schema:location;  rr:objectMap [ rr:parentTriplesMap <#Place> ]  ];
      rr:predicateObjectMap [ rr:predicate schema:offers; rr:objectMap [ rr:parentTriplesMap <#Offer> ] ] .

    <#Place> rml:logicalSource <#myCSV>;
      rr:subjectMap [ rr:termType rr:BlankNode;  rr:class schema:Place; ];
      rr:predicateObjectMap [ rr:predicate schema:address; rr:objectMap [  rml:reference "location_address"; ] ];
      rr:predicateObjectMap [  rr:predicate schema:name; rr:objectMap [ rml:reference "location_name"; ] ] .

    <#Offer> rml:logicalSource <#myCSV>;
      rr:subjectMap [ rr:termType rr:BlankNode;  rr:class schema:Offer; ];
      rr:predicateObjectMap [  rr:predicate schema:url;  rr:objectMap [  rml:reference "ticket_url"; rr:termType rr:IRI; ]  ] .



2. CSVW version (JSON-LD notation)

This is what W3C CSVW JSON-LD metadata csv2rdf mappings look like:

    { "@context": ["http://www.w3.org/ns/csvw", {"@language": "en"}],
      "url": "events-listing.csv",
      "dialect": {"trim": true},


    "tableSchema": {
    "columns": [

    {"aboutUrl": "#event-{_row}", "name": "name", "titles": "Name", "propertyUrl": "schema:name"},
    {"aboutUrl": "#event-{_row}", "name": "start_date", "titles": "Start Date", "datatype": { "base": "datetime", "format": "yyyy-MM-ddTHH:mm" }, "propertyUrl": "schema:startDate"},

    {"aboutUrl": "#event-{_row}", "name": "type_event", "virtual": true, "propertyUrl": "rdf:type","valueUrl": "schema:MusicEvent"},
    {"aboutUrl": "#event-{_row}", "name": "location", "virtual": true, "propertyUrl": "schema:location", "valueUrl": "#place-{_row}"},
    {"aboutUrl": "#event-{_row}", "name": "offers", "virtual": true, "propertyUrl": "schema:offers", "valueUrl": "#offer-{_row}"

    {"aboutUrl": "#place-{_row}", "name": "location_name", "titles": "Location Name", "propertyUrl": "schema:name"},
    {"aboutUrl": "#place-{_row}", "name": "location_address", "titles": "Location Address", "propertyUrl": "schema:address"},

    {"aboutUrl": "#place-{_row}", "name": "type_place", "virtual": true, "propertyUrl": "rdf:type","valueUrl": "schema:Place"},

    {"aboutUrl": "#offer-{_row}", "name": "ticket_url", "titles": "Ticket Url","datatype": "anyURI", "propertyUrl": "schema:url"},
    {"aboutUrl": "#offer-{_row}", "name": "type_offer", "virtual": true, "propertyUrl": "rdf:type","valueUrl": "schema:Offer"},

    }]
    }
    }


3. NOTES

a. I have reordered the examples somewhat. The JSON-LD is now squashed into one line per triple. I moved the "aboutUrl" field to the start of each row, and re-grouped them.
