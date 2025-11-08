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

// Categorize crime by severity
function categorizeCrime(crime: any): { category: string; severity: number } {
  const type = (crime.incident_type || crime.crime_type || crime.type || crime.description || '').toLowerCase();
  const description = (crime.description || crime.summary || '').toLowerCase();
  const text = `${type} ${description}`;

  // Violent crimes (highest severity)
  if (
    text.includes('homicide') ||
    text.includes('murder') ||
    text.includes('assault') ||
    text.includes('robbery') ||
    text.includes('rape') ||
    text.includes('shooting') ||
    text.includes('gun') ||
    text.includes('weapon')
  ) {
    return { category: 'Violent', severity: 5 };
  }

  // Property crimes (medium-high severity)
  if (
    text.includes('burglary') ||
    text.includes('theft') ||
    text.includes('larceny') ||
    text.includes('stolen') ||
    text.includes('break-in') ||
    text.includes('breaking')
  ) {
    return { category: 'Property', severity: 3 };
  }

  // Drug-related (medium severity)
  if (
    text.includes('drug') ||
    text.includes('narcotic') ||
    text.includes('marijuana') ||
    text.includes('cocaine')
  ) {
    return { category: 'Drug', severity: 3 };
  }

  // Vandalism (low-medium severity)
  if (
    text.includes('vandalism') ||
    text.includes('graffiti') ||
    text.includes('damage to property')
  ) {
    return { category: 'Vandalism', severity: 2 };
  }

  // Other (low severity)
  return { category: 'Other', severity: 1 };
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 800 } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Buffalo Open Data Portal - Crime/Police Incident Data
    // Similar to 311 data, this uses Socrata SODA API
    const DATASET_ID = process.env.BUFFALO_CRIME_DATASET_ID || 'YOUR_CRIME_DATASET_ID_HERE';
    const BASE_URL = 'https://data.buffalony.gov/resource';
    
    // Calculate date range (last 90 days for recent crime)
    const daysBack = 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Format dates for Socrata query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build Socrata SODA query
    // Common date field names: incident_date, date_occurred, report_date, date
    const whereClause = `(incident_date >= '${startDateStr}T00:00:00' AND incident_date <= '${endDateStr}T23:59:59') OR (date_occurred >= '${startDateStr}T00:00:00' AND date_occurred <= '${endDateStr}T23:59:59') OR (report_date >= '${startDateStr}T00:00:00' AND report_date <= '${endDateStr}T23:59:59')`;
    
    let crimes: any[] = [];
    
    try {
      // Attempt to fetch from Socrata API
      const apiUrl = `${BASE_URL}/${DATASET_ID}.json?$limit=1000&$where=${encodeURIComponent(whereClause)}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'X-App-Token': process.env.BUFFALO_API_TOKEN || '',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        
        // Process and filter crimes
        crimes = data
          .map((crime: any) => {
            // Extract coordinates
            let crimeLat: number | null = null;
            let crimeLng: number | null = null;

            // Try different possible field names
            if (crime.latitude && crime.longitude) {
              crimeLat = parseFloat(crime.latitude);
              crimeLng = parseFloat(crime.longitude);
            } else if (crime.lat && crime.lng) {
              crimeLat = parseFloat(crime.lat);
              crimeLng = parseFloat(crime.lng);
            } else if (crime.location && crime.location.latitude && crime.location.longitude) {
              crimeLat = parseFloat(crime.location.latitude);
              crimeLng = parseFloat(crime.location.longitude);
            } else if (crime.point && crime.point.coordinates) {
              // GeoJSON format: [lng, lat]
              crimeLng = parseFloat(crime.point.coordinates[0]);
              crimeLat = parseFloat(crime.point.coordinates[1]);
            }

            // Only include if we have coordinates
            if (crimeLat && crimeLng) {
              const distance = calculateDistance(lat, lng, crimeLat, crimeLng);
              
              if (distance <= radius) {
                const { category, severity } = categorizeCrime(crime);
                
                return {
                  type: crime.incident_type || crime.crime_type || crime.type || 'Crime',
                  description: crime.description || crime.summary || 'No description',
                  date: crime.incident_date || crime.date_occurred || crime.report_date || crime.date || new Date().toISOString(),
                  category,
                  severity,
                  lat: crimeLat,
                  lng: crimeLng,
                  distance: Math.round(distance),
                  id: crime.incident_id || crime.id || crime.object_id,
                };
              }
            }
            return null;
          })
          .filter((c: any) => c !== null)
          .sort((a: any, b: any) => {
            // Sort by severity first, then by date
            if (b.severity !== a.severity) {
              return b.severity - a.severity;
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          })
          .slice(0, 100); // Limit to 100 most relevant

        // Calculate crime statistics
        const stats = {
          total: crimes.length,
          violent: crimes.filter((c) => c.category === 'Violent').length,
          property: crimes.filter((c) => c.category === 'Property').length,
          drug: crimes.filter((c) => c.category === 'Drug').length,
          vandalism: crimes.filter((c) => c.category === 'Vandalism').length,
          other: crimes.filter((c) => c.category === 'Other').length,
          avgSeverity: crimes.length > 0 
            ? crimes.reduce((sum, c) => sum + c.severity, 0) / crimes.length 
            : 0,
        };

        return NextResponse.json({
          crimes,
          stats,
        });
      } else {
        console.warn(`Buffalo Crime API returned status ${response.status}`);
        // Return empty data if API fails
        return NextResponse.json({
          crimes: [],
          stats: {
            total: 0,
            violent: 0,
            property: 0,
            drug: 0,
            vandalism: 0,
            other: 0,
            avgSeverity: 0,
          },
        });
      }
    } catch (apiError: any) {
      // If dataset ID is not set or API fails, return empty data
      if (DATASET_ID === 'YOUR_CRIME_DATASET_ID_HERE') {
        console.log('Buffalo Crime dataset ID not configured. Please set BUFFALO_CRIME_DATASET_ID in .env.local');
      } else {
        console.error('Error fetching from Buffalo Crime API:', apiError.message);
      }
      // Return empty data instead of failing
      return NextResponse.json({
        crimes: [],
        stats: {
          total: 0,
          violent: 0,
          property: 0,
          drug: 0,
          vandalism: 0,
          other: 0,
          avgSeverity: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Crime API error:', error);
    return NextResponse.json({ error: 'Failed to fetch crime data' }, { status: 500 });
  }
}

