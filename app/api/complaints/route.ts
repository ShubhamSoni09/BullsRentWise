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

function isInBuffaloArea(lat: number, lng: number): boolean {
  const buffaloCityHall = { lat: 42.8864, lng: -78.8784 };
  return calculateDistance(lat, lng, buffaloCityHall.lat, buffaloCityHall.lng) <= 35000;
}

// Filter complaints by keywords (heat, leak, pest, mold, cockroach)
// OData fields: type, reason, subject
function matchesComplaintType(complaint: any): boolean {
  const searchFields = [
    complaint.type,
    complaint.reason,
    complaint.subject,
    complaint.description,
  ]
    .filter(Boolean)
    .map((f) => f.toLowerCase());

  const searchText = searchFields.join(' ');

  return (
    // Heating issues
    searchText.includes('heat') ||
    searchText.includes('heating') ||
    searchText.includes('no heat') ||
    searchText.includes('furnace') ||
    // Water/leak issues
    searchText.includes('leak') ||
    searchText.includes('leaking') ||
    searchText.includes('water leak') ||
    searchText.includes('plumbing') ||
    searchText.includes('pipe') ||
    // Pest issues
    searchText.includes('pest') ||
    searchText.includes('rodent') ||
    searchText.includes('mouse') ||
    searchText.includes('mice') ||
    searchText.includes('rat') ||
    searchText.includes('rats') ||
    searchText.includes('roach') ||
    searchText.includes('cockroach') ||
    searchText.includes('cockroaches') ||
    searchText.includes('insect') ||
    searchText.includes('bug') ||
    searchText.includes('bugs') ||
    searchText.includes('vermin') ||
    searchText.includes('ant') ||
    searchText.includes('ants') ||
    searchText.includes('bed bug') ||
    searchText.includes('bedbug') ||
    searchText.includes('flea') ||
    searchText.includes('termite') ||
    // Mold/moisture issues
    searchText.includes('mold') ||
    searchText.includes('mildew') ||
    searchText.includes('moisture') ||
    searchText.includes('water damage') ||
    searchText.includes('damp') ||
    searchText.includes('humidity') ||
    searchText.includes('flood') ||
    searchText.includes('water intrusion') ||
    // Housing violations that might indicate these issues
    searchText.includes('housing violation') ||
    searchText.includes('code violation') ||
    searchText.includes('health violation') ||
    searchText.includes('unsanitary') ||
    searchText.includes('infestation')
  );
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 400 } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    if (!isInBuffaloArea(lat, lng)) {
      return NextResponse.json([]);
    }

    // Buffalo Open Data Portal - OData v4 API
    // Dataset ID: whkc-e5vr (311 Service Requests)
    // API endpoint: https://data.buffalony.gov/api/odata/v4/whkc-e5vr
    const DATASET_ID = process.env.BUFFALO_311_DATASET_ID || 'whkc-e5vr';
    const BASE_URL = 'https://data.buffalony.gov/api/odata/v4';
    
    // Calculate date range (last 90 days)
    const daysBack = 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Format dates for OData query
    // The API expects dates in format: 'YYYY-MM-DDTHH:mm:ss.fff' or 'YYYY-MM-DDTHH:mm:ssZ'
    const startDateStr = startDate.toISOString().replace('Z', '');
    const endDateStr = endDate.toISOString().replace('Z', '');
    
    try {
      // Build OData query
      // OData uses $filter for filtering and $top for limiting
      // Field names from the API: open_date, latitude, longitude, type, reason, subject
      // Note: This OData endpoint doesn't support datetime() function, use string comparison
      const filterClause = `open_date ge '${startDateStr}' and open_date le '${endDateStr}'`;
      const apiUrl = `${BASE_URL}/${DATASET_ID}?$filter=${encodeURIComponent(filterClause)}&$top=1000&$orderby=open_date desc`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for OData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Buffalo 311 OData API returned ${response.status}: ${errorText.substring(0, 200)}`);
        return NextResponse.json([]);
      }

      const odataResponse = await response.json();
      // OData returns data in a "value" array
      const data: any[] = odataResponse.value || [];

      if (data.length > 0) {
        // Process and filter complaints
        const complaints = data
          .map((complaint: any) => {
            // Extract coordinates from OData response
            // OData has: latitude, longitude, and location (GeoJSON Point)
            let complaintLat: number | null = null;
            let complaintLng: number | null = null;

            if (complaint.latitude && complaint.longitude) {
              complaintLat = parseFloat(complaint.latitude);
              complaintLng = parseFloat(complaint.longitude);
            } else if (complaint.location && complaint.location.coordinates) {
              // GeoJSON Point format: [lng, lat]
              complaintLng = parseFloat(complaint.location.coordinates[0]);
              complaintLat = parseFloat(complaint.location.coordinates[1]);
            }

            // Only include if we have coordinates and it matches our criteria
            if (complaintLat && complaintLng) {
              const distance = calculateDistance(lat, lng, complaintLat, complaintLng);
              
              if (distance <= radius && matchesComplaintType(complaint)) {
                return {
                  type: complaint.type || complaint.reason || 'Complaint',
                  description: complaint.reason || complaint.subject || complaint.type || 'No description',
                  date: complaint.open_date || new Date().toISOString(),
                  status: complaint.status || 'Unknown',
                  lat: complaintLat,
                  lng: complaintLng,
                  distance: Math.round(distance),
                  id: complaint.case_reference || complaint.__id,
                  address: complaint.address_line_1 ? `${complaint.address_number || ''} ${complaint.address_line_1}`.trim() : null,
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
        
        return NextResponse.json(complaints);
      } else {
        return NextResponse.json([]);
      }
    } catch (apiError: any) {
      console.error('Error fetching from Buffalo 311 API:', apiError.message);
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('Complaints API error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

