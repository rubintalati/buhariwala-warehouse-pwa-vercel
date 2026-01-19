'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PenTool, RotateCcw, Check, X } from 'lucide-react'

interface SignatureCaptureProps {
  title: string
  description: string
  onSignatureComplete: (signature: string, signerName: string, date: string) => void
  onCancel?: () => void
  trigger?: React.ReactNode
}

export default function SignatureCapture({
  title,
  description,
  onSignatureComplete,
  onCancel,
  trigger
}: SignatureCaptureProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [signerName, setSignerName] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const clearSignature = () => {
    signatureRef.current?.clear()
    setHasSignature(false)
  }

  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setHasSignature(true)
    }
  }

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty() && signerName.trim()) {
      const signatureData = signatureRef.current.toDataURL()
      const currentDate = new Date().toLocaleString('en-IN')

      onSignatureComplete(signatureData, signerName.trim(), currentDate)

      // Reset form
      clearSignature()
      setSignerName('')
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    clearSignature()
    setSignerName('')
    setIsOpen(false)
    onCancel?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Add Signature
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signer Name Input */}
          <div className="space-y-2">
            <Label htmlFor="signerName">Full Name</Label>
            <Input
              id="signerName"
              placeholder="Enter full name of the signer"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>

          {/* Signature Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Digital Signature</CardTitle>
              <CardDescription>
                Sign in the box below using your finger or stylus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas w-full h-48'
                  }}
                  onEnd={handleSignatureEnd}
                  backgroundColor="white"
                  penColor="black"
                />
              </div>

              {/* Signature Controls */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {hasSignature ? '✓ Signature captured' : 'Please sign above'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={!hasSignature}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Date Display */}
          <div className="text-sm text-gray-600">
            <strong>Date:</strong> {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasSignature || !signerName.trim()}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Signature
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Additional export for signature data type
export interface SignatureData {
  signature: string
  signerName: string
  date: string
}