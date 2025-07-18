'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  Metric,
  Badge,
  Grid,
  Select,
  SelectItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell
} from '@tremor/react'
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
  ComprehensiveAnalytics
} from '@/types/analytics'
import {
  calculateComprehensiveAnalytics,
  createTimeRange
} from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'
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
  AlertCircle,
  HelpCircle,
  Info,
  Users,
  Star,
  MessageSquare,
  Award
} from 'lucide-react'

interface BrandList {
  id: string
  name: string
  description: string
  items: { id: string; brand_name: string }[]
}

interface ComprehensiveAnalyticsDashboardProps {
  refreshTrigger?: number
}

export function ComprehensiveAnalyticsDashboard({ refreshTrigger }: ComprehensiveAnalyticsDashboardProps) {
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([])
  const [comprehensiveAnalytics, setComprehensiveAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(createTimeRange(30))
  const [activeTab, setActiveTab] = useState(0)

  const fetchBrandLists = useCallback(async () => {
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
      const lists = data.map((list: any) => ({
        ...list,
        items: list.brand_list_items || []
      }))
      setBrandLists(lists)
      
      // Auto-select first list if none selected
      if (!selectedBrandListId && lists.length > 0) {
        setSelectedBrandListId(lists[0].id)
      }
    }
    setLoading(false)
  }, [user, selectedBrandListId])

  const fetchAnalyticsData = useCallback(async () => {
    if (!selectedBrandListId || !user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch mentions data with all analytics fields
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
          brand_list_id,
          sentiment_score,
          evidence_count,
          has_citation,
          rank
        `)
        .eq('brand_list_id', selectedBrandListId)
        .order('created_at', { ascending: false })

      if (mentionsError) {
        console.error('Error fetching mentions:', mentionsError)
        setError('Failed to load analytics data')
        return
      }

      // Transform data to AnalyticsDataPoint format
      const transformedData: AnalyticsDataPoint[] = (mentions || []).map((mention: any) => ({
        id: mention.id,
        query_id: mention.query_text, // Using query_text as query_id for now
        query_text: mention.query_text,
        brand: mention.brand,
        model: mention.model as ModelType,
        mentioned: true,
        first_rank: mention.rank,
        sentiment: mention.sentiment_score,
        evidence_count: mention.evidence_count || 0,
        has_citation: mention.has_citation || false,
        timestamp: new Date(mention.created_at).toISOString(),
        context: mention.context || ''
      }))

      setAnalyticsData(transformedData)
    } catch (err) {
      console.error('Error in fetchAnalyticsData:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [selectedBrandListId, user])

  // Calculate comprehensive analytics when data changes
  useEffect(() => {
    if (analyticsData.length > 0 && selectedBrandListId) {
      const brands = [...new Set(analyticsData.map(d => d.brand))]
      const models: ModelType[] = [...new Set(analyticsData.map(d => d.model))] as ModelType[]
      
      const analytics = calculateComprehensiveAnalytics(analyticsData, brands, models, selectedTimeRange)
      setComprehensiveAnalytics(analytics)
    }
  }, [analyticsData, selectedTimeRange, selectedBrandListId])

  useEffect(() => {
    fetchBrandLists()
  }, [user, selectedBrandListId, fetchBrandLists])

  // Auto-select first brand list if none selected
  useEffect(() => {
    if (brandLists.length > 0 && !selectedBrandListId) {
      setSelectedBrandListId(brandLists[0].id)
    }
  }, [brandLists, selectedBrandListId])

  useEffect(() => {
    if (refreshTrigger) {
      fetchBrandLists()
      fetchAnalyticsData()
    }
  }, [refreshTrigger, fetchBrandLists, fetchAnalyticsData])

  useEffect(() => {
    if (selectedBrandListId) {
      fetchAnalyticsData()
    }
  }, [selectedBrandListId, fetchAnalyticsData])

  const handleTimeRangeChange = (value: string) => {
    const days = parseInt(value)
    const newTimeRange = createTimeRange(days)
    setSelectedTimeRange(newTimeRange)
  }

  const exportData = () => {
    if (!comprehensiveAnalytics) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Queries', comprehensiveAnalytics.summary.total_queries],
      ['Total Mentions', comprehensiveAnalytics.summary.total_mentions],
      ['Average Coverage Rate', `${comprehensiveAnalytics.summary.average_coverage_rate.toFixed(2)}%`],
      ['Average Sentiment', comprehensiveAnalytics.summary.average_sentiment.toFixed(3)],
      ['Top Performing Brand', comprehensiveAnalytics.summary.top_performing_brand],
      ['Top Performing Model', comprehensiveAnalytics.summary.top_performing_model],
      [],
      ['Brand', 'Coverage Rate', 'Share of Voice', 'Avg Rank', 'Sentiment', 'Win Rate'],
      ...comprehensiveAnalytics.coverage_rates.map(cr => [
        cr.brand,
        `${cr.rate.toFixed(2)}%`,
        `${comprehensiveAnalytics.share_of_voice.find(sov => sov.brand === cr.brand && sov.model === cr.model)?.percentage.toFixed(2)}%`,
        comprehensiveAnalytics.average_mention_ranks.find(amr => amr.brand === cr.brand && amr.model === cr.model)?.average_rank.toFixed(1) || 'N/A',
        comprehensiveAnalytics.sentiment_scores.find(ss => ss.brand === cr.brand && ss.model === cr.model)?.average_sentiment.toFixed(3) || 'N/A',
        `${comprehensiveAnalytics.model_win_rates.find(mwr => mwr.brand === cr.brand && mwr.model === cr.model)?.win_rate.toFixed(2)}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprehensive-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Title>Loading Analytics...</Title>
          <Text>Please wait while we fetch your data.</Text>
        </div>
      </Card>
    )
  }

  if (brandLists.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <Title>No Brand Lists Found</Title>
          <Text>Create a brand list to start tracking analytics.</Text>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <Title>Error Loading Data</Title>
          <Text className="mb-4">{error}</Text>
          <Button onClick={() => fetchAnalyticsData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  // Extract brands and models from data
  const brands = [...new Set(analyticsData.map(d => d.brand))]
  const models: ModelType[] = [...new Set(analyticsData.map(d => d.model))] as ModelType[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <Title>Comprehensive Analytics Dashboard</Title>
            <Text>Advanced AEO metrics and insights based on finalanalytics.md</Text>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedTimeRange.days.toString()}
              onValueChange={handleTimeRangeChange}
            >
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </Select>
            <Button
              variant="secondary"
              onClick={() => fetchAnalyticsData()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={exportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Brand List Selection */}
      <Card>
        <Title className="flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Select Brand List for Analytics
        </Title>
        <Text>Choose which brand list to analyze</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {brandLists.map((list) => (
            <Card 
              key={list.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedBrandListId === list.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedBrandListId(list.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Title className="text-lg">{list.name}</Title>
                  <Badge>
                    {list.items.length} brands
                  </Badge>
                </div>
                <Text className="mb-3">
                  {list.description || 'No description'}
                </Text>
                <div className="flex flex-wrap gap-1">
                  {list.items.slice(0, 3).map((item) => (
                    <Badge key={item.id} className="text-xs bg-secondary-100 text-secondary-900">
                      {item.brand_name}
                    </Badge>
                  ))}
                  {list.items.length > 3 && (
                    <Badge className="text-xs bg-secondary-100 text-secondary-900">
                      +{list.items.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Analytics Dashboard */}
      {selectedBrandListId && comprehensiveAnalytics && (
        <TabGroup>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Visibility</Tab>
            <Tab>Quality</Tab>
            <Tab>Models</Tab>
            <Tab>Competition</Tab>
            <Tab>Queries</Tab>
            <Tab>Trends</Tab>
          </TabList>
          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Summary Metrics */}
                <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
                  <Card>
                    <Metric>{comprehensiveAnalytics.summary.total_queries}</Metric>
                    <Text>Total Queries</Text>
                  </Card>
                  <Card>
                    <Metric>{comprehensiveAnalytics.summary.total_mentions}</Metric>
                    <Text>Total Mentions</Text>
                  </Card>
                  <Card>
                    <Metric>{comprehensiveAnalytics.summary.average_coverage_rate.toFixed(1)}%</Metric>
                    <Text>Avg Coverage Rate</Text>
                  </Card>
                  <Card>
                    <Metric>{comprehensiveAnalytics.summary.average_sentiment.toFixed(3)}</Metric>
                    <Text>Avg Sentiment</Text>
                  </Card>
                </Grid>

                {/* Top Performers */}
                <Grid numItems={1} numItemsLg={2} className="gap-6">
                  <Card>
                    <Title>Top Performing Brand</Title>
                    <Text>{comprehensiveAnalytics.summary.top_performing_brand}</Text>
                    <Metric className="mt-2">
                      {comprehensiveAnalytics.coverage_rates
                        .filter(cr => cr.brand === comprehensiveAnalytics.summary.top_performing_brand)
                        .reduce((sum, cr) => sum + cr.rate, 0) / models.length}%
                    </Metric>
                  </Card>
                  <Card>
                    <Title>Top Performing Model</Title>
                    <Text>{comprehensiveAnalytics.summary.top_performing_model}</Text>
                    <Metric className="mt-2">
                      {comprehensiveAnalytics.model_win_rates
                        .filter(mwr => mwr.model === comprehensiveAnalytics.summary.top_performing_model)
                        .reduce((sum, mwr) => sum + mwr.win_rate, 0) / brands.length}%
                    </Metric>
                  </Card>
                </Grid>
              </div>
            </TabPanel>

            {/* Visibility Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Share of Voice by Model */}
                <Card>
                  <Title>Share of Voice by Model</Title>
                  <div className="h-80 mt-4">
                    <BarChart
                      data={comprehensiveAnalytics.share_of_voice.map(sov => ({
                        brand: sov.brand,
                        [sov.model]: sov.percentage
                      }))}
                      index="brand"
                      categories={models}
                      colors={["blue", "green", "purple", "orange"]}
                      className="h-full"
                    />
                  </div>
                </Card>

                {/* Coverage Rate Trends */}
                <Card>
                  <Title>Coverage Rate Trends</Title>
                  <div className="h-80 mt-4">
                    <LineChart
                      data={comprehensiveAnalytics.coverage_rates.flatMap(cr => 
                        cr.time_series.map(ts => ({
                          date: ts.date,
                          brand: cr.brand,
                          model: cr.model,
                          rate: ts.rate
                        }))
                      )}
                      index="date"
                      categories={["rate"]}
                      colors={["blue"]}
                      className="h-full"
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Quality Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Sentiment Heatmap */}
                <Card>
                  <Title>Sentiment Analysis</Title>
                  <div className="mt-4">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Brand</TableHeaderCell>
                          {models.map(model => (
                            <TableHeaderCell key={model}>{model}</TableHeaderCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {brands.map(brand => (
                          <TableRow key={brand}>
                            <TableCell>{brand}</TableCell>
                            {models.map(model => {
                              const sentiment = comprehensiveAnalytics.sentiment_scores.find(
                                ss => ss.brand === brand && ss.model === model
                              )
                              return (
                                <TableCell key={model}>
                                  {sentiment ? sentiment.average_sentiment.toFixed(3) : 'N/A'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {/* Answer Richness */}
                <Card>
                  <Title>Answer Richness (Evidence Count)</Title>
                  <div className="h-80 mt-4">
                    <BarChart
                      data={comprehensiveAnalytics.answer_richness.map(ar => ({
                        brand: ar.brand,
                        [ar.model]: ar.average_evidence_count
                      }))}
                      index="brand"
                      categories={models}
                      colors={["blue", "green", "purple", "orange"]}
                      className="h-full"
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Models Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Model Win Rate vs SW-SoV */}
                <Card>
                  <Title>Model Performance: Win Rate vs Sentiment-Weighted SoV</Title>
                  <div className="mt-4">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Brand</TableHeaderCell>
                          <TableHeaderCell>Model</TableHeaderCell>
                          <TableHeaderCell>Win Rate</TableHeaderCell>
                          <TableHeaderCell>SW-SoV</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comprehensiveAnalytics.model_win_rates.map(mwr => {
                          const swSov = comprehensiveAnalytics.sentiment_weighted_sov.find(
                            sw => sw.brand === mwr.brand && sw.model === mwr.model
                          )
                          return (
                            <TableRow key={`${mwr.brand}-${mwr.model}`}>
                              <TableCell>{mwr.brand}</TableCell>
                              <TableCell>{mwr.model}</TableCell>
                              <TableCell>{mwr.win_rate.toFixed(2)}%</TableCell>
                              <TableCell>{swSov ? swSov.sw_sov.toFixed(2) : 'N/A'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {/* Average Rank by Model */}
                <Card>
                  <Title>Average Mention Rank by Model</Title>
                  <div className="h-80 mt-4">
                    <BarChart
                      data={comprehensiveAnalytics.average_mention_ranks.map(amr => ({
                        brand: amr.brand,
                        [amr.model]: amr.average_rank
                      }))}
                      index="brand"
                      categories={models}
                      colors={["blue", "green", "purple", "orange"]}
                      className="h-full"
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Competition Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Competitive Win Rate Matrix */}
                <Card>
                  <Title>Competitive Win Rate Matrix</Title>
                  <div className="mt-4">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Brand A</TableHeaderCell>
                          <TableHeaderCell>Brand B</TableHeaderCell>
                          <TableHeaderCell>Win Rate</TableHeaderCell>
                          <TableHeaderCell>Comparisons</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comprehensiveAnalytics.competitive_win_rates.map(cwr => (
                          <TableRow key={`${cwr.brand_a}-${cwr.brand_b}`}>
                            <TableCell>{cwr.brand_a}</TableCell>
                            <TableCell>{cwr.brand_b}</TableCell>
                            <TableCell>{cwr.win_rate.toFixed(2)}%</TableCell>
                            <TableCell>{cwr.total_comparisons}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Queries Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Query Effectiveness */}
                <Card>
                  <Title>Query Effectiveness Analysis</Title>
                  <div className="mt-4">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Query</TableHeaderCell>
                          <TableHeaderCell>Effectiveness Score</TableHeaderCell>
                          <TableHeaderCell>Brands Mentioned</TableHeaderCell>
                          <TableHeaderCell>Avg SW-SoV</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comprehensiveAnalytics.query_effectiveness.slice(0, 10).map(qe => (
                          <TableRow key={qe.query_id}>
                            <TableCell className="max-w-xs truncate">{qe.query_text}</TableCell>
                            <TableCell>{qe.effectiveness_score.toFixed(3)}</TableCell>
                            <TableCell>{qe.total_brands_mentioned}</TableCell>
                            <TableCell>{qe.average_sw_sov.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Trends Tab */}
            <TabPanel>
              <div className="space-y-6">
                {/* Coverage Rate Trends */}
                <Card>
                  <Title>Coverage Rate Trends Over Time</Title>
                  <div className="h-80 mt-4">
                    <AreaChart
                      data={comprehensiveAnalytics.coverage_rates.flatMap(cr => 
                        cr.time_series.map(ts => ({
                          date: ts.date,
                          brand: cr.brand,
                          model: cr.model,
                          rate: ts.rate
                        }))
                      )}
                      index="date"
                      categories={["rate"]}
                      colors={["blue"]}
                      className="h-full"
                    />
                  </div>
                </Card>

                {/* Volatility Index */}
                <Card>
                  <Title>Volatility Index</Title>
                  <div className="h-80 mt-4">
                    <BarChart
                      data={comprehensiveAnalytics.volatility_indices.map(vi => ({
                        brand: vi.brand,
                        [vi.model]: vi.volatility_index
                      }))}
                      index="brand"
                      categories={models}
                      colors={["blue", "green", "purple", "orange"]}
                      className="h-full"
                    />
                  </div>
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      )}

      {/* No Data Message */}
      {selectedBrandListId && analyticsData.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Title>No Analytics Data</Title>
            <Text>Run some queries to see comprehensive analytics and insights.</Text>
          </div>
        </Card>
      )}
    </div>
  )
} 