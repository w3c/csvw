
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
* @param {Object} event: the event that triggered the handler
*/
var hide = function(event) {
  /* Get the button that is at the origin of the event */
  var button = event.currentTarget;
  /* get the target, ie, the id of the div element */
  var target = button.getAttribute("data-anno-target");
  var tohide = document.getElementById(target);
  /* get the current visibility flag */
  var flag   = visibility_flags[target];

  /* hide the target */
  tohide.style.display = flag ? "none" : "inherit";

  /* Change the button's content */
  button.innerHTML = flag ? show_text : hide_text;

  /* Reset the visibility flag*/
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
  var match = window.matchMedia("screen");
  for( var i = 0; i < buttons.length; i++ ) {
    var id = buttons[i].getAttribute("data-anno-target");
    if( match.matches ) {
      var tohide = document.getElementById(id);
      visibility_flags[id] = false;
      buttons[i].innerHTML = show_text;
      buttons[i].addEventListener("click", hide);
      tohide.style.display = "none";
    } else {
      buttons[i].style.display = "none";      
    }
  }
}
