 'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Create browser client conditionally to avoid build issues
const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return null
    return null
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase environment variables not found')
    return null
  }
  
  return createBrowserClient(url, key)
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Initialize Supabase client
    const client = createSupabaseClient()
    setSupabase(client)
    
    if (!client) {
      setLoading(false)
      return
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession()
        if (error) {
          console.error('Error getting session:', error.message)
        } else {
          console.log('Initial session:', { hasSession: !!session, timestamp: new Date().toISOString() })
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = client.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log('Auth state change:', { event, hasSession: !!session, timestamp: new Date().toISOString() })
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    console.log('Attempting sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      console.error('Sign in error:', error.message)
      throw error
    }
    console.log('Sign in successful:', { hasSession: !!data.session, timestamp: new Date().toISOString() })
    return data
  }

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    
    // If email confirmation is required, show message
    if (data.user && !data.session) {
      throw new Error('Registration successful! Please check your email and click the confirmation link to complete your account setup.')
    }
    
    return data
  }

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 