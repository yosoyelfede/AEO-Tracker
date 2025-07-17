'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryResults } from '@/components/QueryResults'
import { AEOAnalyticsDashboard } from '@/components/AEOAnalyticsDashboard'
import { BrandListManager } from '@/components/BrandListManager'
import { supabase } from '@/lib/supabase'
import { Query, Brand } from '@/types'
import { BarChart3, Search, History, Settings } from 'lucide-react'

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
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [queries, setQueries] = useState<Query[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['chatgpt'])
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [activeTab, setActiveTab] = useState<'query' | 'analytics'>('query')
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [selectedBrandNames, setSelectedBrandNames] = useState<string[]>([])
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0)
  const [selectedHistoricalQuery, setSelectedHistoricalQuery] = useState<{
    id: string
    prompt: string
    results: QueryResult[]
  } | null>(null)

  const models = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', available: true },
    { id: 'claude', name: 'Claude', icon: '🧠', available: false, reason: 'Insufficient credits' },
    { id: 'gemini', name: 'Gemini', icon: '💎', available: true },
    { id: 'perplexity', name: 'Perplexity', icon: '🔍', available: true }
  ]

  const availableModels = models.filter(m => m.available)

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

    // Check if user has selected a brand list
    if (!selectedBrandListId || selectedBrandNames.length === 0) {
      alert('Please select a brand list to track before running a query.')
      return
    }

    setIsRunning(true)
    setResults([])
    setSelectedHistoricalQuery(null) // Clear any historical results

    try {
      const response = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          queryText: currentQuery,
          models: selectedModels,
          brands: selectedBrandNames, // Use selected brand names
          brandListId: selectedBrandListId, // Pass brand list ID for tracking
        }),
      })

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed (${response.status}): ${errorText}`)
      }

      // Check content type before parsing as JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText}`)
      }

      const data = await response.json()
      console.log('🔍 API Response:', data) // Debug log

      if (data.success) {
        console.log('🔍 Raw results before filtering:', JSON.stringify(data.results, null, 2)) // Debug log
        // Transform the API response to match our QueryResult interface
        const transformedResults = data.results
          .filter((result: any) => {
            console.log('🔍 Result success check:', result.success, 'Model:', result.model, 'Error:', result.error) // Debug log
            return true // TEMPORARILY SHOW ALL RESULTS INCLUDING FAILURES
          })
          .map((result: any) => {
            console.log('🔍 Individual result:', result) // Debug log
            return {
              id: result.runId || result.id || crypto.randomUUID(),
              model: result.model,
              response_text: result.response_text || result.responseText || '',
              created_at: new Date().toISOString(),
              mentions: result.mentions || [],
              api_key_source: result.api_key_source,
              used_free_query: result.used_free_query
            }
          })

        console.log('🔍 Transformed results:', transformedResults) // Debug log
        setResults(transformedResults)
        fetchQueries() // Refresh the queries list
        
        // Trigger analytics refresh
        setAnalyticsRefreshTrigger(prev => prev + 1)

        // Show message about API key usage
        const usedUserKeys = transformedResults.some((r: any) => r.api_key_source === 'user')
        const usedFreeQuery = transformedResults.some((r: any) => r.used_free_query)
        
        if (usedFreeQuery) {
          alert('✅ Query completed using your free query! Future queries will require your own API keys.')
        } else if (usedUserKeys) {
          alert('✅ Query completed using your API keys.')
        }
      } else {
        // Handle API key requirement errors
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
      // Fetch the runs and their data for this specific query
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

      // Transform the data to match our QueryResult interface
      const transformedResults = data.map(run => {
        // Convert mentions to the format expected by QueryResults
        const mentions = run.mentions.map((mention: any, index: number) => ({
          brand: mention.brands.name,
          position: index,
          context: `Ranked #${mention.rank}`
        }))

        return {
          id: run.id,
          model: run.model,
          response_text: run.raw_response || '',
          created_at: run.created_at,
          mentions
        }
      })

      // Set the historical query results and switch to query tab to show them
      setSelectedHistoricalQuery({
        id: queryId,
        prompt,
        results: transformedResults
      })
      setResults([]) // Clear current results
      setActiveTab('query') // Switch to query tab to show results
    } catch (error) {
      console.error('Error loading historical query results:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // This will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AEO Tracker</h1>
              
              {/* Navigation Tabs */}
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('query')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'query'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>Query</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.email}</span>
              <Button 
                variant="outline" 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Profile</span>
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'query' ? (
          <div className="space-y-8">
            {/* Brand List Manager - NEW */}
            <BrandListManager 
              selectedBrandListId={selectedBrandListId}
              onBrandListSelect={(listId, brandNames) => {
                setSelectedBrandListId(listId)
                setSelectedBrandNames(brandNames)
              }}
            />

            {/* Query Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Run New Query</CardTitle>
                <CardDescription>
                  Ask multiple AI models and track brand mentions for AEO optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Query Input */}
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Query
                  </label>
                  <textarea
                    id="query"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., What's the best restaurant in Santiago? or Which retail store has the best deals?"
                    value={currentQuery}
                    onChange={(e) => setCurrentQuery(e.target.value)}
                  />
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select AI Models
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {models.map((model) => (
                      <div key={model.id} className="relative">
                        <button
                          onClick={() => model.available && handleModelToggle(model.id)}
                          disabled={!model.available}
                          className={`w-full p-4 border rounded-lg text-center transition-all ${
                            !model.available
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                              : selectedModels.includes(model.id)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{model.icon}</div>
                          <div className="font-medium text-sm">{model.name}</div>
                          {!model.available && model.reason && (
                            <div className="text-xs text-red-600 mt-1">{model.reason}</div>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run Button */}
                <Button
                  onClick={runQuery}
                  disabled={!currentQuery.trim() || selectedModels.length === 0 || isRunning || !selectedBrandListId}
                  className="w-full"
                  size="lg"
                >
                  {isRunning 
                    ? 'Running on selected models...' 
                    : !selectedBrandListId 
                    ? 'Select a brand list to run query'
                    : `Run on selected models (${selectedModels.length})`
                  }
                </Button>
              </CardContent>
            </Card>

            {/* Results Section - Show either current results or historical results */}
            {(results.length > 0 || selectedHistoricalQuery) && (
              <QueryResults 
                results={selectedHistoricalQuery ? selectedHistoricalQuery.results : results}
                queryText={selectedHistoricalQuery ? selectedHistoricalQuery.prompt : currentQuery}
                isHistorical={!!selectedHistoricalQuery}
                onClearHistorical={() => setSelectedHistoricalQuery(null)}
              />
            )}

            {/* Recent Queries */}
            {queries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Recent Queries</span>
                  </CardTitle>
                  <CardDescription>Your query history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {queries.slice(0, 5).map((query) => (
                      <div key={query.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{query.prompt}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(query.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadHistoricalQueryResults(query.id, query.prompt)}
                          >
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
                          >
                            Run Again
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <AEOAnalyticsDashboard 
            refreshTrigger={analyticsRefreshTrigger}
          />
        )}
      </div>
    </div>
  )
} 