import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Initialize API clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null

const gemini = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY
) : null

// Query functions for each LLM
async function queryChatGPT(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  
  console.log('🤖 Calling ChatGPT API with Web Search...', userApiKey ? '(user key)' : '(platform key)')
  
  // Create OpenAI client with the appropriate API key
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey })
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-search-preview', // Latest search-enabled model
      messages: [{ role: 'user', content: query }],
      max_tokens: 1000
      // Note: temperature not supported by search preview models
    })
    
    console.log('🤖 ChatGPT response received')
    
    const content = response.choices[0]?.message?.content
    if (!content || content.trim() === '') {
      throw new Error('Empty response from ChatGPT')
    }
    
    return content
  } catch (error) {
    console.error('🤖 ChatGPT API Error:', error)
    throw error
  }
}

async function queryClaude(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Claude API key not configured')
  
  console.log('🧠 Calling Claude API...', userApiKey ? '(user key)' : '(platform key)')
  
  // Create Anthropic client with the appropriate API key
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })
  
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest Claude model
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: query }]
    })
    
    console.log('🧠 Claude response received')
    
    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    } else {
      throw new Error('Unexpected response format from Claude')
    }
  } catch (error) {
    console.error('🧠 Claude API Error:', error)
    throw error
  }
}

async function queryGemini(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')
  
  console.log('💎 Calling Gemini API...', userApiKey ? '(user key)' : '(platform key)')
  
  // Create Gemini client with the appropriate API key
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const client = new GoogleGenerativeAI(apiKey)
  
  try {
    const model = client.getGenerativeModel({ 
      model: 'gemini-2.5-flash' // Latest Gemini model
    })
    
    const result = await model.generateContent(query)
    
    console.log('💎 Gemini response received')
    
    const response = result.response
    const text = response.text()
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini')
    }
    
    return text
  } catch (error) {
    console.error('💎 Gemini API Error:', error)
    throw error
  }
}

async function queryPerplexity(query: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('Perplexity API key not configured')
  
  console.log('🔍 Calling Perplexity API (has built-in web search)...', userApiKey ? '(user key)' : '(platform key)')
  
  try {
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
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`)
    }
    
    const data = await response.json()
    console.log('🔍 Perplexity response received')
    
    const content = data.choices[0]?.message?.content
    if (!content || content.trim() === '') {
      throw new Error('Empty response from Perplexity')
    }
    
    return content
  } catch (error) {
    console.error('🔍 Perplexity API Error:', error)
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

// Extract brand mentions from text
function extractBrands(text: string, brandNames: string[]) {
  const mentions: { brand: string; position: number; context: string }[] = []
  
  // SECURITY: Sanitize input text to prevent injection
  const sanitizedText = text.replace(/[<>]/g, '').substring(0, 50000) // Remove potential HTML tags and limit length
  const lowerText = sanitizedText.toLowerCase()
  
  brandNames.forEach(brandName => {
    // SECURITY: Additional sanitization of brand names during processing
    const safeBrandName = brandName.replace(/[<>'"]/g, '').trim()
    if (safeBrandName.length === 0) return
    
    const lowerBrand = safeBrandName.toLowerCase()
    let position = lowerText.indexOf(lowerBrand)
    
    while (position !== -1) {
      // Extract context (50 chars before and after)
      const start = Math.max(0, position - 50)
      const end = Math.min(sanitizedText.length, position + safeBrandName.length + 50)
      const context = sanitizedText.substring(start, end).replace(/[<>'"]/g, '') // Additional context sanitization
      
      mentions.push({
        brand: safeBrandName,
        position,
        context
      })
      
      // Find next occurrence
      position = lowerText.indexOf(lowerBrand, position + 1)
    }
  })
  
  // Sort by position (earlier mentions first)
  return mentions.sort((a, b) => a.position - b.position)
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API request started')
    
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
      'https://localhost:3000' // Development with HTTPS
    ].filter(Boolean)
    
    // Check if request comes from allowed origin
    console.log('🔍 CORS Check:', { 
      origin, 
      referer, 
      allowedOrigins,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL
    })
    
    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
      console.log('❌ CSRF: Invalid origin detected', { origin, allowedOrigins })
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
    }
    
    const { queryText, models, brands, brandListId } = await request.json()
    console.log('📝 Request received')
    
    // SECURITY: Input validation and sanitization
    if (!queryText || typeof queryText !== 'string') {
      return NextResponse.json(
        { error: 'Query text is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Sanitize and validate query text
    const sanitizedQueryText = queryText.trim()
    if (sanitizedQueryText.length === 0 || sanitizedQueryText.length > 2000) {
      return NextResponse.json(
        { error: 'Query text must be between 1 and 2000 characters' },
        { status: 400 }
      )
    }
    
    // Validate models array
    if (!models || !Array.isArray(models) || models.length === 0) {
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
      return NextResponse.json(
        { error: 'No valid models selected' },
        { status: 400 }
      )
    }
    
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

    console.log('✅ User authenticated successfully')
    
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

    // If no free queries available, check for user API keys
    let useUserApiKeys = false
    let userApiKeys: { [key: string]: string } = {}
    
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

      // If user has no API keys for any requested models, return error
      if (!useUserApiKeys) {
        console.log('❌ No API keys found for requested models')
        return NextResponse.json(
          { 
            error: 'API_KEYS_REQUIRED',
            message: 'You have used your free query. Please add API keys for the models you want to use.',
            missing_providers: missingKeys,
            redirect_to: '/profile?tab=api-keys'
          },
          { status: 402 } // Payment Required
        )
      }

      // If some keys are missing, filter models to only those with keys
      if (missingKeys.length > 0) {
        console.log('⚠️ Some API keys missing, filtering models:', missingKeys)
        // Remove models without API keys from the request
        const availableModels = sanitizedModels.filter(model => userApiKeys[model])
        if (availableModels.length === 0) {
          return NextResponse.json(
            { 
              error: 'API_KEYS_REQUIRED',
              message: 'No API keys found for the requested models.',
              missing_providers: missingKeys,
              redirect_to: '/profile?tab=api-keys'
            },
            { status: 402 }
          )
        }
        // Update sanitizedModels to only include available ones
        sanitizedModels.splice(0, sanitizedModels.length, ...availableModels)
      }
    }
    
    // Check if user is admin for special privileges
    const isAdmin = isAdminEmail(user.email || '')
    console.log('👤 User authorization:', { isAdmin, timestamp: new Date().toISOString() })
    
    // SECURITY: Service role bypasses RLS - use only when absolutely necessary
    // Regular users should always use the standard client with RLS enabled
    let serviceSupabase = null
    if (isAdmin) {
      try {
        console.log('🔧 Creating service role client for admin operations')
        const { createClient: createServiceClient } = await import('@supabase/supabase-js')
        serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        console.log('✅ Service role client created - use with caution')
      } catch (error) {
        console.error('❌ Error creating service role client:', error instanceof Error ? error.message : 'Unknown error')
        // Continue with regular client if service role fails
      }
    }

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
    const results = await Promise.allSettled(
      sanitizedModels.map(async (model) => {
        try {
          const queryFunction = modelFunctions[model]
          if (!queryFunction) {
            throw new Error(`Unknown model: ${model}`)
          }
          
          // Use user API key if available, otherwise platform key
          const userApiKey = useUserApiKeys ? userApiKeys[model] : undefined
          const responseText = await queryFunction(sanitizedQueryText, userApiKey)
          
          // Create run record in database
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
            throw new Error(`Failed to save ${model} response`)
          }

          console.log(`✅ Created run for ${model}:`, runData.id)

          // Extract brand mentions using sanitized brands
          const mentions = extractBrands(responseText, sanitizedBrands)
          
          // Save mentions to database with proper error handling
          for (let i = 0; i < mentions.length; i++) {
            const mention = mentions[i]
            
            // Get or create brand for backward compatibility
            const { data: brandData, error: brandError } = await dbClient
              .from('brands')
              .upsert({
                name: mention.brand,
                user_id: user.id
              }, {
                onConflict: 'name,user_id'
              })
              .select()
              .single()

            if (brandError) {
              console.error('Brand creation error:', brandError)
              continue // Skip this mention but continue with others
            }

            // Create mention record with only the required fields
            const { error: mentionError } = await dbClient
              .from('mentions')
              .insert({
                run_id: runData.id,
                brand_id: brandData.id,
                rank: i + 1
              })
              
            if (mentionError) {
              console.error('Mention creation error:', mentionError)
              console.error('Mention data:', { run_id: runData.id, brand_id: brandData.id, rank: i + 1 })
            } else {
              console.log(`✅ Created mention for ${mention.brand} at rank ${i + 1}`)
            }
          }

          return {
            model,
            success: true,
            runId: runData.id,
            response_text: responseText,
            mentions: mentions,
            brands: mentions.map(m => m.brand),
            api_key_source: useUserApiKeys ? 'user' : 'platform',
            used_free_query: hasFreeQuery
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
