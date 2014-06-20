# Repo organization and the publishing process

The working directories are on the 'top level', like ``/syntax``. The ``index.html`` file in those directories are the [``respec``](http://www.w3.org/respec/) sources, plus the possible other accompanying files. The ``respec`` config typically says

	specStatus: "ED",
	// publishDate: "",
	previousPublishDate: "2014-03-04", // whatever is appropriate, commented for a FPWD

the ``/publishing-snapshot`` directory contains specific milestone publications, e.g., ``FPWD-syntax`` or, later, ``WD-syntax-2014-XX-XX`` for a copy of what is officially published at W3C. This means all the relevant data files from ``/syntax``, plus a **generated** ``Overview.html`` file as a pure HTML5 file (i.e., not a ``respec`` source).

## The publication process

(Obviously, many of these steps are typically done in your local repo and then committed to github when appropriate.)

1. Create a new subdirectory in ``/publishing-snapshot``, say, ``publishing-snapshot/WD-syntax-2014-12-12``. 
2. Copy all the auxiliary files (e.g., data files, BNF files, etc) from the main repo area.
3. (Before you forget:-) add an entry to the new directory in ``index.html`` on the top of the repository
4. Generate the pure HTML file:
	1. Finalize/change the ``index.html`` file in ``/syntax``
	1. Commit all the files to github
	1. From your Web browser, use the following URI: ``http://w3c.github.io/csvw/syntax/index.html?specStatus=WD;publishDate=2014-12-12`` (note the URI parameters to set the ``specStatus`` and ``publishDate`` values!). You should see the final format on your screen.
	1. Check whether ``respec`` signals a possible problem (a red or orange button should appear on the upper right hand corner for errors or warnings, respectively).
	1. Push the button called ``respec`` on the upper right hand corner, choose ``Save Snapshot``, then ``Save as HTML``. You should either see the HTML source in your screen (e.g., in Safari or IE) or asked to download the HTML file on your disk.
	1. Create/update a file called ``Overview.html`` file in the snapshot directory, and commit it to github
	1. ``http://w3c.github.io/csvw/publishing-snapshots/WD-syntax-2014-12-12/Overview.html`` is a local copy of the publication-to-be in pure HTML ... note that if you're working in an alternative branch, the content will not be available at ``http://w3c.github.io/[...]``. Instead, use the service at [https://rawgit.com/] - paste the URL of the raw file into the RawGit page, e.g. ``https://raw.githubusercontent.com/w3c/csvw/my-branch/publishing-snapshots/WD-syntax-2014-12-12/Overview.html`` which publishes the content at the "development" URL: ``https://rawgit.com/w3c/csvw/my-branch/publishing-snapshots/WD-syntax-2014-12-12/Overview.html``.
	1. Use the [W3C pub rules checker](http://www.w3.org/2005/07/pubrules) with this URI to check the validity of the document. If there are problems, go back to the first step.
1. Generate diff from previous version:
	1. Push the button called ``respec`` on the upper right hand corner, choose ``Diff``,
 	1. Save diff to publication directory using path set in ``otherLinks/Changes/Diff to previous version/href``.
1. Update working version of file:
	1. Set ``otherLinks/Changes/Diff to previous version/href`` based on last publication date.
	1. Update ``previousPublishDate``, ``previousSpecStatus`` and ``previousURI`` to based on publication snapshot.
1. Once all pubrule issues are solved, you are ready. The next step is for the staff contact to make a copy of the snapshot and put it on the W3C server at ``http://www.w3.org/TR/2014/...``

The process may become slightly simpler if you run a local Web server on your machine that has an access to the local github repository. Indeed, in that case step 4.2. can be omitted, i.e., the ``Overview.html`` file can be generated locally. Alternatively, you may choose to make a local copy of ``index.html`` and open the file from your browser locally. The danger, in this case, is to loose sync with the "master" copy.

This process is based on the assumption that ``index.html`` (i.e., ``respec`` format) differs from the final document only in terms of the specification status and date (or other configuration option that can be set in the URI). If that is not the case, then a local copy of the file has to be added to the snapshot and be manipulated in that directory; of course, in that case the simplest is to set the ``specStatus`` and other options in that copy. Again, the danger of course is to loose sync with the "master" copy.

 

	 
