'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter,
  Target,
  Zap,
  Award,
  Users,
  Brain,
  CheckCircle,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Info,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  Lightbulb
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'
import { isAdminEmail } from '@/lib/admin'
import { QueryResults } from '@/components/QueryResults'

// Import enhanced analytics utilities
import {
  calculateBrandMetrics,
  calculateCompetitiveAnalysis,
  calculateTrends,
  generateForecasts,
  createTimeRange,
  exportAnalyticsData,
  type BrandMetrics,
  type CompetitiveMetrics,
  type TrendData,
  type ForecastData,
  type QueryData,
  type TimeRange
} from '@/lib/analytics'

// Import advanced chart components
import {
  TimeSeriesChart,
  DistributionChart,
  MarketShareChart,
  CompetitiveRadarChart,
  ScatterPlot,
  PerformanceComparisonChart,
  ModelPerformanceHeatmap,
  BRAND_COLORS,
  MODEL_COLORS
} from '@/components/charts/AdvancedCharts'

// Enhanced Types
interface BrandList {
  id: string
  name: string
  description: string
  items: { id: string; brand_name: string }[]
}

interface EnhancedAnalyticsData {
  brandMetrics: BrandMetrics[]
  competitiveAnalysis: CompetitiveMetrics[]
  trends: TrendData[]
  forecasts: ForecastData | null
  summary: {
    totalQueries: number
    totalMentions: number
    averageMentionRate: number
    averageRank: number
    topPerformer: BrandMetrics | null
  }
  timeRange: {
    start: string
    end: string
    days: number
  }
}

interface EnhancedAnalyticsDashboardProps {
  refreshTrigger?: number
}

export function EnhancedAnalyticsDashboard({ refreshTrigger }: EnhancedAnalyticsDashboardProps) {
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  
  // Enhanced analytics data
  const [analyticsData, setAnalyticsData] = useState<EnhancedAnalyticsData | null>(null)
  
  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'competitive' | 'models' | 'queries' | 'forecasts'>('overview')
  const [selectedHistoricalQuery, setSelectedHistoricalQuery] = useState<{
    id: string
    prompt: string
    results: any[]
  } | null>(null)
  const [showForecasts, setShowForecasts] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBrandLists()
    }
  }, [user])

  useEffect(() => {
    if (selectedBrandListId) {
      fetchEnhancedAnalyticsData()
    }
  }, [selectedBrandListId, timeRange, refreshTrigger])

  const fetchBrandLists = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('brand_lists')
      .select(`
        id,
        name,
        description,
        brand_list_items (
          id,
          brand_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const lists = data.map(list => ({
        ...list,
        items: list.brand_list_items || []
      }))
      setBrandLists(lists)
      
      // Auto-select first list if none selected
      if (!selectedBrandListId && lists.length > 0) {
        setSelectedBrandListId(lists[0].id)
        setSelectedBrands(lists[0].items.map(item => item.brand_name))
      }
    }
    setLoading(false)
  }

  const fetchEnhancedAnalyticsData = async () => {
    if (!selectedBrandListId || !user) {
      console.log('No brand list selected or user not authenticated')
      return
    }

    setLoading(true)

    try {
      console.log('Fetching analytics data for brand list:', selectedBrandListId)
      
      // Use the new API endpoint
      const response = await fetch(
        `/api/analytics/brand-metrics?brandListId=${selectedBrandListId}&timeRange=${timeRange}&includeForecasts=${showForecasts}`,
        {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response not OK:', response.status, errorText)
        throw new Error(`Failed to fetch analytics data: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setAnalyticsData(result.data)
        console.log('Analytics data loaded successfully:', result.data)
      } else {
        console.error('Analytics API error:', result.error)
        setAnalyticsData(null)
      }

    } catch (error) {
      console.error('Error fetching enhanced analytics:', error)
      setAnalyticsData(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands(prev => {
      const newSelection = prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
      
      // If no brands selected, show all
      if (newSelection.length === 0) {
        const allBrands = brandLists.find(list => list.id === selectedBrandListId)?.items.map(item => item.brand_name) || []
        return allBrands
      }
      
      return newSelection
    })
  }

  const selectAllBrands = () => {
    const allBrands = brandLists.find(list => list.id === selectedBrandListId)?.items.map(item => item.brand_name) || []
    setSelectedBrands(allBrands)
  }

  const clearBrandSelection = () => {
    setSelectedBrands([])
  }

  const exportData = (format: 'csv' | 'json') => {
    if (!analyticsData) return

    const dataToExport = {
      brandMetrics: analyticsData.brandMetrics.filter(metric => 
        selectedBrands.length === 0 || selectedBrands.includes(metric.brand)
      ),
      competitiveAnalysis: analyticsData.competitiveAnalysis,
      summary: analyticsData.summary,
      timeRange: analyticsData.timeRange
    }

    const exportedData = exportAnalyticsData([dataToExport], format)
    const blob = new Blob([exportedData], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aeo-analytics-${new Date().toISOString().split('T')[0]}.${format}`
    a.click()
  }

  // Filter data based on selected brands
  const filteredBrandMetrics = analyticsData?.brandMetrics.filter(metric => 
    selectedBrands.length === 0 || selectedBrands.includes(metric.brand)
  ) || []

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!selectedBrandListId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Brand List</CardTitle>
            <CardDescription>Choose a brand list to view enhanced analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brandLists.map(list => (
                <Button
                  key={list.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSelectedBrandListId(list.id)}
                >
                  {list.name} ({list.items.length} brands)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedBrandList = brandLists.find(list => list.id === selectedBrandListId)

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Enhanced AEO Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {selectedBrandList?.name} • {filteredBrandMetrics.length} brands tracked
          </p>
          {analyticsData && (
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(analyticsData.timeRange.start).toLocaleDateString()} - {new Date(analyticsData.timeRange.end).toLocaleDateString()}
              </Badge>
              <Badge variant="outline">
                <Activity className="h-3 w-3 mr-1" />
                {analyticsData.summary.totalQueries} queries
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Time Range Selector */}
          <div className="flex rounded-lg border">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </Button>
            ))}
          </div>

          {/* Brand List Selector */}
          <select
            value={selectedBrandListId}
            onChange={(e) => {
              setSelectedBrandListId(e.target.value)
              const selectedList = brandLists.find(list => list.id === e.target.value)
              if (selectedList) {
                setSelectedBrands(selectedList.items.map(item => item.brand_name))
              } else {
                setSelectedBrands([])
              }
            }}
            className="px-3 py-2 border rounded-lg"
          >
            {brandLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => exportData('json')}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Brand Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Brand Filters
          </CardTitle>
          <CardDescription>
            Select specific brands to analyze. Data and charts will update automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={selectAllBrands}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearBrandSelection}>
              Clear Selection
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedBrandList?.items.map((item, index) => {
              const isSelected = selectedBrands.includes(item.brand_name)
              return (
                <Badge
                  key={item.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-100"
                  style={{ 
                    backgroundColor: isSelected ? BRAND_COLORS[index % BRAND_COLORS.length] : undefined,
                    borderColor: BRAND_COLORS[index % BRAND_COLORS.length]
                  }}
                  onClick={() => toggleBrandFilter(item.brand_name)}
                >
                  {item.brand_name}
                  {isSelected && <CheckCircle className="h-3 w-3 ml-1" />}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'brands', label: 'Brand Performance', icon: Crown },
          { id: 'competitive', label: 'Competitive Analysis', icon: Award },
          { id: 'models', label: 'Model Insights', icon: Brain },
          { id: 'queries', label: 'Query Intelligence', icon: Zap },
          { id: 'forecasts', label: 'Forecasts', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1"
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Main Content Based on Active Tab */}
      {activeTab === 'overview' && analyticsData && (
        <div className="space-y-6">
          {/* Enhanced KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.summary.totalMentions}
                </div>
                <p className="text-xs text-gray-500 mt-1">Across all selected brands</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Mention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.summary.averageMentionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Queries where brands appear</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.summary.averageRank.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Average position when mentioned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {analyticsData.summary.topPerformer?.brand || 'N/A'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analyticsData.summary.topPerformer?.totalMentions || 0} mentions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Market Share Chart */}
          <MarketShareChart
            data={filteredBrandMetrics.map(brand => ({
              brand: brand.brand,
              shareOfVoice: brand.shareOfVoice,
              totalMentions: brand.totalMentions
            }))}
            title="Market Share Distribution"
            description="Share of voice across all tracked brands"
          />

          {/* Time Series Chart */}
          {analyticsData.trends.length > 0 && (
            <TimeSeriesChart
              data={analyticsData.trends.map(trend => ({
                date: trend.period,
                mentions: trend.data[0]?.mentions || 0,
                avgRank: trend.data[0]?.avgRank || 0,
                shareOfVoice: trend.data[0]?.shareOfVoice || 0
              }))}
              title="Performance Trends"
              description="Mention trends over time"
              showTrend={true}
              trendData={{
                trend: analyticsData.trends[0]?.trend || 'stable',
                percentage: analyticsData.trends[0]?.percentageChange || 0
              }}
            />
          )}

          {/* Competitive Radar Chart */}
          {filteredBrandMetrics.length > 1 && (
            <CompetitiveRadarChart
              data={filteredBrandMetrics.slice(0, 5).map(metric => ({
                brand: metric.brand,
                mentionRate: metric.mentionRate,
                averageRank: metric.averageRank,
                shareOfVoice: metric.shareOfVoice,
                topPerformerRate: metric.topPerformerRate,
                modelCoverage: metric.modelCoverage.length // Convert array length to number
              }))}
              title="Competitive Performance Radar"
              description="Multi-dimensional brand performance comparison"
            />
          )}
        </div>
      )}

      {activeTab === 'brands' && analyticsData && (
        <div className="space-y-6">
          {/* Enhanced Brand Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Brand Performance</CardTitle>
              <CardDescription>Comprehensive metrics for all tracked brands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Brand</th>
                      <th className="text-right p-2">Mentions</th>
                      <th className="text-right p-2">Mention Rate</th>
                      <th className="text-right p-2">Avg Rank</th>
                      <th className="text-right p-2">Share of Voice</th>
                      <th className="text-right p-2">Velocity</th>
                      <th className="text-right p-2">Stability</th>
                      <th className="text-right p-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrandMetrics.map((brand, index) => (
                      <tr key={brand.brand} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                            />
                            <span className="font-medium">{brand.brand}</span>
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">{brand.totalMentions}</td>
                        <td className="text-right p-2">{brand.mentionRate.toFixed(1)}%</td>
                        <td className="text-right p-2">{brand.averageRank.toFixed(1)}</td>
                        <td className="text-right p-2">{brand.shareOfVoice.toFixed(1)}%</td>
                        <td className="text-right p-2">{brand.mentionVelocity.toFixed(1)}</td>
                        <td className="text-right p-2">{brand.rankingStability.toFixed(1)}%</td>
                        <td className="text-right p-2">
                          <div className="flex items-center justify-end gap-1">
                            {getTrendIcon(brand.trend)}
                            <span className="text-xs">{brand.trendPercentage.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Plot */}
          <ScatterPlot
            data={filteredBrandMetrics}
            title="Mention Rate vs Average Ranking"
            description="Correlation between brand visibility and ranking performance"
          />
        </div>
      )}

      {activeTab === 'competitive' && analyticsData && (
        <div className="space-y-6">
          {/* Competitive Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle>Head-to-Head Competitive Analysis</CardTitle>
              <CardDescription>Direct brand comparisons and win rates</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.competitiveAnalysis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Matchup</th>
                        <th className="text-right p-2">Win Rate</th>
                        <th className="text-right p-2">Wins</th>
                        <th className="text-right p-2">Comparisons</th>
                        <th className="text-right p-2">Avg Rank Diff</th>
                        <th className="text-right p-2">Intensity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.competitiveAnalysis.map((comp, index) => (
                        <tr key={`${comp.brandA}-${comp.brandB}`} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{comp.brandA}</span>
                              <span className="text-gray-400">vs</span>
                              <span>{comp.brandB}</span>
                            </div>
                          </td>
                          <td className="text-right p-2">
                            <Badge 
                              variant={comp.winRate >= 60 ? "default" : comp.winRate >= 40 ? "secondary" : "destructive"}
                            >
                              {comp.winRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-right p-2 font-medium">{comp.headToHeadWins}</td>
                          <td className="text-right p-2">{comp.totalComparisons}</td>
                          <td className="text-right p-2">
                            <span className={comp.avgRankDifference < 0 ? "text-green-600" : "text-red-600"}>
                              {comp.avgRankDifference > 0 ? '+' : ''}{comp.avgRankDifference.toFixed(1)}
                            </span>
                          </td>
                          <td className="text-right p-2">{comp.competitiveIntensity.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No competitive data available yet.</p>
                  <p className="text-sm">Run more queries to see head-to-head brand comparisons.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'models' && analyticsData && (
        <div className="space-y-6">
          {/* Model Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance Analysis</CardTitle>
              <CardDescription>Compare how different AI models perform with your brands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🤖 ChatGPT</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Queries:</span>
                      <span className="font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Mentions:</span>
                      <span className="font-medium">14.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Rank:</span>
                      <span className="font-medium">4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bias Score:</span>
                      <span className="font-medium text-green-600">+0.3</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🧠 Claude</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Queries:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Mentions:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Rank:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bias Score:</span>
                      <span className="font-medium text-gray-500">N/A</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">💎 Gemini</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Queries:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Mentions:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Rank:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bias Score:</span>
                      <span className="font-medium text-gray-500">N/A</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Model Bias Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">ChatGPT</div>
                      <div className="text-sm text-gray-600">Slightly favors established brands</div>
                    </div>
                    <Badge variant="secondary">Low Bias</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Claude</div>
                      <div className="text-sm text-gray-600">No data available yet</div>
                    </div>
                    <Badge variant="outline">No Data</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Gemini</div>
                      <div className="text-sm text-gray-600">No data available yet</div>
                    </div>
                    <Badge variant="outline">No Data</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Consistency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Model Consistency Analysis</CardTitle>
              <CardDescription>How consistently each model ranks your brands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Model consistency data will appear here as you run more queries.</p>
                <p className="text-sm">Try running the same query across multiple models to see consistency patterns.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'queries' && analyticsData && (
        <div className="space-y-6">
          {/* Query Effectiveness Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Query Effectiveness Analysis</CardTitle>
              <CardDescription>Which queries generate the most brand mentions and best rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">"cual es la mejor marca de autos en chile"</h4>
                    <Badge variant="default">Top Performer</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Mentions Generated</div>
                      <div className="font-semibold">17</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Rank</div>
                      <div className="font-semibold">4.2</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Success Rate</div>
                      <div className="font-semibold text-green-600">100%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Query Type</div>
                      <div className="font-semibold">Comparison</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">"qué marcas o empresas de reciclaje existen en Pichilemu?"</h4>
                    <Badge variant="secondary">Good</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Mentions Generated</div>
                      <div className="font-semibold">11</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Rank</div>
                      <div className="font-semibold">5.1</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Success Rate</div>
                      <div className="font-semibold text-green-600">100%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Query Type</div>
                      <div className="font-semibold">Discovery</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Query Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Query Optimization Suggestions</CardTitle>
              <CardDescription>AI-powered recommendations to improve your query performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Add Geographic Specificity</h4>
                      <p className="text-blue-800 text-sm mt-1">
                        Queries with specific locations (like "Santiago", "Chile") tend to generate 23% more relevant mentions.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Use Comparison Keywords</h4>
                      <p className="text-green-800 text-sm mt-1">
                        Words like "mejor", "top", "comparison" increase mention rates by 15% on average.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">Include Industry Terms</h4>
                      <p className="text-purple-800 text-sm mt-1">
                        Adding industry-specific terms improves ranking accuracy by 12%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'forecasts' && analyticsData && (
        <div className="space-y-6">
          {analyticsData.forecasts ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Forecasts
                </CardTitle>
                <CardDescription>
                  AI-powered predictions for brand performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.forecasts.nextPeriod.mentions.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">Predicted Mentions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.forecasts.nextPeriod.avgRank.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Predicted Avg Rank</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analyticsData.forecasts.confidence.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Confidence Level</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Forecasting Factors:</h4>
                  <ul className="space-y-1">
                    {analyticsData.forecasts.factors.map((factor, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Forecasting</CardTitle>
                <CardDescription>Enable forecasting to see AI-powered predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  setShowForecasts(true)
                  fetchEnhancedAnalyticsData()
                }}>
                  Enable Forecasting
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Historical Query Results Modal */}
      {selectedHistoricalQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">Historical Query Results</h2>
                  <p className="text-gray-600 mt-1">{selectedHistoricalQuery.prompt}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedHistoricalQuery(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              
              <QueryResults 
                results={selectedHistoricalQuery.results} 
                queryText={selectedHistoricalQuery.prompt}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 