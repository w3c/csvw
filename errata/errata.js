/*
Script to create errata report pages based on github issues used to raise an errata.

The workflow on github is as follows: 

- An issue is raised. Additionally, a label is added to designate a specific label defined by for the
repository (typically a reference to a specific document). A specific label may be assigned by the specific group for the repo to 
differentiate the raised errata from the other issues.
- The community discusses the issue. If it is accepted as a genuine erratum, the label "Errata" is added to the entry. Additionally, 
a new comment on the issue may be added beginning with the word "Summary".
- If the community rejects the issue as an erratum, the issue is closed.

As for the report, the structure of the HTML file can be seen in the example file /People/Ivan/errata_template.html. The net result is
that the active issues are displayed in different sections, depending on the presence of specific labels. The relevant values are set
through some data-* attributes on the elements.
*/

$(document).ready(function() { 
    var display_issue = function(node, issue, comments, labels) {
        var  display_labels = _.reduce(labels, function(memo, label, index) {
            if( label === "Errata" ) 
                return memo 
            else if( memo === "" )
                return label
            else 
                return memo + ", " + label
        }, "");
        var div = $("<div class='issue'></div>");
        node.append(div);
        div.append("<h3>\"" + issue.title + "\"</h3>");
        div.append("<p><span class='what'>Issue number:</span> <a href='" + issue.html_url + "'>#" + issue.number + "</a><br>" +
                   "<span class='what'>Raised by:</span><a href='" + issue.user.url + "'>@" + issue.user.login + "</a><br>"    +
                   "<span class='what'>Extra Labels:</span> " + display_labels + "</a><br>"                                    +
                   "</p>");
        div.append("<p><span class='what'><a href='" + issue.html_url + "'>Initial description:</a></span> " + issue.body + "</p>");

        // See if a summary has been added to the comment.
        var summary = undefined;
        _.each(comments, function(comment) {
            if( comment.body.search("^Summary:") !== -1 ) {
                summary = comment;
            }
        })

        if( summary !== undefined ) {
            div.append("<p><span class='what'><a href='" + summary.html_url + "'>Erratum summary:</a></span> " + summary.body + "</p>");
        }
    }

    var render_issue = function(issue, comments) {
        var labels = _.map(issue.labels, function (obj) {
            return obj.name;
        });
        var displayed = false;
        $("section").each(function(index) {
            var dataset = $(this).prop('dataset');
            if( _.include(labels, dataset.erratalabel) ) {
                display_issue($(this), issue, comments, labels)
                displayed = true;
            }
        });
        if( displayed === false ) {
            $("section").each(function(index) {
                var dataset = $(this).prop('dataset');
                if( dataset.nolabel !== undefined ) {
                    display_issue($(this), issue, comments, labels)
                }
            });            
        }
    }

    dataset = $('head').prop('dataset');
    if (dataset.githubrepo !== undefined) {
        var url_api    = "https://api.github.com/repos/" + dataset.githubrepo + "/issues?state=open&labels=Errata";
        var url_issues = "https://github.com/" + dataset.githubrepo + "/labels/Errata";
        $.getJSON(url_api, function (allIssues) {
            if( allIssues.length > 0 ) {
                var latest_change = moment.max(_.map(allIssues, function(item) {
                    return moment(item.updated_at)
                }));
                $("span#date").append(latest_change.format("dddd, MMMM Do YYYY"));                
            } else {
                $("span#date").append("N/A");                
            }
            $("span#number").append(allIssues.length);
            $("span#errata_link").append("<a href='" + url_issues + "'>" + url_issues + "</a>");
            $.each(allIssues, function (i, issue) {
                $.getJSON(issue.comments_url, function(comments) {
                    render_issue(issue, comments);
                });
            });
        });
    }
});
