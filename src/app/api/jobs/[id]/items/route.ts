import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const { data, error } = await supabaseAdmin
      .from('items')
      .select(`
        id,
        job_id,
        item_name,
        category,
        quantity,
        condition,
        material,
        dimensions,
        weight_estimate,
        handling_instructions,
        fragile,
        ai_confidence_score,
        manual_verification,
        item_value,
        created_at,
        updated_at,
        item_images (id)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Add image count to each item
    const itemsWithCounts = data?.map(item => ({
      ...item,
      image_count: item.item_images?.length || 0,
      item_images: undefined // Remove the images array from response
    })) || []

    return NextResponse.json({ data: itemsWithCounts })
  } catch (error) {
    console.error('Error loading items:', error)
    return NextResponse.json(
      { error: 'Failed to load items' },
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
      item_name,
      category,
      quantity = 1,
      condition,
      item_value,
      dimensions,
      handling_instructions,
      fragile = false,
      ai_confidence_score,
      manual_verification = false,
      created_by,
      imageData
    } = body

    if (!item_name || !category || !condition) {
      return NextResponse.json(
        { error: 'Item name, category, and condition are required' },
        { status: 400 }
      )
    }

    // Create the item (without room_id since we removed rooms)
    const { data: itemData, error: itemError } = await supabaseAdmin
      .from('items')
      .insert({
        job_id: jobId, // Link directly to job instead of room
        item_name,
        category,
        quantity,
        condition,
        item_value: item_value || null,
        dimensions: dimensions || null,
        weight_estimate: null,
        handling_instructions: handling_instructions || null,
        fragile,
        ai_confidence_score: ai_confidence_score || null,
        manual_verification,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (itemError) {
      console.error('Error creating item:', itemError)
      return NextResponse.json(
        { error: itemError.message },
        { status: 400 }
      )
    }

    // If image data is provided, store it
    if (imageData && itemData) {
      try {
        const { error: imageError } = await supabaseAdmin
          .from('item_images')
          .insert({
            item_id: itemData.id,
            image_url: imageData,
            image_type: 'main',
            ai_analysis_data: {
              confidence_score: ai_confidence_score,
              identified_items: [item_name],
              analysis_timestamp: new Date().toISOString()
            },
            uploaded_at: new Date().toISOString()
          })

        if (imageError) {
          console.warn('Failed to save image data:', imageError)
        }
      } catch (imageError) {
        console.warn('Error processing image:', imageError)
      }
    }

    return NextResponse.json({ success: true, data: itemData })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const body = await request.json()
    const {
      itemId,
      item_name,
      category,
      quantity,
      condition,
      item_value,
      dimensions,
      handling_instructions,
      fragile
    } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('items')
      .update({
        item_name,
        category,
        quantity,
        condition,
        item_value,
        dimensions,
        handling_instructions,
        fragile,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('job_id', jobId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data, message: 'Item updated successfully' })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('job_id', jobId)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the item' },
      { status: 500 }
    )
  }
}