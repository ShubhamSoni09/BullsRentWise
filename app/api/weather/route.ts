import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Step 1: Get grid point from lat/lng
    const gridResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lng}`,
      {
        headers: {
          'User-Agent': 'BullsRentWise/1.0 (contact@example.com)', // NWS requires User-Agent
        },
      }
    );

    if (!gridResponse.ok) {
      throw new Error('Failed to get grid point');
    }

    const gridData = await gridResponse.json();
    const { gridId, gridX, gridY } = gridData.properties;

    // Step 2: Get hourly forecast
    const forecastResponse = await fetch(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
      {
        headers: {
          'User-Agent': 'BullsRentWise/1.0 (contact@example.com)',
        },
      }
    );

    if (!forecastResponse.ok) {
      throw new Error('Failed to get forecast');
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties?.periods || [];

    // Calculate average humidity and total precipitation for last N days (or available data)
    const lastNDays = 7; // Check last 7 days
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - lastNDays * 24 * 60 * 60 * 1000);

    let totalHumidity = 0;
    let humidityCount = 0;
    let totalPrecip = 0;

    periods.forEach((period: any) => {
      const periodDate = new Date(period.startTime);
      if (periodDate >= cutoffDate) {
        if (period.relativeHumidity?.value !== undefined) {
          totalHumidity += period.relativeHumidity.value;
          humidityCount++;
        }
        if (period.probabilityOfPrecipitation?.value !== undefined) {
          // Convert probability to estimated precipitation (simplified)
          // In reality, you'd want actual precipitation amounts
          totalPrecip += (period.probabilityOfPrecipitation.value / 100) * (period.precipitationAmount?.value || 0);
        }
      }
    });

    const avgHumidity = humidityCount > 0 ? totalHumidity / humidityCount : 0;

    return NextResponse.json({
      avgHumidity,
      totalPrecip,
      periods: periods.slice(0, 24), // Return next 24 hours for display
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}

