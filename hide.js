
/**
* For each button/div pair the current visibility is stored
*/
var visibility_flags = {};

/**
* These are the strings to be displayed in the buttons, ie, 
* set as the text content of the <button> elements
*/
var show_text = "Show detailed annotations";
var hide_text = "Hide detailed annotations";

/**
* This function is invoked when the button is pushed
*
* @param {String} target: the id value of the <div> element to be switched, also the value of the @data-anno-target for the button
*/
var hide = function(target) {
  var flag   = visibility_flags[target];
  var tohide = document.getElementById(target);
  tohide.style.display = flag ? "none" : "inherit";

  // Change the button content
  var buttons = document.getElementsByTagName("button");
  for( var i = 0; i < buttons.length; i++ ) {
    if( target === buttons[i].getAttribute("data-anno-target") ) {
      buttons[i].innerHTML = flag ? show_text : hide_text;
    }
  }
  visibility_flags[target] = !flag;
}

/**
* This method is invoked *at the end* of the file; 
* this ensures that all the DOM is already loaded.
* In practice, the end of the HTML file should include something like:
*
*    <script type="text/javascript">
*      (function(){
*        hide_init();
*      })();
*    </script>
*
* The initialization
* * sets, for each button the "onclick" event for "hide()" with the right argument
* * sets the visibility flag to "false" and the display CSS attribute to none for the corresponding <div>
* * sets the text content for the <button> element
*/
var hide_init = function() {
  var buttons = document.getElementsByTagName("button");
  for( var i = 0; i < buttons.length; i++ ) {
    var id = buttons[i].getAttribute("data-anno-target");
    var tohide = document.getElementById(id);
    if( tohide === undefined ) {
      buttons[i].style.display = "none";
    } else {
      visibility_flags[id] = false;
      buttons[i].innerHTML = show_text;
      buttons[i].setAttribute("onclick", "hide('" + id + "');")
      tohide.style.display = "none";
    }
  }
}
