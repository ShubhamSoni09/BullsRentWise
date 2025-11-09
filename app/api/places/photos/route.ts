import { NextRequest, NextResponse } from 'next/server';

interface PhotoRequest {
  address: string;
  lat: number;
  lng: number;
}

export async function POST(request: NextRequest) {
  try {
    const { address, lat, lng }: PhotoRequest = await request.json();

    if (!address || !lat || !lng) {
      return NextResponse.json({ error: 'Address, lat, and lng are required' }, { status: 400 });
    }

    // Use unified Google API key (works for Places, Maps, Geocoding, etc.)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      // Return empty array if API key is not configured
      console.warn('Google API key not configured');
      return NextResponse.json({ photos: [], missingApiKey: true });
    }

    // Step 1: Find place by address/location using Places API Text Search
    const searchQuery = encodeURIComponent(address + ' Buffalo NY');
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Places API search error:', searchData.status);
      return NextResponse.json({ photos: [] });
    }

    let placeId: string | null = null;

    // If we found a place, use its place_id
    if (searchData.results && searchData.results.length > 0) {
      // Find the closest match by distance
      const results = searchData.results.map((place: any) => {
        const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
        return { ...place, distance };
      });
      
      results.sort((a: any, b: any) => a.distance - b.distance);
      placeId = results[0].place_id;
    } else {
      // If no exact match, try nearby search
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100&key=${apiKey}`;
      const nearbyResponse = await fetch(nearbyUrl);
      const nearbyData = await nearbyResponse.json();

      if (nearbyData.results && nearbyData.results.length > 0) {
        placeId = nearbyData.results[0].place_id;
      }
    }

    if (!placeId) {
      const streetViewPhotos = await getStreetViewPhotos(lat, lng, apiKey);
      return NextResponse.json({ photos: streetViewPhotos, streetViewFallback: !!streetViewPhotos.length });
    }

    // Step 2: Get place details including photos
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,name&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    let photos: any[] = [];

    if (detailsData.status === 'OK' && detailsData.result.photos) {
      // Step 3: Get photo URLs (max 10 photos)
      photos = detailsData.result.photos.slice(0, 10).map((photo: any, index: number) => {
        // Google Places Photo API requires photo_reference
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`;
        
        return {
          id: `google_${placeId}_${index}`,
          url: photoUrl,
          caption: photo.html_attributions?.[0] || '',
          date: new Date().toISOString(),
          source: 'google_places',
          width: photo.width,
          height: photo.height,
        };
      });
    }

    if (!photos.length) {
      photos = await getStreetViewPhotos(lat, lng, apiKey);
    }

    return NextResponse.json({
      photos,
      placeName: detailsData.result?.name || address,
      streetViewFallback: photos.length > 0 && photos[0].source === 'google_street_view',
    });
  } catch (error: any) {
    console.error('Places API error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos', photos: [] }, { status: 500 });
  }
}

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


async function getStreetViewPhotos(lat: number, lng: number, apiKey: string) {
  try {
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&source=outdoor&key=${apiKey}`;
    const metadataResponse = await fetch(metadataUrl);
    const metadata = await metadataResponse.json();

    if (metadata.status !== 'OK') {
      return [];
    }

    const panoId = metadata.pano_id;
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&pano=${panoId}&key=${apiKey}`;

    return [
      {
        id: `streetview_${panoId}`,
        url: streetViewUrl,
        caption: metadata.copyright ? `© ${metadata.copyright}` : 'Google Street View',
        date: new Date().toISOString(),
        source: 'google_street_view',
      },
    ];
  } catch (error) {
    console.error('Street View fallback error:', error);
    return [];
  }
}

