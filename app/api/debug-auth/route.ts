import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication error',
        details: authError.message,
        authError: true
      })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        authError: true
      })
    }
    
    // Check free query status
    const { data: freeQueryData, error: freeQueryError } = await supabase
      .rpc('check_free_query_available', { p_user_id: user.id })
      
    // Check user query usage
    const { data: usageData, error: usageError } = await supabase
      .from('user_query_usage')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      freeQuery: {
        available: freeQueryData,
        error: freeQueryError?.message || null
      },
      usage: {
        data: usageData,
        error: usageError?.message || null
      }
    })
    
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 