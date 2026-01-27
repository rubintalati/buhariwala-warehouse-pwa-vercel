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

        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

        const response = await fetch('/api/ai/identify-item', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

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

        let errorMessage = 'Failed to identify item'

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The AI service may be overloaded. Please try again.'
          } else {
            errorMessage = error.message
          }
        }

        setError(errorMessage)
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
    console.log('handleMultiplePhotosProcess called with:', { filesCount: files?.length, imageDataCount: imageDatas?.length })

    if (!files || files.length === 0) {
      setError('No images provided for processing')
      return
    }

    if (!imageDatas || imageDatas.length === 0) {
      setError('No image data provided for processing')
      return
    }

    setStep('analyzing')
    setIsAnalyzing(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`image${index}`, file)
      })
      formData.append('roomType', roomType)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch('/api/ai/identify-item', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

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

      let errorMessage = 'Failed to identify items'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The AI service may be overloaded. Please try again.'
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
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
        onMultipleCapture={handleMultiplePhotosProcess}
        onCancel={onCancel}
        disabled={disabled}
        allowMultiple={allowMultiplePhotos}
        maxFiles={5}
        title={allowMultiplePhotos ? "AI Multi-Item Identification" : "AI Item Identification"}
        description={allowMultiplePhotos
          ? `Take multiple photos or upload images to identify several items at once${roomType !== 'general' ? ` in your ${roomType}` : ''}`
          : `Take a photo and let AI identify the item${roomType !== 'general' ? ` in your ${roomType}` : ''}`
        }
      />
    )
  }

  if (step === 'analyzing') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            Analyzing {allowMultiplePhotos && imageDatas.length > 1 ? 'Items' : 'Item'}
          </CardTitle>
          <CardDescription>
            AI is analyzing your {allowMultiplePhotos && imageDatas.length > 1 ? `${imageDatas.length} photos` : 'photo'} to identify the item{allowMultiplePhotos && imageDatas.length > 1 ? 's' : ''}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowMultiplePhotos && imageDatas.length > 1 ? (
            <div className="grid grid-cols-2 gap-3">
              {imageDatas.slice(0, 4).map((imgData, index) => (
                <img
                  key={index}
                  src={imgData}
                  alt={`Item being analyzed ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
              ))}
              {imageDatas.length > 4 && (
                <div className="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center text-sm text-gray-500">
                  +{imageDatas.length - 4} more
                </div>
              )}
            </div>
          ) : (
            imageData && (
              <img
                src={imageData}
                alt="Item being analyzed"
                className="w-full h-auto max-h-64 object-cover rounded-lg border"
              />
            )
          )}

          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">
                Processing {allowMultiplePhotos && imageDatas.length > 1 ? `${imageDatas.length} images` : 'image'}...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take {allowMultiplePhotos && imageDatas.length > 1 ? '10-30 seconds' : 'a few seconds'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep('camera')
                setError('')
                setIsAnalyzing(false)
              }}
              disabled={disabled}
              className="flex-1"
            >
              Cancel Analysis
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('camera')}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'review' && identifiedItem && editedItem) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              {allowMultiplePhotos && identifiedItems.length > 1
                ? `AI Results - Item ${currentItemIndex + 1} of ${identifiedItems.length}`
                : 'AI Item Identification Results'
              }
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {allowMultiplePhotos && identifiedItems.length > 1
                ? 'Review each identified item and edit details as needed'
                : 'Review and edit the AI-generated item details before saving'
              }
            </CardDescription>
          </CardHeader>

        <CardContent className="space-y-6">
          {/* Navigation for multiple items */}
          {allowMultiplePhotos && identifiedItems.length > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevItem}
                disabled={currentItemIndex === 0}
                className="w-full sm:w-auto"
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Item</span>
                <div className="flex gap-1">
                  {identifiedItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentItemIndex(index)
                        setEditedItem({ ...identifiedItems[index] })
                        setIsEditing(false)
                      }}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentItemIndex ? 'bg-primary' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {currentItemIndex + 1} of {identifiedItems.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextItem}
                disabled={currentItemIndex === identifiedItems.length - 1}
                className="w-full sm:w-auto"
              >
                Next →
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Image Preview */}
            <div className="space-y-3">
              <div className="relative">
                {(imageDatas[currentItemIndex] || imageData) ? (
                  <img
                    src={imageDatas[currentItemIndex] || imageData}
                    alt={`Identified item ${currentItemIndex + 1}`}
                    className="w-full h-auto max-h-80 object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-100 rounded-lg border shadow-sm flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No image available</p>
                    </div>
                  </div>
                )}
                {allowMultiplePhotos && identifiedItems.length > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                    Image {currentItemIndex + 1} of {identifiedItems.length}
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-4 md:space-y-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveEdit} className="w-full sm:col-span-2">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="w-full">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="w-full order-1 sm:order-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white order-2 sm:order-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {allowMultiplePhotos && identifiedItems.length > 1
                      ? `Add ${identifiedItems.length} Items`
                      : 'Add Item'
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep('camera')}
                    className="w-full order-3 sm:order-3"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                </>
              )}
            </div>

            {/* Progress indicator for multiple items */}
            {allowMultiplePhotos && identifiedItems.length > 1 && !isEditing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <span>Reviewing item {currentItemIndex + 1} of {identifiedItems.length}</span>
                  {currentItemIndex < identifiedItems.length - 1 && (
                    <span className="text-blue-600">→ Continue to review all items before adding</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    )
  }

  return null
}