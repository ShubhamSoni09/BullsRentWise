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

const CATEGORY_QUERIES = {
  grocery: 'node["shop"~"supermarket|grocery"](around:RADIUS,LAT,LNG);way["shop"~"supermarket|grocery"](around:RADIUS,LAT,LNG);',
  restaurants: 'node["amenity"="restaurant"](around:RADIUS,LAT,LNG);way["amenity"="restaurant"](around:RADIUS,LAT,LNG);',
  cafes: 'node["amenity"="cafe"](around:RADIUS,LAT,LNG);way["amenity"="cafe"](around:RADIUS,LAT,LNG);',
  gyms: 'node["leisure"="fitness_centre"](around:RADIUS,LAT,LNG);way["leisure"="fitness_centre"](around:RADIUS,LAT,LNG);',
  parks: 'node["leisure"="park"](around:RADIUS,LAT,LNG);way["leisure"="park"](around:RADIUS,LAT,LNG);',
  libraries: 'node["amenity"="library"](around:RADIUS,LAT,LNG);way["amenity"="library"](around:RADIUS,LAT,LNG);',
  transit: 'node["public_transport"="platform"](around:RADIUS,LAT,LNG);node["highway"="bus_stop"](around:RADIUS,LAT,LNG);node["railway"="station"](around:RADIUS,LAT,LNG);',
};

type AmenityCategory = keyof typeof CATEGORY_QUERIES;

function elementCoordinates(element: any): { lat: number; lng: number } | null {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lng: element.lon };
  }

  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, radius = 5 } = await request.json(); // radius in miles

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const radiusMeters = Math.min(radius, 10) * 1609.34;
    const queryBody = Object.values(CATEGORY_QUERIES)
      .join('\n')
      .replaceAll('RADIUS', String(Math.round(radiusMeters)))
      .replaceAll('LAT', String(lat))
      .replaceAll('LNG', String(lng));

    const query = `[out:json][timeout:15];(${queryBody});out center tags 80;`;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(18000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API returned ${response.status}`);
    }

    const overpassData = await response.json();
    const amenities = Object.keys(CATEGORY_QUERIES).reduce((acc, category) => {
      acc[category as AmenityCategory] = [];
      return acc;
    }, {} as Record<AmenityCategory, Array<{ name: string; lat: number; lng: number; distance: number }>>);

    for (const element of overpassData.elements || []) {
      const coords = elementCoordinates(element);
      if (!coords) continue;

      const tags = element.tags || {};
      const category = Object.keys(CATEGORY_QUERIES).find((key) => {
        if (key === 'grocery') return /supermarket|grocery/.test(tags.shop || '');
        if (key === 'restaurants') return tags.amenity === 'restaurant';
        if (key === 'cafes') return tags.amenity === 'cafe';
        if (key === 'gyms') return tags.leisure === 'fitness_centre';
        if (key === 'parks') return tags.leisure === 'park';
        if (key === 'libraries') return tags.amenity === 'library';
        if (key === 'transit') return tags.public_transport === 'platform' || tags.highway === 'bus_stop' || tags.railway === 'station';
        return false;
      }) as AmenityCategory | undefined;

      if (!category) continue;

      amenities[category].push({
        name: tags.name || category.charAt(0).toUpperCase() + category.slice(1),
        lat: coords.lat,
        lng: coords.lng,
        distance: calculateDistance(lat, lng, coords.lat, coords.lng),
      });
    }

    Object.values(amenities).forEach((items) => {
      items.sort((a, b) => a.distance - b.distance);
      items.splice(10);
    });

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

