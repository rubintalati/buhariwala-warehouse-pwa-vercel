'use client'

import { useState, useEffect } from 'react'
import SplashScreen from './SplashScreen'

interface SplashWrapperProps {
  children: React.ReactNode
  showSplashScreen?: boolean
  splashDuration?: number
}

export default function SplashWrapper({
  children,
  showSplashScreen = true,
  splashDuration = 4000
}: SplashWrapperProps) {
  const [showSplash, setShowSplash] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only show splash screen on initial page load, not on navigation
    const hasShownSplash = sessionStorage.getItem('buhariwala-splash-shown')

    if (showSplashScreen && !hasShownSplash) {
      setShowSplash(true)
      sessionStorage.setItem('buhariwala-splash-shown', 'true')
    } else {
      setIsReady(true)
    }
  }, [showSplashScreen])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setIsReady(true)
  }

  // Don't render anything until we know whether to show splash or not
  if (!isReady && !showSplash) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          onComplete={handleSplashComplete}
          duration={splashDuration}
        />
      )}

      {/* Main app content - render but hide behind splash if splash is active */}
      <div className={showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  )
}