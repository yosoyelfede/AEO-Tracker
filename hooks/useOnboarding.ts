import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface OnboardingState {
  hasCompletedTour: boolean
  hasSeenFeatureDiscovery: { [key: string]: boolean }
  lastActiveDate: string | null
  totalQueries: number
  totalBrandLists: number
}

interface UseOnboardingReturn {
  onboardingState: OnboardingState
  showTour: boolean
  showFeatureDiscovery: { [key: string]: boolean }
  completeTour: () => void
  dismissFeatureDiscovery: (feature: string) => void
  markFeatureSeen: (feature: string) => void
  shouldShowTour: () => boolean
  shouldShowFeatureDiscovery: (feature: string) => boolean
  updateUserActivity: () => void
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasCompletedTour: false,
  hasSeenFeatureDiscovery: {},
  lastActiveDate: null,
  totalQueries: 0,
  totalBrandLists: 0
}

export function useOnboarding(userId?: string): UseOnboardingReturn {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE)
  const [showTour, setShowTour] = useState(false)
  const [showFeatureDiscovery, setShowFeatureDiscovery] = useState<{ [key: string]: boolean }>({})

  // Load onboarding state from localStorage and database
  useEffect(() => {
    const loadOnboardingState = async () => {
      // Load from localStorage first
      const stored = localStorage.getItem('aeo-onboarding')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setOnboardingState(prev => ({ ...prev, ...parsed }))
        } catch (error) {
          console.error('Error parsing stored onboarding state:', error)
        }
      }

      // Load from database if user is authenticated
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('onboarding_state')
            .eq('user_id', userId)
            .single()

          if (!error && data?.onboarding_state) {
            const dbState = data.onboarding_state as OnboardingState
            setOnboardingState(prev => ({ ...prev, ...dbState }))
            
            // Update localStorage
            localStorage.setItem('aeo-onboarding', JSON.stringify(dbState))
          }
        } catch (error) {
          console.error('Error loading onboarding state from database:', error)
        }
      }
    }

    loadOnboardingState()
  }, [userId])

  // Save onboarding state to localStorage and database
  const saveOnboardingState = async (newState: Partial<OnboardingState>) => {
    const updatedState = { ...onboardingState, ...newState }
    setOnboardingState(updatedState)
    
    // Save to localStorage
    localStorage.setItem('aeo-onboarding', JSON.stringify(updatedState))
    
    // Save to database if user is authenticated
    if (userId) {
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            onboarding_state: updatedState
          })
      } catch (error) {
        console.error('Error saving onboarding state to database:', error)
      }
    }
  }

  // Complete the onboarding tour
  const completeTour = () => {
    saveOnboardingState({ hasCompletedTour: true })
    setShowTour(false)
  }

  // Dismiss feature discovery
  const dismissFeatureDiscovery = (feature: string) => {
    const newHasSeen = { ...onboardingState.hasSeenFeatureDiscovery, [feature]: true }
    saveOnboardingState({ hasSeenFeatureDiscovery: newHasSeen })
    setShowFeatureDiscovery(prev => ({ ...prev, [feature]: false }))
  }

  // Mark feature as seen
  const markFeatureSeen = (feature: string) => {
    const newHasSeen = { ...onboardingState.hasSeenFeatureDiscovery, [feature]: true }
    saveOnboardingState({ hasSeenFeatureDiscovery: newHasSeen })
  }

  // Check if tour should be shown
  const shouldShowTour = (): boolean => {
    if (onboardingState.hasCompletedTour) return false
    
    // Show tour if user is new (no last active date) or hasn't been active for 7 days
    if (!onboardingState.lastActiveDate) return true
    
    const lastActive = new Date(onboardingState.lastActiveDate)
    const daysSinceLastActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    
    return daysSinceLastActive > 7
  }

  // Check if feature discovery should be shown
  const shouldShowFeatureDiscovery = (feature: string): boolean => {
    if (onboardingState.hasSeenFeatureDiscovery[feature]) return false
    
    // Show feature discovery based on user activity
    switch (feature) {
      case 'analytics':
        return onboardingState.totalQueries >= 3
      case 'brand-lists':
        return onboardingState.totalQueries >= 1
      case 'export':
        return onboardingState.totalQueries >= 5
      case 'scheduling':
        return onboardingState.totalQueries >= 10
      default:
        return false
    }
  }

  // Update user activity
  const updateUserActivity = () => {
    saveOnboardingState({ lastActiveDate: new Date().toISOString() })
  }

  // Check for feature discoveries on mount
  useEffect(() => {
    const discoveries: { [key: string]: boolean } = {}
    
    if (shouldShowFeatureDiscovery('analytics')) {
      discoveries.analytics = true
    }
    if (shouldShowFeatureDiscovery('brand-lists')) {
      discoveries['brand-lists'] = true
    }
    if (shouldShowFeatureDiscovery('export')) {
      discoveries.export = true
    }
    if (shouldShowFeatureDiscovery('scheduling')) {
      discoveries.scheduling = true
    }
    
    setShowFeatureDiscovery(discoveries)
  }, [onboardingState])

  // Check if tour should be shown on mount
  useEffect(() => {
    if (shouldShowTour()) {
      setShowTour(true)
    }
  }, [onboardingState])

  return {
    onboardingState,
    showTour,
    showFeatureDiscovery,
    completeTour,
    dismissFeatureDiscovery,
    markFeatureSeen,
    shouldShowTour,
    shouldShowFeatureDiscovery,
    updateUserActivity
  }
}

// Hook for tracking user activity
export function useActivityTracker(userId?: string) {
  const { updateUserActivity } = useOnboarding(userId)

  useEffect(() => {
    // Update activity on mount
    updateUserActivity()

    // Update activity on user interaction
    const handleUserActivity = () => {
      updateUserActivity()
    }

    // Track various user interactions
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [updateUserActivity])
}

// Hook for progressive feature unlocking
export function useProgressiveFeatures(userId?: string) {
  const { onboardingState } = useOnboarding(userId)

  const unlockedFeatures = {
    basic: true, // Always unlocked
    analytics: onboardingState.totalQueries >= 3,
    export: onboardingState.totalQueries >= 5,
    scheduling: onboardingState.totalQueries >= 10,
    advanced: onboardingState.totalQueries >= 20,
    api: onboardingState.totalQueries >= 50
  }

  const getFeatureStatus = (feature: string) => {
    return {
      unlocked: unlockedFeatures[feature as keyof typeof unlockedFeatures] || false,
      progress: Math.min(onboardingState.totalQueries / getFeatureRequirement(feature), 1),
      requirement: getFeatureRequirement(feature)
    }
  }

  const getFeatureRequirement = (feature: string): number => {
    switch (feature) {
      case 'analytics': return 3
      case 'export': return 5
      case 'scheduling': return 10
      case 'advanced': return 20
      case 'api': return 50
      default: return 0
    }
  }

  return {
    unlockedFeatures,
    getFeatureStatus,
    getFeatureRequirement
  }
} 