import { createBrowserClient } from '@supabase/ssr'

// Create browser client with fallback for build time
let supabase: any = null

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
} catch (error) {
  console.warn('Failed to create Supabase client during build:', error)
}

export { supabase } 