import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// Item categories based on moving/packing industry
const ITEM_CATEGORIES = [
  'Furniture',
  'Electronics',
  'Appliances',
  'Kitchenware',
  'Clothing',
  'Books & Documents',
  'Artwork & Decorations',
  'Sports Equipment',
  'Tools & Hardware',
  'Personal Items',
  'Fragile Items',
  'Other'
]

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'damaged']

interface ItemIdentification {
  itemName: string
  category: string
  condition: string
  quantity: number
  estimatedWeight?: string
  dimensions?: string
  estimatedValue?: number
  handlingInstructions?: string
  isFragile: boolean
  confidenceScore: number
  suggestedDescription?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files: File[] = []
    const roomType = formData.get('roomType') as string || 'general'

    // Handle multiple files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        files.push(value)
      }
    }

    // Also handle single image for backward compatibility
    const singleFile = formData.get('image') as File
    if (singleFile && !files.length) {
      files.push(singleFile)
    }

    if (!files.length) {
      return NextResponse.json(
        { error: 'No image file(s) provided' },
        { status: 400 }
      )
    }

    // Process all images
    const results: ItemIdentification[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')

        // Create the prompt for Gemini
        const prompt = `
You are an expert in identifying household and office items for moving and packing services in India.

Analyze this image and provide information about the item(s) visible. The item is located in a ${roomType} room context.

Please return a JSON response with the following structure:
{
  "itemName": "Simple name with one descriptive word (e.g., 'Brown Table', 'White Chair', 'Large Sofa', 'Small TV')",
  "category": "One of: ${ITEM_CATEGORIES.join(', ')}",
  "condition": "One of: ${CONDITION_OPTIONS.join(', ')} (based on visible wear, damage, age)",
  "quantity": 1 (count of identical items visible, usually 1 unless multiple identical items),
  "estimatedWeight": "Weight estimate in kilograms (e.g., '25-35 kg', 'Under 5 kg', '50+ kg')",
  "dimensions": "Approximate size in centimeters (e.g., '180cm L x 90cm W x 80cm H', 'Small', 'Medium', 'Large')",
  "estimatedValue": 15000 (estimated value in Indian Rupees for insurance purposes),
  "handlingInstructions": "Only mention if there are visible damages, marks, scratches, or color loss (e.g., 'Visible scratches on surface', 'Paint chipping noted', 'No visible damage')",
  "isFragile": true/false,
  "confidenceScore": 0.0-1.0 (how confident you are in this identification),
  "suggestedDescription": "Brief description for packing list (e.g., 'Brown wooden table', 'White plastic chair')"
}

Important guidelines:
- Keep item names simple: basic item type + ONE descriptive word (color, size, or material)
- DO NOT include brands, models, or detailed specifications
- Examples: "Black Chair" not "Herman Miller Aeron Executive Chair"
- Examples: "Large Table" not "IKEA Dining Table Model XYZ"
- Examples: "Small TV" not "Samsung 43-inch Smart LED TV"
- Consider the condition based on visible wear, scratches, or damage
- Provide realistic weight estimates in kilograms for moving purposes
- Use metric measurements (cm, m, kg)
- Estimate value in Indian Rupees considering local market prices
- Only mention handling instructions if you can see actual damage, marks, scratches, or color loss
- Mark items as fragile if they contain glass, electronics, or delicate materials
- Keep descriptions simple and concise
- If multiple items are visible, focus on the most prominent/central item

Return only the JSON response, no additional text.`

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: file.type,
              data: base64
            }
          }
        ])

        const response = await result.response
        const text = response.text()

        // Parse the JSON response
        let itemData: ItemIdentification
        try {
          // Clean the response in case it has markdown formatting
          const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          itemData = JSON.parse(cleanedText)
        } catch (parseError) {
          console.error(`Error parsing Gemini response for image ${i + 1}:`, parseError)
          console.error('Raw response:', text)

          // Fallback response
          itemData = {
            itemName: `Unknown Item ${i + 1}`,
            category: 'Other',
            condition: 'good',
            quantity: 1,
            estimatedWeight: 'Unknown',
            dimensions: 'Unknown',
            estimatedValue: 0,
            handlingInstructions: 'Unable to assess condition',
            isFragile: false,
            confidenceScore: 0.1,
            suggestedDescription: `Item ${i + 1} requiring manual identification`
          }
        }

        // Validate the response
        if (!ITEM_CATEGORIES.includes(itemData.category)) {
          itemData.category = 'Other'
        }

        if (!CONDITION_OPTIONS.includes(itemData.condition)) {
          itemData.condition = 'good'
        }

        // Ensure confidence score is within range
        itemData.confidenceScore = Math.max(0, Math.min(1, itemData.confidenceScore))

        results.push(itemData)

      } catch (imageError) {
        console.error(`Error processing image ${i + 1}:`, imageError)
        // Add fallback item for failed image processing
        results.push({
          itemName: `Failed to Process Image ${i + 1}`,
          category: 'Other',
          condition: 'good',
          quantity: 1,
          estimatedWeight: 'Unknown',
          dimensions: 'Unknown',
          estimatedValue: 0,
          handlingInstructions: 'Image processing failed',
          isFragile: false,
          confidenceScore: 0.0,
          suggestedDescription: `Image ${i + 1} could not be processed`
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: files.length === 1 ? results[0] : results,
      count: results.length
    })

  } catch (error) {
    console.error('Error in AI item identification:', error)

    return NextResponse.json(
      {
        error: 'Failed to identify item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}