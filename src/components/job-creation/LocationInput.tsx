'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, MapPin, Calendar } from 'lucide-react'

interface Location {
  id: string
  type: 'pickup' | 'delivery'
  address: string
  city: string
  state: string
  contactName: string
  contactPhone: string
  contactEmail: string
  date: string
  specialInstructions: string
  sequenceOrder: number
}

interface LocationInputProps {
  location: Location
  onUpdate: (location: Location) => void
  onRemove: (locationId: string) => void
  canRemove: boolean
  isFirst: boolean
  isLast: boolean
}

export default function LocationInput({
  location,
  onUpdate,
  onRemove,
  canRemove,
  isFirst,
  isLast
}: LocationInputProps) {
  const handleFieldChange = (field: keyof Location, value: string | number) => {
    onUpdate({
      ...location,
      [field]: value
    })
  }

  const getLocationIcon = () => {
    return location.type === 'pickup' ? (
      <MapPin className="w-5 h-5 text-primary" />
    ) : (
      <MapPin className="w-5 h-5 text-green-600" />
    )
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {getLocationIcon()}
          {location.type === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
          <span className="text-sm font-normal text-muted-foreground">
            #{location.sequenceOrder}
          </span>
        </h3>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(location.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Address Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Address *</label>
            <Input
              value={location.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Enter complete address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">City *</label>
            <Input
              value={location.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="City"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State *</label>
            <Input
              value={location.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              placeholder="State"
              required
            />
          </div>
        </div>


        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date *
          </label>
          <Input
            value={location.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            type="date"
            required
            className="max-w-xs"
          />
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-sm font-medium mb-2">Special Instructions</label>
          <textarea
            value={location.specialInstructions}
            onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
            placeholder="Access requirements, elevator availability, loading dock instructions, etc."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>
    </div>
  )
}