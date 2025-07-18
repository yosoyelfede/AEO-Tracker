'use client'

import { useEffect, useState, useCallback } from 'react'

interface PerformanceMetrics {
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  fcp: number | null
}

interface PerformanceObserver {
  observe: (options: any) => void
  disconnect: () => void
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null
  })

  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if Performance Observer is supported
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      setIsSupported(true)
    }
  }, [])

  const measureLCP = useCallback(() => {
    if (!isSupported) return

    const observer = new (window as any).PerformanceObserver((list: any) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
    return observer
  }, [isSupported])

  const measureFID = useCallback(() => {
    if (!isSupported) return

    const observer = new (window as any).PerformanceObserver((list: any) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
      })
    })

    observer.observe({ entryTypes: ['first-input'] })
    return observer
  }, [isSupported])

  const measureCLS = useCallback(() => {
    if (!isSupported) return

    let clsValue = 0
    const observer = new (window as any).PerformanceObserver((list: any) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          setMetrics(prev => ({ ...prev, cls: clsValue }))
        }
      })
    })

    observer.observe({ entryTypes: ['layout-shift'] })
    return observer
  }, [isSupported])

  const measureTTFB = useCallback(() => {
    if (!isSupported) return

    const navigation = (performance as any).getEntriesByType('navigation')[0]
    if (navigation) {
      setMetrics(prev => ({ ...prev, ttfb: navigation.responseStart - navigation.requestStart }))
    }
  }, [isSupported])

  const measureFCP = useCallback(() => {
    if (!isSupported) return

    const observer = new (window as any).PerformanceObserver((list: any) => {
      const entries = list.getEntries()
      const firstEntry = entries[0]
      setMetrics(prev => ({ ...prev, fcp: firstEntry.startTime }))
    })

    observer.observe({ entryTypes: ['first-contentful-paint'] })
    return observer
  }, [isSupported])

  useEffect(() => {
    if (!isSupported) return

    const observers: PerformanceObserver[] = []

    // Measure TTFB immediately
    measureTTFB()

    // Set up observers for other metrics
    const lcpObserver = measureLCP()
    const fidObserver = measureFID()
    const clsObserver = measureCLS()
    const fcpObserver = measureFCP()

    if (lcpObserver) observers.push(lcpObserver)
    if (fidObserver) observers.push(fidObserver)
    if (clsObserver) observers.push(clsObserver)
    if (fcpObserver) observers.push(fcpObserver)

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [isSupported, measureLCP, measureFID, measureCLS, measureTTFB, measureFCP])

  const getPerformanceScore = useCallback(() => {
    let score = 100

    // LCP scoring (target: <2.5s)
    if (metrics.lcp && metrics.lcp > 2500) {
      score -= Math.min(30, (metrics.lcp - 2500) / 100)
    }

    // FID scoring (target: <100ms)
    if (metrics.fid && metrics.fid > 100) {
      score -= Math.min(30, (metrics.fid - 100) / 10)
    }

    // CLS scoring (target: <0.1)
    if (metrics.cls && metrics.cls > 0.1) {
      score -= Math.min(30, metrics.cls * 300)
    }

    return Math.max(0, Math.round(score))
  }, [metrics])

  const logMetrics = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.group('🚀 Performance Metrics')
      console.log('LCP:', metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'Not measured')
      console.log('FID:', metrics.fid ? `${metrics.fid.toFixed(2)}ms` : 'Not measured')
      console.log('CLS:', metrics.cls ? metrics.cls.toFixed(3) : 'Not measured')
      console.log('TTFB:', metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : 'Not measured')
      console.log('FCP:', metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'Not measured')
      console.log('Performance Score:', getPerformanceScore())
      console.groupEnd()
    }
  }, [metrics, getPerformanceScore])

  return {
    metrics,
    isSupported,
    getPerformanceScore,
    logMetrics
  }
} 