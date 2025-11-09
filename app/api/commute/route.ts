import { NextRequest, NextResponse } from 'next/server';

// UB Campus coordinates
const UB_NORTH_CAMPUS = { lat: 43.0014, lng: -78.7861 };
const UB_SOUTH_CAMPUS = { lat: 42.9547, lng: -78.8203 };

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

// Calculate walkability score (0-100) based on distance to amenities and transit
function calculateWalkability(distanceToTransit: number, distanceToCampus: number, nearbyAmenities: number): number {
  let score = 50; // Base score
  
  // Transit proximity (max 30 points)
  if (distanceToTransit < 0.25) score += 30;
  else if (distanceToTransit < 0.5) score += 20;
  else if (distanceToTransit < 1.0) score += 10;
  
  // Campus proximity (max 20 points)
  if (distanceToCampus < 2) score += 20;
  else if (distanceToCampus < 5) score += 15;
  else if (distanceToCampus < 10) score += 10;
  
  // Nearby amenities (max 30 points)
  if (nearbyAmenities >= 10) score += 30;
  else if (nearbyAmenities >= 5) score += 20;
  else if (nearbyAmenities >= 3) score += 10;
  
  return Math.min(100, score);
}

// Calculate bike-friendliness score (0-100)
function calculateBikeFriendliness(distanceToCampus: number, hasBikeLanes: boolean = false): number {
  let score = 50; // Base score
  
  // Distance to campus (max 30 points)
  if (distanceToCampus < 3) score += 30;
  else if (distanceToCampus < 5) score += 20;
  else if (distanceToCampus < 10) score += 10;
  
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

    // Calculate distances to UB campuses
    const distanceToNorth = calculateDistance(lat, lng, UB_NORTH_CAMPUS.lat, UB_NORTH_CAMPUS.lng);
    const distanceToSouth = calculateDistance(lat, lng, UB_SOUTH_CAMPUS.lat, UB_SOUTH_CAMPUS.lng);
    const closestCampus = distanceToNorth < distanceToSouth ? 'North' : 'South';
    const closestDistance = Math.min(distanceToNorth, distanceToSouth);

    // Estimate transit distance (simplified - in real app, use NFTA API)
    // For now, assume transit is available if within 0.5 miles of major routes
    const distanceToTransit = closestDistance < 5 ? 0.3 : 0.8; // Simplified

    // Get nearby amenities count (will be calculated in amenities API)
    // For now, estimate based on distance to campus
    const nearbyAmenities = closestDistance < 2 ? 8 : closestDistance < 5 ? 5 : 3;

    // Calculate scores
    const walkabilityScore = calculateWalkability(distanceToTransit, closestDistance, nearbyAmenities);
    const bikeFriendlinessScore = calculateBikeFriendliness(closestDistance, closestDistance < 5);

    // Estimate commute times
    const commuteTimes = {
      walk: estimateCommuteTime(closestDistance, 'walk'),
      bike: estimateCommuteTime(closestDistance, 'bike'),
      drive: estimateCommuteTime(closestDistance, 'drive'),
      transit: estimateCommuteTime(closestDistance + distanceToTransit, 'transit') + 5, // Add wait time
    };

    // Transit routes (simplified - in real app, use NFTA API)
    // UB Stampede serves both campuses, so show routes to both if property is reasonably close
    const transitRoutes = [];
    
    // UB Stampede - available if within 5 miles of either campus
    if (closestDistance < 5) {
      // Show route to closest campus
      transitRoutes.push({
        name: 'UB Stampede',
        type: 'Shuttle',
        distance: distanceToTransit.toFixed(2),
        frequency: 'Every 10-15 min',
        toCampus: closestCampus,
      });
      
      // If property is reasonably close to both campuses (within 8 miles of both), show route to other campus too
      if (distanceToNorth < 8 && distanceToSouth < 8 && Math.abs(distanceToNorth - distanceToSouth) < 3) {
        const otherCampus = closestCampus === 'North' ? 'South' : 'North';
        transitRoutes.push({
          name: 'UB Stampede',
          type: 'Shuttle',
          distance: (distanceToTransit * 1.1).toFixed(2),
          frequency: 'Every 10-15 min',
          toCampus: otherCampus,
        });
      }
    }
    
    // NFTA Metro Bus - typically serves areas closer to campuses
    if (closestDistance < 3) {
      transitRoutes.push({
        name: 'NFTA Metro Bus',
        type: 'Bus',
        distance: (distanceToTransit * 0.8).toFixed(2),
        frequency: 'Every 20-30 min',
        toCampus: closestCampus,
      });
    }

    return NextResponse.json({
      campuses: {
        north: {
          distance: distanceToNorth.toFixed(2),
          distanceMiles: distanceToNorth,
        },
        south: {
          distance: distanceToSouth.toFixed(2),
          distanceMiles: distanceToSouth,
        },
        closest: closestCampus,
        closestDistance: closestDistance.toFixed(2),
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

