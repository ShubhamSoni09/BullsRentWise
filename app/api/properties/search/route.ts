import { NextRequest, NextResponse } from 'next/server';
import { fetchComplaintsForLocation, fetchWeatherForLocation, fetchCrimeForLocation } from '../search-helpers';

interface PropertySearchParams {
  preferences: {
    maxMonthlyBudget: number;
    preferredRentRange: { min: number; max: number };
    maxDistanceToUB: number;
    preferredNeighborhoods: string[];
    preferredRoommateCount: number;
    petFriendly: boolean;
  };
  location: {
    lat: number;
    lng: number;
  };
}

// UB North Campus coordinates
const UB_NORTH_CAMPUS = { lat: 43.0014, lng: -78.7861 };

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate sample properties based on preferences (in production, this would call real APIs)
async function searchPropertiesOnline(params: PropertySearchParams): Promise<any[]> {
  const { preferences, location } = params;
  
  // In a real implementation, you would:
  // 1. Call Zillow API (requires API key)
  // 2. Call Apartments.com API (requires API key)
  // 3. Call Rentals.com API (requires API key)
  // 4. Use web scraping (with proper rate limiting and legal compliance)
  // 5. Use Google Places API for rental listings
  
  // For now, we'll generate realistic sample properties based on preferences
  // and use geocoding to find addresses in Buffalo near UB
  
  const properties: any[] = [];
  
  // Common Buffalo neighborhoods near UB
  const neighborhoods = [
    'University Heights',
    'North Campus Area',
    'South Campus Area',
    'Elmwood Village',
    'Allentown',
    'Hertel Avenue',
    'Downtown Buffalo',
  ];

  // Generate sample properties based on preferences
  const sampleAddresses = [
    { address: '123 Winspear Ave, Buffalo, NY', neighborhood: 'University Heights', baseRent: preferences.preferredRentRange.min + 50 },
    { address: '456 Main St, Buffalo, NY', neighborhood: 'North Campus Area', baseRent: preferences.preferredRentRange.min + 100 },
    { address: '789 Elmwood Ave, Buffalo, NY', neighborhood: 'Elmwood Village', baseRent: preferences.preferredRentRange.min + 150 },
    { address: '321 Hertel Ave, Buffalo, NY', neighborhood: 'Hertel Avenue', baseRent: preferences.preferredRentRange.min + 80 },
    { address: '654 Delaware Ave, Buffalo, NY', neighborhood: 'Allentown', baseRent: preferences.preferredRentRange.min + 120 },
    { address: '987 University Ave, Buffalo, NY', neighborhood: 'University Heights', baseRent: preferences.preferredRentRange.min + 60 },
    { address: '147 Bailey Ave, Buffalo, NY', neighborhood: 'South Campus Area', baseRent: preferences.preferredRentRange.min + 40 },
    { address: '258 Kenmore Ave, Buffalo, NY', neighborhood: 'North Campus Area', baseRent: preferences.preferredRentRange.min + 90 },
  ];

  // Filter by preferences
  const filteredAddresses = sampleAddresses.filter(addr => {
    // Check if neighborhood matches preferences
    if (preferences.preferredNeighborhoods.length > 0) {
      if (!preferences.preferredNeighborhoods.some(n => 
        addr.neighborhood.toLowerCase().includes(n.toLowerCase()) ||
        n.toLowerCase().includes(addr.neighborhood.toLowerCase())
      )) {
        return false;
      }
    }
    
    // Check rent range
    const rent = addr.baseRent;
    if (rent < preferences.preferredRentRange.min || rent > preferences.preferredRentRange.max) {
      return false;
    }
    
    return true;
  });

  // Geocode and analyze each property
  for (const addr of filteredAddresses.slice(0, 10)) { // Limit to 10 for performance
    try {
      // Geocode address
      const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr.address)}&limit=1`, {
        headers: {
          'User-Agent': 'BullsRentWise/1.0',
        },
      });

      if (!geocodeRes.ok) continue;

      const geocodeData = await geocodeRes.json();
      if (geocodeData.length === 0) continue;

      const { lat, lon } = geocodeData[0];
      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), UB_NORTH_CAMPUS.lat, UB_NORTH_CAMPUS.lng);

      // Check distance
      if (distance > preferences.maxDistanceToUB) continue;

      // Fetch risk data for this property location
      const [complaints, weather, crimeData] = await Promise.all([
        fetchComplaintsForLocation(parseFloat(lat), parseFloat(lon), 800),
        fetchWeatherForLocation(parseFloat(lat), parseFloat(lon)),
        fetchCrimeForLocation(parseFloat(lat), parseFloat(lon), 800),
      ]);


      // Calculate risk score
      let riskScore = 0;
      const heatComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('heat') || c.description?.toLowerCase().includes('heat')
      ).length;
      const leakComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('leak') || c.description?.toLowerCase().includes('leak')
      ).length;
      const pestComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('pest') || c.description?.toLowerCase().includes('pest')
      ).length;

      riskScore += heatComplaints * 15;
      riskScore += leakComplaints * 20;
      riskScore += pestComplaints * 15;

      if (weather.avgHumidity > 70) riskScore += 10;
      if (weather.avgHumidity > 80) riskScore += 10;
      if (weather.totalPrecip > 0.5) riskScore += 15;
      if (weather.totalPrecip > 1.0) riskScore += 10;

      if (crimeData.stats) {
        riskScore += crimeData.stats.violent * 25;
        riskScore += crimeData.stats.property * 10;
        riskScore += crimeData.stats.drug * 8;
        riskScore += crimeData.stats.vandalism * 5;
        riskScore += crimeData.stats.other * 3;
        if (crimeData.stats.total > 10) riskScore += 10;
        if (crimeData.stats.total > 20) riskScore += 10;
      }

      riskScore = Math.min(100, riskScore);

      // Calculate per-person cost
      const utilities = 100; // Estimated
      const totalCost = addr.baseRent + utilities;
      const perPersonCost = preferences.preferredRoommateCount > 0
        ? totalCost / (preferences.preferredRoommateCount + 1)
        : totalCost;

      properties.push({
        address: addr.address,
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        riskScore,
        distance,
        estimatedRent: addr.baseRent,
        utilities,
        roommateCount: preferences.preferredRoommateCount,
        perPersonCost,
        neighborhood: addr.neighborhood,
        source: 'online',
        complaints: complaints.length,
        crimeStats: crimeData.stats,
        weather,
      });
    } catch (error) {
      console.error(`Error processing property ${addr.address}:`, error);
      continue;
    }
  }

  return properties;
}

export async function POST(request: NextRequest) {
  try {
    const { preferences, location }: PropertySearchParams = await request.json();

    if (!preferences || !location) {
      return NextResponse.json(
        { error: 'Preferences and location are required' },
        { status: 400 }
      );
    }

    // Search for properties online
    const properties = await searchPropertiesOnline({ preferences, location });

    return NextResponse.json({
      properties,
      count: properties.length,
      message: `Found ${properties.length} properties matching your preferences`,
    });
  } catch (error: any) {
    console.error('Property search error:', error);
    return NextResponse.json(
      { error: 'Failed to search properties', details: error.message },
      { status: 500 }
    );
  }
}

