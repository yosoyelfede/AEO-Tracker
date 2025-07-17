'use client'

import { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithPassword, signUpWithPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (isSignUp) {
        await signUpWithPassword(email, password)
      } else {
        await signInWithPassword(email, password)
      }
      onClose()
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Solid dark gray overlay */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: '#374151' }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Centered modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4">
        <Card className="w-full bg-white shadow-2xl border-0 rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{isSignUp ? 'Sign up for' : 'Sign in to'} AEO Tracker</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account to start tracking AI brand visibility'
                : 'Enter your credentials to access your dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="px-6">
                  Cancel
                </Button>
              </div>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 