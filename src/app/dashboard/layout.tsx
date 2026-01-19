'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getCurrentUser, signOut, type AuthUser } from '@/lib/custom-auth'
import { Menu, X, Home, FileText, Users, Settings, LogOut, CheckCircle } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [jobCounts, setJobCounts] = useState({ pending: 0, inProgress: 0 })
  const router = useRouter()
  const pathname = usePathname()

  const loadJobCounts = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const result = await response.json()
        const jobs = result.data || []

        const pending = jobs.filter((job: any) => job.status === 'pending_approval').length
        const inProgress = jobs.filter((job: any) => job.status === 'in_progress').length

        setJobCounts({ pending, inProgress })
      }
    } catch (error) {
      console.error('Error loading job counts:', error)
    }
  }

  useEffect(() => {
    function loadUser() {
      try {
        const currentUser = getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }
        setUser(currentUser)
        // Load job counts after user is loaded
        loadJobCounts()
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  // Refresh job counts when pathname changes (user navigates)
  useEffect(() => {
    if (user) {
      loadJobCounts()
    }
  }, [pathname, user])

  const handleSignOut = () => {
    try {
      signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Loading Dashboard</h2>
            <p className="text-sm text-muted-foreground">Please wait while we prepare your workspace</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['super_admin', 'checker', 'maker'],
    },
    {
      name: 'Jobs',
      href: '/dashboard/jobs',
      icon: FileText,
      roles: ['super_admin', 'checker', 'maker'],
    },
    {
      name: 'Approvals',
      href: '/dashboard/approvals',
      icon: CheckCircle,
      roles: ['super_admin', 'checker'],
    },
    {
      name: 'Users',
      href: '/dashboard/users',
      icon: Users,
      roles: ['super_admin', 'checker'],
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['super_admin', 'checker', 'maker'],
    },
  ]

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user.role || 'maker')
  )

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 1 && pathSegments[0] === 'dashboard') {
      return 'Dashboard'
    }

    // Special handling for specific routes
    if (pathname === '/dashboard/jobs/new') {
      return 'Create New Job'
    }

    // Check for job details pages (e.g., /dashboard/jobs/[id])
    if (pathSegments[1] === 'jobs' && pathSegments[2] && pathSegments[2] !== 'new') {
      return 'Job Details'
    }

    // Find matching navigation item
    const currentNav = navigation.find(item => {
      const navPath = item.href.split('/').filter(Boolean)
      return navPath[navPath.length - 1] === pathSegments[pathSegments.length - 1]
    })

    if (currentNav) {
      return currentNav.name
    }

    // Fallback: capitalize the last segment
    const lastSegment = pathSegments[pathSegments.length - 1]
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar shadow-card-elevated transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
              <Image
                src="/logo.png"
                alt="Buhariwala Logistics Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Buhariwala</h1>
              <p className="text-xs text-sidebar-foreground/70">Logistics Platform</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {filteredNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground/80 rounded-xl hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-all duration-200 hover:shadow-lg"
              >
                <div className="mr-3 p-1.5 rounded-lg bg-sidebar-accent/20 group-hover:bg-white/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-semibold">{item.name}</span>
              </a>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 px-4 py-4 bg-sidebar-accent/10 rounded-xl border border-sidebar-border/50">
            <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-sidebar-foreground/70">In Progress</span>
                <span className="font-bold text-sidebar-foreground">{jobCounts.inProgress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sidebar-foreground/70">Pending</span>
                <span className="font-bold text-sidebar-foreground">{jobCounts.pending}</span>
              </div>
            </div>
          </div>
        </nav>
        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-sidebar-accent/20 rounded-xl p-4 border border-sidebar-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/20 p-2 rounded-lg"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-border shadow-sm">
          <div className="flex h-16 items-center px-4 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-4 hover:bg-muted"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex flex-1 justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-foreground">
                  {getCurrentPageTitle()}
                </h2>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-500">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}