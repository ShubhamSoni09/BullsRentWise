import { NextRequest, NextResponse } from 'next/server';

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Filter complaints by keywords (heat, leak, pest)
function matchesComplaintType(complaint: any): boolean {
  const searchFields = [
    complaint.service_request_type,
    complaint.request_type,
    complaint.type,
    complaint.description,
    complaint.summary,
    complaint.subject,
  ]
    .filter(Boolean)
    .map((f) => f.toLowerCase());

  const searchText = searchFields.join(' ');

  return (
    searchText.includes('heat') ||
    searchText.includes('heating') ||
    searchText.includes('no heat') ||
    searchText.includes('leak') ||
    searchText.includes('leaking') ||
    searchText.includes('water leak') ||
    searchText.includes('pest') ||
    searchText.includes('rodent') ||
    searchText.includes('roach') ||
    searchText.includes('insect') ||
    searchText.includes('vermin')
  );
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 800 } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Buffalo Open Data Portal - Socrata SODA API
    // You may need to find the actual dataset ID from https://data.buffalony.gov
    // Common dataset IDs for 311 data: often something like "xxxx-xxxx" or "xxxx_xxxx"
    const DATASET_ID = process.env.BUFFALO_311_DATASET_ID || 'YOUR_DATASET_ID_HERE';
    const BASE_URL = 'https://data.buffalony.gov/resource';
    
    // Calculate date range (last 90 days)
    const daysBack = 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Format dates for Socrata query (YYYY-MM-DD format)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build Socrata SODA query
    // Note: Socrata uses $where for filtering, but location filtering requires special handling
    // We'll fetch recent complaints and filter by distance client-side
    const whereClause = `created_date >= '${startDateStr}T00:00:00' AND created_date <= '${endDateStr}T23:59:59'`;
    
    // Try to fetch from Buffalo Open Data API
    let complaints: any[] = [];
    
    try {
      // Attempt to fetch from Socrata API
      // Common field names: latitude/longitude, lat/lng, location, point
      const apiUrl = `${BASE_URL}/${DATASET_ID}.json?$limit=1000&$where=${encodeURIComponent(whereClause)}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'X-App-Token': process.env.BUFFALO_API_TOKEN || '', // Optional, some datasets require it
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        
        // Process and filter complaints
        complaints = data
          .map((complaint: any) => {
            // Extract coordinates - Socrata may store them in different formats
            let complaintLat: number | null = null;
            let complaintLng: number | null = null;

            // Try different possible field names
            if (complaint.latitude && complaint.longitude) {
              complaintLat = parseFloat(complaint.latitude);
              complaintLng = parseFloat(complaint.longitude);
            } else if (complaint.lat && complaint.lng) {
              complaintLat = parseFloat(complaint.lat);
              complaintLng = parseFloat(complaint.lng);
            } else if (complaint.location && complaint.location.latitude && complaint.location.longitude) {
              complaintLat = parseFloat(complaint.location.latitude);
              complaintLng = parseFloat(complaint.location.longitude);
            } else if (complaint.point && complaint.point.coordinates) {
              // GeoJSON format: [lng, lat]
              complaintLng = parseFloat(complaint.point.coordinates[0]);
              complaintLat = parseFloat(complaint.point.coordinates[1]);
            }

            // Only include if we have coordinates and it matches our criteria
            if (complaintLat && complaintLng) {
              const distance = calculateDistance(lat, lng, complaintLat, complaintLng);
              
              if (distance <= radius && matchesComplaintType(complaint)) {
                return {
                  type: complaint.service_request_type || complaint.request_type || complaint.type || 'Complaint',
                  description: complaint.description || complaint.summary || complaint.subject || 'No description',
                  date: complaint.created_date || complaint.date_created || complaint.date || new Date().toISOString(),
                  status: complaint.status || 'Unknown',
                  lat: complaintLat,
                  lng: complaintLng,
                  distance: Math.round(distance),
                  id: complaint.service_request_id || complaint.id || complaint.object_id,
                };
              }
            }
            return null;
          })
          .filter((c: any) => c !== null)
          .sort((a: any, b: any) => {
            // Sort by date (most recent first)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          })
          .slice(0, 50); // Limit to 50 most recent
      } else {
        console.warn(`Buffalo 311 API returned status ${response.status}`);
        // If API fails, return empty array (graceful degradation)
        return NextResponse.json([]);
      }
    } catch (apiError: any) {
      // If dataset ID is not set or API fails, return empty array
      if (DATASET_ID === 'YOUR_DATASET_ID_HERE') {
        console.log('Buffalo 311 dataset ID not configured. Please set BUFFALO_311_DATASET_ID in .env.local');
      } else {
        console.error('Error fetching from Buffalo 311 API:', apiError.message);
      }
      // Return empty array instead of failing
      return NextResponse.json([]);
    }

    return NextResponse.json(complaints);
  } catch (error: any) {
    console.error('Complaints API error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

