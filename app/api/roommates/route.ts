import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// GET - Get roommates for a share code
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const shareCode = searchParams.get('shareCode');

  if (!shareCode) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
  }

  const normalizedCode = shareCode.trim().toUpperCase();

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('roommate_groups')
      .select('*')
      .eq('share_code', normalizedCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Share code not found' }, { status: 404 });
    }

    return NextResponse.json({
      shareCode: data.share_code,
      roommates: data.roommates || [],
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// POST - Create or update a roommate group
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { shareCode, roommates } = body;

    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    const normalizedCode = shareCode.trim().toUpperCase();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('roommate_groups')
      .upsert({
        share_code: normalizedCode,
        roommates: roommates || [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'share_code',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save group' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      group: {
        shareCode: data.share_code,
        roommates: data.roommates || [],
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to save group' }, { status: 500 });
  }
}

// PUT - Add a roommate to a group
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { shareCode, roommate } = body;

    if (!shareCode || !roommate) {
      return NextResponse.json({ error: 'Share code and roommate are required' }, { status: 400 });
    }

    const normalizedCode = shareCode.trim().toUpperCase();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get existing group
    const { data: existingGroup, error: fetchError } = await supabase
      .from('roommate_groups')
      .select('*')
      .eq('share_code', normalizedCode)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json({ error: 'Share code not found' }, { status: 404 });
    }

    const currentRoommates = existingGroup.roommates || [];
    
    // Check if roommate already exists
    const existingIndex = currentRoommates.findIndex((r: any) => r.email === roommate.email || r.id === roommate.id);
    
    let updatedRoommates;
    if (existingIndex >= 0) {
      // Update existing roommate
      updatedRoommates = [...currentRoommates];
      updatedRoommates[existingIndex] = { ...updatedRoommates[existingIndex], ...roommate };
    } else {
      // Add new roommate
      updatedRoommates = [
        ...currentRoommates,
        {
          ...roommate,
          id: roommate.id || `roommate_${Date.now()}`,
          joinedAt: roommate.joinedAt || new Date().toISOString(),
        },
      ];
    }

    // Update group
    const { data, error } = await supabase
      .from('roommate_groups')
      .update({
        roommates: updatedRoommates,
        updated_at: new Date().toISOString(),
      })
      .eq('share_code', normalizedCode)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to add roommate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      group: {
        shareCode: data.share_code,
        roommates: data.roommates || [],
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to add roommate' }, { status: 500 });
  }
}

// DELETE - Remove a roommate from a group
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const shareCode = searchParams.get('shareCode');
    const roommateId = searchParams.get('roommateId');

    if (!shareCode || !roommateId) {
      return NextResponse.json({ error: 'Share code and roommate ID are required' }, { status: 400 });
    }

    const normalizedCode = shareCode.trim().toUpperCase();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get existing group
    const { data: existingGroup, error: fetchError } = await supabase
      .from('roommate_groups')
      .select('*')
      .eq('share_code', normalizedCode)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json({ error: 'Share code not found' }, { status: 404 });
    }

    const updatedRoommates = (existingGroup.roommates || []).filter((r: any) => r.id !== roommateId);

    // Update group
    const { data, error } = await supabase
      .from('roommate_groups')
      .update({
        roommates: updatedRoommates,
        updated_at: new Date().toISOString(),
      })
      .eq('share_code', normalizedCode)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to remove roommate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      group: {
        shareCode: data.share_code,
        roommates: data.roommates || [],
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to remove roommate' }, { status: 500 });
  }
}

