import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      // Check if we have a session, even if there was an error
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is authenticated, redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`)
      } else if (error) {
        console.error('Auth callback error:', error)
        // Only redirect to error if we don't have a session
        return NextResponse.redirect(`${origin}/auth/error`)
      }
    } catch (err) {
      console.error('Auth callback exception:', err)
      // Check if user is authenticated despite the exception
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
} 