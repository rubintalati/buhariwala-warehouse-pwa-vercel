import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/custom-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()
    const { action, rejectionReason } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get current user from session/cookie
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has approval permissions
    if (!['super_admin', 'checker'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve jobs' },
        { status: 403 }
      )
    }

    let updateData: any = {
      approved_by: currentUser.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.status = 'in_progress'
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
      .eq('status', 'pending_approval') // Only allow updates to pending jobs
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
        { error: 'Job not found or not in pending approval status' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: action === 'approve'
        ? 'Job approved successfully and moved to in progress'
        : 'Job rejected and returned to draft'
    })
  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing the approval' },
      { status: 500 }
    )
  }
}