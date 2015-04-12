/*
*
* Replace github.io references to /TR references.
* The issue is as follows: when several specs are developed in parallel, it is a good idea
* to use, for mutual references, the github.io URI-s. That ensures that the editors' drafts are always
* correct in terms of mutual references.
*
* However, when publishing the documents, all those references must be exchanged against the final, /TR
* URI-s. That process, when done manually, is boring and error prone. This script solves the issue:
*
* * Create a separate file with the 'conversions' array. See, e.g., https://github.com/w3c/csvw/blob/gh-pages/local-biblio.js
*   for an example.
* * Include a reference to that file and this to the respec code, after the inclusion of respec. E.g.:
* ```
*  <script class="remove" src="../local-biblio.js"></script>
*  <script class="remove" src="https://www.w3.org/Tools/respec/respec-w3c-common"></script>
*  <script class="remove" src="../replace-ed-uris.js"></script>
* ```
*
* This function will be automatically executed when the respec source is saved in an (X)HTML file.
* Note that
*
* * Links in the header part will *not* be changed. That part is usually generated automatically, and the reference to the
*   editor's draft must stay unchanged
* * The text content of an <a> element will also be converted (if needed). This means that the reference list may also
*   use include the github.io address (as it should...)
*
*/
respecEvents.sub("save", function() {
  $("a[href]").not( $("div.head a") ).each( function(index) {
    var href = $(this).attr("href");
    for( var i = 0; i < conversions.length; i++ ) {
      var to_be_replaced = conversions[i][0];
      var replacement    = conversions[i][1];
      if( href.indexOf(to_be_replaced) !== -1 ) {
        var new_href = href.replace(to_be_replaced,replacement);
        $(this).attr("href", new_href)
        if( $(this).text().indexOf(to_be_replaced) !== -1 ) {
          $(this).text(replacement);
        }
        break;
      }
    }
  })
});
