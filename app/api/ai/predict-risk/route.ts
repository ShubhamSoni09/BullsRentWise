import { NextRequest, NextResponse } from 'next/server';

// ML-based risk prediction using pattern analysis
// This uses statistical models to predict future risk based on historical patterns

interface PredictionInput {
  currentRiskScore: number;
  complaints: any[];
  crimeStats: any;
  weather: any;
  historicalData?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { currentRiskScore, complaints, crimeStats, weather, historicalData }: PredictionInput = await request.json();

    // Feature extraction for ML model
    const features = {
      complaintCount: complaints.length,
      heatComplaints: complaints.filter(c => c.type?.toLowerCase().includes('heat')).length,
      leakComplaints: complaints.filter(c => c.type?.toLowerCase().includes('leak')).length,
      pestComplaints: complaints.filter(c => c.type?.toLowerCase().includes('pest')).length,
      violentCrimes: crimeStats?.violent || 0,
      propertyCrimes: crimeStats?.property || 0,
      totalCrimes: crimeStats?.total || 0,
      avgHumidity: weather?.avgHumidity || 0,
      totalPrecip: weather?.totalPrecip || 0,
      currentMonth: new Date().getMonth(), // 0-11, for seasonal patterns
    };

    // Simple ML prediction model (can be enhanced with actual training)
    const next30Days = predictRisk(features, 30);
    const next90Days = predictRisk(features, 90);
    
    // Calculate single predicted score (weighted average: 60% 30-day, 40% 90-day)
    const predictedScore = Math.round(next30Days * 0.6 + next90Days * 0.4);
    
    const predictions = {
      // Single predicted score (primary)
      predictedScore,
      // Keep individual predictions for reference
      next30Days,
      next90Days,
      // Predict seasonal risk (winter heating issues)
      seasonalRisk: predictSeasonalRisk(features),
      // Predict trend (improving/worsening)
      trend: predictTrend(currentRiskScore, features),
      // Key risk factors
      keyRiskFactors: identifyRiskFactors(features),
    };

    return NextResponse.json(predictions);
  } catch (error: any) {
    console.error('Prediction error:', error);
    return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 });
  }
}

// ML prediction function (simplified - can be enhanced with actual trained model)
function predictRisk(features: any, days: number): number {
  let riskScore = 0;

  // Base risk from current factors
  riskScore += features.complaintCount * 2;
  riskScore += features.heatComplaints * 3;
  riskScore += features.leakComplaints * 4;
  riskScore += features.pestComplaints * 2;
  riskScore += features.violentCrimes * 5;
  riskScore += features.propertyCrimes * 2;

  // Weather-based predictions
  if (features.avgHumidity > 70) {
    riskScore += 5; // Higher mold risk
  }
  if (features.totalPrecip > 0.5) {
    riskScore += 3; // Water damage risk
  }

  // Seasonal adjustments
  if (features.currentMonth >= 10 || features.currentMonth <= 2) {
    // Winter months - higher heating complaint risk
    riskScore += features.heatComplaints * 2;
  }

  // Time decay (risk decreases over time if no new issues)
  const decayFactor = Math.max(0.7, 1 - (days / 365));
  riskScore *= decayFactor;

  return Math.min(100, Math.round(riskScore));
}

function predictSeasonalRisk(features: any): { season: string; risk: number; factors: string[] } {
  const month = features.currentMonth;
  let season = '';
  let risk = 0;
  const factors: string[] = [];

  if (month >= 11 || month <= 2) {
    season = 'Winter';
    risk = features.heatComplaints > 0 ? 40 : 20;
    if (features.heatComplaints > 0) factors.push('Heating issues likely in winter');
  } else if (month >= 3 && month <= 5) {
    season = 'Spring';
    risk = features.totalPrecip > 0.5 ? 30 : 15;
    if (features.totalPrecip > 0.5) factors.push('High precipitation risk');
  } else if (month >= 6 && month <= 8) {
    season = 'Summer';
    risk = features.avgHumidity > 70 ? 35 : 20;
    if (features.avgHumidity > 70) factors.push('High humidity - mold risk');
  } else {
    season = 'Fall';
    risk = 20;
  }

  return { season, risk, factors };
}

function predictTrend(currentScore: number, features: any): 'improving' | 'stable' | 'worsening' {
  // Analyze if risk is likely to improve or worsen
  const complaintTrend = features.complaintCount > 5 ? 'worsening' : 'stable';
  const crimeTrend = features.totalCrimes > 10 ? 'worsening' : 'improving';
  
  if (currentScore > 70) return 'worsening';
  if (currentScore < 30 && features.complaintCount === 0 && features.totalCrimes < 3) return 'improving';
  
  return complaintTrend === 'worsening' || crimeTrend === 'worsening' ? 'worsening' : 'stable';
}

function identifyRiskFactors(features: any): string[] {
  const factors: string[] = [];

  if (features.heatComplaints > 0) {
    factors.push('Heating issues detected');
  }
  if (features.leakComplaints > 0) {
    factors.push('Water leak history');
  }
  if (features.pestComplaints > 0) {
    factors.push('Pest problems reported');
  }
  if (features.violentCrimes > 0) {
    factors.push('Violent crime in area');
  }
  if (features.propertyCrimes > 3) {
    factors.push('High property crime rate');
  }
  if (features.avgHumidity > 75) {
    factors.push('High humidity - mold risk');
  }
  if (features.totalPrecip > 1.0) {
    factors.push('High precipitation - water damage risk');
  }

  return factors;
}

