import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const { data, error } = await supabaseAdmin.rpc('verify_user_credentials', {
      p_username: username,
      p_password: password,
    })

    if (error) {
      return NextResponse.json(
        { user: null, error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { user: null, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const user = data[0]
    return NextResponse.json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        is_active: user.is_active,
      },
      error: null
    })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { user: null, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}