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
        details: authError.message
      })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      })
    }
    
    // Test users table access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      
    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user data',
        details: userError.message,
        code: userError.code
      })
    }
    
    // Test profile update permission
    const { error: updateError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id)
      
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update user data',
        details: updateError.message,
        code: updateError.code
      })
    }
    
    // Check table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      userData,
      schema: schemaData || 'Schema query failed',
      schemaError: schemaError?.message || null
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 