import { supabase } from './supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from './supabase/client'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export interface AuthUser extends User {
  role?: UserRole
  full_name?: string
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    role: userProfile?.role,
    full_name: userProfile?.full_name,
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
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