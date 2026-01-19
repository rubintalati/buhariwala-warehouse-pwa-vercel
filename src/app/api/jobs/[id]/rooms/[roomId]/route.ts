import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const { id: jobId, roomId } = await params

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .eq('job_id', jobId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error loading room:', error)
    return NextResponse.json(
      { error: 'Failed to load room' },
      { status: 500 }
    )
  }
}