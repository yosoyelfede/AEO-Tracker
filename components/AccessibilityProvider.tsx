'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AccessibilityContextType {
  isHighContrast: boolean
  isReducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium')

  useEffect(() => {
    // Check for user's motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedHighContrast = localStorage.getItem('aetrack-high-contrast')
    const savedFontSize = localStorage.getItem('aetrack-font-size')

    if (savedHighContrast) {
      setIsHighContrast(savedHighContrast === 'true')
    }
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize as 'small' | 'medium' | 'large')
    }
  }, [])

  useEffect(() => {
    // Apply accessibility styles to document
    const root = document.documentElement

    if (isHighContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (isReducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)

    // Save preferences
    localStorage.setItem('aetrack-high-contrast', isHighContrast.toString())
    localStorage.setItem('aetrack-font-size', fontSize)
  }, [isHighContrast, isReducedMotion, fontSize])

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev)
  }

  const toggleReducedMotion = () => {
    setIsReducedMotion(prev => !prev)
  }

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size)
  }

  return (
    <AccessibilityContext.Provider value={{
      isHighContrast,
      isReducedMotion,
      fontSize,
      toggleHighContrast,
      toggleReducedMotion,
      setFontSize
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Keyboard navigation hook
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'Escape':
          // Close modals, dropdowns, etc.
          const escapeEvent = new CustomEvent('escape-pressed')
          window.dispatchEvent(escapeEvent)
          break
        
        case 'Enter':
        case ' ':
          // Handle space and enter for buttons
          if (event.target instanceof HTMLElement && 
              event.target.getAttribute('role') === 'button') {
            event.preventDefault()
            event.target.click()
          }
          break
        
        case 'Tab':
          // Ensure focus indicators are visible
          document.body.classList.add('keyboard-navigation')
          break
      }
    }

    const handleMouseDown = () => {
      // Hide focus indicators when using mouse
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
}

// Focus management hook
export function useFocusManagement() {
  const focusTrap = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }

  const focusFirstElement = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }
  }

  return { focusTrap, focusFirstElement }
} 