'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, RotateCcw, Check, X, Upload, Loader2 } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: string, file: File) => void
  onCancel?: () => void
  disabled?: boolean
  title?: string
  description?: string
  acceptFileUpload?: boolean
}

export default function CameraCapture({
  onCapture,
  onCancel,
  disabled = false,
  title = "Capture Item Photo",
  description = "Take a photo or upload an image for AI identification",
  acceptFileUpload = true
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    setError('')
    setIsLoading(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use back camera on mobile
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Unable to access camera. Please check permissions.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and data URL
    canvas.toBlob((blob) => {
      if (blob) {
        const dataURL = canvas.toDataURL('image/jpeg', 0.9)
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        })

        setCapturedImage(dataURL)
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataURL = e.target?.result as string
      if (dataURL) {
        setCapturedImage(dataURL)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const confirmCapture = useCallback(() => {
    if (!capturedImage) return

    if (fileInputRef.current?.files?.[0]) {
      // Use uploaded file
      onCapture(capturedImage, fileInputRef.current.files[0])
    } else {
      // Convert captured image to file
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          })
          onCapture(capturedImage, file)
        })
    }

    // Reset state
    setCapturedImage(null)
    setError('')
  }, [capturedImage, onCapture])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleCancel = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onCancel?.()
  }, [stopCamera, onCancel])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Camera View */}
        {isStreaming && !capturedImage && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-96 object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button
                onClick={capturePhoto}
                disabled={disabled}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
              >
                <Camera className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured item"
              className="w-full h-auto max-h-96 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {!isStreaming && !capturedImage && (
            <>
              <Button
                onClick={startCamera}
                disabled={disabled || isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting Camera...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>

              {acceptFileUpload && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                      className="w-full"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {isStreaming && !capturedImage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={stopCamera}
                disabled={disabled}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {capturedImage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={retakePhoto}
                disabled={disabled}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                disabled={disabled}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
          )}

          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={disabled}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}