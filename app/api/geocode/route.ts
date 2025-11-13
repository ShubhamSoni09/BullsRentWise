import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Log the search to Supabase (non-blocking)
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('search_logs')
        .insert([{ address: address.trim() }])
        .then(({ error }) => {
          if (error) {
            console.error('Error logging search:', error);
          }
        })
        .catch((err) => {
          console.error('Error logging search:', err);
        });
    }

    // Using Nominatim (OpenStreetMap) geocoding - free, no API key needed
    // For production, consider using Mapbox or Google Maps Geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'BullsRentWise/1.0', // Required by Nominatim
        },
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const { lat, lon } = data[0];
    return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}

