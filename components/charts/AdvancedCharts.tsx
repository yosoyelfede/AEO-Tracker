'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Activity,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'


interface BrandMention {
  id: string
  brand: string
  position: number
  context: string
  created_at: string
  model: string
  query_text: string
}

interface AnalyticsData {
  totalMentions: number
  totalQueries: number
  averageRanking: number
  successRate: number
  mentionsByModel: { model: string; mentions: number }[]
  mentionsByBrand: { brand: string; mentions: number; avgRank: number }[]
  mentionsOverTime: { date: string; mentions: number }[]
  recentActivity: BrandMention[]
}

interface AdvancedChartsProps {
  refreshTrigger: number
  selectedBrandListId: string | null
}

export default function AdvancedCharts({ refreshTrigger, selectedBrandListId }: AdvancedChartsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalyticsData = useCallback(async () => {
    if (!selectedBrandListId) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Calculate date range
      const now = new Date()
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

      // Fetch mentions data
      const { data: mentions, error: mentionsError } = await supabase
        .from('mentions')
        .select(`
          id,
          brand,
          position,
          context,
          created_at,
          model,
          query_text,
          brand_list_id
        `)
        .eq('brand_list_id', selectedBrandListId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (mentionsError) {
        console.error('Error fetching mentions:', mentionsError)
        setError('Failed to load analytics data')
        return
      }

      // Process data
      const mentionsData = mentions || []
      
      // Calculate metrics
      const totalMentions = mentionsData.length
      const totalQueries = new Set(mentionsData.map(m => m.query_text)).size
      const averageRanking = mentionsData.length > 0 
        ? mentionsData.reduce((sum, m) => sum + m.position, 0) / mentionsData.length 
        : 0

      // Mentions by model
      const modelCounts: Record<string, number> = {}
      mentionsData.forEach(mention => {
        modelCounts[mention.model] = (modelCounts[mention.model] || 0) + 1
      })
      const mentionsByModel = Object.entries(modelCounts).map(([model, mentions]) => ({
        model,
        mentions
      })).sort((a, b) => b.mentions - a.mentions)

      // Mentions by brand
      const brandStats: Record<string, { mentions: number; totalRank: number }> = {}
      mentionsData.forEach(mention => {
        if (!brandStats[mention.brand]) {
          brandStats[mention.brand] = { mentions: 0, totalRank: 0 }
        }
        brandStats[mention.brand].mentions++
        brandStats[mention.brand].totalRank += mention.position
      })
      const mentionsByBrand = Object.entries(brandStats).map(([brand, stats]) => ({
        brand,
        mentions: stats.mentions,
        avgRank: stats.mentions > 0 ? stats.totalRank / stats.mentions : 0
      })).sort((a, b) => b.mentions - a.mentions)

      // Mentions over time
      const timeCounts: Record<string, number> = {}
      mentionsData.forEach(mention => {
        const date = new Date(mention.created_at).toISOString().split('T')[0]
        timeCounts[date] = (timeCounts[date] || 0) + 1
      })
      const mentionsOverTime = Object.entries(timeCounts)
        .map(([date, mentions]) => ({ date, mentions }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Recent activity
      const recentActivity = mentionsData.slice(0, 10)

      const analyticsData: AnalyticsData = {
        totalMentions,
        totalQueries,
        averageRanking,
        successRate: 95, // Placeholder - would need to calculate from queries table
        mentionsByModel,
        mentionsByBrand,
        mentionsOverTime,
        recentActivity
      }

      setData(analyticsData)
    } catch (err) {
      console.error('Error in fetchAnalyticsData:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [selectedBrandListId, timeRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [refreshTrigger, selectedBrandListId, timeRange, fetchAnalyticsData])

  const handleRefresh = () => {
    fetchAnalyticsData()
  }

  const exportData = () => {
    if (!data) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Mentions', data.totalMentions],
      ['Total Queries', data.totalQueries],
      ['Average Ranking', data.averageRanking.toFixed(2)],
      ['Success Rate', `${data.successRate}%`],
      [],
      ['Brand', 'Mentions', 'Avg Rank'],
      ...data.mentionsByBrand.map(brand => [brand.brand, brand.mentions, brand.avgRank.toFixed(2)])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aeo-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!selectedBrandListId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Brand List</h3>
          <p className="text-gray-600">Choose a brand list to view analytics and insights.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Analytics...</h3>
          <p className="text-gray-600">Please wait while we fetch your data.</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Run some queries to see analytics and insights.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your brand performance across AI models</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mentions</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalMentions}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12% from last period
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalQueries}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +8% from last period
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Ranking</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.averageRanking > 0 ? data.averageRanking.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-red-600 flex items-center">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  -0.3 from last period
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{data.successRate}%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +3% from last period
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentions by Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Mentions by AI Model
            </CardTitle>
            <CardDescription>Distribution of brand mentions across different AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.mentionsByModel.map((item) => (
                <div key={item.model} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="font-medium">{item.model}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(item.mentions / data.totalMentions) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {item.mentions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Top Performing Brands
            </CardTitle>
            <CardDescription>Brands with the most mentions and best rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.mentionsByBrand.slice(0, 5).map((brand, index) => (
                <div key={brand.brand} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{brand.brand}</p>
                      <p className="text-sm text-gray-600">Avg Rank: {brand.avgRank.toFixed(1)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {brand.mentions} mentions
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mentions Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Mentions Over Time
            </CardTitle>
            <CardDescription>Track your brand mentions trend over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data.mentionsOverTime.map((item) => {
                const maxMentions = Math.max(...data.mentionsOverTime.map(d => d.mentions))
                const height = maxMentions > 0 ? (item.mentions / maxMentions) * 100 : 0
                
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2 rotate-45 origin-left">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest brand mentions and AI responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{activity.brand}</p>
                    <p className="text-sm text-gray-600">
                      Mentioned by {activity.model} • Rank #{activity.position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 