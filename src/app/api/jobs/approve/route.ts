import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, action, approvedBy, rejectionReason } = body

    if (!jobId || !action || !approvedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let updateData: any = {
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.rejection_reason = null
    } else if (action === 'reject') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }
      updateData.status = 'draft'
      updateData.rejection_reason = rejectionReason.trim()
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('status', 'pending_review') // Only allow updates to pending jobs
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Job not found or not in pending status' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: action === 'approve' ? 'Job approved successfully' : 'Job rejected and returned to draft'
    })
  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing the approval' },
      { status: 500 }
    )
  }
}