'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SplashScreenProps {
  onComplete?: () => void
  duration?: number // Duration in milliseconds
}

export default function SplashScreen({
  onComplete,
  duration = 4000
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'entrance' | 'content' | 'exit'>('loading')

  useEffect(() => {
    // Skip splash screen if user has seen it recently (within 1 hour)
    const lastSplashTime = localStorage.getItem('buhariwala-splash-time')
    const currentTime = Date.now()
    const oneHour = 60 * 60 * 1000

    if (lastSplashTime && currentTime - parseInt(lastSplashTime) < oneHour) {
      setIsVisible(false)
      onComplete?.()
      return
    }

    // Start animation sequence once logo is loaded
    if (logoLoaded) {
      const timer1 = setTimeout(() => setAnimationPhase('entrance'), 100)
      const timer2 = setTimeout(() => setAnimationPhase('content'), 1600)
      const timer3 = setTimeout(() => setAnimationPhase('exit'), duration - 1000)
      const timer4 = setTimeout(() => {
        setIsVisible(false)
        localStorage.setItem('buhariwala-splash-time', currentTime.toString())
        onComplete?.()
      }, duration)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [logoLoaded, onComplete, duration])

  // Handle skip functionality
  const handleSkip = () => {
    setAnimationPhase('exit')
    setTimeout(() => {
      setIsVisible(false)
      localStorage.setItem('buhariwala-splash-time', Date.now().toString())
      onComplete?.()
    }, 500)
  }

  // Handle keyboard accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleSkip()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-white
        transition-all duration-1000 ease-in-out
        ${animationPhase === 'exit' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
      role="dialog"
      aria-label="Buhariwala Logistics Application Loading"
      aria-live="polite"
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm font-medium z-10"
        aria-label="Skip splash screen"
      >
        Skip
      </button>

      {/* Main Content Container */}
      <div className="relative flex flex-col items-center justify-center text-center px-6">

        {/* Logo Container */}
        <div
          className={`
            relative
            ${animationPhase === 'loading' ? 'opacity-0 scale-50' : ''}
            ${animationPhase === 'entrance' ? 'opacity-100 scale-100 animate-bounceIn' : ''}
            ${animationPhase === 'content' || animationPhase === 'exit' ? 'opacity-100 scale-100' : ''}
            transition-all duration-1500 ease-out
          `}
          style={{
            filter: animationPhase === 'content' || animationPhase === 'exit'
              ? 'drop-shadow(0 4px 20px rgba(0,0,0,0.1))'
              : 'none'
          }}
        >
          <Image
            src="/logo.png"
            alt="Buhariwala Logistics Logo"
            width={400}
            height={400}
            className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 object-contain"
            priority
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoLoaded(true)} // Continue even if logo fails to load
          />
        </div>

        {/* Accessibility Text */}
        <div className="sr-only">
          Loading Buhariwala Logistics application. Please wait a moment.
        </div>
      </div>

      {/* Reduced Motion Alternative */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-bounceIn,
          .animate-slideInUp,
          .animate-fadeIn {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}