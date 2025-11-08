// Helper functions to fetch risk data for properties
// These directly call the route handlers to avoid HTTP overhead

import { NextRequest } from 'next/server';

export async function fetchComplaintsForLocation(lat: number, lng: number, radius: number = 800): Promise<any[]> {
  try {
    // Directly import and call the route handler
    const { POST } = await import('../complaints/route');
    const url = new URL('http://localhost/api/complaints');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, radius }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch complaints:', error);
  }
  return [];
}

export async function fetchWeatherForLocation(lat: number, lng: number): Promise<any> {
  try {
    const { POST } = await import('../weather/route');
    const url = new URL('http://localhost/api/weather');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch weather:', error);
  }
  return { avgHumidity: 70, totalPrecip: 0.5 };
}

export async function fetchCrimeForLocation(lat: number, lng: number, radius: number = 800): Promise<any> {
  try {
    const { POST } = await import('../crime/route');
    const url = new URL('http://localhost/api/crime');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, radius }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch crime:', error);
  }
  return { stats: { total: 0, violent: 0, property: 0, drug: 0, vandalism: 0, other: 0, avgSeverity: 0 } };
}

