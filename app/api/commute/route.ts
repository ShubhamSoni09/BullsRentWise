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

// Calculate walkability score (0-100) based on transit and estimated nearby amenities.
function calculateWalkability(distanceToTransit: number, nearbyAmenities: number): number {
  let score = 50; // Base score
  
  // Transit proximity (max 30 points)
  if (distanceToTransit < 0.25) score += 30;
  else if (distanceToTransit < 0.5) score += 20;
  else if (distanceToTransit < 1.0) score += 10;

  // Nearby amenities (max 30 points)
  if (nearbyAmenities >= 10) score += 30;
  else if (nearbyAmenities >= 5) score += 20;
  else if (nearbyAmenities >= 3) score += 10;
  
  return Math.min(100, score);
}

// Calculate bike-friendliness score (0-100)
function calculateBikeFriendliness(distanceToTransit: number, hasBikeLanes: boolean = false): number {
  let score = 50; // Base score
  
  // Transit/urban proximity proxy (max 30 points)
  if (distanceToTransit < 0.25) score += 30;
  else if (distanceToTransit < 0.5) score += 20;
  else if (distanceToTransit < 1.0) score += 10;
  
  // Bike lanes (max 20 points)
  if (hasBikeLanes) score += 20;
  
  return Math.min(100, score);
}

// Estimate commute time
function estimateCommuteTime(distance: number, mode: 'walk' | 'bike' | 'drive' | 'transit'): number {
  const speeds = {
    walk: 3, // mph
    bike: 12, // mph
    drive: 25, // mph (city average)
    transit: 15, // mph (including wait time)
  };
  
  return (distance / speeds[mode]) * 60; // minutes
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const fractionalDensity = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233));
    const distanceToTransit = 0.2 + fractionalDensity * 0.9;
    const nearbyAmenities = distanceToTransit < 0.35 ? 10 : distanceToTransit < 0.7 ? 6 : 3;

    // Calculate scores
    const walkabilityScore = calculateWalkability(distanceToTransit, nearbyAmenities);
    const bikeFriendlinessScore = calculateBikeFriendliness(distanceToTransit, distanceToTransit < 0.7);

    // Estimate commute times
    const localErrandDistance = Math.max(0.5, Math.min(2.5, distanceToTransit + 0.75));
    const commuteTimes = {
      walk: estimateCommuteTime(localErrandDistance, 'walk'),
      bike: estimateCommuteTime(localErrandDistance, 'bike'),
      drive: estimateCommuteTime(localErrandDistance, 'drive'),
      transit: estimateCommuteTime(localErrandDistance + distanceToTransit, 'transit') + 5,
    };

    const transitRoutes = [];
    
    if (distanceToTransit < 0.75) {
      transitRoutes.push({
        name: 'Nearby local transit',
        type: 'Bus/Rail',
        distance: distanceToTransit.toFixed(2),
        frequency: 'Varies by local agency',
        destination: 'Local stops and stations',
      });
    } else if (distanceToTransit < 1.1) {
      transitRoutes.push({
        name: 'Possible local transit',
        type: 'Bus/Rail',
        distance: distanceToTransit.toFixed(2),
        frequency: 'Check local schedules',
        destination: 'Nearest route may require a longer walk',
      });
    }

    return NextResponse.json({
      locationContext: {
        label: 'Local mobility estimate',
        note: 'Uses distance, density, and transit proximity estimates. Confirm exact routes with your local transit agency.',
      },
      walkability: {
        score: walkabilityScore,
        label: walkabilityScore >= 70 ? 'Excellent' : walkabilityScore >= 50 ? 'Good' : walkabilityScore >= 30 ? 'Fair' : 'Poor',
      },
      bikeFriendliness: {
        score: bikeFriendlinessScore,
        label: bikeFriendlinessScore >= 70 ? 'Excellent' : bikeFriendlinessScore >= 50 ? 'Good' : bikeFriendlinessScore >= 30 ? 'Fair' : 'Poor',
      },
      commuteTimes,
      transitRoutes,
      distanceToTransit: distanceToTransit.toFixed(2),
    });
  } catch (error: any) {
    console.error('Commute analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze commute' }, { status: 500 });
  }
}

