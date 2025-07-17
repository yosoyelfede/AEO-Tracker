'use client'

import { useAuth } from '@/components/auth-context'
import { AuthForm } from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">AEO Tracker</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track how AI assistants mention your local business. Compare responses from ChatGPT and Perplexity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">🔍 Track Mentions</h3>
            <p className="text-gray-600 mb-4">
              Monitor how often AI models recommend your business
            </p>
            <p className="text-sm text-gray-500">
              See real-time comparisons of AI responses for queries about your local market
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">📊 Historical Data</h3>
            <p className="text-gray-600 mb-4">
              Track your visibility trends over time
            </p>
            <p className="text-sm text-gray-500">
              Understand how your AI presence evolves with detailed analytics
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">🚀 Optimize Strategy</h3>
            <p className="text-gray-600 mb-4">
              Get insights to improve your AEO
            </p>
            <p className="text-sm text-gray-500">
              Discover which queries matter most and where to focus your efforts
            </p>
          </div>
        </div>

        {/* Target Market */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Track Any Brand, Anywhere
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Monitor how AI assistants mention your business, products, or competitors. 
            Add any brand names you want to track and see real-time AI responses.
          </p>
        </div>

        {/* Embedded Auth Form - Replaces CTA Buttons */}
        <AuthForm />
      </main>
    </div>
  )
}
