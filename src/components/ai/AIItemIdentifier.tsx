'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Edit, Save, AlertTriangle, CheckCircle, Camera, Loader2 } from 'lucide-react'
import CameraCapture from '@/components/camera/CameraCapture'

interface AIIdentifiedItem {
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

interface AIItemIdentifierProps {
  roomType?: string
  onItemIdentified: (item: AIIdentifiedItem, imageData: string) => void
  onItemsIdentified?: (items: AIIdentifiedItem[], imageDatas: string[]) => void
  onCancel?: () => void
  disabled?: boolean
  allowMultiplePhotos?: boolean
}

export default function AIItemIdentifier({
  roomType = 'general',
  onItemIdentified,
  onItemsIdentified,
  onCancel,
  disabled = false,
  allowMultiplePhotos = false
}: AIItemIdentifierProps) {
  const [step, setStep] = useState<'camera' | 'analyzing' | 'review'>('camera')
  const [imageDatas, setImageDatas] = useState<string[]>([])
  const [identifiedItems, setIdentifiedItems] = useState<AIIdentifiedItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Editable form state
  const [editedItem, setEditedItem] = useState<AIIdentifiedItem | null>(null)

  // Backward compatibility
  const imageData = imageDatas[0] || ''
  const identifiedItem = identifiedItems[currentItemIndex] || null

  const handleImageCapture = async (imageDataUrl: string, file: File) => {
    // For single photo mode (backward compatibility)
    if (!allowMultiplePhotos) {
      setImageDatas([imageDataUrl])
      setStep('analyzing')
      setIsAnalyzing(true)
      setError('')

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('roomType', roomType)

        const response = await fetch('/api/ai/identify-item', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to identify item')
        }

        setIdentifiedItems([result.data])
        setEditedItem({ ...result.data })
        setCurrentItemIndex(0)
        setStep('review')
      } catch (error) {
        console.error('Error identifying item:', error)
        setError(error instanceof Error ? error.message : 'Failed to identify item')
        setStep('camera')
      } finally {
        setIsAnalyzing(false)
      }
    } else {
      // For multiple photo mode, just add to collection
      setImageDatas(prev => [...prev, imageDataUrl])
    }
  }

  const handleMultiplePhotosProcess = async (files: File[], imageDatas: string[]) => {
    setStep('analyzing')
    setIsAnalyzing(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`image${index}`, file)
      })
      formData.append('roomType', roomType)

      const response = await fetch('/api/ai/identify-item', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to identify items')
      }

      const items = Array.isArray(result.data) ? result.data : [result.data]
      setIdentifiedItems(items)
      setCurrentItemIndex(0)
      if (items.length > 0) {
        setEditedItem({ ...items[0] })
      }
      setStep('review')
    } catch (error) {
      console.error('Error identifying items:', error)
      setError(error instanceof Error ? error.message : 'Failed to identify items')
      setStep('camera')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirm = () => {
    if (allowMultiplePhotos && identifiedItems.length > 1 && onItemsIdentified) {
      onItemsIdentified(identifiedItems, imageDatas)
    } else if (editedItem) {
      onItemIdentified(editedItem, imageData)
    }
  }

  const handleNextItem = () => {
    if (currentItemIndex < identifiedItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1)
      setEditedItem({ ...identifiedItems[currentItemIndex + 1] })
      setIsEditing(false)
    }
  }

  const handlePrevItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1)
      setEditedItem({ ...identifiedItems[currentItemIndex - 1] })
      setIsEditing(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
    if (editedItem) {
      const updatedItems = [...identifiedItems]
      updatedItems[currentItemIndex] = { ...editedItem }
      setIdentifiedItems(updatedItems)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (identifiedItem) {
      setEditedItem({ ...identifiedItem })
    }
  }

  const updateEditedItem = (field: keyof AIIdentifiedItem, value: any) => {
    if (!editedItem) return
    setEditedItem({
      ...editedItem,
      [field]: value
    })
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getConfidenceText = (score: number) => {
    if (score >= 0.8) return 'High Confidence'
    if (score >= 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  if (step === 'camera') {
    return (
      <CameraCapture
        onCapture={handleImageCapture}
        onCancel={onCancel}
        disabled={disabled}
        title="AI Item Identification"
        description={`Take a photo and let AI identify the item${roomType !== 'general' ? ` in your ${roomType}` : ''}`}
      />
    )
  }

  if (step === 'analyzing') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            Analyzing Item
          </CardTitle>
          <CardDescription>
            AI is analyzing your photo to identify the item...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageData && (
            <img
              src={imageData}
              alt="Item being analyzed"
              className="w-full h-auto max-h-64 object-cover rounded-lg border"
            />
          )}

          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">Processing image...</p>
              <p className="text-sm text-muted-foreground">
                This may take a few seconds
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'review' && identifiedItem && editedItem) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Item Identification Results
          </CardTitle>
          <CardDescription>
            Review and edit the AI-generated item details before saving
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div>
              <img
                src={imageData}
                alt="Identified item"
                className="w-full h-auto max-h-80 object-cover rounded-lg border"
              />
            </div>

            {/* Item Details */}
            <div className="space-y-4">
              {/* Confidence Score */}
              <div className={`p-3 rounded-lg border ${getConfidenceColor(identifiedItem.confidenceScore)}`}>
                <div className="flex items-center gap-2">
                  {identifiedItem.confidenceScore >= 0.6 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {getConfidenceText(identifiedItem.confidenceScore)}
                  </span>
                  <span className="text-sm">
                    ({Math.round(identifiedItem.confidenceScore * 100)}%)
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name</label>
                  {isEditing ? (
                    <Input
                      value={editedItem.itemName}
                      onChange={(e) => updateEditedItem('itemName', e.target.value)}
                      placeholder="Enter item name"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.itemName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    {isEditing ? (
                      <select
                        value={editedItem.category}
                        onChange={(e) => updateEditedItem('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="Furniture">Furniture</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Appliances">Appliances</option>
                        <option value="Kitchenware">Kitchenware</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books & Documents">Books & Documents</option>
                        <option value="Artwork & Decorations">Artwork & Decorations</option>
                        <option value="Sports Equipment">Sports Equipment</option>
                        <option value="Tools & Hardware">Tools & Hardware</option>
                        <option value="Personal Items">Personal Items</option>
                        <option value="Fragile Items">Fragile Items</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Condition</label>
                    {isEditing ? (
                      <select
                        value={editedItem.condition}
                        onChange={(e) => updateEditedItem('condition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm capitalize">{editedItem.condition}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedItem.quantity || 1}
                        onChange={(e) => updateEditedItem('quantity', parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min="1"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.quantity || 1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Weight</label>
                    {isEditing ? (
                      <Input
                        value={editedItem.estimatedWeight || ''}
                        onChange={(e) => updateEditedItem('estimatedWeight', e.target.value)}
                        placeholder="e.g., 25-35 kg"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.estimatedWeight || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Value (₹)</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedItem.estimatedValue || ''}
                        onChange={(e) => updateEditedItem('estimatedValue', parseFloat(e.target.value) || 0)}
                        placeholder="15000"
                        min="0"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm">
                        {editedItem.estimatedValue ? `₹${editedItem.estimatedValue.toLocaleString('en-IN')}` : 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dimensions</label>
                    {isEditing ? (
                      <Input
                        value={editedItem.dimensions || ''}
                        onChange={(e) => updateEditedItem('dimensions', e.target.value)}
                        placeholder="e.g., 180cm L x 90cm W x 80cm H"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.dimensions || 'Not specified'}</p>
                    )}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">Handling Instructions</label>
                  {isEditing ? (
                    <Textarea
                      value={editedItem.handlingInstructions || ''}
                      onChange={(e) => updateEditedItem('handlingInstructions', e.target.value)}
                      placeholder="Only mention visible damage, marks, scratches, or color loss"
                      rows={3}
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border text-sm">{editedItem.handlingInstructions || 'No visible damage noted'}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedItem.isFragile}
                    onChange={(e) => updateEditedItem('isFragile', e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label className="text-sm font-medium">Fragile Item</label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </>
            )}

            <Button variant="outline" onClick={() => setStep('camera')}>
              <Camera className="w-4 h-4 mr-2" />
              Retake Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}