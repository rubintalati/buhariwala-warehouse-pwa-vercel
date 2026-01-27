'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Home, Package, Camera, Edit, Trash2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/custom-auth'

interface Room {
  id: string
  job_id: string
  room_name: string
  room_type: string
  floor_level?: number
  is_completed: boolean
  created_at: string
  updated_at: string
  item_count?: number
}

interface Job {
  id: string
  job_number: string
  client_name: string
  status: string
}

const ROOM_TYPES = [
  { value: 'living_room', label: 'Living Room', icon: '🛋️' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍽️' },
  { value: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { value: 'dining_room', label: 'Dining Room', icon: '🍴' },
  { value: 'office', label: 'Office', icon: '💼' },
  { value: 'storage', label: 'Storage', icon: '📦' },
  { value: 'other', label: 'Other', icon: '🏠' },
]

export default function RoomsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    room_name: '',
    room_type: 'living_room',
    floor_level: 1,
  })

  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    if (jobId) {
      loadJobAndRooms()
    }
  }, [jobId, router])

  const loadJobAndRooms = async () => {
    try {
      // Load job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`)
      const jobResult = await jobResponse.json()

      if (!jobResponse.ok) {
        setError(jobResult.error || 'Failed to load job details')
        return
      }

      setJob(jobResult.data)

      // Load rooms
      const roomsResponse = await fetch(`/api/jobs/${jobId}/rooms`)
      const roomsResult = await roomsResponse.json()

      if (!roomsResponse.ok) {
        setError(roomsResult.error || 'Failed to load rooms')
        return
      }

      setRooms(roomsResult.data || [])
    } catch (error) {
      console.error('Error loading job and rooms:', error)
      setError('Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          job_id: jobId,
          created_by: getCurrentUser()?.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create room')
        return
      }

      await loadJobAndRooms()
      setShowForm(false)
      setFormData({
        room_name: '',
        room_type: 'living_room',
        floor_level: 1,
      })
    } catch (error) {
      console.error('Error creating room:', error)
      setError('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'floor_level' ? parseInt(value) || 1 : value
    }))
  }

  const getRoomIcon = (roomType: string) => {
    const room = ROOM_TYPES.find(r => r.value === roomType)
    return room?.icon || '🏠'
  }

  const getRoomLabel = (roomType: string) => {
    const room = ROOM_TYPES.find(r => r.value === roomType)
    return room?.label || 'Unknown'
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
            <p className="font-semibold">Loading Rooms</p>
            <p className="text-sm text-gray-500">Fetching room data...</p>
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()} className="border-0 shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <Home className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{rooms.length} Rooms</span>
              </div>
            </div>
            {job && (
              <p className="text-lg text-gray-600">
                {job.job_number} - {job.client_name}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary font-semibold px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Create Room Form */}
      {showForm && (
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Add New Room</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a room to start cataloguing items for this job
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Name</label>
                  <Input
                    name="room_name"
                    value={formData.room_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Master Bedroom, Living Room"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Room Type</label>
                  <select
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {ROOM_TYPES.map(room => (
                      <option key={room.value} value={room.value}>
                        {room.icon} {room.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Floor Level</label>
                <Input
                  name="floor_level"
                  type="number"
                  value={formData.floor_level}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="0"
                  max="20"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating Room...' : 'Create Room'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-0 shadow-sm hover:shadow-md">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Home className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Added</h3>
                <p className="text-gray-500 mb-6 text-center">
                  Start by creating rooms to organize and catalogue items for this job.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Room
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          rooms.map((room) => (
            <Card
              key={room.id}
              className="border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center text-2xl">
                      {getRoomIcon(room.room_type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {room.room_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getRoomLabel(room.room_type)}
                        {room.floor_level && ` • Floor ${room.floor_level}`}
                      </p>
                    </div>
                  </div>
                  {room.is_completed && (
                    <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      Complete
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{room.item_count || 0} items catalogued</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/dashboard/jobs/${jobId}/rooms/${room.id}/items`)}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Add Items
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 border-0 shadow-sm hover:shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pt-3 text-xs text-muted-foreground">
                  Created {new Date(room.created_at).toLocaleDateString()}
                </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}