import { NextRequest, NextResponse } from 'next/server';

// Haversine formula to calculate distance in miles
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Known locations in Buffalo (simplified - in production, use Google Places API or similar)
const KNOWN_AMENITIES = {
  grocery: [
    { name: 'Wegmans', lat: 43.0014, lng: -78.7861 },
    { name: 'Tops Friendly Markets', lat: 42.9547, lng: -78.8203 },
    { name: 'Aldi', lat: 42.9800, lng: -78.8000 },
    { name: 'Target', lat: 43.0100, lng: -78.7900 },
  ],
  restaurants: [
    { name: 'Anchor Bar', lat: 42.9000, lng: -78.8700 },
    { name: 'Duff\'s Famous Wings', lat: 42.9200, lng: -78.8500 },
    { name: 'Mighty Taco', lat: 43.0000, lng: -78.7800 },
    { name: 'Jim\'s Steakout', lat: 42.9500, lng: -78.8300 },
  ],
  cafes: [
    { name: 'Starbucks', lat: 43.0014, lng: -78.7861 },
    { name: 'Tim Hortons', lat: 42.9547, lng: -78.8203 },
    { name: 'Spot Coffee', lat: 42.9800, lng: -78.8000 },
  ],
  gyms: [
    { name: 'Planet Fitness', lat: 43.0000, lng: -78.7800 },
    { name: 'LA Fitness', lat: 42.9500, lng: -78.8300 },
    { name: 'YMCA', lat: 42.9200, lng: -78.8500 },
  ],
  parks: [
    { name: 'Delaware Park', lat: 42.9300, lng: -78.8600 },
    { name: 'Cazenovia Park', lat: 42.8500, lng: -78.8200 },
    { name: 'Riverside Park', lat: 42.9600, lng: -78.9000 },
  ],
  libraries: [
    { name: 'Buffalo Central Library', lat: 42.9000, lng: -78.8700 },
    { name: 'UB Libraries', lat: 43.0014, lng: -78.7861 },
  ],
  transit: [
    { name: 'Metro Station - University', lat: 43.0014, lng: -78.7861 },
    { name: 'Metro Station - South Campus', lat: 42.9547, lng: -78.8203 },
    { name: 'Bus Stop - Main Street', lat: 42.9000, lng: -78.8700 },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 5 } = await request.json(); // radius in miles

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Find nearby amenities within radius
    const findNearby = (category: keyof typeof KNOWN_AMENITIES) => {
      return KNOWN_AMENITIES[category]
        .map(amenity => ({
          ...amenity,
          distance: calculateDistance(lat, lng, amenity.lat, amenity.lng),
        }))
        .filter(amenity => amenity.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Limit to 10 closest
    };

    const amenities = {
      grocery: findNearby('grocery'),
      restaurants: findNearby('restaurants'),
      cafes: findNearby('cafes'),
      gyms: findNearby('gyms'),
      parks: findNearby('parks'),
      libraries: findNearby('libraries'),
      transit: findNearby('transit'),
    };

    // Calculate summary stats
    const totalAmenities = Object.values(amenities).reduce((sum, arr) => sum + arr.length, 0);
    const closestAmenity = Object.values(amenities)
      .flat()
      .sort((a, b) => a.distance - b.distance)[0];

    return NextResponse.json({
      amenities,
      summary: {
        total: totalAmenities,
        closest: closestAmenity ? {
          name: closestAmenity.name,
          distance: closestAmenity.distance.toFixed(2),
          category: Object.keys(amenities).find(key => 
            amenities[key as keyof typeof amenities].some(a => a.name === closestAmenity.name)
          ),
        } : null,
        byCategory: {
          grocery: amenities.grocery.length,
          restaurants: amenities.restaurants.length,
          cafes: amenities.cafes.length,
          gyms: amenities.gyms.length,
          parks: amenities.parks.length,
          libraries: amenities.libraries.length,
          transit: amenities.transit.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Amenities search error:', error);
    return NextResponse.json({ error: 'Failed to find amenities' }, { status: 500 });
  }
}

