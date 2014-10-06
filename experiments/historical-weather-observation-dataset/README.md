<h1>Historical weather observation experiment</h1>

<h2>Describing the source dataset</h2>
This experiement is based on a [historical weather observation dataset for Camborne][1]

[1]: http://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/cambornedata.txt

<h3>Raw data (fixed width)</h3>
A snippet of the raw data is provided below:

```
Camborne
Location 1627E 407N 87m amsl
Estimated data is marked with a * after the value.
Missing data (more than 2 days missing in month) is marked by  ---.
Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.
   yyyy  mm   tmax    tmin      af    rain     sun
              degC    degC    days      mm   hours
   1978   9   17.5    11.3       0    26.7    ---
   1978  10   15.6    10.7       0    20.4    ---
   1978  11   12.6     7.6       0    56.3    ---
   1978  12    9.2     5.0       5   276.7    ---
   1979   1    6.5     0.9      13   134.8    ---
   1979   2    6.7     1.9       5   133.0    ---
   1979   3    8.8     3.6       2   143.8   105.0
   1979   4   10.6     5.5       0    65.9   161.1
   1979   5   12.4     5.8       0    82.3   227.0
   1979   6   16.0    10.4       0    43.2   192.5
   1979   7   18.2    12.1       0    27.9   198.9
...
   2013   9   17.3    12.4       0    62.0   114.4#
   2013  10   15.8    11.7       0   160.8    76.5#
   2013  11   11.0     6.7       0    94.4    60.1#
   2013  12   10.7     5.9       0   175.6    44.5#
   2014   1   10.0     5.1       0   218.4    43.0#
   2014   2    9.6     4.7       0   190.4    85.1#
   2014   3   10.3     5.7       0    67.0    94.1#
   2014   4   12.3     7.4       0    81.4   154.9#  Provisional
   2014   5   14.5     9.0       0    70.0   183.2#  Provisional
   2014   6   17.8    11.6       0    64.8   265.9#  Provisional
   2014   7   20.3    14.3       0    28.6   204.7#  Provisional
   2014   8   18.6    12.5       0    92.8   200.2#  Provisional
```

For convenience there is also a [local copy](cambornedata.txt) is also provided.

As can be seen, the raw data is actually fixed-format rather than CSV. 

For reference, the column titles (in line 6) are interpreted as follows:
- `yyyy`: year
- `mm`: month
- `tmax`: mean daily maximum temperature
- `tmin`: mean daily minimum temperature
- `af`: number of days of air front
- `rain`: total rain (accumulation)
- `sun`: total sunshine duration

<h3>Conversion to standard CSV format</h3>
[Instructions are provided describing how to import these historical weather observation datasets into Microsoft Excel][2]. Standard CSV format can be exported; a snippet of which is provided below:

[2]: http://www.metoffice.gov.uk/climate/uk/about/station-data/import

```
Camborne,,,,,,,,,,,,
Location 1627E 407N 87m amsl,,,,,,,,,,,,
Estimated data is marked with a * after the  value.,,,,,,,,,,,,
Missing  data (more than 2 days missing in month) is  marked by  ---.,,,,,,,,,,,,
"Sunshine data taken from an automatic Kipp & Zonen sensor marked with a #, otherwise sunshine data taken from a Campbell Stokes recorder.",,,,,,,,,,,,
yyyy,mm,tmax,,tmin,,af,,rain,,sun,,
,,degC,,degC,,days,,mm,,hours,,
1978,9,17.5,,11.3,,0,,26.7,,---,,
1978,10,15.6,,10.7,,0,,20.4,,---,,
1978,11,12.6,,7.6,,0,,56.3,,---,,
1978,12,9.2,,5,,5,,276.7,,---,,
1979,1,6.5,,0.9,,13,,134.8,,---,,
1979,2,6.7,,1.9,,5,,133,,---,,
1979,3,8.8,,3.6,,2,,143.8,,105,,
1979,4,10.6,,5.5,,0,,65.9,,161.1,,
1979,5,12.4,,5.8,,0,,82.3,,227,,
1979,6,16,,10.4,,0,,43.2,,192.5,,
1979,7,18.2,,12.1,,0,,27.9,,198.9,,
...
2013,9,17.3,,12.4,,0,,62,,114.4,#,
2013,10,15.8,,11.7,,0,,160.8,,76.5,#,
2013,11,11,,6.7,,0,,94.4,,60.1,#,
2013,12,10.7,,5.9,,0,,175.6,,44.5,#,
2014,1,10,,5.1,,0,,218.4,,43,#,
2014,2,9.6,,4.7,,0,,190.4,,85.1,#,
2014,3,10.3,,5.7,,0,,67,,94.1,#,
2014,4,12.3,,7.4,,0,,81.4,,154.9,#,Provisional
2014,5,14.5,,9,,0,,70,,183.2,#,Provisional
2014,6,17.8,,11.6,,0,,64.8,,265.9,#,Provisional
2014,7,20.3,,14.3,,0,,28.6,,204.7,#,Provisional
2014,8,18.6,,12.5,,0,,92.8,,200.2,#,Provisional
```

For convenience, a [local copy](cambornedata.csv) is provided.

There are a number of characteristics of this CSV file worth noting:
- The first 5 lines are descriptive metadata
- The header row (containing the column titles) is line 6
- Not all columns have titles; the additional columns inserted to capture qualification of the observation values do not provide a title (e.g. estimated "*", instrument type "#" and quality control status "Provisional")
- Additional attributes (e.g. unit of measurement) for some columns are provided in line 7; therefore ... 
- The data does not begin until line 8
- A primary key for each row may be comprised from concatenating the values of `yyyy` and `mm`
- The observation values are attributable to the entire month
- The token `---` is used to indicate missing data
- Observation values are considered to be 'measured' unless further qualified with a "*" in the following column in which case they are considered to be estimated
- Values of sunshine duration are measured using a Campbell Stokes recorded unless qualified with a "#" in the following column in which case they are measured using an automatic Kipp & Zonen sensor - the difference in measurement instrument affects how the data values are interpreted
- Rows marked with "Provisional" in the final column are yet to pass through quality control assessment

<h2>Assessment of the data</h2>
Each row of this dataset provides a set of observation values, potentially with further qualification, for the month specified by the values in columns `yyyy` and `mm`. Because the temporal domain is consistent within each row, it is tempting to treat the entire row as pertaining to a single observation event - as defined in [Observations and Measurements][om] (O&M) or the [Semantic Sensor Network ontology][ssno] (SSN). 

However, this is not the case as each observation value will have been measured using a different measuring instrument and / or procedure. Therefore we must treat the row as a aggregated set of values - effectively this is a 'productized' view of the data containing the _values_ of the results of several discrete observation events.

[om]: http://www.opengeospatial.org/standards/om
[ssno]: http://www.w3.org/2005/Incubator/ssn/ssnx/ssn

For each observation value we know:
- the location - every observation value in this dataset is for Camborne ... in O&M and SSN this is termed `featureOfInterest`
- the quantity kind being measured ... in O&M and SSN this is termed `observedProperty`
- the unit of measurement
- the time for which the observation value is representative ... in O&M this is termed `phenomenonTime` and in SSN it is `observationSamplingTime`

O&M also provides a mechansim to capture data quality information - which would enable us to assert that a given result has been subject to a quality control process, albeit that we have no details of that process nor whether the 'raw' measured values were amended as the result of that assessment.

However, with the exception of the sunshine duration, we have no information on the provenance (lineage) of the observation values. We don't have information on the procedure used, the instrument used nor even the type of instrument.