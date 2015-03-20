/**
* Script to show/hide a <div> element in a document, as a result of a 
* corresponding <button> element's action.
* 
* The <div> (or other) element that is to be hidden/shown has to have an @id
* and be of class "to-toggle". The button element must have an @data-toggle-target
* attribute with the corresponding @id value of the <div> element, and be of class "toggle". 
*
* The HTML source must link this javascript, as well as the hide.css file. (The
* CSS file ensures that the <div> element is hidden by default except when it is
* printed, when it should be visible.)
* 
* Finally, the end of the HTML file should include:
*
*    <script type="text/javascript">
*      (function(){
*        hide_init();
*      })();
*    </script>
*
*
* * Author: Ivan Herman
* * Licence: © Copyright W3C® SOFTWARE NOTICE AND LICENSE <http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>, Ivan Herman, 2015
* 
* @author Ivan Herman
* @license W3C
*/

/**
* For each button/div pair the current visibility is stored
*/
var visibility_flags = {};

/**
* These are the strings to be displayed in the buttons, ie, 
* set as the text content of the <button> elements
*/
var show_text = "Show detailed table annotations";
var hide_text = "Hide detailed table annotations";

/**
* This function is invoked when the button is pushed
*
* @param {Object} event: the event that triggered the handler
*/
var hide = function(event) {
  /* Get the button that is at the origin of the event */
  var button = event.currentTarget;
  /* get the target, ie, the id of the div element */
  var target = button.getAttribute("data-toggle-target");
  var tohide = document.getElementById(target);
  /* get the current visibility flag */
  var flag   = visibility_flags[target];

  /* hide the target */
  tohide.setAttribute("class", flag ? "to-toggle" : "to-toggle visible");

  /* Change the button's content */
  button.innerHTML = flag ? show_text : hide_text;

  /* Reset the visibility flag */
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
    if( buttons[i].className === "toggle" ) {
      var id = buttons[i].getAttribute("data-toggle-target");
      visibility_flags[id] = false;
      buttons[i].innerHTML = show_text;
      buttons[i].addEventListener("click", hide);      
    }
  }
}
