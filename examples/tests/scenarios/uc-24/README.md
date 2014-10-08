


use-case-24--expressing-a-hierachy-within-occupational-listings/

UC: http://w3c.github.io/csvw/use-cases-and-requirements/index.html#UC-ExpressingHierarchyWithinOccupationalListings

"Our user intends to analyze the current state of the job market using information gleaned from 
 job postings that are published using schema.org markup."

 ls ../../../use-case-data-files/use-case-24--expressing-a-hierachy-within-occupational-listings/
 
==2010_Occupations.csv==

* O*NET-SOC 2010 Code,O*NET-SOC 2010 Title,O*NET-SOC 2010 Description
* 11-1011.00,Chief Executives,"Determine and formulate policies and provide overall direction of companies or private and public sector organizations within guidelines set up by a board of directors or similar governing body. Plan, direct, or coordinate operational activities at the highest level of management with the help of subordinate executives and staff managers."
* 11-1011.03,Chief Sustainability Officers,"Communicate and coordinate with management, shareholders, customers, and employees to address sustainability issues. Enact or oversee a corporate sustainability strategy."
* etc.

==soc_structure_2010.csv==

Major Group,Minor Group,Broad Group,Detailed Occupation,,,,,,
* ,,,,,,,,,
* 11-0000,,,,Management Occupations,,,,,
* ,11-1000,,,Top Executives,,,,,
* ,,11-1010,,Chief Executives,,,,,
* ,,,11-1011,Chief Executives,,,,,
* ,,11-1020,,General and Operations Managers,,,,,
* ,,,11-1021,General and Operations Managers,,,,,
* ,,11-1030,,Legislators,,,,,
* ,,,11-1031,Legislators,,,,,
* ,11-2000,,,"Advertising, Marketing, Promotions, Public Relations, and Sales Managers",,,,,
* etc.
