import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        job_number,
        client_name,
        client_phone,
        client_email,
        status,
        created_by,
        created_at,
        submitted_at,
        notes,
        move_date,
        truck_vehicle_no
      `)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Map database fields to frontend expected fields
    const mappedData = data?.map(job => ({
      id: job.id,
      job_number: job.job_number,
      client_name: job.client_name,
      client_phone: job.client_phone,
      client_email: job.client_email,
      status: job.status,
      created_by: job.created_by,
      created_at: job.created_at,
      submitted_at: job.submitted_at,
      notes: job.notes,
      pickup_address: 'Address to be updated', // Fallback for legacy data
      delivery_address: 'Address to be updated', // Fallback for legacy data
      pickup_date: job.move_date || new Date().toISOString().split('T')[0]
    })) || []

    return NextResponse.json({ data: mappedData })
  } catch (error) {
    console.error('Error loading pending jobs:', error)
    return NextResponse.json(
      { error: 'Failed to load pending jobs' },
      { status: 500 }
    )
  }
}