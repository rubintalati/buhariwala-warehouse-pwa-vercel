'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, MapPin, Calendar, User, Phone, Mail, FileText, Package, Camera, Check, X, Send, Sparkles } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface JobLocation {
  id: string
  location_type: 'pickup' | 'delivery'
  address: string
  city: string
  state: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  date?: string
  special_instructions?: string
  sequence_order: number
  delivery_id?: number
  item_count?: number
}

interface Job {
  id: string
  job_number: string
  client_name: string
  client_phone: string
  client_email?: string
  pickup_address: string
  delivery_address: string
  pickup_date: string
  delivery_date?: string
  status: 'draft' | 'pending' | 'pending_approval' | 'in_progress' | 'completed' | 'cancelled'
  job_type?: string
  warehouse_holding?: boolean
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  total_items?: number
  warehouse_entry?: {
    name: string
    from_date: string
    to_date: string
  }
  pickup_locations?: JobLocation[]
  delivery_locations?: JobLocation[]
}

export default function JobDetailsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    if (jobId) {
      loadJob()
    }
  }, [jobId])

  const loadJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load job details')
        return
      }

      setJob(result.data)
    } catch (error) {
      console.error('Error loading job:', error)
      setError('Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-50 text-gray-600 border-gray-300'
      case 'pending_approval':
        return 'bg-yellow-50 text-yellow-600 border-yellow-300'
      case 'in_progress':
        return 'bg-blue-50 text-blue-600 border-blue-300'
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-300'
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-300'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-300'
    }
  }

  const formatStatusName = (status: string) => {
    if (status === 'pending_approval') {
      return 'Pending Approval'
    }
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const submitForApproval = async () => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job?.id,
          updates: { status: 'pending_approval', submitted_at: new Date().toISOString() }
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to submit for approval')
        return
      }

      await loadJob() // Reload to show updated status
    } catch (error) {
      console.error('Error submitting for approval:', error)
      setError('Failed to submit for approval')
    }
  }

  const approveJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${job?.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve'
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to approve job')
        return
      }

      await loadJob() // Reload to show updated status
    } catch (error) {
      console.error('Error approving job:', error)
      setError('Failed to approve job')
    }
  }

  const rejectJob = async () => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason?.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/${job?.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: reason
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Failed to reject job')
        return
      }

      await loadJob() // Reload to show updated status
    } catch (error) {
      console.error('Error rejecting job:', error)
      setError('Failed to reject job')
    }
  }


  const updateJobStatus = async (newStatus: Job['status']) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job?.id,
          updates: { status: newStatus }
        }),
      })

      if (response.ok) {
        await loadJob() // Reload job data
      }
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="font-semibold">Loading Job Details</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-500">{error || 'The requested job could not be found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Matching Create Job Page Style */}
      <div className="flex flex-col gap-6">
        {/* Navigation and Title */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Main Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{job.client_name}</h1>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(job.status)}`}>
              {formatStatusName(job.status)}
            </div>
          </div>
          <p className="text-lg text-muted-foreground">{job.job_number}</p>
        </div>

        {/* Action Buttons - Matching Create Job Page Style */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-foreground">Actions</h3>
              <div className="flex flex-wrap gap-3">
                {/* Draft Status Actions */}
                {job.status === 'draft' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Job
                    </Button>
                    {job.total_items && job.total_items > 0 && (
                      <Button
                        onClick={submitForApproval}
                        className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Submit for Approval
                      </Button>
                    )}
                  </>
                )}

                {/* Pending Approval Actions */}
                {job.status === 'pending_approval' && (
                  <>
                    <Button
                      onClick={() => approveJob()}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectJob()}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </>
                )}

                {/* In Progress & Completed Actions */}
                {(job.status === 'in_progress' || job.status === 'completed') && (
                  <>
                    {job.status === 'in_progress' && (
                      <Button
                        onClick={() => updateJobStatus('completed')}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="font-semibold">{job.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="font-semibold">{job.client_phone}</p>
                </div>
                {job.client_email && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="font-semibold">{job.client_email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pickup Locations */}
              {job.pickup_locations && job.pickup_locations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Pickup Locations ({job.pickup_locations.length})
                  </h4>
                  <div className="space-y-3">
                    {job.pickup_locations.map((location, index) => (
                      <div key={location.id} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            Pickup #{index + 1}
                          </span>
                        </div>
                        <p className="font-medium text-foreground mb-2">{location.address}</p>
                        <p className="text-sm text-muted-foreground">{location.city}, {location.state}</p>
                        {location.contact_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Contact: {location.contact_name} {location.contact_phone && `• ${location.contact_phone}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouse Entry (if exists) */}
              {job.warehouse_entry && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    Warehouse Storage
                  </h4>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="font-medium text-foreground mb-2">{job.warehouse_entry.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.warehouse_entry.from_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} - {new Date(job.warehouse_entry.to_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Locations */}
              {job.delivery_locations && job.delivery_locations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Delivery Locations ({job.delivery_locations.length})
                  </h4>
                  <div className="space-y-3">
                    {job.delivery_locations.map((location, index) => (
                      <div key={location.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            Delivery #{index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {location.item_count || 0} items
                          </span>
                        </div>
                        <p className="font-medium text-foreground mb-2">{location.address}</p>
                        <p className="text-sm text-muted-foreground">{location.city}, {location.state}</p>
                        {location.contact_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Contact: {location.contact_name} {location.contact_phone && `• ${location.contact_phone}`}
                          </p>
                        )}

                        {/* Location-specific Item Management Button */}
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/jobs/${job.id}/items?delivery_id=${index + 1}`)}
                            className="text-green-700 border-green-300 hover:bg-green-100 text-xs"
                          >
                            <Package className="w-3 h-3 mr-1" />
                            Manage Items ({location.item_count || 0})
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback for jobs without multi-location data */}
              {(!job.pickup_locations || job.pickup_locations.length === 0) && (!job.delivery_locations || job.delivery_locations.length === 0) && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Pickup Address</p>
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="font-medium">{job.pickup_address}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Delivery Address</p>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium">{job.delivery_address}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup Date</p>
                  <p className="font-semibold">
                    {new Date(job.pickup_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {job.delivery_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery Date</p>
                    <p className="font-semibold">
                      {new Date(job.delivery_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{job.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions - Hide for completed jobs */}
          {job.status !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* General Item Management - for single delivery or overall view */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/jobs/${job.id}/items`)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage All Items
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-semibold text-foreground">{job.total_items || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pickup Locations</span>
                  <span className="font-semibold text-foreground">{job.pickup_locations?.length || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Locations</span>
                  <span className="font-semibold text-foreground">{job.delivery_locations?.length || 1}</span>
                </div>
                {job.warehouse_holding && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Warehouse Storage</span>
                    <span className="font-semibold text-orange-600">Yes</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Created</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(job.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                {job.created_by && (
                  <p className="text-xs text-muted-foreground mt-1">
                    by {job.created_by}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}