# Crime Data Integration Setup Guide

## Finding the Buffalo Crime Dataset

1. **Visit Buffalo Open Data Portal:**
   - Go to: https://data.buffalony.gov
   - Search for "crime", "police", "incidents", or "arrests"

2. **Find the Dataset ID:**
   - Once you find the crime/police incident dataset, look at the URL
   - The dataset ID is usually in the format: `xxxx-xxxx` or `xxxx_xxxx`
   - Example URL: `https://data.buffalony.gov/dataset/police-incidents-xxxx-xxxx`
   - The dataset ID would be: `xxxx-xxxx`

3. **Check API Documentation:**
   - Look for "API" or "SODA API" link on the dataset page
   - This will show you the API endpoint and available fields

## Configuration

1. **Create/Update `.env.local` file:**
```env
# Buffalo Crime API Configuration
BUFFALO_CRIME_DATASET_ID=your-crime-dataset-id-here
BUFFALO_API_TOKEN=your-app-token-if-required
```

2. **Get Dataset ID:**
   - From the dataset page URL or API documentation
   - Example: If URL is `https://data.buffalony.gov/resource/abcd-1234.json`
   - Then `BUFFALO_CRIME_DATASET_ID=abcd-1234`

3. **Get API Token (if required):**
   - Some Socrata datasets require an app token
   - Sign up at: https://dev.socrata.com/register
   - Create an app token
   - Add to `.env.local` as `BUFFALO_API_TOKEN`

## Crime Categories

The app automatically categorizes crimes by severity:

- **Violent Crimes (Severity 5):** Homicide, murder, assault, robbery, rape, shooting, gun-related
- **Property Crimes (Severity 3):** Burglary, theft, larceny, break-ins
- **Drug Crimes (Severity 3):** Drug-related, narcotics, marijuana, cocaine
- **Vandalism (Severity 2):** Vandalism, graffiti, property damage
- **Other (Severity 1):** All other crimes

## Risk Score Impact

Crime data affects the risk score as follows:
- **Violent crimes:** +25 points each
- **Property crimes:** +10 points each
- **Drug crimes:** +8 points each
- **Vandalism:** +5 points each
- **Other crimes:** +3 points each
- **High crime density:** +10 points (if >10 crimes), +20 points (if >20 crimes)

## Common Field Names in Socrata Datasets

The code tries to handle various field name formats:
- **Coordinates:** `latitude`/`longitude`, `lat`/`lng`, `location`, `point`
- **Date:** `incident_date`, `date_occurred`, `report_date`, `date`
- **Type:** `incident_type`, `crime_type`, `type`
- **Description:** `description`, `summary`

## Testing

1. **Test with a known Buffalo address:**
   - Enter: "1 Niagara Square, Buffalo, NY"
   - Check if crime markers appear on the map
   - Verify crime statistics in the UI

2. **Check browser console:**
   - Look for any API errors
   - Check network tab for API calls

3. **Verify data format:**
   - If no crimes appear, the field names might be different
   - Check the actual API response format
   - Update the field mapping in `app/api/crime/route.ts`

## Troubleshooting

**No crimes showing:**
- Verify dataset ID is correct
- Check if API token is required
- Verify field names match the actual dataset
- Check date range (currently set to last 90 days)

**API errors:**
- Check rate limits (Socrata has limits)
- Verify coordinates are in the dataset
- Check if dataset is publicly accessible

**Location filtering not working:**
- Verify coordinates field names
- Check if coordinates are in correct format (decimal degrees)
- Verify radius calculation (currently 800m)

## Alternative Data Sources

If Buffalo's Open Data Portal doesn't have crime data, consider:
- **FBI UCR Data:** National crime statistics (less granular)
- **SpotCrime API:** Commercial crime data API (may require subscription)
- **Local police department APIs:** Some cities provide direct APIs

