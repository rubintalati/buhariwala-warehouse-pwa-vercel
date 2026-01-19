import type { Database } from './supabase/client'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export interface AuthUser {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  phone?: string | null
  is_active: boolean
}

export interface AuthResponse {
  user: AuthUser | null
  error: string | null
}

export async function signInWithUsername(username: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { user: null, error: result.error || 'Authentication failed' }
    }

    // Store user session in localStorage for client-side auth
    if (typeof window !== 'undefined' && result.user) {
      localStorage.setItem('auth_user', JSON.stringify(result.user))
      localStorage.setItem('auth_session', Date.now().toString())
    }

    return { user: result.user, error: null }
  } catch (err) {
    console.error('Login error:', err)
    return { user: null, error: 'An error occurred during login' }
  }
}

export function signOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_session')
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  try {
    const userStr = localStorage.getItem('auth_user')
    const sessionStr = localStorage.getItem('auth_session')

    if (!userStr || !sessionStr) return null

    // Check if session is still valid (24 hours)
    const sessionTime = parseInt(sessionStr)
    const currentTime = Date.now()
    const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (currentTime - sessionTime > sessionDuration) {
      signOut()
      return null
    }

    return JSON.parse(userStr) as AuthUser
  } catch (err) {
    console.error('Error getting current user:', err)
    signOut()
    return null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password: string
  full_name: string
  role: UserRole
  phone?: string
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create user' }
    }

    return { success: true, userId: result.userId }
  } catch (err) {
    console.error('Error creating user:', err)
    return { success: false, error: 'Failed to create user' }
  }
}

export function hasRole(user: AuthUser | null, allowedRoles: UserRole[]): boolean {
  if (!user?.role) return false
  return allowedRoles.includes(user.role)
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ['super_admin'])
}

export function isChecker(user: AuthUser | null): boolean {
  return hasRole(user, ['checker', 'super_admin'])
}

export function isMaker(user: AuthUser | null): boolean {
  return hasRole(user, ['maker'])
}

export function canApproveJobs(user: AuthUser | null): boolean {
  return hasRole(user, ['checker', 'super_admin'])
}

export function canCreateJobs(user: AuthUser | null): boolean {
  return hasRole(user, ['maker'])
}

export function canManageUsers(user: AuthUser | null): boolean {
  return hasRole(user, ['super_admin'])
}