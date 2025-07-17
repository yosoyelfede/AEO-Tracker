import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ApiProvider, StoreApiKeyRequest } from '@/types'

// API Key validation functions for each provider
async function validateApiKey(provider: ApiProvider, apiKey: string): Promise<{ valid: boolean; message: string }> {
  try {
    switch (provider) {
      case 'openai':
        return await validateOpenAIKey(apiKey)
      case 'anthropic':
        return await validateAnthropicKey(apiKey)
      case 'google':
        return await validateGoogleKey(apiKey)
      case 'perplexity':
        return await validatePerplexityKey(apiKey)
      default:
        return { valid: false, message: 'Unknown provider' }
    }
  } catch (error) {
    console.error(`Error validating ${provider} key:`, error)
    return { valid: false, message: 'Validation failed' }
  }
}

async function validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey.startsWith('sk-')) {
    return { valid: false, message: 'OpenAI API key must start with "sk-"' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { valid: true, message: 'Valid OpenAI API key' }
    } else if (response.status === 401) {
      return { valid: false, message: 'Invalid OpenAI API key' }
    } else {
      return { valid: false, message: 'Unable to validate OpenAI key' }
    }
  } catch (error) {
    return { valid: false, message: 'Network error validating OpenAI key' }
  }
}

async function validateAnthropicKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey.startsWith('sk-ant-')) {
    return { valid: false, message: 'Anthropic API key must start with "sk-ant-"' }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    if (response.ok || response.status === 400) {
      // 400 is also OK - it means the key is valid but request format might be wrong
      return { valid: true, message: 'Valid Anthropic API key' }
    } else if (response.status === 401) {
      return { valid: false, message: 'Invalid Anthropic API key' }
    } else {
      return { valid: false, message: 'Unable to validate Anthropic key' }
    }
  } catch (error) {
    return { valid: false, message: 'Network error validating Anthropic key' }
  }
}

async function validateGoogleKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey.startsWith('AIza')) {
    return { valid: false, message: 'Google AI API key must start with "AIza"' }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)

    if (response.ok) {
      return { valid: true, message: 'Valid Google AI API key' }
    } else if (response.status === 403) {
      return { valid: false, message: 'Invalid Google AI API key' }
    } else {
      return { valid: false, message: 'Unable to validate Google AI key' }
    }
  } catch (error) {
    return { valid: false, message: 'Network error validating Google AI key' }
  }
}

async function validatePerplexityKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey.startsWith('pplx-')) {
    return { valid: false, message: 'Perplexity API key must start with "pplx-"' }
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-small-online',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    })

    if (response.ok || response.status === 400) {
      // 400 might be OK - key is valid but request format might be wrong
      return { valid: true, message: 'Valid Perplexity API key' }
    } else if (response.status === 401) {
      return { valid: false, message: 'Invalid Perplexity API key' }
    } else {
      return { valid: false, message: 'Unable to validate Perplexity key' }
    }
  } catch (error) {
    return { valid: false, message: 'Network error validating Perplexity key' }
  }
}

// POST - Store/Update API Key
export async function POST(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const { provider, api_key }: StoreApiKeyRequest = await request.json()

    // Input validation
    if (!provider || !api_key) {
      return NextResponse.json(
        { success: false, message: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders: ApiProvider[] = ['openai', 'anthropic', 'google', 'perplexity']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, message: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Sanitize API key
    const sanitizedKey = api_key.trim()
    if (sanitizedKey.length < 10 || sanitizedKey.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Validate API key with the provider
    const validation = await validateApiKey(provider, sanitizedKey)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      )
    }

    // Store encrypted API key using Supabase function
    const { data, error } = await supabase
      .rpc('store_api_key', {
        p_user_id: user.id,
        p_provider: provider,
        p_api_key: sanitizedKey
      })

    if (error) {
      console.error('Error storing API key:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to store API key' },
        { status: 500 }
      )
    }

    const result = data[0]
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    // Log the successful storage (audit trail)
    await supabase
      .from('api_key_access_log')
      .insert({
        user_id: user.id,
        provider,
        action: 'create',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: `${provider} API key stored and validated successfully`,
      key_hint: result.key_hint
    })

  } catch (error) {
    console.error('API key storage error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve API key information (not the actual keys)
export async function GET(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get API key information (excluding the actual encrypted keys)
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at, updated_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      api_keys: apiKeys || []
    })

  } catch (error) {
    console.error('API key fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove API Key
export async function DELETE(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const provider = url.searchParams.get('provider') as ApiProvider

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider parameter is required' },
        { status: 400 }
      )
    }

    // Delete the API key
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    // Log the deletion (audit trail)
    await supabase
      .from('api_key_access_log')
      .insert({
        user_id: user.id,
        provider,
        action: 'delete',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: `${provider} API key deleted successfully`
    })

  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 