'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Package, Camera, Edit, Trash2, Sparkles } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/custom-auth'
import AIItemIdentifier from '@/components/ai/AIItemIdentifier'

interface Item {
  id: string
  room_id: string
  item_name: string
  category: string
  quantity: number
  condition: string
  material?: string
  dimensions?: string
  weight_estimate?: number
  handling_instructions?: string
  fragile: boolean
  ai_confidence_score?: number
  manual_verification: boolean
  created_at: string
  image_count?: number
}

interface Room {
  id: string
  room_name: string
  room_type: string
  job_id: string
}

interface Job {
  id: string
  job_number: string
  client_name: string
}

export default function ItemsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAICapture, setShowAICapture] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const roomId = params.roomId as string

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    if (jobId && roomId) {
      loadData()
    }
  }, [jobId, roomId, router])

  const loadData = async () => {
    try {
      // Load job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`)
      const jobResult = await jobResponse.json()

      if (jobResponse.ok) {
        setJob(jobResult.data)
      }

      // Load room details
      const roomResponse = await fetch(`/api/jobs/${jobId}/rooms/${roomId}`)
      const roomResult = await roomResponse.json()

      if (!roomResponse.ok) {
        setError(roomResult.error || 'Failed to load room details')
        return
      }

      setRoom(roomResult.data)

      // Load items
      const itemsResponse = await fetch(`/api/jobs/${jobId}/rooms/${roomId}/items`)
      const itemsResult = await itemsResponse.json()

      if (!itemsResponse.ok) {
        setError(itemsResult.error || 'Failed to load items')
        return
      }

      setItems(itemsResult.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIItemIdentified = async (aiItem: any, imageData: string) => {
    setIsCreating(true)
    setError('')

    try {
      // Create the item
      const response = await fetch(`/api/jobs/${jobId}/rooms/${roomId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: aiItem.itemName,
          category: aiItem.category,
          quantity: 1,
          condition: aiItem.condition,
          material: aiItem.material,
          dimensions: aiItem.dimensions,
          handling_instructions: aiItem.handlingInstructions,
          fragile: aiItem.isFragile,
          ai_confidence_score: aiItem.confidenceScore,
          manual_verification: aiItem.confidenceScore < 0.8, // Require verification for low confidence
          created_by: getCurrentUser()?.id,
          imageData // Include image data for storage
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create item')
        return
      }

      await loadData()
      setShowAICapture(false)
    } catch (error) {
      console.error('Error creating item:', error)
      setError('Failed to create item')
    } finally {
      setIsCreating(false)
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'damaged':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceDisplay = (score?: number, manualVerification?: boolean) => {
    if (manualVerification) {
      return (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <Edit className="w-3 h-3" />
          <span>Needs Review</span>
        </div>
      )
    }

    if (score && score >= 0.8) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Sparkles className="w-3 h-3" />
          <span>AI Verified</span>
        </div>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="font-semibold">Loading Items</p>
            <p className="text-sm text-gray-500">Fetching item data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showAICapture) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowAICapture(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Button>
        </div>

        <AIItemIdentifier
          roomType={room?.room_type || 'general'}
          onItemIdentified={handleAIItemIdentified}
          onCancel={() => setShowAICapture(false)}
          disabled={isCreating}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/dashboard/jobs/${jobId}/rooms`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {room?.room_name} Items
              </h1>
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{items.length} Items</span>
              </div>
            </div>
            {job && room && (
              <p className="text-lg text-gray-600">
                {job.job_number} - {job.client_name} - {room.room_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowAICapture(true)}
          className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary font-semibold px-6"
        >
          <Camera className="mr-2 h-4 w-4" />
          Capture Item with AI
        </Button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Added</h3>
                <p className="text-gray-500 mb-6 text-center">
                  Start capturing photos of items in this room. AI will automatically identify and categorize them for you.
                </p>
                <Button
                  onClick={() => setShowAICapture(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture First Item
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-card-hover transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                      {item.item_name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {item.category}
                      {item.quantity > 1 && ` • Qty: ${item.quantity}`}
                    </CardDescription>
                  </div>
                  {item.fragile && (
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                      Fragile
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getConditionColor(item.condition)}`}>
                    {item.condition.toUpperCase()}
                  </div>
                  {getConfidenceDisplay(item.ai_confidence_score, item.manual_verification)}
                </div>

                {item.material && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Material:</span> {item.material}
                  </div>
                )}

                {item.dimensions && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Size:</span> {item.dimensions}
                  </div>
                )}

                {item.handling_instructions && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Instructions:</span> {item.handling_instructions}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Added {new Date(item.created_at).toLocaleDateString()}
                  {item.image_count && item.image_count > 0 && (
                    <span> • {item.image_count} photos</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}