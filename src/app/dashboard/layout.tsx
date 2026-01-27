'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getCurrentUser, signOut, type AuthUser } from '@/lib/custom-auth'
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  CheckCircle,
  Menu,
  Plus
} from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Loading Dashboard</h2>
            <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          {/* Left: Navigation Menu */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-target p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-[#800E13] text-white border-r-0 p-0">
                <SheetHeader className="border-b border-white/20 p-6 pb-4">
                  <SheetTitle className="flex flex-col items-center gap-3 text-white text-center">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Buhariwala Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-lg font-semibold">Buhariwala Logistics</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full p-6 pt-4">
                  {/* User Profile Section */}
                  <div className="bg-white/10 rounded-lg border border-white/20 mb-6">
                    <div className="p-4">
                      <p className="font-medium text-sm text-white">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-white/70 capitalize">
                        {user.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white/10 rounded-lg border border-white/20 mb-6">
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-3 text-white">Quick Stats</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{jobCounts.inProgress}</div>
                          <div className="text-xs text-white/70">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-300">{jobCounts.pending}</div>
                          <div className="text-xs text-white/70">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Menu */}
                  <nav className="space-y-1">
                    {filteredNavigation.map((item) => (
                      <SheetClose key={item.name} asChild>
                        <a
                          href={item.href}
                          className={`flex items-center gap-3 p-3 text-sm font-medium transition-colors rounded-lg ${
                            pathname === item.href
                              ? 'bg-white text-[#800E13]'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </a>
                      </SheetClose>
                    ))}
                  </nav>

                  {/* Sign Out */}
                  <div className="pt-4 border-t border-white/20 mt-6">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start flex items-center gap-3 p-3 text-sm font-medium text-white hover:bg-white/10 rounded-lg"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Title Only */}
            <div className="flex items-center">
              <h1 className="font-semibold text-lg truncate">
                {getCurrentPageTitle()}
              </h1>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Quick Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          className="w-14 h-14 rounded-full shadow-lg touch-target bg-primary text-white hover:bg-primary/90"
          onClick={() => router.push('/dashboard/jobs/new')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}