'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function EditJobPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [job, setJob] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    if (jobId) {
      loadJob()
    }
  }, [jobId])

  // Redirect to edit form if job is draft - must be before conditional returns
  useEffect(() => {
    if (job && job.status === 'draft') {
      // Small delay to ensure the current page is in history
      setTimeout(() => {
        router.replace(`/dashboard/jobs/new?edit=${jobId}`)
      }, 100)
    }
  }, [job, jobId, router])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Edit Job</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Error Loading Job</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (job?.status !== 'draft') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Edit Job</h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-yellow-700 font-medium">Cannot Edit Job</p>
            <p className="text-yellow-600 text-sm">
              Jobs can only be edited when they are in draft status. This job is currently: {job.status.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          size="sm"
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Job</h1>
          <p className="text-sm text-muted-foreground">{job.job_number} - {job.client_name}</p>
        </div>
      </div>

      {/* Redirecting Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Redirecting to Edit Form</h2>
        <p className="text-blue-700 mb-4">
          You will be redirected to the job creation form with your current data pre-filled for editing.
        </p>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}