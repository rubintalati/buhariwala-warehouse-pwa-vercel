'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Clock, Eye, MapPin, Calendar, User } from 'lucide-react'
import { getCurrentUser, canApproveJobs } from '@/lib/custom-auth'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  job_number: string
  client_name: string
  client_phone: string
  client_email?: string
  pickup_address: string
  delivery_address: string
  pickup_date: string
  status: 'draft' | 'pending_review' | 'approved' | 'in_progress' | 'completed'
  created_by: string
  created_at: string
  submitted_at?: string
  notes?: string
  locations?: any[]
}

export default function ApprovalsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!canApproveJobs(currentUser)) {
      router.push('/dashboard')
      return
    }

    loadPendingJobs()
  }, [router])

  const loadPendingJobs = async () => {
    try {
      const response = await fetch('/api/jobs/approvals')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load pending jobs')
        return
      }

      setJobs(result.data || [])
    } catch (error) {
      console.error('Error loading pending jobs:', error)
      setError('Failed to load pending jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (jobId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/jobs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          action: 'approve',
          approvedBy: getCurrentUser()?.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to approve job')
        return
      }

      await loadPendingJobs()
      setSelectedJob(null)
    } catch (error) {
      console.error('Error approving job:', error)
      setError('Failed to approve job')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedJob || !rejectionReason.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/jobs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          action: 'reject',
          rejectionReason,
          approvedBy: getCurrentUser()?.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to reject job')
        return
      }

      await loadPendingJobs()
      setShowRejectModal(false)
      setSelectedJob(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Error rejecting job:', error)
      setError('Failed to reject job')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
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
            <p className="font-semibold">Loading Approvals</p>
            <p className="text-sm text-gray-500">Fetching pending jobs...</p>
          </div>
        </div>
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
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Job Approvals</h1>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{jobs.length} Pending</span>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Review and approve jobs submitted by makers
          </p>
        </div>
      </div>

      {/* Pending Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
                <p className="text-gray-500 text-center">
                  All jobs have been reviewed. New submissions will appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          jobs.map((job) => (
            <Card
              key={job.id}
              className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {job.job_number}
                    </h3>
                    <p className="font-medium text-foreground">
                      {job.client_name}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Pickup</p>
                      <p className="text-sm text-muted-foreground truncate">{job.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Delivery</p>
                      <p className="text-sm text-muted-foreground truncate">{job.delivery_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.pickup_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Submitted by</p>
                      <p className="text-sm text-muted-foreground">{job.created_by}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-0 shadow-sm hover:shadow-md"
                      onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(job.id)}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-0 shadow-sm text-red-600 hover:bg-red-50 hover:shadow-md"
                      onClick={() => {
                        setSelectedJob(job)
                        setShowRejectModal(true)
                      }}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Reject Job</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for rejecting {selectedJob.job_number}
              </p>
              <div className="space-y-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                    setSelectedJob(null)
                  }}
                  className="flex-1 border-0 shadow-sm hover:shadow-md"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isProcessing || !rejectionReason.trim()}
                >
                  {isProcessing ? 'Rejecting...' : 'Reject Job'}
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}