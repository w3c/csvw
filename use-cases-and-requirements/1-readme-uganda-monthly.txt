These data originated from John Christy of UAH. Data was sent via E-Mail and uploaded to FTP on 1 Mar 2012 by Jared Rennie. A description of the data is below, however there are documents within this tar file that will provide a more detailed explanation.

Please note that there are 2 different versions of Stage 1 data for Uganda. They are as follows:

uganda-raw 
uganda-bestguess

When converting to Stage 2. Only uganda-bestguess will be used. However we have provided both versions in the stage 1 directory

uganda-raw contains all 32 Uganda stations from multiple sources. They are as follows:

BEA
GHCN
ColArchive
GSOD
GSODcal
GSODrec
NCARds512
NCARds570
WWR
MCDW

uganda-bestguess contains all 32 stations, however derived from the different sources based upon a hierarchy described below:

First priority is given to values that were input directly from imaged documents from the British East Africa met service by the author.  31 of the 32 stations were included in the BEA stations and 18 exclusively so (see listing in appendix).  BEA data ceased after 1974.

Second priority is given to values contained in the GHCNv3 database.  For the most part GHCNv3 is a subset of BEA and contains only five stations.

Third priority is given to the values contained in the Colonial Era Archive from NCDC.  The five stations in GHCNv3 are largely derived from this archive, with the erroneous values in the Colonial Archive identified in the appendix eliminated in GHCNv3.  Two stations (Jinja and Mbarara) were not in GHCNv3, and provided data not found in the BEA documents, primarily around 1937 to 1942 as the third priority.

Fourth priority was given to Global Summary Of the Day (GSOD) for TMax and TMin in which a monthly average of the daily values was calculated by the author if a minimum of 15 days were present.  This is the main source for more recent data.  For the TMean value, priority was given to the GSOD value calculated from TMax and TMin called GSODcal.  

(TMean) Fifth priority was given to NCAR dataset #570.

(TMean)  Sixth priority for TMean was given to the monthly values derived from GSOD by NCDC called GSODrec.  These values are often different from those described above.

(TMean) Seventh priority for TMean was given to monthly values from Monthly Climate Data of the World (MCDW).

NCAR dataset #512 monthly means (available at scattered times since 1979) was not included in the hierarchy.    In the judgment of the author, the values did not appear to be representative of observations.

World Weather Records were not included due to their presence as a subset of NCARds570.

