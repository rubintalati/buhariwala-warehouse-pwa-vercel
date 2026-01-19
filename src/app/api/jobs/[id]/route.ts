import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params

    // Get job details with warehouse information
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        job_number,
        client_name,
        client_phone,
        client_email,
        status,
        job_type,
        warehouse_holding,
        selected_warehouse_id,
        estimated_storage_start_date,
        estimated_storage_end_date,
        notes,
        created_by,
        created_at,
        updated_at,
        warehouses:selected_warehouse_id (
          name,
          address
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Supabase error:', jobError)
      return NextResponse.json(
        { error: `Database error: ${jobError.message}` },
        { status: 500 }
      )
    }

    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get all locations for this job
    const { data: locationsData, error: locationsError } = await supabaseAdmin
      .from('job_locations')
      .select('id, location_type, address, city, state, contact_name, contact_phone, contact_email, date, special_instructions, sequence_order')
      .eq('job_id', jobId)
      .order('sequence_order', { ascending: true })

    if (locationsError) {
      console.error('Error loading job locations:', locationsError)
    }

    // Get items count grouped by delivery location
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('delivery_id, quantity')
      .eq('job_id', jobId)

    if (itemsError) {
      console.error('Error loading items:', itemsError)
    }

    // Calculate total items per delivery location
    const itemsByDelivery = new Map()
    let totalItems = 0
    itemsData?.forEach(item => {
      const deliveryId = item.delivery_id || 1
      const quantity = item.quantity || 1
      itemsByDelivery.set(deliveryId, (itemsByDelivery.get(deliveryId) || 0) + quantity)
      totalItems += quantity
    })

    // Get warehouse schedule information if warehouse is involved
    let warehouseSchedules = []
    if (jobData.warehouse_holding) {
      const { data: scheduleData, error: scheduleError } = await supabaseAdmin
        .from('job_schedule')
        .select(`
          job_id,
          warehouse_id,
          schedule_type,
          scheduled_date,
          status,
          warehouses:warehouse_id (
            name
          )
        `)
        .eq('job_id', jobId)
        .in('schedule_type', ['warehouse_in', 'warehouse_out'])

      if (!scheduleError) {
        warehouseSchedules = scheduleData || []
      }
    }

    // Organize locations by type
    const pickupLocations = locationsData?.filter(loc => loc.location_type === 'pickup') || []
    const deliveryLocations = locationsData?.filter(loc => loc.location_type === 'delivery') || []

    // Add item counts to delivery locations
    const deliveryLocationsWithItems = deliveryLocations.map((location, index) => ({
      ...location,
      delivery_id: index + 1,
      item_count: itemsByDelivery.get(index + 1) || 0
    }))

    // Find warehouse entry/exit dates from schedule
    const warehouseIn = warehouseSchedules.find(s => s.schedule_type === 'warehouse_in')
    const warehouseOut = warehouseSchedules.find(s => s.schedule_type === 'warehouse_out')

    // Create warehouse entry object if warehouse is involved
    let warehouse_entry = null
    if (jobData.warehouse_holding && (warehouseIn || warehouseOut || jobData.warehouses)) {
      warehouse_entry = {
        name: warehouseIn?.warehouses?.name || jobData.warehouses?.name || 'Express Hub Delhi',
        from_date: warehouseIn?.scheduled_date || jobData.estimated_storage_start_date,
        to_date: warehouseOut?.scheduled_date || jobData.estimated_storage_end_date
      }
    }

    // Map status for frontend compatibility
    let frontendStatus = jobData.status
    if (jobData.status === 'pending') {
      frontendStatus = 'pending_approval'
    }

    const mappedJobData = {
      id: jobData.id,
      job_number: jobData.job_number,
      client_name: jobData.client_name,
      client_phone: jobData.client_phone,
      client_email: jobData.client_email,
      pickup_date: pickupLocations[0]?.date || null,
      delivery_date: deliveryLocations[0]?.date || null,
      status: frontendStatus,
      job_type: jobData.job_type,
      warehouse_holding: jobData.warehouse_holding,
      notes: jobData.notes,
      created_by: jobData.created_by,
      created_at: jobData.created_at,
      updated_at: jobData.updated_at,
      total_items: totalItems,
      warehouse_entry: warehouse_entry,
      pickup_locations: pickupLocations,
      delivery_locations: deliveryLocationsWithItems,
      // Backward compatibility - use first locations as primary
      pickup_address: pickupLocations[0]?.address || 'Address not set',
      delivery_address: deliveryLocations[0]?.address || 'Address not set'
    }

    return NextResponse.json({ data: mappedJobData })
  } catch (error) {
    console.error('Error loading job details:', error)
    return NextResponse.json(
      { error: 'Failed to load job details' },
      { status: 500 }
    )
  }
}