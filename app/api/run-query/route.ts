import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin'
// import OpenAI from 'openai'
// import Anthropic from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/generative-ai'

// Rate limiting storage (in production, use Redis or database)
const rateLimit = new Map<string, number[]>()

// Rate limit: 3 requests per minute per user
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 3

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimit.get(userId) || []
  
  // Remove requests older than the time window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
  
  // Check if user has exceeded the limit
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }
  
  // Add current request and update storage
  recentRequests.push(now)
  rateLimit.set(userId, recentRequests)
  
  return true // Request allowed
}

// Initialize API clients - these are used for validation but not directly in queries
// const openai = process.env.OPENAI_API_KEY ? new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// }) : null

// const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY
// }) : null

// const gemini = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? new GoogleGenerativeAI(
//   process.env.GOOGLE_GENERATIVE_AI_API_KEY
// ) : null

// Query functions for each LLM
async function queryChatGPT(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  
  console.log('🤖 Calling ChatGPT API with Web Search...', userApiKey ? '(user key)' : '(platform key)')
  
  // Create OpenAI client with the appropriate API key
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey })
  
  try {
    console.log('🤖 Using model: gpt-4o-search-preview')
    
    // Use the search-enabled model and remove temperature parameter which is incompatible
    const response = await client.chat.completions.create({
      model: 'gpt-4o-search-preview', // Search-enabled model
      messages: [{ role: 'user', content: query }],
      max_tokens: 1000
      // Note: temperature parameter is removed as it's incompatible with search models
    })
    
    console.log('🤖 ChatGPT response received:', {
      id: response.id,
      model: response.model,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason,
      contentLength: response.choices[0]?.message?.content?.length || 0
    })
    
    const content = response.choices[0]?.message?.content
    if (!content || content.trim() === '') {
      throw new Error('Empty response from ChatGPT')
    }
    
    return content
  } catch (error) {
    console.error('🤖 ChatGPT API Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

async function queryClaude(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Claude API key not configured')
  
  console.log('🧠 Calling Claude API with Web Search...', userApiKey ? '(user key)' : '(platform key)')
  
  // Create Anthropic client with the appropriate API key
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })
  
  try {
    console.log('🧠 Using model: claude-3-5-sonnet-20241022 with web_search tool')
    
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest Claude model
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: query }],
      system: "You are a helpful AI assistant with access to web search. When answering questions, search the web for the most up-to-date information.",
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305'
        }
      ]
    })
    
    console.log('🧠 Claude response received:', {
      id: response.id,
      model: response.model,
      stopReason: response.stop_reason,
      contentLength: response.content?.length || 0
    })
    
    // Extract text content from the response
    let content = ''
    if (response.content && response.content.length > 0) {
      for (const item of response.content) {
        if (item.type === 'text') {
          content += item.text
        }
      }
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Empty response from Claude')
    }
    
    return content
  } catch (error) {
    console.error('🧠 Claude API Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

async function queryGemini(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')
  
  console.log('💎 Calling Gemini API with Web Search...', userApiKey ? '(user key)' : '(platform key)')
  
  try {
    console.log('💎 Using model: gemini-2.0-flash-exp with web search')
    
    // Use the new @google/genai library
    const { GoogleGenAI } = await import('@google/genai')
    const genAI = new GoogleGenAI({ apiKey })
    
    // Create content with web search enabled
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: query,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        tools: [
          {
            googleSearch: {}
          }
        ]
      }
    });
    
    console.log('💎 Gemini response received:', {
      responseType: typeof result,
      hasText: !!result.text,
      textLength: result.text?.length || 0,
      candidates: result.candidates?.length || 0
    })
    
    const text = result.text;
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini')
    }
    
    return text;
  } catch (error) {
    console.error('💎 Gemini API Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

async function queryPerplexity(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('Perplexity API key not configured')
  
  console.log('🔍 Calling Perplexity API (has built-in web search)...', userApiKey ? '(user key)' : '(platform key)')
  
  try {
    console.log('🔍 Using model: sonar (online search model)')
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar', // Online search model
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000,
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('🔍 Perplexity API HTTP error:', response.status, errorText)
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`)
    }
    
    const data = await response.json()
    console.log('🔍 Perplexity response received:', {
      id: data.id,
      model: data.model,
      usage: data.usage,
      finishReason: data.choices?.[0]?.finish_reason,
      contentLength: data.choices?.[0]?.message?.content?.length || 0
    })
    
    const content = data.choices[0]?.message?.content
    if (!content || content.trim() === '') {
      throw new Error('Empty response from Perplexity')
    }
    
    return content
  } catch (error) {
    console.error('🔍 Perplexity API Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

// Map model names to query functions
const modelFunctions: Record<string, (query: string, userApiKey?: string) => Promise<string>> = {
  chatgpt: queryChatGPT,
  claude: queryClaude,
  gemini: queryGemini,
  perplexity: queryPerplexity
}

// Pure JS diacritic and punctuation removal (no external dependency)
function removeDiacriticsAndPunctuation(str: string) {
  // Remove diacritics
  let normalized = str.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  // Remove punctuation (apostrophes, periods, commas, dashes, etc.)
  normalized = normalized.replace(/[\p{P}\p{S}]/gu, '')
  return normalized
}

// Helper to check if a position is inside a URL or markdown link
function isInUrlOrCitation(pos: number, rawText: string) {
  // Check for markdown links: [text](url)
  const before = rawText.lastIndexOf('[', pos)
  const after = rawText.indexOf(')', pos)
  if (before !== -1 && after !== -1 && rawText.indexOf('](', before) < after && rawText.indexOf('](', before) > before) {
    return true
  }
  // Check for http(s)://
  const urlRegex = /https?:\/\//g
  let match
  while ((match = urlRegex.exec(rawText)) !== null) {
    const urlStart = match.index
    const urlEnd = rawText.indexOf(' ', urlStart)
    if (pos >= urlStart && (urlEnd === -1 || pos < urlEnd)) {
      return true
    }
  }
  // Check for citation-like [1], [2], etc.
  const citationRegex = /\[\d+\]/g
  while ((match = citationRegex.exec(rawText)) !== null) {
    if (pos >= match.index && pos < match.index + match[0].length) {
      return true
    }
  }
  return false
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1.0
  const distance = levenshteinDistance(str1, str2)
  return 1 - (distance / maxLength)
}

// Enhanced brand normalization - currently unused
// function normalizeBrandName(brand: string): string {
//   return brand
//     .toLowerCase()
//     .replace(/[^\w\s]/g, '') // Remove punctuation
//     .replace(/\s+/g, ' ') // Normalize whitespace
//     .trim()
// }

// Enhanced brand extraction with sentiment analysis, evidence counting, and citation detection
function extractBrands(text: string, brandNames: string[]) {
  // Helper to normalize for comparison
  function normalize(str: string) {
    return removeDiacriticsAndPunctuation(str).toLowerCase()
  }

  // Sentiment analysis function
  function calculateSentiment(text: string): number {
    const positiveWords = ['excellent', 'amazing', 'best', 'great', 'outstanding', 'fantastic', 'wonderful', 'perfect', 'superb', 'brilliant', 'top', 'premium', 'quality', 'recommended', 'favorite', 'loved', 'enjoyed', 'satisfied', 'happy', 'delicious', 'authentic', 'fresh', 'innovative', 'reliable', 'trusted', 'popular', 'award-winning', 'expert', 'professional', 'exclusive', 'luxury'];
    const negativeWords = ['terrible', 'awful', 'worst', 'bad', 'poor', 'disappointing', 'horrible', 'mediocre', 'average', 'overrated', 'expensive', 'cheap', 'avoid', 'skip', 'waste', 'disappointed', 'unhappy', 'dissatisfied', 'regret', 'complaint', 'cold', 'stale', 'unprofessional', 'rude', 'slow', 'overpriced', 'crowded', 'noisy', 'dirty', 'unreliable', 'fake'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const totalWords = words.length;
    if (totalWords === 0) return 0;
    
    // Return sentiment score between -1 and 1
    return Math.max(-1, Math.min(1, (positiveCount - negativeCount) / totalWords));
  }

  // Evidence counting function
  function countEvidence(text: string): number {
    let count = 0;
    
    // Count URLs
    const urlMatches = text.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) count += urlMatches.length;
    
    // Count citations (text in quotes or parentheses with source)
    const citationMatches = text.match(/["''][^"'']*["'']\s*\([^)]+\)/g);
    if (citationMatches) count += citationMatches.length;
    
    // Count numbers that might be data points
    const dataMatches = text.match(/\d+%|\d+\s*(stars?|points?|rating|years?|customers?|reviews?)/g);
    if (dataMatches) count += dataMatches.length;
    
    // Count "according to" or "source:" patterns
    const sourceMatches = text.match(/according to|source:|cited|reference|study|research|report|survey/gi);
    if (sourceMatches) count += sourceMatches.length;
    
    return count;
  }

  // Citation detection function
  function hasCitation(text: string): boolean {
    return !!(
      text.match(/https?:\/\/[^\s]+/) || // URLs
      text.match(/["''][^"'']*["'"]\s*\([^)]+\)/) || // Quoted text with source
      text.match(/according to|source:|cited|reference/gi) || // Citation keywords
      text.match(/\d{4}.*\b(study|research|report|survey)\b/) // Year with research terms
    );
  }

  // Build normalized text and mapping from normalized index to original index
  let normalizedText = ''
  const normIdxToOrigIdx: number[] = []
  for (let i = 0; i < text.length; i++) {
    const normChar = removeDiacriticsAndPunctuation(text[i]).toLowerCase()
    if (normChar) {
      normalizedText += normChar
      normIdxToOrigIdx.push(i)
    }
  }

  // Create normalized brand map with fuzzy matching support
  const normBrandMap = new Map<string, string>()
  const brandVariations = new Map<string, string[]>()
  
  brandNames.forEach(brand => {
    const norm = normalize(brand)
    if (norm && !normBrandMap.has(norm)) {
      normBrandMap.set(norm, brand)
      
      // Create variations for fuzzy matching
      const variations = [
        norm,
        norm.replace(/\s+/g, ''), // Remove spaces
        norm.replace(/\s+/g, '-'), // Replace spaces with hyphens
        norm.replace(/\s+/g, '_'), // Replace spaces with underscores
        // Add common business suffixes
        norm + ' spa',
        norm + ' ltda',
        norm + ' eirl',
        norm + ' empresa',
        norm + ' company',
        norm + ' inc',
        norm + ' corp'
      ]
      brandVariations.set(brand, variations)
    }
  })

  const mentions: { 
    brand: string; 
    position: number; 
    context: string; 
    confidence: number;
    sentiment_score: number;
    evidence_count: number;
    has_citation: boolean;
  }[] = []
  const usedPositions = new Set<number>()

  // First pass: exact matches
  for (const [normBrand, origBrand] of normBrandMap.entries()) {
    if (!normBrand) continue
    let idx = 0
    while ((idx = normalizedText.indexOf(normBrand, idx)) !== -1) {
      const origIdx = normIdxToOrigIdx[idx]
      if (usedPositions.has(origIdx)) {
        idx += normBrand.length
        continue
      }
      
      // Word boundary check in normalized text
      const beforeOk = idx === 0 || !(/[\p{L}\p{N}]/u).test(normalizedText[idx - 1])
      const afterOk = idx + normBrand.length === normalizedText.length || !(/[\p{L}\p{N}]/u).test(normalizedText[idx + normBrand.length])
      
      if (beforeOk && afterOk) {
        // Check if not in URL/citation in original text
        if (!isInUrlOrCitation(origIdx, text)) {
          const start = Math.max(0, origIdx - 100)
          const end = Math.min(text.length, origIdx + normBrand.length + 100)
          const context = text.substring(start, end)
          
          // Calculate analytics metrics for this mention
          const sentiment_score = calculateSentiment(context);
          const evidence_count = countEvidence(context);
          const has_citation = hasCitation(context);
          
          mentions.push({ 
            brand: origBrand, 
            position: origIdx, 
            context,
            confidence: 1.0,
            sentiment_score,
            evidence_count,
            has_citation
          })
          usedPositions.add(origIdx)
        }
      }
      idx += normBrand.length
    }
  }

  // Second pass: fuzzy matching for remaining text
  const words = text.split(/\s+/)
  let currentPos = 0
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const wordStart = currentPos
    const wordEnd = currentPos + word.length
    
    // Skip if position already used
    if (usedPositions.has(wordStart)) {
      currentPos = wordEnd + 1
      continue
    }
    
    // Check for multi-word brand matches
    for (let j = 1; j <= 4 && i + j <= words.length; j++) {
      const phrase = words.slice(i, i + j).join(' ')
      const normPhrase = normalize(phrase)
      
      // Try exact match first
      if (normBrandMap.has(normPhrase)) {
        const brand = normBrandMap.get(normPhrase)!
        if (!usedPositions.has(wordStart)) {
          const start = Math.max(0, wordStart - 100)
          const end = Math.min(text.length, wordStart + phrase.length + 100)
          const context = text.substring(start, end)
          
          // Calculate analytics metrics for this mention
          const sentiment_score = calculateSentiment(context);
          const evidence_count = countEvidence(context);
          const has_citation = hasCitation(context);
          
          mentions.push({ 
            brand, 
            position: wordStart, 
            context,
            confidence: 0.9,
            sentiment_score,
            evidence_count,
            has_citation
          })
          usedPositions.add(wordStart)
          break
        }
      }
      
      // Try fuzzy matching
      for (const [brand, variations] of brandVariations.entries()) {
        for (const variation of variations) {
          const similarity = calculateSimilarity(normPhrase, variation)
          if (similarity >= 0.8) { // 80% similarity threshold
            if (!usedPositions.has(wordStart)) {
              const start = Math.max(0, wordStart - 100)
              const end = Math.min(text.length, wordStart + phrase.length + 100)
              const context = text.substring(start, end)
              
              // Calculate analytics metrics for this mention
              const sentiment_score = calculateSentiment(context);
              const evidence_count = countEvidence(context);
              const has_citation = hasCitation(context);
              
              mentions.push({ 
                brand, 
                position: wordStart, 
                context,
                confidence: similarity,
                sentiment_score,
                evidence_count,
                has_citation
              })
              usedPositions.add(wordStart)
              break
            }
          }
        }
      }
    }
    
    currentPos = wordEnd + 1
  }

  // Sort by position (earlier mentions first) and then by confidence
  return mentions
    .sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position
      }
      return b.confidence - a.confidence
    })
    .map(({ brand, position, context, sentiment_score, evidence_count, has_citation }) => ({ 
      brand, 
      position, 
      context, 
      sentiment_score, 
      evidence_count, 
      has_citation 
    }))
}

function stripMarkdown(text: string): string {
  // Remove bold/italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // Remove remaining markdown symbols
  text = text.replace(/[>#*_~`-]/g, '');
  return text;
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API request started at', new Date().toISOString())
    
    // SECURITY: Request size limit to prevent DoS attacks
    const contentLength = request.headers.get('content-length')
    const maxRequestSize = 1024 * 50 // 50KB limit
    
    if (contentLength && parseInt(contentLength) > maxRequestSize) {
      console.log('❌ Request size limit exceeded')
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      )
    }
    
    // SECURITY: Basic CSRF protection
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Vercel automatic env
      'https://aeo-tracker.vercel.app', // Production domain
      'http://localhost:3000', // Development
      'https://localhost:3000', // Development with HTTPS
      '*' // Temporarily allow all origins for debugging
    ].filter(Boolean)
    
    // Check if request comes from allowed origin
    console.log('🔍 CORS Check:', { 
      origin, 
      referer, 
      allowedOrigins,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL
    })
    
    // Temporarily disable CORS check for debugging
    /*
    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
      console.log('❌ CSRF: Invalid origin detected', { origin, allowedOrigins })
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }
    */
    
    const requestBody = await request.json()
    console.log('📝 Request received:', {
      models: requestBody.models,
      brandListId: requestBody.brandListId,
      brandCount: requestBody.brands?.length,
      queryTextLength: requestBody.queryText?.length
    })
    
    const { queryText, models, brands, brandListId } = requestBody
    
    // SECURITY: Input validation and sanitization
    if (!queryText || typeof queryText !== 'string') {
      console.error('❌ Invalid query text:', queryText)
      return NextResponse.json(
        { error: 'Query text is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Sanitize and validate query text
    const sanitizedQueryText = queryText.trim()
    if (sanitizedQueryText.length === 0 || sanitizedQueryText.length > 2000) {
      console.error('❌ Query text length invalid:', sanitizedQueryText.length)
      return NextResponse.json(
        { error: 'Query text must be between 1 and 2000 characters' },
        { status: 400 }
      )
    }
    
    // Validate models array
    if (!models || !Array.isArray(models) || models.length === 0) {
      console.error('❌ Invalid models array:', models)
      return NextResponse.json(
        { error: 'At least one model must be selected' },
        { status: 400 }
      )
    }
    
    // Validate each model
    const allowedModels = ['chatgpt', 'claude', 'gemini', 'perplexity']
    const sanitizedModels = models.filter(model => 
      typeof model === 'string' && allowedModels.includes(model.toLowerCase())
    )
    
    if (sanitizedModels.length === 0) {
      console.error('❌ No valid models selected:', models)
      return NextResponse.json(
        { error: 'No valid models selected' },
        { status: 400 }
      )
    }
    
    console.log('✅ Using models:', sanitizedModels)

    // Validate brands array
    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return NextResponse.json(
        { error: 'At least one brand must be specified' },
        { status: 400 }
      )
    }
    
    // Sanitize brand names to prevent injection
    const sanitizedBrands = brands
      .filter(brand => typeof brand === 'string')
      .map(brand => brand.trim().substring(0, 100)) // Limit length
      .filter(brand => brand.length > 0 && /^[a-zA-Z0-9\s\-_&.]+$/.test(brand)) // Only allow safe characters
    
    if (sanitizedBrands.length === 0) {
      return NextResponse.json(
        { error: 'No valid brand names provided' },
        { status: 400 }
      )
    }
    
    // Validate brandListId
    if (!brandListId || typeof brandListId !== 'string') {
      return NextResponse.json(
        { error: 'Brand list ID is required' },
        { status: 400 }
      )
    }
    
    // Validate UUID format for brandListId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(brandListId)) {
      return NextResponse.json(
        { error: 'Invalid brand list ID format' },
        { status: 400 }
      )
    }

    // Get authenticated user from Supabase
    const supabase = await createClient()
    
    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔑 Session check:', { 
      hasUser: !!user, 
      userId: user?.id,
      timestamp: new Date().toISOString(),
      hasUserError: !!userError
    })

    if (!user) {
      console.log('❌ No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated successfully:', user.id)
    
    // SECURITY: Rate limiting check
    if (!checkRateLimit(user.id)) {
      console.log('❌ Rate limit exceeded for user')
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before making another request.' },
        { status: 429 }
      )
    }

    // Check free query availability and API key requirements
    const { data: freeQueryCheck } = await supabase
      .rpc('check_free_query_available', { p_user_id: user.id })

    const hasFreeQuery = freeQueryCheck || false
    console.log('🆓 Free query check:', { hasFreeQuery, userId: user.id })

    // If no free queries available, check for user API keys or use platform keys for admin
    let useUserApiKeys = false
    const userApiKeys: { [key: string]: string } = {}
    
    if (!hasFreeQuery) {
      console.log('🔑 No free queries available, checking user API keys...')
      
      // Get user's API keys for the requested models
      const userKeyPromises = sanitizedModels.map(async (model) => {
        const { data } = await supabase
          .rpc('get_decrypted_api_key', { 
            p_user_id: user.id, 
            p_provider: model 
          })
        return { model, key: data }
      })

      const userKeyResults = await Promise.all(userKeyPromises)
      const missingKeys: string[] = []

      userKeyResults.forEach(({ model, key }) => {
        if (key) {
          userApiKeys[model] = key
          useUserApiKeys = true
        } else {
          missingKeys.push(model)
        }
      })

      // Check if platform API keys are available for missing models (for admin users)
      const platformKeysAvailable: { [key: string]: boolean } = {
        'chatgpt': !!process.env.OPENAI_API_KEY,
        'claude': !!process.env.ANTHROPIC_API_KEY,
        'gemini': !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        'perplexity': !!process.env.PERPLEXITY_API_KEY
      }

      const platformCoveredModels = missingKeys.filter(model => platformKeysAvailable[model])
      const stillMissingKeys = missingKeys.filter(model => !platformKeysAvailable[model])

      if (platformCoveredModels.length > 0) {
        console.log('✅ Platform API keys available for models:', platformCoveredModels)
      }

      // If user has no API keys AND no platform keys are available, return error
      if (!useUserApiKeys && stillMissingKeys.length === sanitizedModels.length) {
        console.log('❌ No API keys found for requested models (user or platform)')
        return NextResponse.json(
          { 
            error: 'API_KEYS_REQUIRED',
            message: 'You have used your free query. Please add API keys for the models you want to use.',
            missing_providers: stillMissingKeys,
            redirect_to: '/profile?tab=api-keys'
          },
          { status: 402 } // Payment Required
        )
      }

      // If some keys are missing, filter models to only those with keys (user or platform)
      if (stillMissingKeys.length > 0) {
        console.log('⚠️ Some API keys missing, filtering models:', stillMissingKeys)
        // Remove models without any API keys (user or platform) from the request
        const availableModels = sanitizedModels.filter(model => 
          userApiKeys[model] || platformKeysAvailable[model]
        )
        if (availableModels.length === 0) {
          return NextResponse.json(
            { 
              error: 'API_KEYS_REQUIRED',
              message: 'No API keys found for the requested models.',
              missing_providers: stillMissingKeys,
              redirect_to: '/profile?tab=api-keys'
            },
            { status: 402 }
          )
        }
        // Update sanitizedModels to only include available ones
        sanitizedModels.splice(0, sanitizedModels.length, ...availableModels)
        console.log('✅ Using available models:', availableModels)
      }
    }
    
    // Check if user is admin for special privileges
    const isAdmin = isAdminEmail(user.email || '')
    console.log('👤 User authorization:', { isAdmin, timestamp: new Date().toISOString() })
    
    // SECURITY: Service role bypasses RLS - use only when absolutely necessary
    // Regular users should always use the standard client with RLS enabled
    // let serviceSupabase = null
    // if (isAdmin) {
    //   try {
    //     console.log('🔧 Creating service role client for admin operations')
    //     const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    //     serviceSupabase = createServiceClient(
    //       process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //       process.env.SUPABASE_SERVICE_ROLE_KEY!,
    //       {
    //         auth: {
    //           autoRefreshToken: false,
    //           persistSession: false
    //         }
    //       }
    //     )
    //     console.log('✅ Service role client created - use with caution')
    //   } catch (error) {
    //     console.error('❌ Error creating service role client:', error instanceof Error ? error.message : 'Unknown error')
    //     // Continue with regular client if service role fails
    //   }
    // }

    console.log('👤 Processing request for authenticated user')

    // SECURITY: Prefer regular client with RLS over service role
    // Only use service role for specific admin operations that require it
    const dbClient = supabase  // Default to secure RLS-enabled client
    
    // For this operation, we don't need service role - user can only create their own queries
    // RLS policies will enforce proper data isolation

    // Create query record in database
    console.log('📝 Creating query record')
    const { data: queryData, error: queryError } = await dbClient
      .from('queries')
      .insert({
        prompt: sanitizedQueryText,
        user_id: user.id,
        brand_list_id: brandListId
      })
      .select()
      .single()

    if (queryError) {
      console.error('❌ Failed to create query:', queryError)
      return NextResponse.json(
        { error: 'Failed to create query record' },
        { status: 500 }
      )
    }

    console.log('✅ Created query:', queryData.id)

    // If using free query, increment the usage counter
    if (hasFreeQuery) {
      console.log('🆓 Incrementing free query usage for user:', user.id)
      await supabase.rpc('increment_free_query_usage', { p_user_id: user.id })
    }

    // Run queries on all selected models in parallel
    console.log('🚀 Starting parallel queries for models:', sanitizedModels)
    const results = await Promise.allSettled(
      sanitizedModels.map(async (model) => {
        try {
          const queryFunction = modelFunctions[model]
          if (!queryFunction) {
            throw new Error(`Unknown model: ${model}`)
          }
          
          // Use user API key if available, otherwise platform key (falls back to env vars)
          const userApiKey = userApiKeys[model] // This will be undefined if user doesn't have this key
          const responseText = await queryFunction(sanitizedQueryText, userApiKey)
          
          // Log the response length for debugging
          console.log(`📝 ${model} response received, length: ${responseText.length} characters`)
          
          // Create run record in database
          console.log(`📊 Attempting to save run for ${model} to database...`)
          
          try {
            const { data: runData, error: runError } = await dbClient
              .from('runs')
              .insert({
                query_id: queryData.id,
                model,
                raw_response: responseText
              })
              .select()
              .single()

            if (runError) {
              console.error(`❌ Failed to create run for ${model}:`, runError)
              console.error(`❌ Database error details:`, JSON.stringify(runError))
              throw new Error(`Failed to save ${model} response: ${runError.message}`)
            }

            console.log(`✅ Created run for ${model}:`, runData.id)

            // Extract brand mentions using sanitized brands
            const plainText = stripMarkdown(responseText)
            const mentions = extractBrands(plainText, sanitizedBrands)
            console.log(`📊 Extracted ${mentions.length} brand mentions for ${model}`)

            // Efficiently upsert all brands and collect their IDs
            const brandNameToId: Record<string, string> = {}
            if (mentions.length > 0) {
              // Upsert all brands in parallel
              await Promise.all(
                mentions.map(async (mention) => {
                  const { data: brandData, error: brandError } = await dbClient
                    .from('brands')
                    .upsert({ name: mention.brand, user_id: user.id }, { onConflict: 'name,user_id' })
                    .select()
                    .single()
                  if (brandError) {
                    console.error('Brand creation error:', brandError)
                    return null
                  }
                  brandNameToId[mention.brand] = brandData.id
                  return brandData
                })
              )
            }

            // Prepare all mention records for batch insert with analytics fields
            const mentionRecords = mentions.map((mention, i) => ({
              run_id: runData.id,
              brand_id: brandNameToId[mention.brand],
              brand_list_id: brandListId, // Add brand_list_id to associate mentions with brand lists
              rank: i + 1,
              position: mention.position,
              context: mention.context,
              sentiment_score: mention.sentiment_score,
              evidence_count: mention.evidence_count,
              has_citation: mention.has_citation,
              query_text: sanitizedQueryText,
              model: model
            }))

            // Batch insert all mentions
            if (mentionRecords.length > 0) {
              const { error: mentionInsertError } = await dbClient
                .from('mentions')
                .insert(mentionRecords)
              if (mentionInsertError) {
                console.error('Mention batch insert error:', mentionInsertError)
                console.error('Mention records:', mentionRecords)
              } else {
                console.log(`✅ Inserted ${mentionRecords.length} mentions for run ${runData.id}`)
              }
            }

            return {
              model,
              success: true,
              runId: runData.id,
              response_text: responseText,
              mentions: mentions,
              brands: mentions.map(m => m.brand),
              api_key_source: userApiKeys[model] ? 'user' : 'platform',
              used_free_query: hasFreeQuery
            }
          } catch (dbError) {
            console.error(`❌ Database operation failed for ${model}:`, dbError)
            throw dbError
          }
        } catch (error) {
          console.error(`Error querying ${model}:`, error)
          return {
            model,
            success: false,
            error: process.env.NODE_ENV === 'production' 
              ? 'Service temporarily unavailable'
              : error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Format results
    const successfulRuns = results.filter(r => r.status === 'fulfilled' && r.value.success)
    console.log(`📊 Query results summary: ${successfulRuns.length} successful out of ${results.length} total runs`)
    
    // Log individual results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          console.log(`✅ Model ${result.value.model} succeeded with ${result.value.mentions?.length || 0} mentions`)
        } else {
          console.error(`❌ Model ${result.value.model} failed with error: ${result.value.error}`)
        }
      } else {
        console.error(`❌ Model run rejected with reason:`, result.reason)
      }
    })

    return NextResponse.json({
      success: true,
      queryId: queryData.id,
      results: results.map(r => r.status === 'fulfilled' ? r.value : {
        model: 'unknown',
        success: false,
        error: r.reason?.message || 'Unknown error'
      }),
      summary: {
        total: models.length,
        successful: successfulRuns.length,
        failed: models.length - successfulRuns.length
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'production'
          ? 'An error occurred processing your request'
          : error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
