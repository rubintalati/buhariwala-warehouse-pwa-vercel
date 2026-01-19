import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  try {
    const { id: jobId, roomId } = params

    const { data, error } = await supabaseAdmin
      .from('items')
      .select(`
        id,
        room_id,
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
        created_at,
        updated_at,
        item_images (id)
      `)
      .eq('room_id', roomId)
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
  { params }: { params: { id: string; roomId: string } }
) {
  try {
    const { id: jobId, roomId } = params
    const body = await request.json()
    const {
      item_name,
      category,
      quantity = 1,
      condition,
      material,
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

    // Create the item
    const { data: itemData, error: itemError } = await supabaseAdmin
      .from('items')
      .insert({
        room_id: roomId,
        item_name,
        category,
        quantity,
        condition,
        material: material || null,
        dimensions: dimensions || null,
        weight_estimate: null, // Will be calculated later if needed
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
        // For now, we'll store the image data URL in the database
        // In production, you would upload to a cloud storage service
        const { error: imageError } = await supabaseAdmin
          .from('item_images')
          .insert({
            item_id: itemData.id,
            image_url: imageData, // In production, this would be a cloud storage URL
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
          // Don't fail the request, just log the warning
        }
      } catch (imageError) {
        console.warn('Error processing image:', imageError)
        // Don't fail the request, just log the warning
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