'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, User, Phone, Mail, Plus, Settings, MapPin, Send } from 'lucide-react'
import { getCurrentUser, isMaker } from '@/lib/custom-auth'
import { useRouter } from 'next/navigation'
import LocationInput from '@/components/job-creation/LocationInput'
import WarehouseSelector from '@/components/job-creation/WarehouseSelector'

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

export default function NewJobPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [submitType, setSubmitType] = useState<'draft' | 'review'>('draft')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editJobId, setEditJobId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Client information
  const [clientData, setClientData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
  })

  // Locations
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      type: 'pickup',
      address: '',
      city: '',
      state: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      date: '',
      specialInstructions: '',
      sequenceOrder: 1
    },
    {
      id: '2',
      type: 'delivery',
      address: '',
      city: '',
      state: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      date: '',
      specialInstructions: '',
      sequenceOrder: 2
    }
  ])

  // Warehouse options
  const [warehouseEnabled, setWarehouseEnabled] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [storageStartDate, setStorageStartDate] = useState('')
  const [storageEndDate, setStorageEndDate] = useState('')

  // Additional notes
  const [notes, setNotes] = useState('')

  // Load job data for editing
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditMode(true)
      setEditJobId(editId)
      loadJobForEdit(editId)
    }
  }, [searchParams])

  const loadJobForEdit = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load job for editing')
        return
      }

      const job = result.data

      // Pre-fill the form with existing data
      setClientData({
        client_name: job.client_name || '',
        client_phone: job.client_phone || '',
        client_email: job.client_email || '',
      })

      setWarehouseEnabled(job.warehouse_holding || false)
      setSelectedWarehouseId(job.selected_warehouse_id || null)

      // Set warehouse dates - prioritize existing dates, then fall back to location dates
      let startDate = job.estimated_storage_start_date || ''
      let endDate = job.estimated_storage_end_date || ''

      // If warehouse is enabled but dates are empty, try to get from location dates
      if (job.warehouse_holding && !startDate && !endDate) {
        const pickupLocation = job.pickup_locations?.find((loc: any) => loc.location_type === 'pickup')
        const deliveryLocation = job.delivery_locations?.find((loc: any) => loc.location_type === 'delivery')

        if (pickupLocation?.date) {
          startDate = pickupLocation.date
        }
        if (deliveryLocation?.date) {
          endDate = deliveryLocation.date
        }
      }

      setStorageStartDate(startDate)
      setStorageEndDate(endDate)
      setNotes(job.notes || '')

      // Set locations from the job data
      if (job.pickup_locations && job.delivery_locations) {
        const allLocations = [...job.pickup_locations, ...job.delivery_locations]
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map(loc => ({
            id: loc.id || Date.now().toString(),
            type: loc.location_type,
            address: loc.address || '',
            city: loc.city || '',
            state: loc.state || '',
            contactName: loc.contact_name || '',
            contactPhone: loc.contact_phone || '',
            contactEmail: loc.contact_email || '',
            date: loc.date || '',
            specialInstructions: loc.special_instructions || '',
            sequenceOrder: loc.sequence_order
          }))

        if (allLocations.length > 0) {
          setLocations(allLocations)
          setIsAdvancedMode(allLocations.length > 2)
        }
      }
    } catch (error) {
      console.error('Error loading job for edit:', error)
      setError('Failed to load job for editing')
    }
  }

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setClientData(prev => ({ ...prev, [name]: value }))
  }

  const updateLocation = (updatedLocation: Location) => {
    setLocations(prev => prev.map(loc =>
      loc.id === updatedLocation.id ? updatedLocation : loc
    ))
  }

  const addLocation = (type: 'pickup' | 'delivery') => {
    const newLocation: Location = {
      id: Date.now().toString(),
      type,
      address: '',
      city: '',
      state: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      date: '',
      specialInstructions: '',
      sequenceOrder: locations.length + 1
    }
    setLocations(prev => [...prev, newLocation])
  }

  const removeLocation = (locationId: string) => {
    setLocations(prev => {
      const filtered = prev.filter(loc => loc.id !== locationId)
      // Resequence the remaining locations
      return filtered.map((loc, index) => ({
        ...loc,
        sequenceOrder: index + 1
      }))
    })
  }

  // Handle warehouse enable/disable with automatic date prefill
  const handleWarehouseEnabledChange = (enabled: boolean) => {
    setWarehouseEnabled(enabled)

    // Auto-prefill warehouse dates when enabling warehouse storage
    if (enabled && !storageStartDate && !storageEndDate) {
      const pickupLocation = locations.find(loc => loc.type === 'pickup')
      const deliveryLocation = locations.find(loc => loc.type === 'delivery')

      if (pickupLocation?.date) {
        setStorageStartDate(pickupLocation.date)
      }
      if (deliveryLocation?.date) {
        setStorageEndDate(deliveryLocation.date)
      }
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        setError('User session expired. Please login again.')
        return
      }

      // Validate that we have at least one pickup and one delivery
      const pickups = locations.filter(loc => loc.type === 'pickup')
      const deliveries = locations.filter(loc => loc.type === 'delivery')

      if (pickups.length === 0 || deliveries.length === 0) {
        setError('Please add at least one pickup and one delivery location.')
        return
      }

      // Determine job type
      let jobType = 'direct_move'
      if (warehouseEnabled) {
        jobType = 'warehouse_storage'
      } else if (locations.length > 2) {
        jobType = 'multi_location'
      }

      const jobData = {
        ...clientData,
        job_type: jobType,
        warehouse_holding: warehouseEnabled,
        selected_warehouse_id: warehouseEnabled ? selectedWarehouseId : null,
        estimated_storage_start_date: warehouseEnabled ? storageStartDate : null,
        estimated_storage_end_date: warehouseEnabled ? storageEndDate : null,
        notes,
        created_by: currentUser.id,
        submit_for_review: submitType === 'review',
        locations: locations
      }

      const response = await fetch('/api/jobs', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditMode ? { ...jobData, id: editJobId } : jobData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create job')
        return
      }

      // Redirect to the job details page
      router.push(`/dashboard/jobs/${result.data.id}`)
    } catch (error) {
      console.error('Error creating job:', error)
      setError('An error occurred while creating the job')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Controls Section */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Advanced Mode Toggle - Right Aligned */}
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Mode:</span>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded transition-colors ${
                !isAdvancedMode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setIsAdvancedMode(false)}
            >
              Simple
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isAdvancedMode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setIsAdvancedMode(true)}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name *</label>
                <Input
                  name="client_name"
                  value={clientData.client_name}
                  onChange={handleClientChange}
                  placeholder="Enter client's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </label>
                <Input
                  name="client_phone"
                  type="tel"
                  value={clientData.client_phone}
                  onChange={handleClientChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                name="client_email"
                type="email"
                value={clientData.client_email}
                onChange={handleClientChange}
                placeholder="Enter email address (optional)"
              />
            </div>
          </CardContent>
        </Card>


        {/* Location Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {isAdvancedMode ? 'Location Management' : 'Pickup & Delivery Locations'}
              </CardTitle>

              {isAdvancedMode && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLocation('pickup')}
                    className="justify-start"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Pickup
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLocation('delivery')}
                    className="justify-start"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Delivery
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {locations.map((location, index) => (
              <LocationInput
                key={location.id}
                location={location}
                onUpdate={updateLocation}
                onRemove={removeLocation}
                canRemove={isAdvancedMode && locations.length > 2}
                isFirst={index === 0}
                isLast={index === locations.length - 1}
              />
            ))}
          </CardContent>
        </Card>

        {/* Warehouse Storage (Optional) */}
        <WarehouseSelector
          isWarehouseEnabled={warehouseEnabled}
          onWarehouseEnabledChange={handleWarehouseEnabledChange}
          selectedWarehouseId={selectedWarehouseId}
          onWarehouseSelect={setSelectedWarehouseId}
          storageStartDate={storageStartDate}
          onStorageStartDateChange={setStorageStartDate}
          storageEndDate={storageEndDate}
          onStorageEndDateChange={setStorageEndDate}
        />

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any special instructions, fragile items, access requirements, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          {/* Create Job */}
          <Button
            type="submit"
            disabled={isCreating}
            className="bg-gradient-to-r from-red-800 to-red-700 hover:from-red-900 hover:to-red-800 font-semibold px-8"
            onClick={() => setSubmitType('draft')}
          >
            <Save className="mr-2 h-4 w-4" />
            {isCreating ? (isEditMode ? 'Updating Job...' : 'Creating Job...') : (isEditMode ? 'Update Job' : 'Create Job')}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isCreating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}