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

// Categorize pest/mold complaints
function categorizeIssue(complaint: any): { type: 'mold' | 'pest' | 'cockroach' | 'rodent' | 'other'; severity: number } {
  const searchFields = [
    complaint.type,
    complaint.reason,
    complaint.subject,
    complaint.description,
  ]
    .filter(Boolean)
    .map((f) => f.toLowerCase());

  const searchText = searchFields.join(' ');

  // Mold issues (high severity - health risk)
  if (
    searchText.includes('mold') ||
    searchText.includes('mildew') ||
    searchText.includes('moisture') ||
    searchText.includes('water damage') ||
    searchText.includes('damp') ||
    searchText.includes('humidity') ||
    searchText.includes('flood')
  ) {
    return { type: 'mold', severity: 5 };
  }

  // Cockroach issues (high severity - health risk)
  if (
    searchText.includes('roach') ||
    searchText.includes('cockroach') ||
    searchText.includes('cockroaches')
  ) {
    return { type: 'cockroach', severity: 5 };
  }

  // Rodent issues (medium-high severity)
  if (
    searchText.includes('rodent') ||
    searchText.includes('mouse') ||
    searchText.includes('mice') ||
    searchText.includes('rat') ||
    searchText.includes('rats')
  ) {
    return { type: 'rodent', severity: 4 };
  }

  // Other pest issues
  if (
    searchText.includes('pest') ||
    searchText.includes('insect') ||
    searchText.includes('bug') ||
    searchText.includes('vermin') ||
    searchText.includes('ant') ||
    searchText.includes('bed bug') ||
    searchText.includes('flea') ||
    searchText.includes('termite')
  ) {
    return { type: 'pest', severity: 3 };
  }

  return { type: 'other', severity: 1 };
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 400 } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Buffalo Open Data Portal - OData v4 API
    // Dataset ID: whkc-e5vr (311 Service Requests)
    const DATASET_ID = process.env.BUFFALO_311_DATASET_ID || 'whkc-e5vr';
    const BASE_URL = 'https://data.buffalony.gov/api/odata/v4';

    // Calculate date range (last 90 days)
    const daysBack = 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Format dates for OData query
    const startDateStr = startDate.toISOString().replace('Z', '');
    const endDateStr = endDate.toISOString().replace('Z', '');

    try {
      // Build OData query - search for pest/mold related complaints
      const filterClause = `open_date ge '${startDateStr}' and open_date le '${endDateStr}'`;
      const apiUrl = `${BASE_URL}/${DATASET_ID}?$filter=${encodeURIComponent(filterClause)}&$top=2000&$orderby=open_date desc`;

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Buffalo 311 OData API returned ${response.status}: ${errorText.substring(0, 200)}`);
        return NextResponse.json({
          mold: [],
          pest: [],
          cockroach: [],
          rodent: [],
          stats: {
            total: 0,
            mold: 0,
            pest: 0,
            cockroach: 0,
            rodent: 0,
          },
        });
      }

      const odataResponse = await response.json();
      const data: any[] = odataResponse.value || [];

      // Filter for pest/mold related complaints within radius
      const issues = data
        .map((complaint: any) => {
          let complaintLat: number | null = null;
          let complaintLng: number | null = null;

          if (complaint.latitude && complaint.longitude) {
            complaintLat = parseFloat(complaint.latitude);
            complaintLng = parseFloat(complaint.longitude);
          } else if (complaint.location && complaint.location.coordinates) {
            complaintLng = parseFloat(complaint.location.coordinates[0]);
            complaintLat = parseFloat(complaint.location.coordinates[1]);
          }

          if (complaintLat && complaintLng) {
            const distance = calculateDistance(lat, lng, complaintLat, complaintLng);

            if (distance <= radius) {
              const { type, severity } = categorizeIssue(complaint);

              // Only include if it's a pest/mold related issue
              if (type !== 'other') {
                return {
                  type,
                  severity,
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
          }
          return null;
        })
        .filter((c: any) => c !== null)
        .sort((a: any, b: any) => {
          if (b.severity !== a.severity) {
            return b.severity - a.severity;
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

      // Group by type
      const mold = issues.filter((i: any) => i.type === 'mold');
      const pest = issues.filter((i: any) => i.type === 'pest');
      const cockroach = issues.filter((i: any) => i.type === 'cockroach');
      const rodent = issues.filter((i: any) => i.type === 'rodent');

      const stats = {
        total: issues.length,
        mold: mold.length,
        pest: pest.length,
        cockroach: cockroach.length,
        rodent: rodent.length,
      };

      return NextResponse.json({
        mold,
        pest,
        cockroach,
        rodent,
        stats,
      });
    } catch (apiError: any) {
      console.error('Error fetching pest/mold data:', apiError.message);
      return NextResponse.json({
        mold: [],
        pest: [],
        cockroach: [],
        rodent: [],
        stats: {
          total: 0,
          mold: 0,
          pest: 0,
          cockroach: 0,
          rodent: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Pest/Mold API error:', error);
    return NextResponse.json({
      mold: [],
      pest: [],
      cockroach: [],
      rodent: [],
      stats: {
        total: 0,
        mold: 0,
        pest: 0,
        cockroach: 0,
        rodent: 0,
      },
      error: 'Failed to fetch pest/mold data',
    });
  }
}

