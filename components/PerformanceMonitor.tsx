'use client'

import { useEffect, useState } from 'react'
import { usePerformance } from '@/hooks/usePerformance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Zap, Clock, Eye } from 'lucide-react'

interface PerformanceScore {
  score: number
  label: string
  color: 'green' | 'yellow' | 'red'
  icon: React.ReactNode
}

export function PerformanceMonitor() {
  const { metrics, getPerformanceScore, logMetrics } = usePerformance()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show performance monitor after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
      logMetrics()
    }, 3000)

    return () => clearTimeout(timer)
  }, [logMetrics])

  const getScoreColor = (score: number): 'green' | 'yellow' | 'red' => {
    if (score >= 90) return 'green'
    if (score >= 50) return 'yellow'
    return 'red'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-4 h-4" />
    if (score >= 70) return <Minus className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }

  const performanceScore = getPerformanceScore()
  const scoreColor = getScoreColor(performanceScore)
  const scoreLabel = getScoreLabel(performanceScore)
  const scoreIcon = getScoreIcon(performanceScore)

  const formatMetric = (value: number | null, unit: string): string => {
    if (value === null) return 'Not measured'
    return `${value.toFixed(1)}${unit}`
  }

  const getMetricColor = (value: number | null, thresholds: { good: number; poor: number }): 'green' | 'yellow' | 'red' => {
    if (value === null) return 'yellow'
    if (value <= thresholds.good) return 'green'
    if (value <= thresholds.poor) return 'yellow'
    return 'red'
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Performance
            </CardTitle>
            <Badge 
              variant={scoreColor === 'green' ? 'default' : scoreColor === 'yellow' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              {scoreIcon}
              {performanceScore}
            </Badge>
          </div>
          <CardDescription>
            {scoreLabel} performance score
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* LCP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">LCP</span>
            </div>
            <Badge 
              variant={getMetricColor(metrics.lcp, { good: 2500, poor: 4000 }) === 'green' ? 'default' : 
                      getMetricColor(metrics.lcp, { good: 2500, poor: 4000 }) === 'yellow' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {formatMetric(metrics.lcp, 'ms')}
            </Badge>
          </div>

          {/* FID */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">FID</span>
            </div>
            <Badge 
              variant={getMetricColor(metrics.fid, { good: 100, poor: 300 }) === 'green' ? 'default' : 
                      getMetricColor(metrics.fid, { good: 100, poor: 300 }) === 'yellow' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {formatMetric(metrics.fid, 'ms')}
            </Badge>
          </div>

          {/* CLS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">CLS</span>
            </div>
            <Badge 
              variant={getMetricColor(metrics.cls, { good: 0.1, poor: 0.25 }) === 'green' ? 'default' : 
                      getMetricColor(metrics.cls, { good: 0.1, poor: 0.25 }) === 'yellow' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {formatMetric(metrics.cls, '')}
            </Badge>
          </div>

          {/* TTFB */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">TTFB</span>
            </div>
            <Badge 
              variant={getMetricColor(metrics.ttfb, { good: 800, poor: 1800 }) === 'green' ? 'default' : 
                      getMetricColor(metrics.ttfb, { good: 800, poor: 1800 }) === 'yellow' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {formatMetric(metrics.ttfb, 'ms')}
            </Badge>
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hide performance monitor
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Development-only performance monitor
export function DevPerformanceMonitor() {
  const { metrics, getPerformanceScore, logMetrics } = usePerformance()

  useEffect(() => {
    // Log metrics on mount in development
    if (process.env.NODE_ENV === 'development') {
      logMetrics()
    }
  }, [logMetrics])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-64 shadow-lg bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-yellow-800">Dev Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-xs space-y-1">
            <div>Score: {getPerformanceScore()}</div>
            <div>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}</div>
            <div>FID: {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}</div>
            <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}</div>
          </div>
          <button
            onClick={logMetrics}
            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
          >
            Log to console
          </button>
        </CardContent>
      </Card>
    </div>
  )
} 