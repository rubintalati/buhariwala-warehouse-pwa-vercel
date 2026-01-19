'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Package, Camera, Edit, Trash2, Sparkles, PlusCircle } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/custom-auth'
import AIItemIdentifier from '@/components/ai/AIItemIdentifier'

interface Item {
  id: string
  job_id: string
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
  item_value?: number
  created_at: string
  image_count?: number
}

interface Job {
  id: string
  job_number: string
  client_name: string
  status: string
}

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

export default function JobItemsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAICapture, setShowAICapture] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Manual form state
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Furniture',
    quantity: 1,
    condition: 'good',
    item_value: 0,
    dimensions: '',
    handling_instructions: '',
    fragile: false,
  })

  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setCurrentUser(user)
    if (jobId) {
      loadData()
    }
  }, [jobId, router])

  const loadData = async () => {
    try {
      // Load job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`)
      const jobResult = await jobResponse.json()

      if (jobResponse.ok) {
        setJob(jobResult.data)
      }

      // Load items
      const itemsResponse = await fetch(`/api/jobs/${jobId}/items`)
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
      const response = await fetch(`/api/jobs/${jobId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: aiItem.itemName,
          category: aiItem.category,
          quantity: aiItem.quantity || 1,
          condition: aiItem.condition,
          item_value: aiItem.estimatedValue || 0,
          dimensions: aiItem.dimensions,
          handling_instructions: aiItem.handlingInstructions,
          fragile: aiItem.isFragile,
          ai_confidence_score: aiItem.confidenceScore,
          manual_verification: aiItem.confidenceScore < 0.8,
          created_by: currentUser?.id,
          imageData
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ai_confidence_score: null,
          manual_verification: false, // Manually entered items don't need verification
          created_by: currentUser?.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create item')
        return
      }

      await loadData()
      setShowManualForm(false)
      setFormData({
        item_name: '',
        category: 'Furniture',
        quantity: 1,
        condition: 'good',
        item_value: 0,
        dimensions: '',
        handling_instructions: '',
        fragile: false,
      })
    } catch (error) {
      console.error('Error creating item:', error)
      setError('Failed to create item')
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? (name === 'item_value' ? parseFloat(value) || 0 : parseInt(value) || 1) : value
    }))
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

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setFormData({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      condition: item.condition,
      item_value: item.item_value || 0,
      dimensions: item.dimensions || '',
      handling_instructions: item.handling_instructions || '',
      fragile: item.fragile,
    })
    setShowManualForm(true)
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setIsEditing(true)
    setError('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: editingItem.id,
          ...formData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update item')
        return
      }

      // Reset form and close modal
      setFormData({
        item_name: '',
        category: 'Furniture',
        quantity: 1,
        condition: 'good',
        item_value: 0,
        dimensions: '',
        handling_instructions: '',
        fragile: false,
      })
      setEditingItem(null)
      setShowManualForm(false)

      // Reload items
      await loadData()
    } catch (error) {
      console.error('Error updating item:', error)
      setError('Failed to update item')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.item_name}"?`)) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/items?itemId=${item.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to delete item')
        return
      }

      // Reload items
      await loadData()
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.item_value || 0), 0)
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
          <p className="font-semibold">Loading Items</p>
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

      {/* Header Section - Match Jobs Page Pattern */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {job && (
            <div className="flex flex-col">
              <p className="text-lg text-muted-foreground">
                {job.job_number}
              </p>
              <p className="text-lg text-muted-foreground">
                {job.client_name}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowManualForm(!showManualForm)}
              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary font-semibold px-6 w-fit"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item Manually
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAICapture(true)}
              className="text-xs w-fit"
            >
              <Camera className="mr-2 h-3 w-3" />
              Add via Image (Testing)
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{items.length} Items</span>
            </div>
            {getTotalValue() > 0 && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                <span className="text-sm font-medium text-green-600">{formatCurrency(getTotalValue())} Total</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Form */}
      {showManualForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Item' : 'Add Item Manually'}</CardTitle>
            <CardDescription>
              {editingItem ? 'Update the item details below' : 'Enter item details manually without using AI identification'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingItem ? handleUpdateItem : handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name *</label>
                  <Input
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Wooden Dining Table"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {ITEM_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {CONDITION_OPTIONS.map(condition => (
                      <option key={condition} value={condition}>{condition.charAt(0).toUpperCase() + condition.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Value (₹)</label>
                  <Input
                    type="number"
                    name="item_value"
                    value={formData.item_value}
                    onChange={handleInputChange}
                    placeholder="15000"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dimensions</label>
                <Input
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 180cm L x 90cm W x 80cm H"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Handling Instructions</label>
                <Textarea
                  name="handling_instructions"
                  value={formData.handling_instructions}
                  onChange={handleInputChange}
                  placeholder="Only mention visible damage, marks, scratches, or color loss"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="fragile"
                  checked={formData.fragile}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label className="text-sm font-medium">Fragile Item</label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isCreating || isEditing}>
                  {editingItem ? (isEditing ? 'Updating...' : 'Update Item') : (isCreating ? 'Adding Item...' : 'Add Item')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowManualForm(false)
                  setEditingItem(null)
                  setFormData({
                    item_name: '',
                    category: 'Furniture',
                    quantity: 1,
                    condition: 'good',
                    item_value: 0,
                    dimensions: '',
                    handling_instructions: '',
                    fragile: false,
                  })
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Added</h3>
                <p className="text-gray-500 mb-6 text-center">
                  Start by capturing photos with AI identification or adding items manually.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAICapture(true)}
                    className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Add with AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manually
                  </Button>
                </div>
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
                    {item.item_value && (
                      <div className="mt-2">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(item.item_value)}
                        </div>
                      </div>
                    )}
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
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteItem(item)}
                    disabled={isDeleting}
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