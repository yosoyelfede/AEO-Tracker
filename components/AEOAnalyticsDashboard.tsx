'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts'
import { 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Eye, 
  Calendar, 
  ArrowLeft, 
  Clock,
  Filter,
  Target,
  Zap,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Info,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Crown,
  Users,
  Brain,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'
import { isAdminEmail } from '@/lib/admin'
import { QueryResults } from '@/components/QueryResults'

// Types for enhanced analytics
interface BrandList {
  id: string
  name: string
  description: string
  items: { id: string; brand_name: string }[]
}

interface CoreBrandMetrics {
  brand: string
  totalMentions: number
  mentionRate: number // Percentage of queries where brand appears
  averageRank: number
  bestRank: number
  worstRank: number
  shareOfVoice: number // Percentage of total mentions
  modelCoverage: string[] // Models that mention this brand
  rankingConsistency: number // Standard deviation of rankings
  topPerformerRate: number // Percentage of #1 rankings
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface ModelPerformanceMetrics {
  model: string
  totalMentions: number
  averageRank: number
  modelBias: string // Brand this model favors most
  brands: {
    brand: string
    mentions: number
    averageRank: number
    bestRank: number
    worstRank: number
    mentionRate: number
  }[]
}

interface QueryEffectivenessMetrics {
  query: string
  queryId: string
  totalMentions: number
  uniqueBrands: number
  avgRanking: number
  effectivenessScore: number // Custom score based on mentions and rankings
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
}

interface CompetitiveAnalysis {
  brandA: string
  brandB: string
  headToHeadWins: number // Times brandA ranked higher than brandB
  totalComparisons: number
  winRate: number
  avgRankDifference: number
}

interface TimeSeriesDataPoint {
  date: string
  [brandName: string]: number | string // Dynamic brand columns
}

interface AEOAnalyticsDashboardProps {
  refreshTrigger?: number
}

// Enhanced sentiment analysis
const analyzeQuerySentiment = (query: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number, keywords: string[] } => {
  const positiveKeywords = ['best', 'top', 'great', 'excellent', 'amazing', 'good', 'favorite', 'recommend', 'quality', 'premium', 'mejor', 'bueno']
  const negativeKeywords = ['worst', 'bad', 'terrible', 'awful', 'poor', 'cheap', 'avoid', 'problems', 'issues', 'complaints', 'peor', 'malo']
  
  const lowerQuery = query.toLowerCase()
  let positiveScore = 0
  let negativeScore = 0
  const foundKeywords: string[] = []
  
  positiveKeywords.forEach(word => {
    if (lowerQuery.includes(word)) {
      positiveScore++
      foundKeywords.push(word)
    }
  })
  
  negativeKeywords.forEach(word => {
    if (lowerQuery.includes(word)) {
      negativeScore++
      foundKeywords.push(word)
    }
  })
  
  if (positiveScore > negativeScore) {
    return { sentiment: 'positive', score: positiveScore - negativeScore, keywords: foundKeywords }
  } else if (negativeScore > positiveScore) {
    return { sentiment: 'negative', score: negativeScore - positiveScore, keywords: foundKeywords }
  } else {
    return { sentiment: 'neutral', score: 0, keywords: foundKeywords }
  }
}

// Color schemes for charts
const BRAND_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', 
  '#84CC16', '#F97316', '#8B5A2B', '#EC4899', '#6366F1'
]

const MODEL_COLORS = {
  'chatgpt': '#10B981',
  'claude': '#8B5CF6', 
  'gemini': '#F59E0B',
  'perplexity': '#06B6D4'
}

export function AEOAnalyticsDashboard({ refreshTrigger }: AEOAnalyticsDashboardProps) {
  console.log('AEOAnalyticsDashboard rendered with refreshTrigger:', refreshTrigger)
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]) // For filtering
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  
  // Enhanced analytics data
  const [coreBrandMetrics, setCoreBrandMetrics] = useState<CoreBrandMetrics[]>([])
  const [modelPerformance, setModelPerformance] = useState<ModelPerformanceMetrics[]>([])
  const [queryEffectiveness, setQueryEffectiveness] = useState<QueryEffectivenessMetrics[]>([])
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysis[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([])
  
  // UI State
  const [activeMetricTab, setActiveMetricTab] = useState<'overview' | 'models' | 'queries' | 'competitive'>('overview')
  const [selectedHistoricalQuery, setSelectedHistoricalQuery] = useState<{
    id: string
    prompt: string
    results: any[]
  } | null>(null)

  useEffect(() => {
    if (user) {
      fetchBrandLists()
    }
  }, [user])

  useEffect(() => {
    if (selectedBrandListId) {
      fetchAnalyticsData()
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
        // Auto-select all brands initially
        setSelectedBrands(lists[0].items.map(item => item.brand_name))
      }
    }
    setLoading(false)
  }

  const fetchAnalyticsData = async () => {
    if (!selectedBrandListId || !user) return

    setLoading(true)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      startDate.setDate(endDate.getDate() - days)

      // Admin access check
      const isAdmin = user?.email && isAdminEmail(user.email)
      const userIds = isAdmin ? [user.id] : [user?.id].filter(Boolean)

      // Fetch comprehensive query data
      const { data: queries, error } = await supabase
        .from('queries')
        .select(`
          id,
          prompt,
          created_at,
          brand_list_id,
          runs (
            id,
            model,
            raw_response,
            created_at,
            mentions (
              rank,
              brands (
                name
              )
            )
          )
        `)
        .eq('brand_list_id', selectedBrandListId)
        .in('user_id', userIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching analytics data:', error)
        return
      }

      console.log('Fetched queries for analytics:', JSON.stringify(queries, null, 2))

      // Process enhanced analytics
      processEnhancedAnalytics(queries || [])

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const processEnhancedAnalytics = (queries: any[]) => {
    const selectedBrandList = brandLists.find(list => list.id === selectedBrandListId)
    const allBrandNames = selectedBrandList?.items.map(item => item.brand_name) || []
    
    // Filter by selected brands if any are specified
    const brandNames = selectedBrands.length > 0 ? selectedBrands : allBrandNames

    // Initialize data structures
    const brandStats: { [brand: string]: {
      mentions: number
      ranks: number[]
      models: Set<string>
      queriesAppeared: Set<string>
      totalQueries: number
      firstRanks: number
      dailyMentions: { [date: string]: number }
    } } = {}

    const modelStats: { [model: string]: {
      brands: { [brand: string]: { mentions: number, ranks: number[] } }
      totalMentions: number
    } } = {}

    const queryStats: { [queryId: string]: {
      prompt: string
      mentions: number
      brands: Set<string>
      ranks: number[]
      sentiment: any
    } } = {}

    // Initialize brand data
    brandNames.forEach(brand => {
      brandStats[brand] = {
        mentions: 0,
        ranks: [],
        models: new Set(),
        queriesAppeared: new Set(),
        totalQueries: 0,
        firstRanks: 0,
        dailyMentions: {}
      }
    })

    const totalQueries = queries.length
    const totalRuns = queries.reduce((sum, q) => sum + (q.runs?.length || 0), 0)

    // Process all data
    queries.forEach(query => {
      const date = new Date(query.created_at).toISOString().split('T')[0]
      const querySentiment = analyzeQuerySentiment(query.prompt)
      
      // Initialize query stats
      if (!queryStats[query.id]) {
        queryStats[query.id] = {
          prompt: query.prompt,
          mentions: 0,
          brands: new Set(),
          ranks: [],
          sentiment: querySentiment
        }
      }

      // Track total queries per brand
      brandNames.forEach(brand => {
        brandStats[brand].totalQueries = totalQueries
      })

      query.runs?.forEach((run: any) => {
        const model = run.model
        
        // Initialize model stats
        if (!modelStats[model]) {
          modelStats[model] = { brands: {}, totalMentions: 0 }
        }

        run.mentions?.forEach((mention: any) => {
          const brandName = mention.brands?.name
          if (brandNames.includes(brandName)) {
            const rank = mention.rank

            // Update brand stats
            brandStats[brandName].mentions++
            brandStats[brandName].ranks.push(rank)
            brandStats[brandName].models.add(model)
            brandStats[brandName].queriesAppeared.add(query.id)
            if (rank === 1) brandStats[brandName].firstRanks++

            // Daily mentions for time series
            if (!brandStats[brandName].dailyMentions[date]) {
              brandStats[brandName].dailyMentions[date] = 0
            }
            brandStats[brandName].dailyMentions[date]++

            // Update model stats
            if (!modelStats[model].brands[brandName]) {
              modelStats[model].brands[brandName] = { mentions: 0, ranks: [] }
            }
            modelStats[model].brands[brandName].mentions++
            modelStats[model].brands[brandName].ranks.push(rank)
            modelStats[model].totalMentions++

            // Update query stats
            queryStats[query.id].mentions++
            queryStats[query.id].brands.add(brandName)
            queryStats[query.id].ranks.push(rank)
          }
        })
      })
    })

    // Calculate total mentions for share of voice
    const totalMentionsAcrossAllBrands = Object.values(brandStats).reduce((sum, brand) => sum + brand.mentions, 0)

    // Build Core Brand Metrics
    const coreMetrics: CoreBrandMetrics[] = brandNames.map(brand => {
      const stats = brandStats[brand]
      const avgRank = stats.ranks.length > 0 ? stats.ranks.reduce((sum, rank) => sum + rank, 0) / stats.ranks.length : 0
      const mentionRate = stats.totalQueries > 0 ? (stats.queriesAppeared.size / stats.totalQueries) * 100 : 0
      const shareOfVoice = totalMentionsAcrossAllBrands > 0 ? (stats.mentions / totalMentionsAcrossAllBrands) * 100 : 0
      const topPerformerRate = stats.mentions > 0 ? (stats.firstRanks / stats.mentions) * 100 : 0
      
      // Calculate ranking consistency (lower std dev = more consistent)
      const rankingConsistency = stats.ranks.length > 1 ? 
        Math.sqrt(stats.ranks.reduce((sum, rank) => sum + Math.pow(rank - avgRank, 2), 0) / stats.ranks.length) : 0

      return {
        brand,
        totalMentions: stats.mentions,
        mentionRate,
        averageRank: avgRank,
        bestRank: stats.ranks.length > 0 ? Math.min(...stats.ranks) : 0,
        worstRank: stats.ranks.length > 0 ? Math.max(...stats.ranks) : 0,
        shareOfVoice,
        modelCoverage: Array.from(stats.models),
        rankingConsistency,
        topPerformerRate,
        trend: 'stable' as const, // Would need historical comparison
        trendPercentage: 0
      }
    }).sort((a, b) => b.totalMentions - a.totalMentions)

    console.log('Processed coreBrandMetrics:', coreMetrics)

    // Build Model Performance Metrics
    const modelMetrics: ModelPerformanceMetrics[] = Object.entries(modelStats).map(([model, stats]) => {
      const brandAnalysis = Object.entries(stats.brands).map(([brand, brandData]) => {
        const avgRank = brandData.ranks.length > 0 ? 
          brandData.ranks.reduce((sum, rank) => sum + rank, 0) / brandData.ranks.length : 0
        const mentionRate = brandStats[brand].totalQueries > 0 ? 
          (brandData.mentions / brandStats[brand].totalQueries) * 100 : 0

        return {
          brand,
          mentions: brandData.mentions,
          averageRank: avgRank,
          bestRank: brandData.ranks.length > 0 ? Math.min(...brandData.ranks) : 0,
          worstRank: brandData.ranks.length > 0 ? Math.max(...brandData.ranks) : 0,
          mentionRate
        }
      }).sort((a, b) => a.averageRank - b.averageRank) // Sort by best ranking

      const modelBias = brandAnalysis.length > 0 ? brandAnalysis[0].brand : 'None'

      return {
        model,
        totalMentions: stats.totalMentions,
        averageRank: brandAnalysis.length > 0 ? 
          brandAnalysis.reduce((sum, brand) => sum + brand.averageRank, 0) / brandAnalysis.length : 0,
        modelBias,
        brands: brandAnalysis
      }
    }).sort((a, b) => b.totalMentions - a.totalMentions)

    console.log('Processed modelPerformance:', modelMetrics)

    // Build Query Effectiveness Metrics
    const queryMetrics: QueryEffectivenessMetrics[] = Object.entries(queryStats).map(([queryId, stats]) => {
      const avgRanking = stats.ranks.length > 0 ? stats.ranks.reduce((sum, rank) => sum + rank, 0) / stats.ranks.length : 0
      // Effectiveness score: higher mentions, unique brands, and better rankings = higher score
      const effectivenessScore = (stats.mentions * 10) + (stats.brands.size * 5) + Math.max(0, (10 - avgRanking))

      return {
        query: stats.prompt,
        queryId,
        totalMentions: stats.mentions,
        uniqueBrands: stats.brands.size,
        avgRanking,
        effectivenessScore,
        sentiment: stats.sentiment.sentiment,
        keywords: stats.sentiment.keywords
      }
    }).sort((a, b) => b.effectivenessScore - a.effectivenessScore)

    console.log('Processed queryEffectiveness:', queryMetrics)

    setCoreBrandMetrics(coreMetrics)
    setModelPerformance(modelMetrics)
    setQueryEffectiveness(queryMetrics)

    // Build Competitive Analysis
    const competitive: CompetitiveAnalysis[] = []
    for (let i = 0; i < brandNames.length; i++) {
      for (let j = i + 1; j < brandNames.length; j++) {
        const brandA = brandNames[i]
        const brandB = brandNames[j]
        
        let headToHeadWins = 0
        let totalComparisons = 0
        let rankDifferences: number[] = []

        // Compare brands in each query where both appear
        queries.forEach(query => {
          const brandARanks: number[] = []
          const brandBRanks: number[] = []

          query.runs?.forEach((run: any) => {
            run.mentions?.forEach((mention: any) => {
              if (mention.brands?.name === brandA) brandARanks.push(mention.rank)
              if (mention.brands?.name === brandB) brandBRanks.push(mention.rank)
            })
          })

          // If both brands appear in this query, compare their best ranks
          if (brandARanks.length > 0 && brandBRanks.length > 0) {
            const bestRankA = Math.min(...brandARanks)
            const bestRankB = Math.min(...brandBRanks)
            
            totalComparisons++
            if (bestRankA < bestRankB) headToHeadWins++
            rankDifferences.push(bestRankA - bestRankB)
          }
        })

        if (totalComparisons > 0) {
          const winRate = (headToHeadWins / totalComparisons) * 100
          const avgRankDifference = rankDifferences.reduce((sum, diff) => sum + diff, 0) / rankDifferences.length

          competitive.push({
            brandA,
            brandB,
            headToHeadWins,
            totalComparisons,
            winRate,
            avgRankDifference
          })
        }
      }
    }

    setCompetitiveAnalysis(competitive.sort((a, b) => b.winRate - a.winRate))

    // Build Time Series Data
    const allDates = new Set<string>()
    Object.values(brandStats).forEach(brand => {
      Object.keys(brand.dailyMentions).forEach(date => allDates.add(date))
    })

    const timeSeriesArray: TimeSeriesDataPoint[] = Array.from(allDates)
      .sort()
      .map(date => {
        const dataPoint: TimeSeriesDataPoint = {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
        
        brandNames.forEach(brand => {
          dataPoint[brand] = brandStats[brand].dailyMentions[date] || 0
        })
        
        return dataPoint
      })

    setTimeSeriesData(timeSeriesArray)
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

  // Filter data based on selected brands
  const filteredCoreBrandMetrics = coreBrandMetrics.filter(metric => 
    selectedBrands.length === 0 || selectedBrands.includes(metric.brand)
  )

  const filteredTimeSeriesData = timeSeriesData.map(dataPoint => {
    const filtered: TimeSeriesDataPoint = { date: dataPoint.date }
    Object.keys(dataPoint).forEach(key => {
      if (key === 'date' || selectedBrands.length === 0 || selectedBrands.includes(key)) {
        filtered[key] = dataPoint[key]
      }
    })
    return filtered
  })

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
            <CardDescription>Choose a brand list to view analytics</CardDescription>
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
      {/* Header with Brand List Selection and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">AEO Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {selectedBrandList?.name} • {filteredCoreBrandMetrics.length} brands tracked
          </p>
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

      {/* Metric Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Brand Overview', icon: Target },
          { id: 'models', label: 'Model Performance', icon: Brain },
          { id: 'queries', label: 'Query Effectiveness', icon: Zap },
          { id: 'competitive', label: 'Competitive Analysis', icon: Award }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeMetricTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveMetricTab(tab.id as any)}
              className="flex-1"
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Main Content Based on Active Tab */}
      {activeMetricTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredCoreBrandMetrics.reduce((sum, brand) => sum + brand.totalMentions, 0)}
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
                  {filteredCoreBrandMetrics.length > 0 
                    ? (filteredCoreBrandMetrics.reduce((sum, brand) => sum + brand.mentionRate, 0) / filteredCoreBrandMetrics.length).toFixed(1)
                    : 0}%
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
                  {filteredCoreBrandMetrics.length > 0 
                    ? (filteredCoreBrandMetrics.reduce((sum, brand) => sum + brand.averageRank, 0) / filteredCoreBrandMetrics.length).toFixed(1)
                    : 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Average position when mentioned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Top Performer Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredCoreBrandMetrics.length > 0 
                    ? (filteredCoreBrandMetrics.reduce((sum, brand) => sum + brand.topPerformerRate, 0) / filteredCoreBrandMetrics.length).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">#1 ranking frequency</p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Performance Overview</CardTitle>
              <CardDescription>Key metrics for all tracked brands</CardDescription>
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
                      <th className="text-right p-2">Best Rank</th>
                      <th className="text-right p-2">Share of Voice</th>
                      <th className="text-right p-2">Model Coverage</th>
                      <th className="text-right p-2">#1 Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoreBrandMetrics.map((brand, index) => (
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
                        <td className="text-right p-2">
                          <Badge variant={brand.bestRank === 1 ? "default" : "secondary"}>
                            #{brand.bestRank}
                          </Badge>
                        </td>
                        <td className="text-right p-2">{brand.shareOfVoice.toFixed(1)}%</td>
                        <td className="text-right p-2">{brand.modelCoverage.length}/4</td>
                        <td className="text-right p-2">
                          <span className={brand.topPerformerRate > 20 ? "text-green-600 font-medium" : ""}>
                            {brand.topPerformerRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Share of Voice Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share of Voice Distribution</CardTitle>
                <CardDescription>Percentage of total mentions by brand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredCoreBrandMetrics}
                      dataKey="shareOfVoice"
                      nameKey="brand"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ brand, shareOfVoice }) => `${brand}: ${shareOfVoice.toFixed(1)}%`}
                    >
                      {filteredCoreBrandMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mention Rate vs Average Ranking</CardTitle>
                <CardDescription>Bubble chart showing performance correlation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={filteredCoreBrandMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mentionRate" label={{ value: 'Mention Rate (%)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Avg Rank', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="averageRank" fill="#8884d8" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mention Trends Over Time</CardTitle>
              <CardDescription>Daily mention count for selected brands</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedBrands.map((brand, index) => (
                    <Line
                      key={brand}
                      type="monotone"
                      dataKey={brand}
                      stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeMetricTab === 'models' && (
        <div className="space-y-6">
          {/* Model Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modelPerformance.map(model => (
              <Card key={model.model}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: MODEL_COLORS[model.model as keyof typeof MODEL_COLORS] || '#666' }}
                    />
                    {model.model.charAt(0).toUpperCase() + model.model.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{model.totalMentions}</div>
                  <p className="text-xs text-gray-500">Total mentions</p>
                  <div className="text-sm text-gray-600 mt-2">
                    Favors: <span className="font-medium">{model.modelBias}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Model Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
              <CardDescription>Total mentions by model across all brands</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalMentions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Model Analysis */}
          {modelPerformance.map(model => (
            <Card key={model.model}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[model.model as keyof typeof MODEL_COLORS] || '#666' }}
                  />
                  {model.model.charAt(0).toUpperCase() + model.model.slice(1)} Performance
                </CardTitle>
                <CardDescription>
                  Brand performance within this model • Model Bias: {model.modelBias}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Brand</th>
                        <th className="text-right p-2">Mentions</th>
                        <th className="text-right p-2">Avg Rank</th>
                        <th className="text-right p-2">Best Rank</th>
                        <th className="text-right p-2">Mention Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.brands
                        .filter(brand => selectedBrands.length === 0 || selectedBrands.includes(brand.brand))
                        .map((brand, index) => (
                        <tr key={brand.brand} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{brand.brand}</td>
                          <td className="text-right p-2">{brand.mentions}</td>
                          <td className="text-right p-2">{brand.averageRank.toFixed(1)}</td>
                          <td className="text-right p-2">
                            <Badge variant={brand.bestRank === 1 ? "default" : "secondary"}>
                              #{brand.bestRank}
                            </Badge>
                          </td>
                          <td className="text-right p-2">{brand.mentionRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeMetricTab === 'queries' && (
        <div className="space-y-6">
          {/* Query Effectiveness Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Query Effectiveness Analysis</CardTitle>
              <CardDescription>
                Which queries generate the most brand visibility and best rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Query</th>
                      <th className="text-right p-2">Mentions</th>
                      <th className="text-right p-2">Brands</th>
                      <th className="text-right p-2">Avg Rank</th>
                      <th className="text-right p-2">Effectiveness</th>
                      <th className="text-right p-2">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryEffectiveness.slice(0, 10).map((query) => (
                      <tr key={query.queryId} className="border-b hover:bg-gray-50">
                        <td className="p-2 max-w-xs">
                          <div className="truncate" title={query.query}>
                            {query.query}
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">{query.totalMentions}</td>
                        <td className="text-right p-2">{query.uniqueBrands}</td>
                        <td className="text-right p-2">{query.avgRanking.toFixed(1)}</td>
                        <td className="text-right p-2">
                          <Badge variant="secondary">
                            {query.effectivenessScore.toFixed(0)}
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          <Badge 
                            variant={
                              query.sentiment === 'positive' ? 'default' : 
                              query.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }
                          >
                            {query.sentiment}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Query Effectiveness Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Query Effectiveness vs Sentiment</CardTitle>
              <CardDescription>Correlation between query sentiment and brand visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={queryEffectiveness.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="query" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Query: ${label}`}
                    formatter={(value, name) => [
                      name === 'effectivenessScore' ? `${value} points` : value,
                      name === 'effectivenessScore' ? 'Effectiveness Score' : name
                    ]}
                  />
                  <Bar dataKey="effectivenessScore" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeMetricTab === 'competitive' && (
        <div className="space-y-6">
          {/* Competitive Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Head-to-Head Brand Comparisons</CardTitle>
              <CardDescription>
                Direct competitive analysis when brands appear in the same queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitiveAnalysis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Matchup</th>
                        <th className="text-right p-2">Win Rate</th>
                        <th className="text-right p-2">Wins</th>
                        <th className="text-right p-2">Total Comparisons</th>
                        <th className="text-right p-2">Avg Rank Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitiveAnalysis.map((comp, index) => (
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

          {/* Win Rate Visualization */}
          {competitiveAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Competitive Win Rates</CardTitle>
                <CardDescription>Visual representation of head-to-head performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={competitiveAnalysis.slice(0, 10)}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis 
                      type="category" 
                      dataKey={(data) => `${data.brandA} vs ${data.brandB}`}
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Win Rate']}
                      labelFormatter={(label) => `Matchup: ${label}`}
                    />
                    <Bar dataKey="winRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
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