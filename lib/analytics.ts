// Analytics calculation functions based on finalanalytics.md specification

import {
  AnalyticsDataPoint,
  CoverageRate,
  ShareOfVoice,
  AverageMentionRank,
  SentimentScore,
  SentimentWeightedSoV,
  AnswerRichness,
  CitationPresence,
  ModelWinRate,
  CompetitiveWinRate,
  QueryEffectiveness,
  VolatilityIndex,
  TimeRange,
  ModelType,
  ComprehensiveAnalytics,
  AnalyticsSummary
} from '@/types/analytics'

// Utility function to create time range
export function createTimeRange(days: number): TimeRange {
  const end = new Date()
  const start = new Date(end.getTime() - (days * 24 * 60 * 60 * 1000))
  return { start, end, days }
}

// Filter data by time range
function filterByTimeRange(data: AnalyticsDataPoint[], timeRange: TimeRange): AnalyticsDataPoint[] {
  return data.filter(point => {
    const pointDate = new Date(point.timestamp)
    return pointDate >= timeRange.start && pointDate <= timeRange.end
  })
}

// Group data by date for time series
function groupByDate(data: AnalyticsDataPoint[]): Map<string, AnalyticsDataPoint[]> {
  const grouped = new Map<string, AnalyticsDataPoint[]>()
  
  data.forEach(point => {
    const date = new Date(point.timestamp).toISOString().split('T')[0]
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(point)
  })
  
  return grouped
}

// 2.1 Coverage Rate (CR) - Percentage of queries where brand appears
export function calculateCoverageRate(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): CoverageRate {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model)
  
  // Get unique queries for this brand/model combination
  const uniqueQueries = new Set(brandModelData.map(d => d.query_id))
  const totalQueries = new Set(filteredData.filter(d => d.model === model).map(d => d.query_id)).size
  
  const rate = totalQueries > 0 ? (uniqueQueries.size / totalQueries) * 100 : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayQueries = new Set(dayData.map(d => d.query_id)).size
    const totalDayQueries = new Set(filteredData.filter(d => d.model === model && d.timestamp.startsWith(date)).map(d => d.query_id)).size
    return {
      date,
      rate: totalDayQueries > 0 ? (dayQueries / totalDayQueries) * 100 : 0
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    rate,
    time_series: timeSeries
  }
}

// 2.2 Share of Voice (SoV) - Proportion of mentions of a brand over total
export function calculateShareOfVoice(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): ShareOfVoice {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model && d.mentioned)
  const allModelData = filteredData.filter(d => d.model === model && d.mentioned)
  
  const brandMentions = brandModelData.length
  const totalMentions = allModelData.length
  const percentage = totalMentions > 0 ? (brandMentions / totalMentions) * 100 : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayBrandMentions = dayData.length
    const dayTotalMentions = allModelData.filter(d => d.timestamp.startsWith(date)).length
    return {
      date,
      percentage: dayTotalMentions > 0 ? (dayBrandMentions / dayTotalMentions) * 100 : 0
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    percentage,
    total_mentions: brandMentions,
    total_mentions_all_brands: totalMentions,
    time_series: timeSeries
  }
}

// 2.3 Average Mention Rank (AMR) - Mean of first_rank where mentioned=true
export function calculateAverageMentionRank(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): AverageMentionRank {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model && d.mentioned && d.first_rank !== null)
  
  const totalMentions = brandModelData.length
  const averageRank = totalMentions > 0 
    ? brandModelData.reduce((sum, d) => sum + (d.first_rank || 0), 0) / totalMentions 
    : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayAverageRank = dayData.length > 0 
      ? dayData.reduce((sum, d) => sum + (d.first_rank || 0), 0) / dayData.length 
      : 0
    return {
      date,
      average_rank: dayAverageRank
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    average_rank: averageRank,
    total_mentions: totalMentions,
    time_series: timeSeries
  }
}

// 2.4 Sentiment Score - Mean of sentiment where mentioned=true
export function calculateSentimentScore(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): SentimentScore {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model && d.mentioned && d.sentiment !== null)
  
  const totalMentions = brandModelData.length
  const averageSentiment = totalMentions > 0 
    ? brandModelData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / totalMentions 
    : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayAverageSentiment = dayData.length > 0 
      ? dayData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / dayData.length 
      : 0
    return {
      date,
      average_sentiment: dayAverageSentiment
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    average_sentiment: averageSentiment,
    total_mentions: totalMentions,
    time_series: timeSeries
  }
}

// 2.5 Sentiment-Weighted SoV (SW-SoV) - SoV * (sentiment+1)/2
export function calculateSentimentWeightedSoV(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): SentimentWeightedSoV {
  const sov = calculateShareOfVoice(data, brand, model, timeRange)
  const sentiment = calculateSentimentScore(data, brand, model, timeRange)
  
  const sentimentMultiplier = (sentiment.average_sentiment + 1) / 2
  const swSov = sov.percentage * sentimentMultiplier
  
  // Create time series
  const timeSeries = sov.time_series.map((sovPoint, index) => {
    const sentimentPoint = sentiment.time_series[index]
    const daySentimentMultiplier = sentimentPoint ? (sentimentPoint.average_sentiment + 1) / 2 : 1
    return {
      date: sovPoint.date,
      sw_sov: sovPoint.percentage * daySentimentMultiplier
    }
  })
  
  return {
    brand,
    model,
    sw_sov: swSov,
    base_sov: sov.percentage,
    sentiment_multiplier: sentimentMultiplier,
    time_series: timeSeries
  }
}

// 2.6 Answer Richness (AR) - Mean of evidence_count
export function calculateAnswerRichness(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): AnswerRichness {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model && d.mentioned)
  
  const totalMentions = brandModelData.length
  const averageEvidenceCount = totalMentions > 0 
    ? brandModelData.reduce((sum, d) => sum + d.evidence_count, 0) / totalMentions 
    : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayAverageEvidence = dayData.length > 0 
      ? dayData.reduce((sum, d) => sum + d.evidence_count, 0) / dayData.length 
      : 0
    return {
      date,
      average_evidence_count: dayAverageEvidence
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    average_evidence_count: averageEvidenceCount,
    total_mentions: totalMentions,
    time_series: timeSeries
  }
}

// 2.7 Citation Presence (CP) - Percentage of mentions with citations
export function calculateCitationPresence(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): CitationPresence {
  const filteredData = filterByTimeRange(data, timeRange)
  const brandModelData = filteredData.filter(d => d.brand === brand && d.model === model && d.mentioned)
  
  const totalMentions = brandModelData.length
  const mentionsWithCitations = brandModelData.filter(d => d.has_citation).length
  const citationRate = totalMentions > 0 ? (mentionsWithCitations / totalMentions) * 100 : 0
  
  // Create time series
  const groupedData = groupByDate(brandModelData)
  const timeSeries = Array.from(groupedData.entries()).map(([date, dayData]) => {
    const dayCitations = dayData.filter(d => d.has_citation).length
    return {
      date,
      citation_rate: dayData.length > 0 ? (dayCitations / dayData.length) * 100 : 0
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    brand,
    model,
    citation_rate: citationRate,
    total_mentions: totalMentions,
    mentions_with_citations: mentionsWithCitations,
    time_series: timeSeries
  }
}

// 2.8 Model Win Rate (MWR) - Percentage of times model ranks brand first when ≥2 models mention it
export function calculateModelWinRate(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeRange: TimeRange
): ModelWinRate {
  const filteredData = filterByTimeRange(data, timeRange)
  
  // Get queries where this brand is mentioned by multiple models
  const brandQueries = new Set(filteredData.filter(d => d.brand === brand && d.mentioned).map(d => d.query_id))
  
  let totalCompetitions = 0
  let wins = 0
  
  brandQueries.forEach(queryId => {
    const queryMentions = filteredData.filter(d => d.query_id === queryId && d.brand === brand && d.mentioned)
    
    // Only count if multiple models mentioned this brand
    if (queryMentions.length >= 2) {
      totalCompetitions++
      
      // Check if this model ranked the brand first
      const modelMention = queryMentions.find(d => d.model === model)
      if (modelMention) {
        const bestRank = Math.min(...queryMentions.map(d => d.first_rank || Infinity))
        if (modelMention.first_rank === bestRank) {
          wins++
        }
      }
    }
  })
  
  const winRate = totalCompetitions > 0 ? (wins / totalCompetitions) * 100 : 0
  
  // Create time series (simplified - would need more complex logic for daily breakdown)
  const timeSeries = [{
    date: new Date().toISOString().split('T')[0],
    win_rate: winRate
  }]
  
  return {
    brand,
    model,
    win_rate: winRate,
    total_competitions: totalCompetitions,
    wins,
    time_series: timeSeries
  }
}

// 2.9 Competitive Win Rate (CWR) - Percentage of times brand_a beats brand_b
export function calculateCompetitiveWinRate(
  data: AnalyticsDataPoint[],
  brandA: string,
  brandB: string,
  timeRange: TimeRange
): CompetitiveWinRate {
  const filteredData = filterByTimeRange(data, timeRange)
  
  // Get queries where both brands are mentioned
  const brandAQueries = new Set(filteredData.filter(d => d.brand === brandA && d.mentioned).map(d => d.query_id))
  const brandBQueries = new Set(filteredData.filter(d => d.brand === brandB && d.mentioned).map(d => d.query_id))
  
  const commonQueries = new Set([...brandAQueries].filter(q => brandBQueries.has(q)))
  
  let totalComparisons = 0
  let brandAWins = 0
  
  commonQueries.forEach(queryId => {
    const brandAMentions = filteredData.filter(d => d.query_id === queryId && d.brand === brandA && d.mentioned)
    const brandBMentions = filteredData.filter(d => d.query_id === queryId && d.brand === brandB && d.mentioned)
    
    if (brandAMentions.length > 0 && brandBMentions.length > 0) {
      totalComparisons++
      
      const brandABestRank = Math.min(...brandAMentions.map(d => d.first_rank || Infinity))
      const brandBBestRank = Math.min(...brandBMentions.map(d => d.first_rank || Infinity))
      
      if (brandABestRank < brandBBestRank) {
        brandAWins++
      }
    }
  })
  
  const winRate = totalComparisons > 0 ? (brandAWins / totalComparisons) * 100 : 0
  
  // Create time series (simplified)
  const timeSeries = [{
    date: new Date().toISOString().split('T')[0],
    win_rate: winRate
  }]
  
  return {
    brand_a: brandA,
    brand_b: brandB,
    win_rate: winRate,
    total_comparisons: totalComparisons,
    brand_a_wins: brandAWins,
    time_series: timeSeries
  }
}

// 2.10 Query Effectiveness (QE) - SW-SoV sum / query length
export function calculateQueryEffectiveness(
  data: AnalyticsDataPoint[],
  queryId: string,
  brands: string[]
): QueryEffectiveness {
  const queryData = data.filter(d => d.query_id === queryId)
  const queryText = queryData[0]?.query_text || ''
  
  // Calculate SW-SoV for each brand in this query
  const swSovValues = brands.map(brand => {
    const brandData = queryData.filter(d => d.brand === brand)
    if (brandData.length === 0) return 0
    
    // Simplified SW-SoV calculation for single query
    const totalMentions = queryData.length
    const brandMentions = brandData.length
    const sov = totalMentions > 0 ? (brandMentions / totalMentions) * 100 : 0
    
    const averageSentiment = brandData.length > 0 
      ? brandData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / brandData.length 
      : 0
    
    const sentimentMultiplier = (averageSentiment + 1) / 2
    return sov * sentimentMultiplier
  })
  
  const totalSwSov = swSovValues.reduce((sum, val) => sum + val, 0)
  const effectivenessScore = queryText.length > 0 ? totalSwSov / queryText.length : 0
  
  const totalBrandsMentioned = new Set(queryData.filter(d => d.mentioned).map(d => d.brand)).size
  const averageSwSov = brands.length > 0 ? totalSwSov / brands.length : 0
  
  return {
    query_id: queryId,
    query_text: queryText,
    effectiveness_score: effectivenessScore,
    total_brands_mentioned: totalBrandsMentioned,
    average_sw_sov: averageSwSov,
    query_length: queryText.length,
    time_series: [{
      date: new Date().toISOString().split('T')[0],
      effectiveness_score: effectivenessScore
    }]
  }
}

// 2.11 Volatility Index (VI) - Standard deviation of coverage rate over time window
export function calculateVolatilityIndex(
  data: AnalyticsDataPoint[],
  brand: string,
  model: ModelType,
  timeWindowDays: number,
  timeRange: TimeRange
): VolatilityIndex {
  const coverageRates = calculateCoverageRate(data, brand, model, timeRange)
  
  // Calculate standard deviation of coverage rates
  const rates = coverageRates.time_series.map(ts => ts.rate)
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length
  const stdDev = Math.sqrt(variance)
  
  const volatilityIndex = stdDev / (mean > 0 ? mean : 1) // Normalized volatility
  
  return {
    brand,
    model,
    volatility_index: volatilityIndex,
    coverage_rate_std_dev: stdDev,
    time_window_days: timeWindowDays,
    time_series: coverageRates.time_series.map(ts => ({
      date: ts.date,
      volatility_index: volatilityIndex
    }))
  }
}

// Calculate comprehensive analytics for all metrics
export function calculateComprehensiveAnalytics(
  data: AnalyticsDataPoint[],
  brands: string[],
  models: ModelType[],
  timeRange: TimeRange
): ComprehensiveAnalytics {
  // Calculate all metrics
  const coverageRates = brands.flatMap(brand =>
    models.map(model => calculateCoverageRate(data, brand, model, timeRange))
  )
  
  const shareOfVoice = brands.flatMap(brand =>
    models.map(model => calculateShareOfVoice(data, brand, model, timeRange))
  )
  
  const averageMentionRanks = brands.flatMap(brand =>
    models.map(model => calculateAverageMentionRank(data, brand, model, timeRange))
  )
  
  const sentimentScores = brands.flatMap(brand =>
    models.map(model => calculateSentimentScore(data, brand, model, timeRange))
  )
  
  const sentimentWeightedSoV = brands.flatMap(brand =>
    models.map(model => calculateSentimentWeightedSoV(data, brand, model, timeRange))
  )
  
  const answerRichness = brands.flatMap(brand =>
    models.map(model => calculateAnswerRichness(data, brand, model, timeRange))
  )
  
  const citationPresence = brands.flatMap(brand =>
    models.map(model => calculateCitationPresence(data, brand, model, timeRange))
  )
  
  const modelWinRates = brands.flatMap(brand =>
    models.map(model => calculateModelWinRate(data, brand, model, timeRange))
  )
  
  const competitiveWinRates = brands.length > 1 ? 
    brands.slice(0, -1).flatMap((brandA, i) =>
      brands.slice(i + 1).map(brandB =>
        calculateCompetitiveWinRate(data, brandA, brandB, timeRange)
      )
    ) : []
  
  const queryIds = [...new Set(data.map(d => d.query_id))]
  const queryEffectiveness = queryIds.map(queryId =>
    calculateQueryEffectiveness(data, queryId, brands)
  ).sort((a, b) => b.effectiveness_score - a.effectiveness_score)
  
  const volatilityIndices = brands.flatMap(brand =>
    models.map(model => calculateVolatilityIndex(data, brand, model, 30, timeRange))
  )
  
  // Calculate summary
  const totalQueries = new Set(data.map(d => d.query_id)).size
  const totalMentions = data.filter(d => d.mentioned).length
  const averageCoverageRate = coverageRates.reduce((sum, cr) => sum + cr.rate, 0) / coverageRates.length || 0
  const averageSentiment = sentimentScores.reduce((sum, ss) => sum + ss.average_sentiment, 0) / sentimentScores.length || 0
  
  // Find top performing brand and model
  const topPerformingBrand = shareOfVoice.length > 0 
    ? shareOfVoice.reduce((top, sov) => sov.percentage > top.percentage ? sov : top).brand 
    : brands[0] || ''
  
  const topPerformingModel = modelWinRates.length > 0 
    ? modelWinRates.reduce((top, mwr) => mwr.win_rate > top.win_rate ? mwr : top).model 
    : models[0] || 'chatgpt'
  
  const summary: AnalyticsSummary = {
    total_queries: totalQueries,
    total_mentions: totalMentions,
    average_coverage_rate: averageCoverageRate,
    average_sentiment: averageSentiment,
    top_performing_brand: topPerformingBrand,
    top_performing_model: topPerformingModel,
    time_range: timeRange
  }
  
  return {
    summary,
    coverage_rates: coverageRates,
    share_of_voice: shareOfVoice,
    average_mention_ranks: averageMentionRanks,
    sentiment_scores: sentimentScores,
    sentiment_weighted_sov: sentimentWeightedSoV,
    answer_richness: answerRichness,
    citation_presence: citationPresence,
    model_win_rates: modelWinRates,
    competitive_win_rates: competitiveWinRates,
    query_effectiveness: queryEffectiveness,
    volatility_indices: volatilityIndices
  }
} 