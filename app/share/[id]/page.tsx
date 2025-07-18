'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Eye, Calendar, User, TrendingUp, BarChart3, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedWrapper, AnimatedCard, LoadingSkeleton } from '@/components/AnimatedWrapper'

import { supabase } from '@/lib/supabase'

interface DashboardShare {
  id: string
  title: string
  description: string
  user_id: string
  analytics_data: any
  view_count: number
  created_at: string
  expires_at?: string
  user_email?: string
}

export default function SharedDashboardPage() {
  const params = useParams()
  const shareId = params.id as string
  const [share, setShare] = useState<DashboardShare | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    fetchShareData()
  }, [shareId])

  const fetchShareData = async () => {
    try {
      setLoading(true)
      
      // Fetch the share data
      const { data: shareData, error: shareError } = await supabase
        .from('dashboard_shares')
        .select(`
          *,
          user_profiles!inner(email)
        `)
        .eq('id', shareId)
        .eq('is_public', true)
        .single()

      if (shareError || !shareData) {
        setError('Dashboard not found or not publicly accessible')
        setLoading(false)
        return
      }

      // Check if expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        setIsExpired(true)
        setError('This shared dashboard has expired')
        setLoading(false)
        return
      }

      // Increment view count
      await supabase.rpc('increment_share_view_count', { share_id: shareId })

      setShare({
        id: shareData.id,
        title: shareData.title,
        description: shareData.description,
        user_id: shareData.user_id,
        analytics_data: shareData.analytics_data,
        view_count: shareData.view_count + 1, // Increment for display
        created_at: shareData.created_at,
        expires_at: shareData.expires_at,
        user_email: shareData.user_profiles?.email
      })

    } catch (error) {
      console.error('Error fetching share data:', error)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const downloadData = () => {
    if (!share?.analytics_data) return

    const dataStr = JSON.stringify(share.analytics_data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${share.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analytics.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <AnimatedWrapper animation="fadeIn">
            <div className="max-w-4xl mx-auto">
              <LoadingSkeleton className="h-8 mb-4" />
              <LoadingSkeleton className="h-4 mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-32" />
                ))}
              </div>
              <LoadingSkeleton className="h-96" />
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    )
  }

  if (error || !share) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <AnimatedWrapper animation="fadeIn">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isExpired ? 'Dashboard Expired' : 'Dashboard Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'This shared dashboard is no longer available.'}
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Go to AETrack
              </Button>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <AnimatedWrapper animation="slideDown">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{share.title}</h1>
                  {share.description && (
                    <p className="text-gray-600 mt-1">{share.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{share.view_count} views</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Shared {new Date(share.created_at).toLocaleDateString()}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={downloadData}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Try AETrack
                </Button>
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <AnimatedWrapper animation="fadeIn" delay={0.2}>
          <div className="max-w-7xl mx-auto">
            {share.analytics_data ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Shared Analytics Dashboard</h2>
                    <p className="text-gray-600">Analytics data shared by {share.user_email}</p>
                  </div>
                </div>
                
                {/* Display analytics data in a simplified format */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Overview</CardTitle>
                    <CardDescription>Key metrics from the shared dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(share.analytics_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                  <p className="text-gray-600">This shared dashboard doesn't contain any analytics data.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </AnimatedWrapper>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <AnimatedWrapper animation="fadeIn" delay={0.4}>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AETrack</span>
              </div>
              <p className="text-gray-600 mb-4">
                Track and optimize your brand presence in AI responses
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Shared by {share.user_email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Powered by AETrack Analytics</span>
                </div>
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    </div>
  )
} 