'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, RotateCcw, Check, X, Upload, Loader2 } from 'lucide-react'

interface CameraCaptureProps {
  onCapture?: (imageData: string, file: File) => void
  onMultipleCapture?: (imageDatas: string[], files: File[]) => void
  onCancel?: () => void
  disabled?: boolean
  title?: string
  description?: string
  acceptFileUpload?: boolean
  allowMultiple?: boolean
  maxFiles?: number
}

export default function CameraCapture({
  onCapture,
  onMultipleCapture,
  onCancel,
  disabled = false,
  title = "Capture Item Photo",
  description = "Take a photo or upload an image for AI identification",
  acceptFileUpload = true,
  allowMultiple = false,
  maxFiles = 5
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
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
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Try different camera configurations for better mobile compatibility
      const constraints = [
        // Try with back camera first (preferred for mobile)
        {
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            facingMode: { exact: 'environment' }
          }
        },
        // Fallback to any back camera
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'environment'
          }
        },
        // Fallback to front camera
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          }
        },
        // Final fallback - any camera
        {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        }
      ]

      let stream: MediaStream | null = null

      // Try each constraint configuration
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint)
          break
        } catch (constraintError) {
          console.log('Failed with constraint:', constraint, constraintError)
          continue
        }
      }

      if (!stream) {
        throw new Error('Unable to access any camera')
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)

        // Handle camera loading
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(playError => {
            console.error('Error playing video:', playError)
            setError('Unable to start camera preview')
          })
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)

      let errorMessage = 'Unable to access camera'

      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions and try again.'
            break
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.'
            break
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported. Try uploading an image instead.'
            break
          case 'SecurityError':
            errorMessage = 'Camera access blocked due to security settings.'
            break
          default:
            errorMessage = `Camera error: ${error.message}`
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setError(errorMessage)
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

    if (!context) {
      setError('Unable to capture photo. Please try again.')
      return
    }

    try {
      // Check if video is ready
      if (video.readyState < 2) {
        setError('Camera not ready. Please wait and try again.')
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight

      if (canvas.width === 0 || canvas.height === 0) {
        setError('Invalid camera dimensions. Please try again.')
        return
      }

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob and data URL with error handling
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.9)

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            })

            if (allowMultiple) {
              setCapturedImages(prev => [...prev, dataURL])
              setSelectedFiles(prev => [...prev, file])
            } else {
              setCapturedImage(dataURL)
              setSelectedFiles([file])
              stopCamera()
            }
          } else {
            setError('Failed to create image file. Please try again.')
          }
        }, 'image/jpeg', 0.9)
      } catch (canvasError) {
        console.error('Canvas error:', canvasError)
        setError('Failed to process image. Please try again.')
      }
    } catch (error) {
      console.error('Capture error:', error)
      setError('Failed to capture photo. Please try again.')
    }
  }, [stopCamera, allowMultiple])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    const imageDataUrls: string[] = []
    let processedCount = 0

    // Validate file types
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not a valid image file.`)
        return
      }
      if (allowMultiple && validFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} images allowed.`)
        break
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Process files
    validFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataURL = e.target?.result as string
        if (dataURL) {
          imageDataUrls[index] = dataURL
          processedCount++

          // When all files are processed
          if (processedCount === validFiles.length) {
            if (allowMultiple && validFiles.length > 1) {
              setCapturedImages(imageDataUrls)
              setSelectedFiles(validFiles)
            } else {
              setCapturedImage(imageDataUrls[0])
              setSelectedFiles([validFiles[0]])
            }
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }, [allowMultiple, maxFiles])

  const confirmCapture = useCallback(() => {
    if (allowMultiple && capturedImages.length > 0) {
      // Handle multiple images
      if (onMultipleCapture) {
        if (selectedFiles.length > 0) {
          // Files already exist (from gallery upload)
          onMultipleCapture(capturedImages, selectedFiles)
        } else {
          // Need to convert captured images to files
          const promises = capturedImages.map((imageData, index) => {
            return fetch(imageData)
              .then(res => res.blob())
              .then(blob => {
                return new File([blob], `photo-${Date.now()}-${index}.jpg`, {
                  type: 'image/jpeg'
                })
              })
          })

          Promise.all(promises)
            .then(files => {
              onMultipleCapture(capturedImages, files)
              // Reset state after successful processing
              setCapturedImage(null)
              setCapturedImages([])
              setSelectedFiles([])
              setError('')
            })
            .catch(error => {
              console.error('Error converting images to files:', error)
              setError('Failed to process captured images')
            })
        }
      }
    } else if (capturedImage) {
      // Handle single image
      if (selectedFiles.length > 0) {
        // Use uploaded file
        onCapture?.(capturedImage, selectedFiles[0])
      } else {
        // Convert captured image to file
        fetch(capturedImage)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `photo-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            })
            onCapture?.(capturedImage, file)
          })
      }
    }

    // Reset state (only if not converting images)
    if (allowMultiple && capturedImages.length > 0 && selectedFiles.length === 0) {
      // Don't reset immediately if we're converting images
      return
    }

    setCapturedImage(null)
    setCapturedImages([])
    setSelectedFiles([])
    setError('')
  }, [capturedImage, capturedImages, selectedFiles, allowMultiple, onCapture, onMultipleCapture])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setCapturedImages([])
    setSelectedFiles([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleCancel = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setCapturedImages([])
    setSelectedFiles([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onCancel?.()
  }, [stopCamera, onCancel])

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Card className="overflow-hidden">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg md:text-xl">
            <Camera className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-sm md:text-base">{description}</CardDescription>
        </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Camera View */}
        {isStreaming && !capturedImage && (!allowMultiple || capturedImages.length === 0) && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-96 object-cover"
              onError={() => setError('Camera preview failed to load')}
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <Button
                onClick={capturePhoto}
                disabled={disabled || (allowMultiple && capturedImages.length >= maxFiles)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
              >
                <Camera className="w-5 h-5" />
              </Button>
              {allowMultiple && capturedImages.length > 0 && (
                <Button
                  onClick={stopCamera}
                  className="bg-green-500/80 hover:bg-green-600/80 backdrop-blur-sm border border-white/30 text-white"
                >
                  <Check className="w-5 h-5" />
                </Button>
              )}
            </div>
            {allowMultiple && (
              <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
                {capturedImages.length}/{maxFiles}
              </div>
            )}
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && !allowMultiple && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured item"
              className="w-full h-auto max-h-96 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* Multiple Images Preview */}
        {capturedImages.length > 0 && allowMultiple && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Images ({capturedImages.length}/{maxFiles})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {capturedImages.map((imageData, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageData}
                    alt={`Selected item ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = capturedImages.filter((_, i) => i !== index)
                      const newFiles = selectedFiles.filter((_, i) => i !== index)
                      setCapturedImages(newImages)
                      setSelectedFiles(newFiles)
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
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
                    {allowMultiple ? 'Take Photos' : 'Start Camera'}
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
                      multiple={allowMultiple}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || (allowMultiple && capturedImages.length >= maxFiles)}
                      className="w-full"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {allowMultiple ? `Upload Images (${capturedImages.length}/${maxFiles})` : 'Upload Image'}
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

          {(capturedImage || capturedImages.length > 0) && (
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
                disabled={disabled || (allowMultiple ? capturedImages.length === 0 : !capturedImage)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              >
                <Check className="w-4 h-4 mr-2" />
                {allowMultiple && capturedImages.length > 1 ? `Use ${capturedImages.length} Photos` : 'Use Photo'}
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
    </div>
  )
}