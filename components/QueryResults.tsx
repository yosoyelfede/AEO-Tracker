import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Copy, Calendar, Clock, ArrowLeft, AlertCircle } from 'lucide-react'
import { ApiQueryResult } from '@/types'

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
  queryBrands?: string[] // Add the brands that were used in the query
  selectedModels?: string[] // Add the models that were selected for the query
}

const MODEL_CONFIGS = {
  chatgpt: { name: 'ChatGPT', color: 'bg-green-100 text-green-800', icon: '🤖', provider: 'OpenAI' },
  claude: { name: 'Claude', color: 'bg-purple-100 text-purple-800', icon: '🧠', provider: 'Anthropic' },
  gemini: { name: 'Gemini', color: 'bg-blue-100 text-blue-800', icon: '💎', provider: 'Google' },
  perplexity: { name: 'Perplexity', color: 'bg-orange-100 text-orange-800', icon: '🔍', provider: 'Perplexity' }
}

// Define the correct order of models as they appear in the UI
const MODEL_ORDER = ['chatgpt', 'claude', 'gemini', 'perplexity']

export function QueryResults({ results, queryText, isHistorical = false, onClearHistorical, queryBrands = [], selectedModels = [] }: QueryResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Highlight brands in the text using normalization-aware matching
  const highlightBrands = (text: string, detectedBrands: string[]) => {
    if (detectedBrands.length === 0) return text

    // Helper to normalize
    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .toLowerCase()

    // Build a set for fast lookup (unused but kept for potential future optimization)
    // const detectedSet = new Set(detectedBrands.map(normalize))

    // We'll build the highlighted string piece by piece
    let result = ''
    let i = 0
    while (i < text.length) {
      let found = false
      // Try all detected brands at this position
      for (const brand of detectedBrands) {
        const brandNorm = normalize(brand)
        // Try to match a substring of the same length as the brand (plus possible punctuation)
        // We'll try up to brand.length+2 to allow for apostrophes, etc.
        for (let len = brand.length; len <= brand.length + 2 && i + len <= text.length; len++) {
          const candidate = text.slice(i, i + len)
          if (normalize(candidate) === brandNorm) {
            // Highlight this substring
            result += `<mark class="bg-yellow-200 font-semibold px-1 py-0.5 rounded">${candidate}</mark>`
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

  // Helper function to normalize text (same as backend) - unused but kept for consistency
  // const removeDiacriticsAndPunctuation = (str: string) => {
  //   return str
  //     .normalize('NFD')
  //     .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
  //     .replace(/[^\w\s]/g, '') // Remove punctuation
  //     .toLowerCase()
  // }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Create a map of results by model for easy lookup
  const resultsByModel = new Map<string, QueryResult | QueryError | ApiQueryResult>()
  results.forEach(result => {
    resultsByModel.set(result.model, result)
  })

  // Generate the ordered list of models to display
  const modelsToDisplay = selectedModels.length > 0 
    ? selectedModels 
    : MODEL_ORDER.filter(model => resultsByModel.has(model))

  if (modelsToDisplay.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No results yet. Run a query to see AI responses here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Query Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
              {isHistorical && <Clock className="h-4 w-4 text-gray-500" />}
            Query Results: &ldquo;{queryText}&rdquo;
              {isHistorical && <Badge variant="outline">Historical</Badge>}
          </CardTitle>
            {isHistorical && onClearHistorical && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistorical}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Current
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {modelsToDisplay.map((modelId) => {
          const result = resultsByModel.get(modelId)
          const modelConfig = MODEL_CONFIGS[modelId as keyof typeof MODEL_CONFIGS] || 
                             { name: modelId, color: 'bg-gray-100 text-gray-800', icon: '🤖', provider: 'Unknown' }
          
          // Check if this is an error result
          if (!result || !result.success) {
            const error = result?.error || 'Unknown error occurred'
            return (
              <Card key={modelId} className="flex flex-col h-full border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{modelConfig.icon}</span>
                      <CardTitle className="text-lg">{modelConfig.name}</CardTitle>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      Error
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(new Date().toISOString())}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="flex items-start gap-3 p-4 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-1">
                        {modelConfig.provider} Service Error
                      </p>
                      <p className="text-red-700">
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
            )
          }

          // Handle successful result
          const successfulResult = result as QueryResult | ApiQueryResult
          const mentions = successfulResult.mentions || []
          const detectedBrands = mentions.map(m => 
            'brand' in m ? m.brand : m.brands?.name
          ).filter((brand): brand is string => Boolean(brand))
          const undetectedBrands = queryBrands.filter(brand => !detectedBrands.includes(brand))
          const responseText = ('response_text' in successfulResult ? successfulResult.response_text : successfulResult.responseText) || ''
          const resultId = (successfulResult.id || ('runId' in successfulResult ? successfulResult.runId : undefined) || modelId || 'unknown') as string
          const createdAt = 'created_at' in successfulResult ? successfulResult.created_at : new Date().toISOString()
          
          return (
            <Card key={resultId} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{modelConfig.icon}</span>
                    <CardTitle className="text-lg">{modelConfig.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={modelConfig.color}>
                      {mentions.length} mentions
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(responseText, resultId)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === resultId ? '✓' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(createdAt)}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                {/* Brand Mentions Summary */}
                {mentions.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Detected Brands:</p>
                    <div className="flex flex-wrap gap-1">
                      {/* Group mentions by brand, order by first appearance */}
                      {(() => {
                        const brandOrder: { brand: string, firstIdx: number, count: number }[] = [];
                        mentions.forEach((mention, idx) => {
                          const brandName = 'brand' in mention ? mention.brand : mention.brands?.name
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
                          <Badge key={b.brand} variant="outline" className="text-xs">
                            #{i + 1} {b.brand} ({b.count} mention{b.count > 1 ? 's' : ''})
                          </Badge>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Response Text with Highlighting */}
                <div 
                  className="prose prose-sm max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightBrands(responseText, detectedBrands) 
                  }}
                />

                {/* No mentions message - only show undetected brands */}
                {undetectedBrands.length > 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {undetectedBrands.length === queryBrands.length 
                      ? `No tracked brands (${queryBrands.join(', ')}) mentioned in this response`
                      : `The following tracked brands were not mentioned: ${undetectedBrands.join(', ')}`
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 