import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .select(`
        id,
        name,
        address,
        contact_person,
        contact_phone,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name')

    if (error) {
      // If table doesn't exist, return empty array for now
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], error: 'Warehouses table not yet created' })
      }

      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Map to simplified structure
    const simplifiedData = data?.map(warehouse => ({
      id: warehouse.id,
      name: warehouse.name,
      address: warehouse.address,
      contact_name: warehouse.contact_person, // Map contact_person to contact_name
      contact_phone: warehouse.contact_phone,
      is_active: warehouse.is_active,
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at
    })) || []

    return NextResponse.json({ data: simplifiedData })
  } catch (error) {
    console.error('Error loading warehouses:', error)
    return NextResponse.json(
      { error: 'Failed to load warehouses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      address,
      contact_name,
      contact_phone
    } = body

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .insert({
        name,
        address,
        contact_name,
        contact_phone,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating warehouse:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the warehouse' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { warehouseId, updates } = body

    const { data, error } = await supabaseAdmin
      .from('warehouses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', warehouseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating warehouse:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    )
  }
}