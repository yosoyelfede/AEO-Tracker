'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QueryResults } from '@/components/QueryResults'
import { EnhancedAnalyticsDashboard } from '@/components/EnhancedAnalyticsDashboard'
import { BrandListManager } from '@/components/BrandListManager'
import { supabase } from '@/lib/supabase'
import { Query, ApiQueryResponse, ApiQueryResult, ApiMention, HistoricalQuery } from '@/types'
import { 
  BarChart3, 
  Search, 
  History, 
  Settings, 
  User, 
  LogOut, 
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Play,
  Eye,
  RefreshCw,
  ChevronRight,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QueryResult {
  id: string
  model: string
  response_text: string
  created_at: string
  mentions: {
    brand: string
    position: number
    context: string
  }[]
  success: true
}

interface QueryError {
  model: string
  success: false
  error: string
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [queries, setQueries] = useState<Query[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['chatgpt'])
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<(QueryResult | QueryError)[]>([])
  const [activeTab, setActiveTab] = useState<'query' | 'analytics'>('query')
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [selectedBrandNames, setSelectedBrandNames] = useState<string[]>([])
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0)
  const [selectedHistoricalQuery, setSelectedHistoricalQuery] = useState<HistoricalQuery | null>(null)

  const models = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', available: true, color: 'from-blue-500 to-blue-600' },
    { id: 'claude', name: 'Claude', icon: '🧠', available: true, color: 'from-orange-500 to-orange-600' },
    { id: 'gemini', name: 'Gemini', icon: '💎', available: true, color: 'from-purple-500 to-purple-600' },
    { id: 'perplexity', name: 'Perplexity', icon: '🔍', available: true, color: 'from-green-500 to-green-600' }
  ]

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }
    fetchQueries()
  }, [user, loading, router])

  const fetchQueries = async () => {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching queries:', error)
    } else {
      setQueries(data || [])
    }
  }

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const runQuery = async () => {
    if (!currentQuery.trim() || selectedModels.length === 0) return

    if (!selectedBrandListId) {
      alert('Please select a brand list to track before running a query. If you just created an account, please wait a moment for the default brand list to load.')
      return
    }

    if (selectedBrandNames.length === 0) {
      alert('The selected brand list has no brands. Please add some brands to your list before running a query.')
      return
    }

    setIsRunning(true)
    setResults([])
    setSelectedHistoricalQuery(null)

    try {
      console.log('🚀 Starting query with models:', selectedModels)
      console.log('🚀 Query text:', currentQuery)
      console.log('🚀 Selected brands:', selectedBrandNames)
      
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          queryText: currentQuery,
          models: selectedModels,
          brands: selectedBrandNames,
          brandListId: selectedBrandListId,
        }),
      })

      console.log('🚀 API response status:', response.status)
      console.log('🚀 API response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(`API request failed (${response.status}): ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('❌ Unexpected content type:', contentType, 'Response:', responseText)
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText}`)
      }

      const data: ApiQueryResponse = await response.json()
      console.log('🔍 API Response:', data)

      if (data.success) {
        console.log('🔍 Raw results before filtering:', JSON.stringify(data.results, null, 2))
        const transformedResults = data.results.map((result: ApiQueryResult) => {
          console.log('🔍 Individual result:', result)
          
          if (result.success) {
            return {
              id: result.runId || result.id || crypto.randomUUID(),
              model: result.model,
              response_text: result.response_text || result.responseText || '',
              created_at: new Date().toISOString(),
              mentions: result.mentions?.map((mention: any) => ({
                brand: mention.brand || mention.brands?.name || 'Unknown',
                position: mention.position || mention.rank || 0,
                context: mention.context || `Ranked #${mention.rank || 0}`
              })) || [],
              success: true as const,
              api_key_source: result.api_key_source,
              used_free_query: result.used_free_query
            }
          } else {
            return {
              model: result.model,
              success: false as const,
              error: result.error || 'Unknown error occurred'
            }
          }
        })

        console.log('🔍 Transformed results:', transformedResults)
        
        if (transformedResults.length === 0) {
          console.warn('⚠️ No results found')
          alert('No results were returned. Please check the console for more details.')
        }
        
        setResults(transformedResults)
        fetchQueries()
        
        setAnalyticsRefreshTrigger(prev => {
          const next = prev + 1;
          console.log('Analytics refresh trigger incremented:', next);
          return next;
        })

        const usedUserKeys = transformedResults.some((r: QueryResult | QueryError) => 'api_key_source' in r && r.api_key_source === 'user')
        const usedFreeQuery = transformedResults.some((r: QueryResult | QueryError) => 'used_free_query' in r && r.used_free_query)
        
        if (usedFreeQuery) {
          alert('✅ Query completed using your free query! Future queries will require your own API keys.')
        } else if (usedUserKeys) {
          alert('✅ Query completed using your API keys.')
        }
      } else {
        if (data.error === 'API_KEYS_REQUIRED') {
          if (confirm(`${data.message}\n\nWould you like to add your API keys now?`)) {
            router.push(data.redirect_to || '/profile?tab=api-keys')
            return
          }
        } else {
          console.error('Query failed:', data.error)
          alert(`Query failed: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Error running query:', error)
      alert(`Error running query: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const loadHistoricalQueryResults = async (queryId: string, prompt: string) => {
    try {
      const { data, error } = await supabase
        .from('runs')
        .select(`
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
        `)
        .eq('query_id', queryId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching historical query results:', error)
        return
      }

      const apiResults: ApiQueryResult[] = data.map(run => {
        const mentions: ApiMention[] = run.mentions?.map((mention: { rank: number; brands: { name: string }[] }) => ({
          brand: mention.brands[0]?.name || 'Unknown Brand',
          position: mention.rank,
          context: `Ranked #${mention.rank}`,
          rank: mention.rank
        })) || []

        return {
          id: run.id,
          model: run.model,
          response_text: run.raw_response || '',
          mentions,
          success: true
        }
      })

      const transformedResults: (QueryResult | QueryError)[] = data.map(run => {
        const mentions = run.mentions?.map((mention: { rank: number; brands: { name: string }[] }, index: number) => ({
          brand: mention.brands[0]?.name || 'Unknown Brand',
          position: index,
          context: `Ranked #${mention.rank}`
        })) || []

        return {
          id: run.id,
          model: run.model,
          response_text: run.raw_response || '',
          created_at: run.created_at,
          mentions,
          success: true as const
        }
      })

      setSelectedHistoricalQuery({
        id: queryId,
        prompt,
        results: apiResults,
        models: apiResults.map(r => r.model)
      })
      setResults(transformedResults)
      setActiveTab('query')
    } catch (error) {
      console.error('Error loading historical query results:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" data-testid="dashboard">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  AEO Tracker
                </h1>
              </div>
              
              {/* Enhanced Navigation Tabs */}
              <nav className="flex space-x-2 bg-slate-100/50 p-1 rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('query')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'query'
                      ? 'bg-white text-primary shadow-lg shadow-primary/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>Query Builder</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'analytics'
                      ? 'bg-white text-primary shadow-lg shadow-primary/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </motion.button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/50 px-4 py-2 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2 bg-white/50 hover:bg-white border-slate-200"
              >
                <Settings className="h-4 w-4" />
                <span>Profile</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="flex items-center space-x-2 bg-white/50 hover:bg-white border-slate-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'query' ? (
            <motion.div
              key="query"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Queries</p>
                      <p className="text-3xl font-bold text-slate-900">{queries.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Active Models</p>
                      <p className="text-3xl font-bold text-slate-900">{selectedModels.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Tracked Brands</p>
                      <p className="text-3xl font-bold text-slate-900">{selectedBrandNames.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Brand List Manager */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <BrandListManager 
                  selectedBrandListId={selectedBrandListId}
                  onBrandListSelect={(listId, brandNames) => {
                    setSelectedBrandListId(listId)
                    setSelectedBrandNames(brandNames)
                  }}
                />
              </motion.div>

              {/* Enhanced Query Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Run New Query</CardTitle>
                        <CardDescription className="text-slate-600">
                          Ask multiple AI models and track brand mentions for AEO optimization
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Enhanced Query Input */}
                    <div className="space-y-3">
                      <label htmlFor="query" className="block text-sm font-semibold text-slate-700">
                        Your Query
                      </label>
                      <textarea
                        id="query"
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-white/50 backdrop-blur-sm"
                        placeholder="e.g., What's the best restaurant in Santiago? or Which retail store has the best deals?"
                        value={currentQuery}
                        onChange={(e) => setCurrentQuery(e.target.value)}
                      />
                    </div>

                    {/* Enhanced Model Selection */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        Select AI Models ({selectedModels.length} selected)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {models.map((model) => (
                          <motion.div
                            key={model.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative"
                          >
                            <button
                              onClick={() => model.available && handleModelToggle(model.id)}
                              disabled={!model.available}
                              className={`w-full p-6 border-2 rounded-2xl text-center transition-all duration-200 ${
                                !model.available
                                  ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                                  : selectedModels.includes(model.id)
                                  ? `border-primary bg-gradient-to-br ${model.color} text-white shadow-lg shadow-primary/25`
                                  : 'border-slate-200 hover:border-primary/50 hover:bg-white/50 bg-white/30 backdrop-blur-sm'
                              }`}
                            >
                              <div className="text-3xl mb-2">{model.icon}</div>
                              <div className="font-semibold text-sm">{model.name}</div>
                              {selectedModels.includes(model.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                                </motion.div>
                              )}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Run Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={runQuery}
                        disabled={!currentQuery.trim() || selectedModels.length === 0 || isRunning || !selectedBrandListId}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 rounded-xl"
                        size="lg"
                      >
                        {isRunning ? (
                          <div className="flex items-center space-x-3">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Running on {selectedModels.length} models...</span>
                          </div>
                        ) : !selectedBrandListId ? (
                          <div className="flex items-center space-x-3">
                            <Eye className="h-5 w-5" />
                            <span>Select a brand list to run query</span>
                          </div>
                        ) : selectedBrandNames.length === 0 ? (
                          <div className="flex items-center space-x-3">
                            <TrendingUp className="h-5 w-5" />
                            <span>Add brands to your list to run query</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Play className="h-5 w-5" />
                            <span>Run on {selectedModels.length} models</span>
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Section */}
              <AnimatePresence>
                {(results.length > 0 || selectedHistoricalQuery) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <QueryResults 
                      results={results}
                      queryText={selectedHistoricalQuery ? selectedHistoricalQuery.prompt : currentQuery}
                      isHistorical={!!selectedHistoricalQuery}
                      onClearHistorical={() => setSelectedHistoricalQuery(null)}
                      queryBrands={selectedBrandNames}
                      selectedModels={selectedHistoricalQuery ? selectedHistoricalQuery.models : selectedModels}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Recent Queries */}
              {queries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                          <History className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">Recent Queries</CardTitle>
                          <CardDescription className="text-slate-600">Your query history</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {queries.slice(0, 5).map((query, index) => (
                          <motion.div
                            key={query.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-all duration-200"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-1">{query.prompt}</p>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <p className="text-sm text-slate-500">
                                  {new Date(query.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadHistoricalQueryResults(query.id, query.prompt)}
                                className="bg-white/50 hover:bg-white border-slate-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentQuery(query.prompt)
                                  setSelectedHistoricalQuery(null)
                                  setActiveTab('query')
                                }}
                                className="bg-white/50 hover:bg-white border-slate-200"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Run Again
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EnhancedAnalyticsDashboard 
                refreshTrigger={analyticsRefreshTrigger}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 