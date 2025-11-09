import { NextRequest, NextResponse } from 'next/server';

// Alternative weather APIs
async function fetchFromOpenWeatherMap(lat: number, lng: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    // Current weather + forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      const data = await response.json();
      const list = data.list || [];
      
      // Calculate average humidity and precipitation
      let totalHumidity = 0;
      let totalPrecip = 0;
      let count = 0;

      list.forEach((item: any) => {
        if (item.main?.humidity !== undefined) {
          totalHumidity += item.main.humidity;
          count++;
        }
        if (item.rain?.['3h']) {
          totalPrecip += item.rain['3h'];
        } else if (item.snow?.['3h']) {
          totalPrecip += item.snow['3h'] * 0.1; // Convert snow to equivalent water
        }
      });

      return {
        avgHumidity: count > 0 ? totalHumidity / count : 0,
        totalPrecip: totalPrecip,
        periods: list.slice(0, 24).map((item: any) => ({
          startTime: item.dt_txt,
          relativeHumidity: { value: item.main?.humidity || 0 },
          precipitationAmount: { value: item.rain?.['3h'] || item.snow?.['3h'] || 0 },
        })),
        source: 'OpenWeatherMap',
      };
    }
  } catch (error) {
    console.error('OpenWeatherMap API error:', error);
  }
  return null;
}

async function fetchFromWeatherAPI(lat: number, lng: number) {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) return null;

  try {
    // Current + forecast
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=7&aqi=no&alerts=no`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      const data = await response.json();
      const forecastDays = data.forecast?.forecastday || [];
      
      let totalHumidity = 0;
      let totalPrecip = 0;
      let count = 0;

      forecastDays.forEach((day: any) => {
        if (day.day?.avghumidity) {
          totalHumidity += day.day.avghumidity;
          count++;
        }
        if (day.day?.totalprecip_in) {
          totalPrecip += day.day.totalprecip_in;
        }
      });

      // Also get current humidity
      if (data.current?.humidity) {
        totalHumidity += data.current.humidity;
        count++;
      }

      return {
        avgHumidity: count > 0 ? totalHumidity / count : 0,
        totalPrecip: totalPrecip,
        periods: forecastDays.slice(0, 7).map((day: any) => ({
          startTime: day.date,
          relativeHumidity: { value: day.day?.avghumidity || 0 },
          precipitationAmount: { value: day.day?.totalprecip_in || 0 },
        })),
        source: 'WeatherAPI',
      };
    }
  } catch (error) {
    console.error('WeatherAPI error:', error);
  }
  return null;
}

// Original NWS API (free, no key required)
async function fetchFromNWS(lat: number, lng: number) {
  try {
    // Step 1: Get grid point from lat/lng
    const gridResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lng}`,
      {
        headers: {
          'User-Agent': 'BullsRentWise/1.0 (contact@example.com)',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!gridResponse.ok) {
      return null;
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
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!forecastResponse.ok) {
      return null;
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties?.periods || [];

    // Calculate average humidity and total precipitation for last 7 days
    const lastNDays = 7;
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
          totalPrecip += (period.probabilityOfPrecipitation.value / 100) * (period.precipitationAmount?.value || 0);
        }
      }
    });

    const avgHumidity = humidityCount > 0 ? totalHumidity / humidityCount : 0;

    return {
      avgHumidity,
      totalPrecip,
      periods: periods.slice(0, 24),
      source: 'NWS',
    };
  } catch (error) {
    console.error('NWS API error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Try APIs in order of preference (free first, then paid)
    let weatherData = null;

    // 1. Try NWS (free, no API key needed)
    weatherData = await fetchFromNWS(lat, lng);
    
    // 2. Try OpenWeatherMap (requires API key, free tier available)
    if (!weatherData && process.env.OPENWEATHER_API_KEY) {
      weatherData = await fetchFromOpenWeatherMap(lat, lng);
    }

    // 3. Try WeatherAPI.com (requires API key, free tier available)
    if (!weatherData && process.env.WEATHERAPI_KEY) {
      weatherData = await fetchFromWeatherAPI(lat, lng);
    }

    if (weatherData) {
      console.log('Weather API Response:', {
        avgHumidity: weatherData.avgHumidity,
        totalPrecip: weatherData.totalPrecip,
        source: weatherData.source,
      });

      return NextResponse.json({
        avgHumidity: weatherData.avgHumidity,
        totalPrecip: weatherData.totalPrecip,
        periods: weatherData.periods,
        source: weatherData.source,
      });
    }

    // If all APIs fail, return default values
    console.warn('All weather APIs failed. Using default values.');
    return NextResponse.json({
      avgHumidity: 0,
      totalPrecip: 0,
      periods: [],
      error: 'Weather data unavailable - consider adding OPENWEATHER_API_KEY or WEATHERAPI_KEY to .env.local',
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      avgHumidity: 0,
      totalPrecip: 0,
      periods: [],
      error: 'Weather data unavailable',
    });
  }
}
