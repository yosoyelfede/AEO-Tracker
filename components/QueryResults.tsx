'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  TrendingUp,
  Activity,
  Copy,
  Download,
  Share2,
  MessageSquare,
  AlertTriangle,
  Eye,
  RefreshCw
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
  api_key_source?: string
  used_free_query?: boolean
}

interface QueryError {
  model: string
  success: false
  error: string
}

interface QueryResultsProps {
  results: (QueryResult | QueryError)[]
  isRunning: boolean
  onRefresh?: () => void
}

export default function QueryResults({ results, isRunning, onRefresh }: QueryResultsProps) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null)
  const [copiedResult, setCopiedResult] = useState<string | null>(null)
  const [filterModel, setFilterModel] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'time' | 'model' | 'mentions'>('time')

  const successfulResults = results.filter((result): result is QueryResult => result.success)
  const errorResults = results.filter((result): result is QueryError => !result.success)

  const totalMentions = successfulResults.reduce((sum, result) => sum + result.mentions.length, 0)
  const averageRanking = successfulResults.length > 0 
    ? successfulResults.reduce((sum, result) => {
        const avgRank = result.mentions.length > 0 
          ? result.mentions.reduce((rankSum, mention) => rankSum + mention.position, 0) / result.mentions.length
          : 0
        return sum + avgRank
      }, 0) / successfulResults.length
    : 0

  const copyToClipboard = async (text: string, resultId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedResult(resultId)
      setTimeout(() => setCopiedResult(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const filteredResults = successfulResults.filter(result => 
    filterModel === 'all' || result.model.toLowerCase() === filterModel.toLowerCase()
  )

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'model':
        return a.model.localeCompare(b.model)
      case 'mentions':
        return b.mentions.length - a.mentions.length
      default:
        return 0
    }
  })

  const models = ['all', ...Array.from(new Set(successfulResults.map(r => r.model)))]

  if (results.length === 0 && !isRunning) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
          <p className="text-gray-600 mb-4">
            Run a query to see AI responses and brand mentions here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Query Results</h2>
          <p className="text-gray-600">AI responses and brand mentions analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRunning}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">{successfulResults.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mentions</p>
                <p className="text-2xl font-bold text-gray-900">{totalMentions}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Ranking</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageRanking > 0 ? averageRanking.toFixed(1) : 'N/A'}
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
                <p className="text-2xl font-bold text-gray-900">
                  {results.length > 0 ? Math.round((successfulResults.length / results.length) * 100) : 0}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            {models.map(model => (
              <option key={model} value={model}>
                {model === 'all' ? 'All Models' : model}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'time' | 'model' | 'mentions')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="time">Time</option>
            <option value="model">Model</option>
            <option value="mentions">Mentions</option>
          </select>
        </div>
      </div>

      {/* Error Results */}
      {errorResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Errors ({errorResults.length})
          </h3>
          {errorResults.map((error, index) => (
            <Card key={index} className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">{error.model}</p>
                      <p className="text-sm text-red-700">{error.error}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {sortedResults.map((result) => (
          <Card 
            key={result.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedResult === result.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <CardTitle className="text-lg">{result.model}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(result.created_at).toLocaleString()}</span>
                      {result.api_key_source && (
                        <Badge variant="outline" className="text-xs">
                          {result.api_key_source}
                        </Badge>
                      )}
                      {result.used_free_query && (
                        <Badge variant="secondary" className="text-xs">
                          Free Query
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {result.mentions.length} mentions
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(result.response_text, result.id)
                    }}
                  >
                    {copiedResult === result.id ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <AnimatePresence>
                {selectedResult === result.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Response Text */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                        {result.response_text}
                      </div>
                    </div>

                    {/* Brand Mentions */}
                    {result.mentions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Brand Mentions</h4>
                        <div className="space-y-2">
                          {result.mentions.map((mention, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Target className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="font-medium text-blue-900">{mention.brand}</p>
                                  <p className="text-sm text-blue-700">{mention.context}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-white">
                                Rank #{mention.position}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedResults.length === 0 && !isRunning && (
        <Card>
          <CardContent className="p-8 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">
              {filterModel !== 'all' ? `No results for ${filterModel}.` : 'No results match your criteria.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isRunning && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Running Query...</h3>
            <p className="text-gray-600">Please wait while we process your request.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 