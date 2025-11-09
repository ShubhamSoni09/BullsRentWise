import { NextRequest, NextResponse } from 'next/server';

interface PropertyData {
  address: string;
  riskScore: number;
  lat?: number;
  lng?: number;
  budget?: {
    estimatedRent: number;
    utilities: number;
    roommateCount: number;
    monthlyBudget?: number;
  };
  complaints?: any[];
  crime?: {
    stats: {
      total: number;
      violent: number;
      property: number;
    };
  };
  weather?: any;
  source?: string;
}

interface UserPreferences {
  maxMonthlyBudget: number;
  preferredRentRange: { min: number; max: number };
  riskTolerance: 'low' | 'medium' | 'high';
  preferredNeighborhoods: string[];
  maxDistanceToUB: number;
  publicTransportRequired: boolean;
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  preferredRoommateCount: number;
  petFriendly: boolean;
  priorities: {
    budget: number;
    safety: number;
    location: number;
    features: number;
  };
}

interface Recommendation {
  address: string;
  matchScore: number; // 0-100
  reasons: string[];
  strengths: string[];
  concerns: string[];
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  riskScore: number;
  estimatedCost?: number;
  source?: string;
}

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

// UB North Campus coordinates (approximate)
const UB_NORTH_CAMPUS = { lat: 43.0014, lng: -78.7861 };

// Calculate match score for a property
function calculateMatchScore(property: PropertyData, preferences: UserPreferences): Recommendation {
  let matchScore = 0;
  const reasons: string[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Budget matching (weighted by priority)
  if (property.budget) {
    const totalCost = property.budget.estimatedRent + (property.budget.utilities || 0);
    const perPersonCost = property.budget.roommateCount > 0
      ? totalCost / (property.budget.roommateCount + 1)
      : totalCost;

    if (perPersonCost <= preferences.maxMonthlyBudget) {
      const budgetScore = Math.min(100, (preferences.maxMonthlyBudget / perPersonCost) * 100);
      matchScore += (budgetScore / 100) * 30 * (preferences.priorities.budget / 5);
      strengths.push(`Within budget at $${perPersonCost.toFixed(0)}/person`);
    } else {
      const overBudget = perPersonCost - preferences.maxMonthlyBudget;
      matchScore -= (overBudget / preferences.maxMonthlyBudget) * 20 * (preferences.priorities.budget / 5);
      concerns.push(`Over budget by $${overBudget.toFixed(0)}/month`);
    }

    // Check rent range
    if (property.budget.estimatedRent >= preferences.preferredRentRange.min &&
        property.budget.estimatedRent <= preferences.preferredRentRange.max) {
      matchScore += 10 * (preferences.priorities.budget / 5);
      reasons.push('Rent is within preferred range');
    }
  }

  // Risk tolerance matching (weighted by safety priority)
  const riskWeight = preferences.priorities.safety / 5;
  if (preferences.riskTolerance === 'low' && property.riskScore < 30) {
    matchScore += 25 * riskWeight;
    strengths.push('Low risk score matches your safety preferences');
  } else if (preferences.riskTolerance === 'medium' && property.riskScore < 60) {
    matchScore += 20 * riskWeight;
    reasons.push('Medium risk score acceptable for your tolerance');
  } else if (preferences.riskTolerance === 'high') {
    matchScore += 15 * riskWeight;
    reasons.push('Risk score acceptable for high tolerance');
  } else {
    matchScore -= (property.riskScore / 100) * 15 * riskWeight;
    concerns.push(`Risk score of ${property.riskScore} may be too high for your tolerance`);
  }

  // Location matching (weighted by location priority)
  if (property.lat && property.lng) {
    const distance = calculateDistance(property.lat, property.lng, UB_NORTH_CAMPUS.lat, UB_NORTH_CAMPUS.lng);
    if (distance <= preferences.maxDistanceToUB) {
      const locationScore = (1 - distance / preferences.maxDistanceToUB) * 100;
      matchScore += (locationScore / 100) * 20 * (preferences.priorities.location / 5);
      strengths.push(`${distance.toFixed(1)} miles from UB - within your range`);
    } else {
      matchScore -= ((distance - preferences.maxDistanceToUB) / preferences.maxDistanceToUB) * 15 * (preferences.priorities.location / 5);
      concerns.push(`${distance.toFixed(1)} miles from UB - exceeds your preferred distance`);
    }
  }

  // Roommate count matching
  if (property.budget) {
    const roommateDiff = Math.abs(property.budget.roommateCount - preferences.preferredRoommateCount);
    if (roommateDiff === 0) {
      matchScore += 10;
      strengths.push('Roommate count matches your preference');
    } else if (roommateDiff <= 1) {
      matchScore += 5;
      reasons.push('Roommate count close to your preference');
    }
  }

  // Crime data analysis
  if (property.crime) {
    const crimeScore = property.crime.stats.violent * 2 + property.crime.stats.property;
    if (crimeScore === 0) {
      matchScore += 10 * riskWeight;
      strengths.push('No reported crimes in the area');
    } else if (crimeScore <= 3) {
      matchScore += 5 * riskWeight;
      reasons.push('Low crime rate in the area');
    } else {
      matchScore -= (crimeScore / 10) * 10 * riskWeight;
      concerns.push(`Higher crime rate: ${property.crime.stats.violent} violent, ${property.crime.stats.property} property crimes`);
    }
  }

  // Weather risk
  if (property.weather) {
    if (property.weather.avgHumidity > 75) {
      matchScore -= 5 * riskWeight;
      concerns.push('High humidity may increase mold risk');
    }
    if (property.weather.totalPrecip > 1.0) {
      matchScore -= 5 * riskWeight;
      concerns.push('High precipitation may indicate water damage risk');
    }
  }

  // Normalize match score to 0-100
  matchScore = Math.max(0, Math.min(100, matchScore));

  // Determine suitability
  let suitability: 'excellent' | 'good' | 'fair' | 'poor';
  if (matchScore >= 80) suitability = 'excellent';
  else if (matchScore >= 60) suitability = 'good';
  else if (matchScore >= 40) suitability = 'fair';
  else suitability = 'poor';

  return {
    address: property.address,
    matchScore: Math.round(matchScore),
    reasons,
    strengths,
    concerns,
    suitability,
    riskScore: property.riskScore,
    estimatedCost: property.budget
      ? (property.budget.estimatedRent + (property.budget.utilities || 0)) / 
        (property.budget.roommateCount > 0 ? property.budget.roommateCount + 1 : 1)
      : undefined,
    source: property.source,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { properties, preferences, useAI }: {
      properties: PropertyData[];
      preferences: UserPreferences;
      useAI?: boolean;
    } = await request.json();

    if (!properties || !preferences) {
      return NextResponse.json(
        { error: 'Properties and preferences are required' },
        { status: 400 }
      );
    }

    // Calculate match scores for all properties
    const recommendations = properties.map(property =>
      calculateMatchScore(property, preferences)
    );

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // If OpenAI API key is available and useAI is true, enhance with AI analysis
    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a housing advisor helping a UB student find the best rental property. 
                Analyze the properties and provide personalized recommendations based on their preferences.`,
              },
              {
                role: 'user',
                content: `User Preferences:
- Budget: $${preferences.maxMonthlyBudget}/month
- Risk Tolerance: ${preferences.riskTolerance}
- Max Distance to UB: ${preferences.maxDistanceToUB} miles
- Must Have Features: ${preferences.mustHaveFeatures.join(', ') || 'None'}
- Priorities: Budget(${preferences.priorities.budget}/5), Safety(${preferences.priorities.safety}/5), Location(${preferences.priorities.location}/5), Features(${preferences.priorities.features}/5)

Properties:
${recommendations.slice(0, 5).map((rec, idx) => `
${idx + 1}. ${rec.address}
   - Match Score: ${rec.matchScore}/100
   - Risk Score: ${rec.riskScore}/100
   - Estimated Cost: $${rec.estimatedCost?.toFixed(0) || 'N/A'}/person
   - Strengths: ${rec.strengths.join(', ')}
   - Concerns: ${rec.concerns.join(', ')}
`).join('\n')}

Provide a brief personalized recommendation for the top 3 properties, explaining why each might be a good fit.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (openaiResponse.ok) {
          const aiData = await openaiResponse.json();
          const aiAnalysis = aiData.choices[0]?.message?.content;

          // Add AI insights to top recommendations
          if (aiAnalysis) {
            recommendations[0].reasons.push(`AI Insight: ${aiAnalysis.split('\n')[0]}`);
          }
        }
      } catch (aiError) {
        console.error('AI enhancement error:', aiError);
        // Continue without AI enhancement
      }
    }

    const onlineCount = properties.filter((p: any) => p.source === 'online').length;
    
    return NextResponse.json({
      recommendations: recommendations.slice(0, 10), // Return top 10
      summary: {
        totalProperties: properties.length,
        onlineCount,
        excellentMatches: recommendations.filter(r => r.suitability === 'excellent').length,
        goodMatches: recommendations.filter(r => r.suitability === 'good').length,
        averageMatchScore: Math.round(
          recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length
        ),
      },
    });
  } catch (error: any) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

