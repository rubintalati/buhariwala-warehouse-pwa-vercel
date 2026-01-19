import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, full_name, role, phone, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error loading users:', error)
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, full_name, role, phone } = body

    const { data, error } = await supabaseAdmin.rpc('create_user_with_password', {
      p_username: username,
      p_email: email,
      p_password: password,
      p_full_name: full_name,
      p_role: role,
      p_phone: phone || null,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, userId: data })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, is_active } = body

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active })
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username, email, full_name, role, phone } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user information
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        username,
        email,
        full_name,
        role,
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // First check if user is super admin - prevent deletion
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      )
    }

    // Check if user has created any jobs
    const { data: userJobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id, job_number')
      .eq('created_by', userId)
      .limit(5)

    if (jobsError) {
      return NextResponse.json(
        { error: 'Error checking user jobs' },
        { status: 500 }
      )
    }

    if (userJobs && userJobs.length > 0) {
      const jobNumbers = userJobs.map(job => job.job_number).join(', ')
      return NextResponse.json(
        {
          error: `Cannot delete user. User has created ${userJobs.length} job(s): ${jobNumbers}${userJobs.length === 5 ? ', ...' : ''}. Please reassign or delete these jobs first.`
        },
        { status: 409 }
      )
    }

    // Delete the user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}