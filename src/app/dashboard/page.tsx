'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, BarChart3, MapPin, Calendar, FileText } from 'lucide-react'
import { getCurrentUser } from '@/lib/custom-auth'

interface Job {
  id: string
  job_number: string
  client_name: string
  client_phone: string
  pickup_address: string
  delivery_address: string
  pickup_date: string
  delivery_date: string
  status: 'draft' | 'pending_approval' | 'in_progress' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    loadRecentJobs()
  }, [router])

  const loadRecentJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load jobs')
        return
      }

      // Get the 6 most recent jobs
      const jobs = result.data || []
      const sortedJobs = jobs.sort((a: Job, b: Job) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRecentJobs(sortedJobs.slice(0, 6))
    } catch (error) {
      console.error('Error loading jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      case 'pending_approval':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatStatusName = (status: string) => {
    if (status === 'pending_approval') {
      return 'PENDING'
    }
    return status.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Primary Action Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white"
          onClick={() => router.push('/dashboard/jobs/new')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#800E13] rounded-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-[#800E13]">Create New Job</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white"
          onClick={() => router.push('/dashboard/users')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#800E13] rounded-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-[#800E13]">Manage Users</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white"
          onClick={() => {/* Add analytics route when implemented */}}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#800E13] rounded-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-[#800E13]">Analytics</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Moving & Packing Jobs Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recent Moving & Packing Jobs</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <Card className="shadow-sm border-0 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">No Jobs Found</h3>
              <p className="text-xs text-muted-foreground mb-6 text-center max-w-sm">
                Get started by creating your first moving & packing job.
              </p>
              <Button
                onClick={() => router.push('/dashboard/jobs/new')}
                className="bg-[#800E13] text-white hover:bg-[#800E13]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentJobs.map((job) => (
              <Card
                key={job.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    {/* Job Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {job.job_number}
                        </h3>
                        <p className="font-medium text-foreground">
                          {job.client_name}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(job.status)}`}>
                        {formatStatusName(job.status)}
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">Pickup</p>
                          <p className="text-xs text-muted-foreground truncate">{job.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">Delivery</p>
                          <p className="text-xs text-muted-foreground truncate">{job.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-secondary" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Pickup Date</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.pickup_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3">
                      <p className="text-[10px] text-muted-foreground">
                        Created {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* System Health Section */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold mb-4">System Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Server Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-500">Healthy</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-500">Connected</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Backup</span>
              <span className="text-sm font-medium text-muted-foreground">2 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}