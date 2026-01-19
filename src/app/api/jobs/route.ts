import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Enhanced query to get jobs with all required information
    const { data: jobsData, error: jobsError } = await supabaseAdmin
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
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Supabase error:', jobsError)
      return NextResponse.json(
        { error: `Database error: ${jobsError.message}` },
        { status: 500 }
      )
    }

    // Get job locations for all jobs
    const jobIds = jobsData?.map(job => job.id) || []
    const { data: locationsData, error: locationsError } = await supabaseAdmin
      .from('job_locations')
      .select('job_id, location_type, address, date, sequence_order')
      .in('job_id', jobIds)
      .order('sequence_order', { ascending: true })

    if (locationsError) {
      console.error('Error loading job locations:', locationsError)
    }

    // Create locations map
    const locationsMap = new Map()
    locationsData?.forEach(location => {
      if (!locationsMap.has(location.job_id)) {
        locationsMap.set(location.job_id, [])
      }
      locationsMap.get(location.job_id).push(location)
    })

    // Get items count for each job
    const { data: itemCounts, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('job_id, quantity')
      .in('job_id', jobIds)

    if (itemsError) {
      console.error('Error loading item counts:', itemsError)
    }

    // Calculate total items per job
    const itemCountsMap = new Map()
    itemCounts?.forEach(item => {
      const currentCount = itemCountsMap.get(item.job_id) || 0
      itemCountsMap.set(item.job_id, currentCount + (item.quantity || 1))
    })

    // Get warehouse schedule information for jobs with warehouse entries
    const warehouseJobIds = jobsData?.filter(job => job.warehouse_holding)?.map(job => job.id) || []
    let warehouseSchedules = []
    if (warehouseJobIds.length > 0) {
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
        .in('job_id', warehouseJobIds)
        .in('schedule_type', ['warehouse_in', 'warehouse_out'])

      if (!scheduleError) {
        warehouseSchedules = scheduleData || []
      }
    }

    // Create warehouse schedules map
    const warehouseSchedulesMap = new Map()
    warehouseSchedules.forEach(schedule => {
      if (!warehouseSchedulesMap.has(schedule.job_id)) {
        warehouseSchedulesMap.set(schedule.job_id, [])
      }
      warehouseSchedulesMap.get(schedule.job_id).push(schedule)
    })

    // Map database fields to frontend expected fields
    const mappedData = jobsData?.map(job => {
      const totalItems = itemCountsMap.get(job.id) || 0
      const locations = locationsMap.get(job.id) || []
      const schedules = warehouseSchedulesMap.get(job.id) || []

      // Get pickup and delivery addresses and dates from locations
      const pickupLocation = locations.find(loc => loc.location_type === 'pickup')
      const deliveryLocation = locations.find(loc => loc.location_type === 'delivery')

      // Find warehouse entry/exit dates from schedule
      const warehouseIn = schedules.find(s => s.schedule_type === 'warehouse_in')
      const warehouseOut = schedules.find(s => s.schedule_type === 'warehouse_out')

      // Create warehouse entry object if warehouse is involved
      let warehouse_entry = null
      if (job.warehouse_holding && (warehouseIn || warehouseOut || job.warehouses)) {
        warehouse_entry = {
          name: warehouseIn?.warehouses?.name || job.warehouses?.name || 'Express Hub Delhi',
          from_date: warehouseIn?.scheduled_date || job.estimated_storage_start_date,
          to_date: warehouseOut?.scheduled_date || job.estimated_storage_end_date
        }
      }

      // Map status for frontend compatibility
      let frontendStatus = job.status
      if (job.status === 'pending') {
        frontendStatus = 'pending_approval'
      }

      return {
        id: job.id,
        job_number: job.job_number,
        client_name: job.client_name,
        client_phone: job.client_phone,
        pickup_address: pickupLocation?.address || 'Address not set',
        delivery_address: deliveryLocation?.address || 'Address not set',
        pickup_date: pickupLocation?.date || null,
        delivery_date: deliveryLocation?.date || null,
        status: frontendStatus,
        created_by: job.created_by,
        created_at: job.created_at,
        updated_at: job.updated_at,
        total_items: totalItems,
        warehouse_entry: warehouse_entry
      }
    }) || []

    return NextResponse.json({ data: mappedData })
  } catch (error) {
    console.error('Error loading jobs:', error)
    return NextResponse.json(
      { error: 'Failed to load jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      client_name,
      client_phone,
      client_email,
      job_type,
      warehouse_holding,
      selected_warehouse_id,
      estimated_storage_start_date,
      estimated_storage_end_date,
      notes,
      created_by,
      locations,
      submit_for_review
    } = body

    // Generate job number (format: JOB-YYYYMMDD-XXXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    // Get count of jobs created today to generate sequential number
    const { data: todaysJobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
      .lt('created_at', `${today.toISOString().slice(0, 10)}T23:59:59.999Z`)

    const sequenceNumber = String((todaysJobs?.length || 0) + 1).padStart(4, '0')
    const job_number = `JOB-${dateStr}-${sequenceNumber}`

    // Determine job status based on submission type
    const jobStatus = submit_for_review ? 'pending' : 'draft'
    const currentTime = new Date().toISOString()

    // Create the main job record with enhanced structure
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_number,
        client_name,
        client_phone,
        client_email,
        job_type: job_type || 'direct_move',
        warehouse_holding: warehouse_holding || false,
        selected_warehouse_id: warehouse_holding ? selected_warehouse_id : null,
        estimated_storage_start_date: warehouse_holding ? estimated_storage_start_date : null,
        estimated_storage_end_date: warehouse_holding ? estimated_storage_end_date : null,
        notes,
        status: jobStatus,
        submitted_at: submit_for_review ? currentTime : null,
        created_by
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: jobError.message },
        { status: 400 }
      )
    }

    // Create location records if provided
    if (locations && locations.length > 0) {
      const locationInserts = locations.map((location: any) => ({
        job_id: jobData.id,
        location_type: location.type,
        address: location.address,
        city: location.city,
        state: location.state,
        contact_name: location.contactName,
        contact_phone: location.contactPhone,
        contact_email: location.contactEmail,
        date: location.date,
        special_instructions: location.specialInstructions,
        sequence_order: location.sequenceOrder
      }))

      const { error: locationError } = await supabaseAdmin
        .from('job_locations')
        .insert(locationInserts)

      if (locationError) {
        // If location insertion fails, we should clean up the job
        await supabaseAdmin
          .from('jobs')
          .delete()
          .eq('id', jobData.id)

        console.error('Error creating job locations:', locationError)
        return NextResponse.json(
          { error: 'Failed to create job locations: ' + locationError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true, data: jobData })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the job' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      client_name,
      client_phone,
      client_email,
      job_type,
      warehouse_holding,
      selected_warehouse_id,
      estimated_storage_start_date,
      estimated_storage_end_date,
      notes,
      locations
    } = body

    // Update the main job record
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .update({
        client_name,
        client_phone,
        client_email,
        job_type: job_type || 'direct_move',
        warehouse_holding: warehouse_holding || false,
        selected_warehouse_id: warehouse_holding ? selected_warehouse_id : null,
        estimated_storage_start_date: warehouse_holding ? estimated_storage_start_date : null,
        estimated_storage_end_date: warehouse_holding ? estimated_storage_end_date : null,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (jobError) {
      console.error('Error updating job:', jobError)
      return NextResponse.json(
        { error: jobError.message },
        { status: 400 }
      )
    }

    // Delete existing locations and recreate them
    if (locations && locations.length > 0) {
      // Delete existing locations
      await supabaseAdmin
        .from('job_locations')
        .delete()
        .eq('job_id', id)

      // Insert updated locations
      const locationInserts = locations.map((location: any) => ({
        job_id: id,
        location_type: location.type,
        address: location.address,
        city: location.city,
        state: location.state,
        contact_name: location.contactName,
        contact_phone: location.contactPhone,
        contact_email: location.contactEmail,
        date: location.date,
        special_instructions: location.specialInstructions,
        sequence_order: location.sequenceOrder
      }))

      const { error: locationError } = await supabaseAdmin
        .from('job_locations')
        .insert(locationInserts)

      if (locationError) {
        console.error('Error updating job locations:', locationError)
        return NextResponse.json(
          { error: 'Failed to update job locations: ' + locationError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true, data: jobData })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the job' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, updates } = body

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}