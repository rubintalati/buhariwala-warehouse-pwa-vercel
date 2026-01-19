'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Search, Filter, Calendar, MapPin, Truck, Package, Clock, CheckCircle, XCircle, Warehouse, FileOutput } from 'lucide-react'
import { getCurrentUser } from '@/lib/custom-auth'
import { useRouter } from 'next/navigation'

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
  total_items: number
  warehouse_entry?: {
    name: string
    from_date: string
    to_date: string
  }
}

type StatusFilter = 'all' | 'draft' | 'pending_approval' | 'in_progress' | 'completed' | 'cancelled'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    loadJobs()
  }, [router])

  // Filter jobs when search term or status filter changes
  useEffect(() => {
    let filtered = jobs

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, statusFilter])

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load jobs')
        return
      }

      setJobs(result.data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    router.push(`/dashboard/jobs/${jobId}/reports`)
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
      case 'pending_approval':
        return 'bg-yellow-50 text-yellow-600 border-yellow-300 hover:bg-yellow-100'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'draft':
        return FileText
      case 'pending_approval':
        return Clock
      case 'in_progress':
        return Truck
      case 'completed':
        return CheckCircle
      case 'cancelled':
        return XCircle
      default:
        return FileText
    }
  }

  const formatStatusName = (status: string) => {
    if (status === 'pending_approval') {
      return 'Pending'
    }
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getJobInitials = (job: Job) => {
    if (job.client_name) {
      return job.client_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    }
    return job.job_number.slice(0, 2).toUpperCase()
  }

  const getJobIcon = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return Package
      case 'in_progress':
        return Truck
      case 'completed':
        return CheckCircle
      case 'cancelled':
        return XCircle
      default:
        return FileText
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
            <p className="text-lg font-semibold text-foreground">Loading Jobs</p>
            <p className="text-sm text-muted-foreground">Fetching job data...</p>
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

      {/* Header Section with Proper Typography - Match Users Pattern */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard/jobs/new')}
              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary font-semibold px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
            <p className="text-lg text-muted-foreground">
              Manage moving and packing jobs, track progress, and coordinate logistics
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Job Count and Filters */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 w-fit">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary whitespace-nowrap">
              {filteredJobs.length} {statusFilter === 'all' ? 'Jobs' : formatStatusName(statusFilter)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jobs Grid - Match Users Grid Pattern */}
      {filteredJobs.length === 0 && !isLoading ? (
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {statusFilter === 'all' ? 'No Jobs Found' : `No ${formatStatusName(statusFilter)} Found`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {statusFilter === 'all'
                ? 'Get started by creating your first moving & packing job.'
                : `No jobs with the ${formatStatusName(statusFilter).toLowerCase()} status found. Try a different filter or create a new job.`
              }
            </p>
            {statusFilter === 'all' && (
              <Button
                onClick={() => router.push('/dashboard/jobs/new')}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Job
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="group hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-border cursor-pointer"
              onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col space-y-3">

                  {/* Job Header with Avatar & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-sm">
                          {getJobInitials(job)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {job.job_number}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.client_name}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium border ${getStatusColor(job.status)}`}
                    >
                      {(() => {
                        const StatusIcon = getStatusIcon(job.status)
                        return <StatusIcon className="w-3 h-3 mr-1" />
                      })()}
                      {formatStatusName(job.status)}
                    </Badge>
                  </div>

                  {/* Items Count */}
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {job.total_items} items
                    </span>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-xs text-foreground font-medium truncate">{job.pickup_address}</p>
                      </div>
                    </div>

                    {/* Warehouse Entry (if exists) */}
                    {job.warehouse_entry && (
                      <div className="flex items-start gap-2">
                        <Warehouse className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Warehouse</p>
                          <p className="text-xs text-foreground font-medium">{job.warehouse_entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.warehouse_entry.from_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })} - {new Date(job.warehouse_entry.to_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="text-xs text-foreground font-medium truncate">{job.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Pickup: {new Date(job.pickup_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Delivery: {new Date(job.delivery_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Created {new Date(job.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Generate Reports Button - Only show for approved jobs */}
                        {(job.status === 'in_progress' || job.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => generateReport(job.id, e)}
                            className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <FileOutput className="w-3 h-3 mr-1" />
                            Reports
                          </Button>
                        )}
                        <span className="font-medium text-primary">View Details →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}