'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Clock, 
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/auth-context'

const features = [
  {
    icon: Search,
    title: "Real-time AI Comparison",
    description: "Compare responses from ChatGPT, Claude, Gemini, and Perplexity side-by-side to see how each AI mentions your brand."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your brand visibility over time with detailed metrics, rankings, and competitive analysis."
  },
  {
    icon: Clock,
    title: "Historical Tracking",
    description: "Monitor how your AI presence evolves with comprehensive historical data and trend analysis."
  },
  {
    icon: TrendingUp,
    title: "Competitive Intelligence",
    description: "Understand your position vs competitors and identify opportunities to improve your AEO strategy."
  }
]

const testimonials = [
  {
    quote: "AEO Tracker helped us increase our AI mentions by 40% in just 3 months. The insights are invaluable!",
    author: "Sarah Chen",
    role: "Marketing Director at Local Restaurant Chain",
    avatar: "S"
  },
  {
    quote: "Finally, a tool that makes AEO optimization measurable and actionable. My clients love the detailed reports.",
    author: "Mike Rodriguez",
    role: "SEO Consultant at Digital Marketing Agency",
    avatar: "M"
  },
  {
    quote: "The real-time comparison feature is game-changing. We can see exactly how different AIs recommend us.",
    author: "Emma Thompson",
    role: "Business Owner at Boutique Hotel",
    avatar: "E"
  }
]

const stats = [
  { value: "2,500+", label: "Active Users" },
  { value: "15,000+", label: "Brands Tracked" },
  { value: "4", label: "AI Models" },
  { value: "94%", label: "Success Rate" }
]

export default function Home() {
  const { signInWithPassword } = useAuth()
  const [formData, setFormData] = useState({
    email: 'federxv@gmail.com',
    password: 'adminpassword'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signInWithPassword(formData.email, formData.password)
      // Redirect to dashboard after successful sign in
      window.location.href = '/dashboard'
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AEO Tracker</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Search className="w-4 h-4 mr-2" />
              AI-Powered Brand Tracking
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Track How AI
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Recommends Your Brand</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Compare responses from ChatGPT, Claude, Gemini, and Perplexity. See exactly how AI assistants mention your business and optimize for better visibility.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Play className="w-5 h-5 mr-2" />
                Try Demo Now
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Demo Section */}
        <section className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">See It In Action</h2>
            <p className="text-xl text-gray-600">Watch how AEO Tracker compares AI responses in real-time and extracts brand mentions automatically.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border">
                <div className="flex items-center mb-4">
                  <Search className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold">Sample Query</h3>
                </div>
                <p className="text-gray-600 mb-4">This is what users can ask AI models</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 font-medium">&quot;What are the best restaurants in Santiago, Chile?&quot;</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tracked Brands:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Boragó</Badge>
                    <Badge variant="secondary">Ambrosia</Badge>
                    <Badge variant="secondary">La Mar</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">ChatGPT</h3>
                  <div className="flex items-center text-green-600">
                    <Activity className="w-4 h-4 mr-1" />
                    Active
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    Based on recent reviews and local recommendations, here are the top restaurants in Santiago: 1. <strong>Boragó</strong> - Award-winning fine dining with innovative Chilean cuisine 2. <strong>Ambrosia</strong> - Excellent Italian food with a cozy atmosphere 3. <strong>La Mar</strong> - Fresh seafood and Peruvian specialties
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium">Brand Mentions:</span>
                  <div className="ml-2 flex gap-1">
                    <Badge variant="outline" className="text-xs">Boragó</Badge>
                    <Badge variant="outline" className="text-xs">Ambrosia</Badge>
                    <Badge variant="outline" className="text-xs">La Mar</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <h3 className="text-lg font-semibold mb-4">Claude</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    For the best dining experiences in Santiago, I recommend: 1. <strong>Ambrosia</strong> - Outstanding Italian cuisine and wine selection 2. <strong>Boragó</strong> - World-class tasting menu featuring local ingredients 3. <strong>La Mar</strong> - Authentic Peruvian seafood dishes
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium">Brand Mentions:</span>
                  <div className="ml-2 flex gap-1">
                    <Badge variant="outline" className="text-xs">Ambrosia</Badge>
                    <Badge variant="outline" className="text-xs">Boragó</Badge>
                    <Badge variant="outline" className="text-xs">La Mar</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <h3 className="text-lg font-semibold mb-4">Perplexity</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    Top restaurants in Santiago based on recent reviews: 1. <strong>La Mar</strong> - Excellent Peruvian cuisine and fresh seafood 2. <strong>Boragó</strong> - Innovative Chilean fine dining experience 3. <strong>Ambrosia</strong> - Cozy Italian restaurant with great service
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium">Brand Mentions:</span>
                  <div className="ml-2 flex gap-1">
                    <Badge variant="outline" className="text-xs">La Mar</Badge>
                    <Badge variant="outline" className="text-xs">Boragó</Badge>
                    <Badge variant="outline" className="text-xs">Ambrosia</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Play className="w-5 h-5 mr-2" />
              Play Demo
            </Button>
            <div className="flex justify-center mt-4 space-x-2">
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
            </div>
          </div>
        </section>

        {/* Analytics Dashboard Preview */}
        <section className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Analytics Dashboard</h2>
            <p className="text-xl text-gray-600">Get actionable insights with our comprehensive analytics and reporting tools.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-gray-600">Total Mentions</p>
                    <p className="text-green-600 text-sm">+12%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">2.3</p>
                    <p className="text-gray-600">Avg Ranking</p>
                    <p className="text-green-600 text-sm">-0.4</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">4/4</p>
                    <p className="text-gray-600">Model Coverage</p>
                    <p className="text-green-600 text-sm">+1</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                    <p className="text-gray-600">Query Success</p>
                    <p className="text-green-600 text-sm">+3%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Brand Performance Over Time</h3>
              </div>
              <p className="text-gray-600 mb-6">Track your brand mentions and rankings across all AI models</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive charts and analytics</p>
                  <p className="text-sm text-gray-500">Sign up to see your data</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need for AEO</h2>
            <p className="text-xl text-gray-600">Comprehensive tools to track, analyze, and optimize your brand presence in AI responses.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by Marketing Teams</h2>
            <p className="text-xl text-gray-600">See what our users say about AEO Tracker</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent>
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4">
                    &quot;{testimonial.quote}&quot;
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Optimize Your AI Presence?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of businesses tracking and optimizing their brand mentions in AI responses.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg">Schedule Demo</Button>
          </div>
        </section>

        {/* Sign Up Section */}
        <section className="mt-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg border">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">Welcome Back</h3>
                  <p className="text-gray-600">Sign in to access your AEO dashboard</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">Free 14-day trial</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button type="button" className="absolute right-3 top-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h18a3 3 0 1 0-3-3"/></svg>
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              <div className="text-center mt-6">
                <p className="text-gray-600">or</p>
                <Button variant="outline" className="w-full mt-4">
                  <div className="w-5 h-5 mr-2">G</div>
                  Continue with Google
                </Button>
                <p className="mt-4 text-sm text-gray-600">
                  Don&apos;t have an account? <Link href="#" className="text-blue-600 hover:underline">Sign up</Link>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Join the AEO Revolution</h2>
              <p className="text-xl text-gray-600 mb-8">Track, analyze, and optimize your brand presence in AI responses with our comprehensive platform.</p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Instant Setup</h3>
                  <p className="text-sm text-gray-600">Get started in minutes with our guided onboarding</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure & Private</h3>
                  <p className="text-sm text-gray-600">Your data is encrypted and never shared</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Proven Results</h3>
                  <p className="text-sm text-gray-600">Average 40% increase in AI mentions</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">2,500+ businesses trust AEO Tracker</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">4.9/5 from 500+ reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">4</p>
                  <p className="text-sm text-gray-600">AI Models</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AEO Tracker</span>
              </div>
              <p className="text-gray-400">The complete solution for tracking and optimizing your brand presence in AI responses.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 AEO Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
