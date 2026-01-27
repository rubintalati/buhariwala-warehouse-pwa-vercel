'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Mail, Phone, Calendar, Shield, CheckCircle, Clock, Filter, Trash2, Edit } from 'lucide-react'
import { createUser, getCurrentUser, canManageUsers, isSuperAdmin } from '@/lib/custom-auth'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: 'super_admin' | 'checker' | 'maker'
  phone: string | null
  is_active: boolean
  created_at: string
}

type RoleFilter = 'all' | 'super_admin' | 'checker' | 'maker'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'maker' as 'super_admin' | 'checker' | 'maker',
    phone: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'maker' as 'super_admin' | 'checker' | 'maker',
    phone: '',
  })

  useEffect(() => {
    const currentUser = getCurrentUser()

    // Enhanced access control - only super admins
    if (!currentUser || !isSuperAdmin(currentUser)) {
      router.push('/dashboard')
      return
    }

    loadUsers()
  }, [router])

  // Filter users when role filter changes
  useEffect(() => {
    if (roleFilter === 'all') {
      setFilteredUsers(users)
    } else {
      setFilteredUsers(users.filter(user => user.role === roleFilter))
    }
  }, [users, roleFilter])

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const response = await fetch('/api/users')
      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result.error)
        setError(`Error: ${result.error}`)
        return
      }

      setUsers(result.data || [])
      console.log('Users loaded:', result.data?.length || 0)
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const result = await createUser(formData)
      if (result.success) {
        await loadUsers()
        setShowForm(false)
        setFormData({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'maker' as 'super_admin' | 'checker' | 'maker',
          phone: '',
        })
      } else {
        setError(result.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('An error occurred while creating the user')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          is_active: !currentStatus
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }

      await loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      setError('Failed to update user status')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Failed to delete user')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
    })
    setError('')
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'maker',
      phone: '',
    })
    setError('')
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          ...editFormData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      await loadUsers()
      closeEditModal()
    } catch (error) {
      console.error('Error updating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
      case 'checker':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
      case 'maker':
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getUserInitials = (user: User) => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    }
    return user.username.slice(0, 2).toUpperCase()
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
            <p className="text-lg font-semibold text-foreground">Loading Users</p>
            <p className="text-sm text-muted-foreground">Fetching user data...</p>
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

      {/* Header Section with Proper Typography */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage system users and their permissions
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#800E13] text-white hover:bg-[#800E13]/90 font-semibold px-6 w-fit"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </div>

          {/* Filter and User Count */}
          <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 bg-[#800E13]/10 rounded-full px-3 py-2">
              <Users className="w-4 h-4 text-[#800E13]" />
              <span className="text-sm font-medium text-[#800E13] whitespace-nowrap">
                {filteredUsers.length} {roleFilter === 'all' ? 'Users' : formatRoleName(roleFilter)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                <SelectTrigger className="w-40 border-0 shadow-sm">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {isSuperAdmin(getCurrentUser()) && (
                    <SelectItem value="super_admin">Super Admins</SelectItem>
                  )}
                  {isSuperAdmin(getCurrentUser()) && (
                    <SelectItem value="checker">Checkers</SelectItem>
                  )}
                  <SelectItem value="maker">Makers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {showForm && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Create New User</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Add a new user to the system with appropriate role and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'super_admin' | 'checker' | 'maker' }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maker">Maker</SelectItem>
                      <SelectItem value="checker">Checker</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={isCreating} className="bg-[#800E13] text-white hover:bg-[#800E13]/90 font-medium">
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Card Grid */}
      {filteredUsers.length === 0 && !isLoading ? (
        <Card className="shadow-sm border-0 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {roleFilter === 'all' ? 'No Users Found' : `No ${formatRoleName(roleFilter)} Found`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {roleFilter === 'all'
                ? 'Get started by creating your first user account.'
                : `No users with the ${formatRoleName(roleFilter).toLowerCase()} role found. Try a different filter or create a new user.`
              }
            </p>
            {roleFilter === 'all' && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-[#800E13] text-white hover:bg-[#800E13]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-md bg-white"
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">

                  {/* User Avatar & Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#800E13] rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">
                        {getUserInitials(user)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {user.full_name || user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        user.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        user.is_active ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {formatRoleName(user.role)}
                    </Badge>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground font-medium truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 space-y-2">
                    {/* Edit Button - Always available */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(user)}
                      className="w-full text-xs font-medium transition-colors border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit className="w-3 h-3 mr-2" />
                      Edit User
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`w-full text-xs font-medium transition-colors ${
                        user.is_active
                          ? 'border-yellow-600 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-700'
                          : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <Clock className="w-3 h-3 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>

                    {/* Delete Button - Only for makers and checkers */}
                    {user.role !== 'super_admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="w-full text-xs font-medium transition-colors border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete User
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Edit User: {editingUser.full_name || editingUser.username}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update user information and permissions. Changes will take effect immediately.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                  <Input
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditInputChange}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  name="full_name"
                  value={editFormData.full_name}
                  onChange={handleEditInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value as 'super_admin' | 'checker' | 'maker' }))}
                    disabled={editingUser.role === 'super_admin' && !isSuperAdmin(getCurrentUser())}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maker">Maker</SelectItem>
                      {isSuperAdmin(getCurrentUser()) && <SelectItem value="checker">Checker</SelectItem>}
                      {isSuperAdmin(getCurrentUser()) && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                  {editingUser.role === 'super_admin' && !isSuperAdmin(getCurrentUser()) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You cannot change the role of a Super Admin
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                  <Input
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={isUpdating} className="bg-[#800E13] text-white hover:bg-[#800E13]/90 font-medium flex-1">
                  {isUpdating ? 'Updating...' : 'Update User'}
                </Button>
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}