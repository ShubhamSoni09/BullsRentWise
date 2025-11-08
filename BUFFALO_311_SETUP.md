# Buffalo 311 API Integration Setup Guide

## Finding the Buffalo 311 Dataset

1. **Visit Buffalo Open Data Portal:**
   - Go to: https://data.buffalony.gov
   - Search for "311" or "service requests" or "complaints"

2. **Find the Dataset ID:**
   - Once you find the 311 complaints dataset, look at the URL
   - The dataset ID is usually in the format: `xxxx-xxxx` or `xxxx_xxxx`
   - Example URL: `https://data.buffalony.gov/dataset/311-service-requests-xxxx-xxxx`
   - The dataset ID would be: `xxxx-xxxx`

3. **Check API Documentation:**
   - Look for "API" or "SODA API" link on the dataset page
   - This will show you the API endpoint and available fields

## Configuration

1. **Create/Update `.env.local` file:**
```env
# Buffalo 311 API Configuration
BUFFALO_311_DATASET_ID=your-dataset-id-here
BUFFALO_API_TOKEN=your-app-token-if-required
```

2. **Get Dataset ID:**
   - From the dataset page URL or API documentation
   - Example: If URL is `https://data.buffalony.gov/resource/abcd-1234.json`
   - Then `BUFFALO_311_DATASET_ID=abcd-1234`

3. **Get API Token (if required):**
   - Some Socrata datasets require an app token
   - Sign up at: https://dev.socrata.com/register
   - Create an app token
   - Add to `.env.local` as `BUFFALO_API_TOKEN`

## Common Field Names in Socrata Datasets

The code tries to handle various field name formats:
- **Coordinates:** `latitude`/`longitude`, `lat`/`lng`, `location`, `point`
- **Date:** `created_date`, `date_created`, `date`
- **Type:** `service_request_type`, `request_type`, `type`
- **Description:** `description`, `summary`, `subject`

## Testing

1. **Test with a known Buffalo address:**
   - Enter: "1 Niagara Square, Buffalo, NY"
   - Check if complaints appear on the map

2. **Check browser console:**
   - Look for any API errors
   - Check network tab for API calls

3. **Verify data format:**
   - If no complaints appear, the field names might be different
   - Check the actual API response format
   - Update the field mapping in `app/api/complaints/route.ts`

## Alternative: Using CSV Export

If the API doesn't work, you can:
1. Export the dataset as CSV from the portal
2. Host it somewhere (GitHub, S3, etc.)
3. Fetch and parse it in the API route
4. Filter by location and date

## Troubleshooting

**No complaints showing:**
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

