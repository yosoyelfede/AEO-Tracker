import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Copy, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Sparkles,
  Eye,
  MessageSquare,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { ApiQueryResult } from '@/types'
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

interface QueryResultsProps {
  results: (QueryResult | QueryError | ApiQueryResult)[]
  queryText: string
  isHistorical?: boolean
  onClearHistorical?: () => void
  queryBrands?: string[]
  selectedModels?: string[]
}

const MODEL_CONFIGS = {
  chatgpt: { 
    name: 'ChatGPT', 
    color: 'from-blue-500 to-blue-600', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🤖', 
    provider: 'OpenAI',
    description: 'Advanced language model by OpenAI'
  },
  claude: { 
    name: 'Claude', 
    color: 'from-orange-500 to-orange-600', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '🧠', 
    provider: 'Anthropic',
    description: 'Constitutional AI assistant'
  },
  gemini: { 
    name: 'Gemini', 
    color: 'from-purple-500 to-purple-600', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '💎', 
    provider: 'Google',
    description: 'Multimodal AI by Google'
  },
  perplexity: { 
    name: 'Perplexity', 
    color: 'from-green-500 to-green-600', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🔍', 
    provider: 'Perplexity',
    description: 'Search-powered AI assistant'
  }
}

const MODEL_ORDER = ['chatgpt', 'claude', 'gemini', 'perplexity']

export function QueryResults({ results, queryText, isHistorical = false, onClearHistorical, queryBrands = [], selectedModels = [] }: QueryResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const highlightBrands = (text: string, detectedBrands: string[]) => {
    if (detectedBrands.length === 0) return text

    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .toLowerCase()

    let result = ''
    let i = 0
    while (i < text.length) {
      let found = false
      for (const brand of detectedBrands) {
        const brandNorm = normalize(brand)
        for (let len = brand.length; len <= brand.length + 2 && i + len <= text.length; len++) {
          const candidate = text.slice(i, i + len)
          if (normalize(candidate) === brandNorm) {
            result += `<mark class="bg-gradient-to-r from-yellow-200 to-orange-200 font-semibold px-1 py-0.5 rounded-md shadow-sm">${candidate}</mark>`
            i += len
            found = true
            break
          }
        }
        if (found) break
      }
      if (!found) {
        result += text[i]
        i++
      }
    }
    return result
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const resultsByModel = new Map<string, QueryResult | QueryError | ApiQueryResult>()
  results.forEach(result => {
    resultsByModel.set(result.model, result)
  })

  const modelsToDisplay = selectedModels.length > 0 
    ? selectedModels 
    : MODEL_ORDER.filter(model => resultsByModel.has(model))

  if (modelsToDisplay.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="py-16">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Bot className="h-10 w-10 text-slate-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Results Yet</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Run a query to see AI responses and track brand mentions for AEO optimization
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Calculate summary statistics
  const totalMentions = results.reduce((sum, result) => {
    if (result.success && result.mentions) {
      return sum + result.mentions.length
    }
    return sum
  }, 0)

  const successfulResults = results.filter(r => r.success).length
  const errorResults = results.length - successfulResults

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Enhanced Query Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
                  <span>Query Results</span>
                  {isHistorical && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Historical
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-slate-600 mt-1 font-medium">
                  "{queryText}"
                </p>
              </div>
            </div>
            {isHistorical && onClearHistorical && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={onClearHistorical}
                  className="flex items-center space-x-2 bg-white/50 hover:bg-white border-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Current</span>
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Responses</p>
              <p className="text-3xl font-bold text-slate-900">{results.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Successful</p>
              <p className="text-3xl font-bold text-green-600">{successfulResults}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Mentions</p>
              <p className="text-3xl font-bold text-purple-600">{totalMentions}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
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
              <p className="text-3xl font-bold text-orange-600">{queryBrands.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Results Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        <AnimatePresence>
          {modelsToDisplay.map((modelId, index) => {
            const result = resultsByModel.get(modelId)
            const modelConfig = MODEL_CONFIGS[modelId as keyof typeof MODEL_CONFIGS] || 
                               { 
                                 name: modelId, 
                                 color: 'from-slate-500 to-slate-600', 
                                 bgColor: 'bg-slate-50',
                                 borderColor: 'border-slate-200',
                                 icon: '🤖', 
                                 provider: 'Unknown',
                                 description: 'AI Model'
                               }
            
            // Handle error results
            if (!result || !result.success) {
              const error = result?.error || 'Unknown error occurred'
              return (
                <motion.div
                  key={modelId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full border-red-200 bg-red-50/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${modelConfig.color} rounded-xl flex items-center justify-center`}>
                            <span className="text-lg">{modelConfig.icon}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900">{modelConfig.name}</CardTitle>
                            <p className="text-sm text-slate-600">{modelConfig.provider}</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(new Date().toISOString())}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <div className="flex items-start space-x-4 p-4 bg-red-100/50 rounded-xl border border-red-200">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-red-800 mb-2">
                            {modelConfig.provider} Service Error
                          </p>
                          <p className="text-red-700 leading-relaxed">
                            {error.includes('529') && error.includes('overloaded') 
                              ? `${modelConfig.provider}'s servers are currently overloaded. Please try again in a few minutes.`
                              : error.includes('rate limit') || error.includes('quota')
                              ? `${modelConfig.provider} rate limit exceeded. Please try again later or check your API key usage.`
                              : error.includes('API key') || error.includes('authentication')
                              ? `Authentication error with ${modelConfig.provider}. Please check your API key.`
                              : `${modelConfig.provider} service is temporarily unavailable. Please try again later.`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            }

            // Handle successful results
            const successfulResult = result as QueryResult | ApiQueryResult
            const mentions = successfulResult.mentions || []
                         const detectedBrands = mentions.map(m => {
               // Handle ApiMention type which can have both brand and brands properties
               if (typeof m === 'object' && m !== null) {
                 if ('brand' in m && typeof m.brand === 'string') {
                   return m.brand
                 }
                 if ('brands' in m && m.brands && typeof m.brands === 'object' && 'name' in m.brands) {
                   return (m.brands as { name: string }).name
                 }
               }
               return null
             }).filter((brand): brand is string => Boolean(brand))
            const undetectedBrands = queryBrands.filter(brand => !detectedBrands.includes(brand))
            const responseText = ('response_text' in successfulResult ? successfulResult.response_text : successfulResult.responseText) || ''
            const resultId = (successfulResult.id || ('runId' in successfulResult ? successfulResult.runId : undefined) || modelId || 'unknown') as string
            const createdAt = 'created_at' in successfulResult ? successfulResult.created_at : new Date().toISOString()
            const isExpanded = expandedCards.has(resultId)
            
            return (
              <motion.div
                key={resultId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`flex flex-col h-full bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 ${modelConfig.borderColor}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${modelConfig.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-xl">{modelConfig.icon}</span>
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">{modelConfig.name}</CardTitle>
                          <p className="text-sm text-slate-600">{modelConfig.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className={`bg-gradient-to-r ${modelConfig.color} text-white border-0 shadow-md`}>
                          <Target className="h-3 w-3 mr-1" />
                          {mentions.length} mentions
                        </Badge>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(responseText, resultId)}
                            className="h-9 w-9 p-0 bg-white/50 hover:bg-white border border-slate-200"
                          >
                            {copiedId === resultId ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(createdAt)}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCardExpansion(resultId)}
                        className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                      </motion.button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-6">
                    {/* Brand Mentions Summary */}
                    {mentions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <Target className="h-4 w-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">Detected Brands</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const brandOrder: { brand: string, firstIdx: number, count: number }[] = [];
                                                         mentions.forEach((mention, idx) => {
                               let brandName: string | null = null
                               if (typeof mention === 'object' && mention !== null) {
                                 if ('brand' in mention && typeof mention.brand === 'string') {
                                   brandName = mention.brand
                                 } else if ('brands' in mention && mention.brands && typeof mention.brands === 'object' && 'name' in mention.brands) {
                                   brandName = (mention.brands as { name: string }).name
                                 }
                               }
                               if (brandName) {
                                const found = brandOrder.find(b => b.brand === brandName);
                                if (found) {
                                  found.count++;
                                } else {
                                  brandOrder.push({ brand: brandName, firstIdx: idx, count: 1 });
                                }
                              }
                            });
                            brandOrder.sort((a, b) => a.firstIdx - b.firstIdx);
                            return brandOrder.map((b, i) => (
                              <Badge key={b.brand} variant="outline" className="bg-white/80 border-slate-300 text-xs font-medium">
                                <span className="w-5 h-5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full flex items-center justify-center text-xs mr-1">
                                  {i + 1}
                                </span>
                                {b.brand} ({b.count})
                              </Badge>
                            ));
                          })()}
                        </div>
                      </motion.div>
                    )}

                    {/* Response Text with Highlighting */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>AI Response</span>
                        </h4>
                        <div className="text-xs text-slate-500">
                          {responseText.length} characters
                        </div>
                      </div>
                      <div 
                        className={`prose prose-sm max-w-none text-sm leading-relaxed bg-white/50 rounded-xl p-4 border border-slate-200 ${
                          isExpanded ? '' : 'max-h-48 overflow-hidden'
                        }`}
                        dangerouslySetInnerHTML={{ 
                          __html: highlightBrands(responseText, detectedBrands) 
                        }}
                      />
                      {!isExpanded && responseText.length > 300 && (
                        <div className="text-center">
                          <div className="w-full h-8 bg-gradient-to-t from-white/80 to-transparent absolute bottom-0 left-0 rounded-b-xl"></div>
                        </div>
                      )}
                    </div>

                    {/* Undetected Brands Message */}
                    {undetectedBrands.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-4 px-4 bg-amber-50 rounded-xl border border-amber-200"
                      >
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Missing Brands</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          {undetectedBrands.length === queryBrands.length 
                            ? `No tracked brands (${queryBrands.join(', ')}) mentioned in this response`
                            : `The following tracked brands were not mentioned: ${undetectedBrands.join(', ')}`
                          }
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 