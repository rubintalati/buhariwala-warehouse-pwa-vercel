import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        job_id,
        room_name,
        room_type,
        floor_level,
        is_completed,
        created_at,
        updated_at,
        items (id)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Add item count to each room
    const roomsWithCounts = data?.map(room => ({
      ...room,
      item_count: room.items?.length || 0,
      items: undefined // Remove the items array from response
    })) || []

    return NextResponse.json({ data: roomsWithCounts })
  } catch (error) {
    console.error('Error loading rooms:', error)
    return NextResponse.json(
      { error: 'Failed to load rooms' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()
    const {
      room_name,
      room_type,
      floor_level,
      created_by
    } = body

    if (!room_name || !room_type) {
      return NextResponse.json(
        { error: 'Room name and type are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        job_id: jobId,
        room_name,
        room_type,
        floor_level: floor_level || null,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating room:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the room' },
      { status: 500 }
    )
  }
}