# Repo organization and the publishing process

The working directories are on the 'top level', like ``/syntax``. The ``index.html`` file in those directories are the [``respec``](http://www.w3.org/respec/) sources, plus the possible other accompanying files. The ``respec`` config typically says

	specStatus: "ED",
	// publishDate: "",
	previousPublishDate: 2014-03-04, // whatever is appropriate, or "" for a FPWD

the ``/publishing-snapshot`` directory contains specific milestone publications, e.g., ``FPWD-syntax`` or, later, ``WD-syntax-2014-XX-XX`` for a copy of what is officially published at W3C. This means all the relevant data files from ``/syntax``, plus a **generated** ``Overview.html`` file as a pure HTML5 file (i.e., not a ``respec`` source).

## The publication process

(Obviously, all these steps are typically done in your local repo and then committed to github when appropriate.)

1. Create a new subdirectory in ``/publishing-snapshot``, say, ``publishing-snapshot/WD-syntax-2014-12-12``. 
2. Copy all the auxiliary files (e.g., data files, BNF files, etc) from the main repo area.
3. (Before you forget:-) add an entry to the new directory in ``index.html`` on the top of the repository
4. Generate the pure HTML file:
	1. Finalize/change the ``index.html`` file in ``/syntax``
	1. Commit all the files to github
	1. From your Web browser, use the following URI: ``http://w3c.github.io/csvw/syntax/index.html?specStatus=WD;publishDate=2014-12-12`` (note the URI parameters to set the ``specStatus`` and ``publishDate`` values!). You should see the final format on your screen.
	1. Check whether ``respec`` signals a possible problem (a red button should appear on the upper right hand corner in that case.)
	1. Push the button called ``respec`` on the upper right hand corner, choose ``Save Snapshot``, then ``Save as HTML``. You should see the HTML source in your screen.
	1. Create/update a file called ``Overview.html`` file in the snapshot directory, and commit it to github
	1. ``http://w3c.github.io/csvw/publishing-snapshots/WD-syntax=2014-12-12/Overview.html`` is a local copy of the publication-to-be in pure HTML
	1. Use the [W3C pub rules checker](http://www.w3.org/2005/07/pubrules) with this URI to check the validity of the document. If there are problems, go back to the first step.
1. Once all pubrule issues are solved, you are ready. The next step is for the staff contact to make a copy of the snapshot and put it on the W3C server at ``http://www.w3.org/TR/2014/...``

This process is based on the assumption that the ``index.html`` (i.e., ``respec`` format) differs from the final document only in terms of the specification status and the date. If that is not the case, then a local copy of the file has to be added to the snapshot and be manipulated locally in that directory.
 

	 
