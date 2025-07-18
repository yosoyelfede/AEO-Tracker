// Analytics Types based on finalanalytics.md specification

export type ModelType = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

export interface TimeRange {
  start: Date
  end: Date
  days: number
}

// Core data point for analytics calculations
export interface AnalyticsDataPoint {
  id: string
  query_id: string
  query_text: string
  brand: string
  model: ModelType
  timestamp: string
  mentioned: boolean
  first_rank: number | null
  sentiment: number | null // -1.0 to +1.0
  evidence_count: number
  has_citation: boolean
  context?: string
}

// 2.1 Coverage Rate (CR)
export interface CoverageRate {
  brand: string
  model: ModelType
  rate: number // percentage
  time_series: Array<{
    date: string
    rate: number
  }>
}

// 2.2 Share of Voice (SoV)
export interface ShareOfVoice {
  brand: string
  model: ModelType
  percentage: number
  total_mentions: number
  total_mentions_all_brands: number
  time_series: Array<{
    date: string
    percentage: number
  }>
}

// 2.3 Average Mention Rank (AMR)
export interface AverageMentionRank {
  brand: string
  model: ModelType
  average_rank: number
  total_mentions: number
  time_series: Array<{
    date: string
    average_rank: number
  }>
}

// 2.4 Sentiment Score
export interface SentimentScore {
  brand: string
  model: ModelType
  average_sentiment: number // -1.0 to +1.0
  total_mentions: number
  time_series: Array<{
    date: string
    average_sentiment: number
  }>
}

// 2.5 Sentiment-Weighted SoV (SW-SoV)
export interface SentimentWeightedSoV {
  brand: string
  model: ModelType
  sw_sov: number
  base_sov: number
  sentiment_multiplier: number
  time_series: Array<{
    date: string
    sw_sov: number
  }>
}

// 2.6 Answer Richness (AR)
export interface AnswerRichness {
  brand: string
  model: ModelType
  average_evidence_count: number
  total_mentions: number
  time_series: Array<{
    date: string
    average_evidence_count: number
  }>
}

// 2.7 Citation Presence (CP)
export interface CitationPresence {
  brand: string
  model: ModelType
  citation_rate: number // percentage
  total_mentions: number
  mentions_with_citations: number
  time_series: Array<{
    date: string
    citation_rate: number
  }>
}

// 2.8 Model Win Rate (MWR)
export interface ModelWinRate {
  brand: string
  model: ModelType
  win_rate: number // percentage
  total_competitions: number
  wins: number
  time_series: Array<{
    date: string
    win_rate: number
  }>
}

// 2.9 Competitive Win Rate (CWR)
export interface CompetitiveWinRate {
  brand_a: string
  brand_b: string
  win_rate: number // percentage
  total_comparisons: number
  brand_a_wins: number
  time_series: Array<{
    date: string
    win_rate: number
  }>
}

// 2.10 Query Effectiveness (QE)
export interface QueryEffectiveness {
  query_id: string
  query_text: string
  effectiveness_score: number
  total_brands_mentioned: number
  average_sw_sov: number
  query_length: number
  time_series: Array<{
    date: string
    effectiveness_score: number
  }>
}

// 2.11 Volatility Index (VI)
export interface VolatilityIndex {
  brand: string
  model: ModelType
  volatility_index: number
  coverage_rate_std_dev: number
  time_window_days: number
  time_series: Array<{
    date: string
    volatility_index: number
  }>
}

// Dashboard summary metrics
export interface AnalyticsSummary {
  total_queries: number
  total_mentions: number
  average_coverage_rate: number
  average_sentiment: number
  top_performing_brand: string
  top_performing_model: ModelType
  time_range: TimeRange
}

// Comprehensive analytics data structure
export interface ComprehensiveAnalytics {
  summary: AnalyticsSummary
  coverage_rates: CoverageRate[]
  share_of_voice: ShareOfVoice[]
  average_mention_ranks: AverageMentionRank[]
  sentiment_scores: SentimentScore[]
  sentiment_weighted_sov: SentimentWeightedSoV[]
  answer_richness: AnswerRichness[]
  citation_presence: CitationPresence[]
  model_win_rates: ModelWinRate[]
  competitive_win_rates: CompetitiveWinRate[]
  query_effectiveness: QueryEffectiveness[]
  volatility_indices: VolatilityIndex[]
}

// Chart data structures for visualization
export interface ChartDataPoint {
  date: string
  value: number
  brand?: string
  model?: ModelType
}

export interface BrandComparisonData {
  brand: string
  coverage_rate: number
  share_of_voice: number
  average_rank: number
  sentiment_score: number
  model_win_rate: number
}

export interface ModelComparisonData {
  model: ModelType
  total_mentions: number
  average_rank: number
  average_sentiment: number
  citation_rate: number
}

// Filter options for analytics
export interface AnalyticsFilters {
  time_range: TimeRange
  brands: string[]
  models: ModelType[]
  include_forecasts: boolean
}

// Export interface for analytics data
export interface AnalyticsExport {
  summary: AnalyticsSummary
  brand_metrics: BrandComparisonData[]
  model_metrics: ModelComparisonData[]
  competitive_analysis: CompetitiveWinRate[]
  query_analysis: QueryEffectiveness[]
  generated_at: string
  time_range: TimeRange
} 