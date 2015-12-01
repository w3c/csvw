/*
 * Dynamic Table of Contents script
 * Largely inspired by the script of Matt Whitlock <http://www.whitsoftdev.com/> but rewritten into 
 * jQuery and extended with additional features.
 *
 * There are two versions of this script: one is based on the usage of <h1>...<h6> elements, the other
 * based on the usage of html5 <section>.
 *
 * This is the "sections" version.
 * 
 * See the separate Readme.md documentation for details on using this script
 *
 * W3C® SOFTWARE NOTICE AND LICENSE <http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231>
 */

$(document).ready(function() {  
	dataset = $('head').prop('dataset');
	if(dataset.notoc !== undefined) return;

	/* Note that the function can stop at this point via a 'return'! */
	var maxlevel = 6;
	if (dataset.tocmaxlevel !== undefined) {
		/* This will coerce this to an integer... */
		xlevel = 1*dataset.tocmaxlevel;
		if (xlevel === 0) {
			// switch the toc level out completely!
			return;
		} else {
			maxlevel = xlevel
		}
	};

	var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0;
	var section_num = "";
	/* Prepare the TOC part */
 	toc = $('<ul class="toc toclevel2"></ul>');
 	toc_div = $('div#toc, section#toc');
 	toc_div.append(toc);

 	/* Any section header can be used... */
	var selector = "section > h1, section > h2, section > h3, section > h4, section > h5, section > h6";
	$(selector).each(function(index) {
		/* The nice aspects of sectioning: one can look at any of the ancestor sections to see if toc has been removed */
		/* Ie, one can remove a whole hierarchy from TOC by putting data-notoc on the section element */
		if( $(this).parents("section[data-notoc]").length > 0 ) return;

		/* Establish the current sectioning level */
		var level = $(this).parents("section").length;

		/* If the level is deeper than what is requested, stop it here */
		if( level > maxlevel ) return;
		switch( level ) {
			case 1 :
				++i1;
				i2 = 0; i3 = 0; i4 = 0; i5 = 0; 
				section_num = i1;
				current_ul = toc;
				break;
			case 2 :
				++i2;
				i3 = 0; i4 = 0; i5 = 0;
				section_num = i1 + "." + i2;
				if (i2 === 1) {
					// We have to add <ul> to the top...
					current_ul = $('<ul class="toc toclevel2"></ul>');
					toc.children().eq(i1-1).append(current_ul);
				} else {
					current_ul = toc.children().eq(i1-1).children().last();
				}
				break;
			case 3 :
				++i3;
				i4 = 0; i5 = 0;
				section_num = i1 + "." + i2 + "." + i3;
				if (i3 === 1) {
					// We have to add <ul> to the top...
					current_ul = $('<ul class="toc toclevel3"></ul>');
					toc.children().eq(i1-1).children().last().children().eq(i2-1).append(current_ul);					
				} else {
					current_ul = toc.children().eq(i1-1).children().last().children().eq(i2-1).children().last();					
				}
				break;
			case 4 :
				++i4;
				i5 = 0;
				section_num = i1 + "." + i2 + "." + i3 + "." + i4;
				if (i4 === 1) {
					// We have to add <ul> to the top...
					current_ul = $('<ul class="toc toclevel4"></ul>');
					toc.children().eq(i1-1).children().last().children().eq(i2-1).children().last().children().eq(i3-1).append(current_ul);					
				} else {
					current_ul = toc.children().eq(i1-1).children().last().children().eq(i2-1).children().last().children().eq(i3-1).children().last();										
				}
				break;
			case 5 :
				++i5;
				section_num = i1 + "." + i2 + "." + i3 + "." + i4 + "." + i5;
				if (i5 === 1) {
					// We have to add <ul> to the top...
					current_ul = $('<ul class="toc toclevel5"></ul>');
					toc.children().eq(i1-1).children().last().children().eq(i2-1).children().last().children().eq(i3-1).children().last().children().eq(i4-1).append(current_ul);					
				} else {
					current_ul = toc.children().eq(i1-1).children().last().children().eq(i2-1).children().last().children().eq(i3-1).children().last().children().eq(i4-1).children().last();										
				}
				break;
		}

		$(this).addClass("headertoclevel" + level)
		id = "id_" + section_num;
		section_num += ". ";

		var new_li = $("<li></li>");
		var new_tocnumber = $("<span></span>");
		new_tocnumber.attr('class','tocnumber').append(section_num);

		// See if the corresponding section has a tochidden flag; this has to be copied to the numbering for later processing!
		if( $(this).parent().attr("data-tochidden") !== undefined ) {
			new_tocnumber.attr("data-tochidden","true");
		}
		new_li.append(new_tocnumber);

		new_li.append($("<a></a>").attr('href','#'+id).text($(this).text()));
		current_ul.append(new_li);

		// Add an anchor to the header
		$(this).prepend($("<span></span>").append(section_num).attr("id", id));
	})

	toctitle = $('<h2 id="toctitle">Table of content</h2>')
 	toc_div.prepend(toctitle);

 	// Set up the interaction on the TOC entries
 	$('span.tocnumber').each(function() {
 		if( $(this).siblings("ul").length > 0 ) {
 			if( $(this).attr("data-tochidden") !== undefined ) {
 				// The initial status should be hidden for the corresponding sub TOC!
 				$(this).addClass("tochidden");
 				$(this).siblings("ul").hide();
 			} else {
	 			$(this).addClass("tocvisible");
 			}
 			$(this).click(function() {
 				$(this).siblings("ul").toggle(300);
				$(this).toggleClass("tocvisible");
				$(this).toggleClass("tochidden");			
 			});
 		}
 	})

	// Togle the visibility of the whole table of content
	// Initially, the TOC is visible
	// Initial values for TOC visibility
	if (dataset.tochidden === undefined) {
		// Initially, the toc is visible
		toctitle.addClass("tocvisible");
	} else {
		// Initially, the toc is not visible
		toc.hide();
		toctitle.addClass("tochidden");
	}
	toctitle.click(function() {
		toc.toggle(300);
		toctitle.toggleClass("tocvisible");
		toctitle.toggleClass("tochidden");
	});
});

