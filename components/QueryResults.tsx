import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Calendar, Bot, ArrowLeft, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'

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

interface QueryResultsProps {
  results: QueryResult[]
  queryText: string
  isHistorical?: boolean
  onClearHistorical?: () => void
}

const MODEL_CONFIGS = {
  chatgpt: { name: 'ChatGPT', color: 'bg-green-100 text-green-800', icon: '🤖' },
  claude: { name: 'Claude', color: 'bg-purple-100 text-purple-800', icon: '🧠' },
  gemini: { name: 'Gemini', color: 'bg-blue-100 text-blue-800', icon: '💎' },
  perplexity: { name: 'Perplexity', color: 'bg-orange-100 text-orange-800', icon: '🔍' }
}

export function QueryResults({ results, queryText, isHistorical = false, onClearHistorical }: QueryResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [userBrands, setUserBrands] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserBrands()
    }
  }, [user])

  const fetchUserBrands = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('brands')
      .select('name')
      .eq('user_id', user.id) // Filter by current user
      .order('name')

    if (!error && data) {
      setUserBrands(data.map(b => b.name))
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const highlightBrands = (text: string) => {
    let highlightedText = text
    userBrands.forEach((brand, index) => {
      const regex = new RegExp(`(${brand})`, 'gi')
      const colorClass = `bg-yellow-200 font-semibold px-1 py-0.5 rounded`
      highlightedText = highlightedText.replace(regex, `<mark class="${colorClass}">$1</mark>`)
    })
    return highlightedText
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (results.length === 0) {
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
            Query Results: "{queryText}"
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
        {results.map((result) => {
          const modelConfig = MODEL_CONFIGS[result.model as keyof typeof MODEL_CONFIGS] || 
                             { name: result.model, color: 'bg-gray-100 text-gray-800', icon: '🤖' }
          
          return (
            <Card key={result.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{modelConfig.icon}</span>
                    <CardTitle className="text-lg">{modelConfig.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={modelConfig.color}>
                      {result.mentions.length} mentions
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.response_text, result.id)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === result.id ? '✓' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(result.created_at)}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                {/* Brand Mentions Summary */}
                {result.mentions.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Detected Brands:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.mentions.map((mention, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{index + 1} {mention.brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Text with Highlighting */}
                <div 
                  className="prose prose-sm max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightBrands(result.response_text) 
                  }}
                />

                {/* No mentions message */}
                {result.mentions.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {userBrands.length > 0 
                      ? `No tracked brands (${userBrands.join(', ')}) mentioned in this response`
                      : 'No tracked brands mentioned in this response'
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