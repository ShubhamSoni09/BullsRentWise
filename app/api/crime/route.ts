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
// OData fields: incident_type_primary, parent_incident_type, incident_description
function categorizeCrime(crime: any): { category: string; severity: number } {
  const type = (crime.incident_type_primary || crime.parent_incident_type || crime.incident_type || crime.crime_type || crime.type || '').toLowerCase();
  const description = (crime.incident_description || crime.description || crime.summary || '').toLowerCase();
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

// Fetch from CrimeoMeter API (requires API key)
async function fetchFromCrimeoMeter(lat: number, lng: number, radius: number) {
  const apiKey = process.env.CRIMEOMETER_API_KEY;
  if (!apiKey) return null;

  try {
    // CrimeoMeter API endpoint (check their docs for exact endpoint)
    const response = await fetch(
      `https://api.crimeometer.com/v1/incidents/raw-data?lat=${lat}&lon=${lng}&distance=${radius}&datetime_ini=2024-01-01T00:00:00.000Z&datetime_end=2024-12-31T23:59:59.999Z`,
      {
        headers: {
          'x-api-key': apiKey,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const incidents = data.incidents || [];

      const crimes = incidents.map((incident: any) => {
        const { category, severity } = categorizeCrime(incident);
        return {
          type: incident.incident_type || incident.type || 'Crime',
          description: incident.incident_description || incident.description || 'No description',
          date: incident.incident_date || incident.date || new Date().toISOString(),
          category,
          severity,
          lat: incident.latitude || incident.lat,
          lng: incident.longitude || incident.lng,
          distance: calculateDistance(lat, lng, incident.latitude || incident.lat, incident.longitude || incident.lng),
          id: incident.incident_id || incident.id,
        };
      });

      const stats = {
        total: crimes.length,
        violent: crimes.filter((c: any) => c.category === 'Violent').length,
        property: crimes.filter((c: any) => c.category === 'Property').length,
        drug: crimes.filter((c: any) => c.category === 'Drug').length,
        vandalism: crimes.filter((c: any) => c.category === 'Vandalism').length,
        other: crimes.filter((c: any) => c.category === 'Other').length,
        avgSeverity: crimes.length > 0 
          ? crimes.reduce((sum: number, c: any) => sum + c.severity, 0) / crimes.length 
          : 0,
      };

      return { crimes, stats, source: 'CrimeoMeter' };
    }
  } catch (error) {
    console.error('CrimeoMeter API error:', error);
  }
  return null;
}

// Buffalo Open Data OData API
async function fetchFromBuffaloOpenData(lat: number, lng: number, radius: number) {
  const DATASET_ID = process.env.BUFFALO_CRIME_DATASET_ID || 'd6g9-xbgu';
  const BASE_URL = 'https://data.buffalony.gov/api/odata/v4';

  try {
    const daysBack = 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Format dates for OData query (string comparison, no datetime function)
    const startDateStr = startDate.toISOString().replace('Z', '');
    const endDateStr = endDate.toISOString().replace('Z', '');

    // Build OData query
    // Field names: incident_datetime, incident_type_primary, parent_incident_type, latitude, longitude
    const filterClause = `incident_datetime ge '${startDateStr}' and incident_datetime le '${endDateStr}'`;
    const apiUrl = `${BASE_URL}/${DATASET_ID}?$filter=${encodeURIComponent(filterClause)}&$top=1000&$orderby=incident_datetime desc`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Buffalo Crime OData API returned ${response.status}: ${errorText.substring(0, 200)}`);
      return null;
    }

    const odataResponse = await response.json();
    // OData returns data in a "value" array
    const data: any[] = odataResponse.value || [];

    if (data.length === 0) {
      return null;
    }

    const crimes = data
      .map((crime: any) => {
        let crimeLat: number | null = null;
        let crimeLng: number | null = null;

        // Extract coordinates from OData response
        if (crime.latitude && crime.longitude) {
          crimeLat = parseFloat(crime.latitude);
          crimeLng = parseFloat(crime.longitude);
        } else if (crime.location && crime.location.coordinates) {
          // GeoJSON Point format: [lng, lat]
          crimeLng = parseFloat(crime.location.coordinates[0]);
          crimeLat = parseFloat(crime.location.coordinates[1]);
        }

        if (crimeLat && crimeLng) {
          const distance = calculateDistance(lat, lng, crimeLat, crimeLng);
          
          if (distance <= radius) {
            const { category, severity } = categorizeCrime(crime);
            
            return {
              type: crime.incident_type_primary || crime.parent_incident_type || 'Crime',
              description: crime.incident_description || 'No description',
              date: crime.incident_datetime || new Date().toISOString(),
              category,
              severity,
              lat: crimeLat,
              lng: crimeLng,
              distance: Math.round(distance),
              id: crime.case_number || crime.__id,
              address: crime.address_1 || null,
            };
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
      })
      .slice(0, 100);

    const stats = {
      total: crimes.length,
      violent: crimes.filter((c: any) => c.category === 'Violent').length,
      property: crimes.filter((c: any) => c.category === 'Property').length,
      drug: crimes.filter((c: any) => c.category === 'Drug').length,
      vandalism: crimes.filter((c: any) => c.category === 'Vandalism').length,
      other: crimes.filter((c: any) => c.category === 'Other').length,
      avgSeverity: crimes.length > 0 
        ? crimes.reduce((sum: number, c: any) => sum + c.severity, 0) / crimes.length 
        : 0,
    };

    return { crimes, stats, source: 'Buffalo Open Data' };
  } catch (error) {
    console.error('Buffalo Crime API error:', error);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 400 } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Try APIs in order
    let crimeData = null;

    // 1. Try Buffalo Open Data first (now has default dataset ID: d6g9-xbgu)
    crimeData = await fetchFromBuffaloOpenData(lat, lng, radius);

    // 2. Fallback to CrimeoMeter if Buffalo Open Data fails (requires API key)
    if (!crimeData && process.env.CRIMEOMETER_API_KEY) {
      crimeData = await fetchFromCrimeoMeter(lat, lng, radius);
    }

    if (crimeData) {
      return NextResponse.json({
        crimes: crimeData.crimes,
        stats: crimeData.stats,
        source: crimeData.source,
      });
    }

    // If all APIs fail, return empty data
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
      error: 'Crime data unavailable - check console for details',
    });
  } catch (error: any) {
    console.error('Crime API error:', error);
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
      error: 'Failed to fetch crime data',
    });
  }
}
