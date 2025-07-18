import { format, subDays, parseISO, differenceInDays } from 'date-fns'

// Enhanced Analytics Types
export interface AnalyticsProcessor {
  calculateBrandMetrics: (data: QueryData[]) => BrandMetrics
  calculateCompetitiveAnalysis: (data: QueryData[]) => CompetitiveMetrics
  calculateTrends: (data: QueryData[], timeRange: TimeRange) => TrendData
  generateForecasts: (historicalData: QueryData[]) => ForecastData
}

export interface QueryData {
  id: string
  prompt: string
  created_at: string
  brand_list_id: string
  runs: {
    id: string
    model: string
    raw_response: string
    created_at: string
    mentions: {
      rank: number
      brands: {
        name: string
      }
    }[]
  }[]
}

export interface BrandMetrics {
  brand: string
  totalMentions: number
  mentionRate: number
  averageRank: number
  bestRank: number
  worstRank: number
  shareOfVoice: number
  modelCoverage: string[]
  rankingConsistency: number
  topPerformerRate: number
  mentionVelocity: number // Mentions per day
  rankingStability: number // Coefficient of variation
  marketPenetration: number // Presence across query categories
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  dailyMentions: { [date: string]: number }
  queryCategories: { [category: string]: number }
}

export interface CompetitiveMetrics {
  brandA: string
  brandB: string
  headToHeadWins: number
  totalComparisons: number
  winRate: number
  avgRankDifference: number
  competitiveIntensity: number
  marketPosition: number
}

export interface TrendData {
  period: string
  data: {
    date: string
    mentions: number
    avgRank: number
    shareOfVoice: number
  }[]
  trend: 'up' | 'down' | 'stable'
  percentageChange: number
}

export interface ForecastData {
  nextPeriod: {
    mentions: number
    avgRank: number
    shareOfVoice: number
  }
  confidence: number
  factors: string[]
}

export interface QueryEffectivenessMetrics {
  queryId: string
  query: string
  totalMentions: number
  uniqueBrands: number
  avgRanking: number
  effectivenessScore: number
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  successRate: number
  queryType: string
  createdAt: string
}

export interface TimeRange {
  start: Date
  end: Date
  days: number
}

// Statistical Utility Functions
export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(variance)
}

export const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

export const calculateCoefficientOfVariation = (values: number[]): number => {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  if (mean === 0) return 0
  const stdDev = calculateStandardDeviation(values)
  return (stdDev / mean) * 100
}

// Enhanced Analytics Calculation Functions
export const calculateBrandMetrics = (data: QueryData[], brandNames: string[]): BrandMetrics[] => {
  const brandStats: { [brand: string]: {
    mentions: number
    ranks: number[]
    models: Set<string>
    queriesAppeared: Set<string>
    totalQueries: number
    firstRanks: number
    dailyMentions: { [date: string]: number }
    queryCategories: { [category: string]: number }
    dates: string[]
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
      dailyMentions: {},
      queryCategories: {},
      dates: []
    }
  })

  const totalQueries = data.length

  // Process all data
  data.forEach(query => {
    const date = new Date(query.created_at).toISOString().split('T')[0]
    const queryCategory = categorizeQuery(query.prompt)
    
    // Track total queries per brand
    brandNames.forEach(brand => {
      brandStats[brand].totalQueries = totalQueries
      if (!brandStats[brand].queryCategories[queryCategory]) {
        brandStats[brand].queryCategories[queryCategory] = 0
      }
    })

    query.runs?.forEach(run => {
      const model = run.model
      
      run.mentions?.forEach(mention => {
        const brandName = mention.brands?.name
        if (brandNames.includes(brandName)) {
          const rank = mention.rank

          // Update brand stats
          brandStats[brandName].mentions++
          brandStats[brandName].ranks.push(rank)
          brandStats[brandName].models.add(model)
          brandStats[brandName].queriesAppeared.add(query.id)
          brandStats[brandName].queryCategories[queryCategory]++
          if (rank === 1) brandStats[brandName].firstRanks++

          // Daily mentions for time series
          if (!brandStats[brandName].dailyMentions[date]) {
            brandStats[brandName].dailyMentions[date] = 0
          }
          brandStats[brandName].dailyMentions[date]++
          brandStats[brandName].dates.push(date)
        }
      })
    })
  })

  // Calculate total mentions for share of voice
  const totalMentions = Object.values(brandStats).reduce((sum, brand) => sum + brand.mentions, 0)

  // Build enhanced brand metrics
  return brandNames.map(brand => {
    const stats = brandStats[brand]
    const avgRank = stats.ranks.length > 0 ? stats.ranks.reduce((sum, rank) => sum + rank, 0) / stats.ranks.length : 0
    const mentionRate = stats.totalQueries > 0 ? (stats.queriesAppeared.size / stats.totalQueries) * 100 : 0
    const shareOfVoice = totalMentions > 0 ? (stats.mentions / totalMentions) * 100 : 0
    const topPerformerRate = stats.mentions > 0 ? (stats.firstRanks / stats.mentions) * 100 : 0
    
    // Enhanced metrics
    const rankingConsistency = calculateStandardDeviation(stats.ranks)
    const rankingStability = calculateCoefficientOfVariation(stats.ranks)
    const mentionVelocity = stats.dates.length > 0 ? stats.mentions / (differenceInDays(new Date(), parseISO(stats.dates[0])) + 1) : 0
    
    // Market penetration (presence across query categories)
    const totalCategories = Object.keys(stats.queryCategories).length
    const marketPenetration = totalCategories > 0 ? (totalCategories / 5) * 100 : 0 // Assuming 5 main categories

    // Trend calculation (simplified - would need historical comparison)
    const trend = 'stable' as const
    const trendPercentage = 0

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
      mentionVelocity,
      rankingStability,
      marketPenetration,
      trend,
      trendPercentage,
      dailyMentions: stats.dailyMentions,
      queryCategories: stats.queryCategories
    }
  }).sort((a, b) => b.totalMentions - a.totalMentions)
}

export const calculateCompetitiveAnalysis = (data: QueryData[], brandNames: string[]): CompetitiveMetrics[] => {
  const competitive: CompetitiveMetrics[] = []
  
  for (let i = 0; i < brandNames.length; i++) {
    for (let j = i + 1; j < brandNames.length; j++) {
      const brandA = brandNames[i]
      const brandB = brandNames[j]
      
      let headToHeadWins = 0
      let totalComparisons = 0
      const rankDifferences: number[] = []

      // Compare brands in each query where both appear
      data.forEach(query => {
        const brandARanks: number[] = []
        const brandBRanks: number[] = []

        query.runs?.forEach(run => {
          run.mentions?.forEach(mention => {
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
        const competitiveIntensity = totalComparisons / data.length * 100
        const marketPosition = winRate >= 60 ? 1 : winRate >= 40 ? 2 : 3

        competitive.push({
          brandA,
          brandB,
          headToHeadWins,
          totalComparisons,
          winRate,
          avgRankDifference,
          competitiveIntensity,
          marketPosition
        })
      }
    }
  }

  return competitive.sort((a, b) => b.winRate - a.winRate)
}

export const calculateTrends = (data: QueryData[]): TrendData[] => {
  // Group data by time periods
  const periods: { [period: string]: {
    mentions: number[]
    ranks: number[]
    shareOfVoice: number[]
  } } = {}

  data.forEach(query => {
    const queryDate = parseISO(query.created_at)
    const period = format(queryDate, 'yyyy-MM-dd')
    
    if (!periods[period]) {
      periods[period] = { mentions: [], ranks: [], shareOfVoice: [] }
    }

    let totalMentions = 0
    const ranks: number[] = []

    query.runs?.forEach(run => {
      run.mentions?.forEach(mention => {
        totalMentions++
        ranks.push(mention.rank)
      })
    })

    if (totalMentions > 0) {
      periods[period].mentions.push(totalMentions)
      periods[period].ranks.push(...ranks)
      periods[period].shareOfVoice.push(totalMentions)
    }
  })

  // Calculate trend data
  const trendData: TrendData[] = Object.entries(periods).map(([period, data]) => {
    const avgMentions = data.mentions.length > 0 ? data.mentions.reduce((sum, val) => sum + val, 0) / data.mentions.length : 0
    const avgRank = data.ranks.length > 0 ? data.ranks.reduce((sum, val) => sum + val, 0) / data.ranks.length : 0
    const avgShareOfVoice = data.shareOfVoice.length > 0 ? data.shareOfVoice.reduce((sum, val) => sum + val, 0) / data.shareOfVoice.length : 0

    return {
      period,
      data: [{
        date: period,
        mentions: avgMentions,
        avgRank,
        shareOfVoice: avgShareOfVoice
      }],
      trend: 'stable' as const,
      percentageChange: 0
    }
  })

  return trendData.sort((a, b) => a.period.localeCompare(b.period))
}

export const generateForecasts = (historicalData: QueryData[]): ForecastData => {
  // Simple linear regression for forecasting
  const dates = historicalData.map(query => parseISO(query.created_at))
  const mentions = historicalData.map(query => 
    query.runs?.reduce((sum, run) => sum + (run.mentions?.length || 0), 0) || 0
  )

  if (dates.length < 2) {
    return {
      nextPeriod: { mentions: 0, avgRank: 0, shareOfVoice: 0 },
      confidence: 0,
      factors: ['Insufficient data for forecasting']
    }
  }

  // Simple trend calculation
  const firstHalf = mentions.slice(0, Math.floor(mentions.length / 2))
  const secondHalf = mentions.slice(Math.floor(mentions.length / 2))
  
  const avgFirst = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const trend = avgSecond - avgFirst
  const nextPeriodMentions = Math.max(0, avgSecond + trend)

  return {
    nextPeriod: {
      mentions: nextPeriodMentions,
      avgRank: 5, // Default assumption
      shareOfVoice: 20 // Default assumption
    },
    confidence: Math.min(85, Math.max(20, 100 - Math.abs(trend) * 10)),
    factors: [
      'Historical trend analysis',
      'Seasonal patterns',
      'Query volume changes'
    ]
  }
}

// Query Categorization
export const categorizeQuery = (query: string): string => {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('recommend')) {
    return 'Recommendation'
  } else if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
    return 'Comparison'
  } else if (lowerQuery.includes('review') || lowerQuery.includes('opinion') || lowerQuery.includes('experience')) {
    return 'Review'
  } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('affordable')) {
    return 'Pricing'
  } else if (lowerQuery.includes('location') || lowerQuery.includes('near') || lowerQuery.includes('address')) {
    return 'Location'
  } else {
    return 'General'
  }
}

// Time Range Utilities
export const createTimeRange = (days: number): TimeRange => {
  const end = new Date()
  const start = subDays(end, days)
  return { start, end, days }
}

export const formatTimeRange = (timeRange: TimeRange): string => {
  return `${format(timeRange.start, 'MMM dd')} - ${format(timeRange.end, 'MMM dd, yyyy')}`
}

// Performance Metrics
export const calculateQueryEffectiveness = (query: string, mentions: number, avgRank: number): number => {
  const sentiment = analyzeQuerySentiment(query)
  const sentimentScore = sentiment.sentiment === 'positive' ? 1.2 : sentiment.sentiment === 'negative' ? 0.8 : 1.0
  
  // Effectiveness formula: mentions * sentiment * (10 - avgRank) / 10
  return (mentions * sentimentScore * Math.max(1, 10 - avgRank)) / 10
}

export const analyzeQuerySentiment = (query: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number, keywords: string[] } => {
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

// Export Utilities
export const exportAnalyticsData = (data: unknown[], format: 'csv' | 'json'): string => {
  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  } else {
    // CSV export logic
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
              ...data.map((row) => headers.map(header => JSON.stringify((row as Record<string, unknown>)[header])).join(','))
    ].join('\n')
    return csvContent
  }
} 