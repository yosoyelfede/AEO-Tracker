'use client'

import { useAuth } from '@/components/auth-context'
import { AuthForm } from '@/components/AuthForm'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  Star,
  Users,
  Target,
  Brain,
  Sparkles,
  Play,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Demo data for the product preview
const demoResults = [
  {
    model: 'ChatGPT',
    response: 'Based on recent reviews and local recommendations, here are the top restaurants in Santiago:\n\n1. **Boragó** - Award-winning fine dining with innovative Chilean cuisine\n2. **Ambrosia** - Excellent Italian food with a cozy atmosphere\n3. **La Mar** - Fresh seafood and Peruvian specialties',
    mentions: ['Boragó', 'Ambrosia', 'La Mar'],
    color: '#10a37f'
  },
  {
    model: 'Claude',
    response: 'For the best dining experiences in Santiago, I recommend:\n\n1. **Ambrosia** - Outstanding Italian cuisine and wine selection\n2. **Boragó** - World-class tasting menu featuring local ingredients\n3. **La Mar** - Authentic Peruvian seafood dishes',
    mentions: ['Ambrosia', 'Boragó', 'La Mar'],
    color: '#d97706'
  },
  {
    model: 'Perplexity',
    response: 'Top restaurants in Santiago based on recent reviews:\n\n1. **La Mar** - Excellent Peruvian cuisine and fresh seafood\n2. **Boragó** - Innovative Chilean fine dining experience\n3. **Ambrosia** - Cozy Italian restaurant with great service',
    mentions: ['La Mar', 'Boragó', 'Ambrosia'],
    color: '#8b5cf6'
  }
]

const demoMetrics = [
  { label: 'Total Mentions', value: '156', change: '+12%', icon: Target, color: 'from-blue-500 to-cyan-500' },
  { label: 'Avg Ranking', value: '2.3', change: '-0.4', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
  { label: 'Model Coverage', value: '4/4', change: '+1', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { label: 'Query Success', value: '94%', change: '+3%', icon: CheckCircle, color: 'from-orange-500 to-red-500' }
]

const features = [
  {
    icon: Search,
    title: 'Real-time AI Comparison',
    description: 'Compare responses from ChatGPT, Claude, Gemini, and Perplexity side-by-side to see how each AI mentions your brand.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track your brand visibility over time with detailed metrics, rankings, and competitive analysis.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: TrendingUp,
    title: 'Historical Tracking',
    description: 'Monitor how your AI presence evolves with comprehensive historical data and trend analysis.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Competitive Intelligence',
    description: 'Understand your position vs competitors and identify opportunities to improve your AEO strategy.',
    color: 'from-orange-500 to-red-500'
  }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Director',
    company: 'Local Restaurant Chain',
    content: 'AEO Tracker helped us increase our AI mentions by 40% in just 3 months. The insights are invaluable!',
    rating: 5
  },
  {
    name: 'Mike Rodriguez',
    role: 'SEO Consultant',
    company: 'Digital Marketing Agency',
    content: 'Finally, a tool that makes AEO optimization measurable and actionable. My clients love the detailed reports.',
    rating: 5
  },
  {
    name: 'Emma Thompson',
    role: 'Business Owner',
    company: 'Boutique Hotel',
    content: 'The real-time comparison feature is game-changing. We can see exactly how different AIs recommend us.',
    rating: 5
  }
]

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeDemo, setActiveDemo] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveDemo((prev) => (prev + 1) % demoResults.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-400/20 to-primary-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/20 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">AEO Tracker</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button variant="ghost" size="sm">
                Features
              </Button>
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="pt-20 pb-16 px-4 sm:px-6 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.div variants={itemVariants} className="mb-8">
              <Badge variant="ai" size="lg" className="mb-4">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Brand Tracking
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold text-secondary-900 mb-6 leading-tight">
                Track How AI
                <span className="text-gradient block">Recommends Your Brand</span>
              </h1>
              <p className="text-xl md:text-2xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Compare responses from ChatGPT, Claude, Gemini, and Perplexity. 
                See exactly how AI assistants mention your business and optimize for better visibility.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="xl" className="text-lg px-8 py-4" animation="glow">
                <Play className="w-5 h-5 mr-2" />
                Try Demo Now
              </Button>
              <Button variant="outline" size="xl" className="text-lg px-8 py-4">
                <ArrowRight className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { label: 'Active Users', value: '2,500+' },
                { label: 'Brands Tracked', value: '15,000+' },
                { label: 'AI Models', value: '4' },
                { label: 'Success Rate', value: '94%' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-secondary-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Live Demo Section */}
        <motion.section 
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                See It In Action
              </h2>
              <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                Watch how AEO Tracker compares AI responses in real-time and extracts brand mentions automatically.
              </p>
            </div>

            {/* Demo Interface */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Query Input */}
              <Card variant="elevated" className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Sample Query
                  </CardTitle>
                  <CardDescription>
                    This is what users can ask AI models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary-50 rounded-lg p-4 border-l-4 border-primary-500">
                    <p className="text-secondary-900 font-medium">
                      "What are the best restaurants in Santiago, Chile?"
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Tracked Brands:</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Boragó', 'Ambrosia', 'La Mar'].map((brand, index) => (
                        <Badge key={brand} variant="outline" className="border-primary-200 text-primary-700">
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Display */}
              <div className="space-y-4">
                {demoResults.map((result, index) => (
                  <motion.div
                    key={result.model}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: activeDemo === index ? 1 : 0.7,
                      x: 0,
                      scale: activeDemo === index ? 1.02 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <Card 
                      variant={activeDemo === index ? "elevated" : "default"}
                      className={`transition-all duration-300 ${
                        activeDemo === index ? 'ring-2 ring-primary-200' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: result.color }}
                            />
                            <CardTitle className="text-lg">{result.model}</CardTitle>
                          </div>
                          {activeDemo === index && (
                            <Badge variant="success" size="sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-secondary-700 whitespace-pre-line">
                            {result.response}
                          </div>
                          <div className="pt-3 border-t border-secondary-100">
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                              <Target className="w-4 h-4" />
                              <span className="font-medium">Brand Mentions:</span>
                              {result.mentions.map((mention, idx) => (
                                <Badge key={idx} variant="secondary" size="sm">
                                  {mention}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Demo Controls */}
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setIsPlaying(!isPlaying)}
                className="mr-4"
              >
                {isPlaying ? 'Pause' : 'Play'} Demo
              </Button>
              <div className="flex justify-center gap-2 mt-4">
                {demoResults.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDemo(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      activeDemo === index 
                        ? 'bg-primary-600 scale-125' 
                        : 'bg-secondary-300 hover:bg-secondary-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Analytics Preview */}
        <motion.section 
          className="py-20 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                Powerful Analytics Dashboard
              </h2>
              <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                Get actionable insights with our comprehensive analytics and reporting tools.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {demoMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="interactive" className="text-center p-6">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-secondary-900 mb-1">{metric.value}</div>
                    <div className="text-sm text-secondary-600 mb-2">{metric.label}</div>
                    <div className="text-xs text-success-600 font-medium">{metric.change}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Chart Preview */}
            <Card variant="elevated" className="p-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Brand Performance Over Time
                </CardTitle>
                <CardDescription>
                  Track your brand mentions and rankings across all AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-secondary-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Interactive charts and analytics</p>
                    <p className="text-xs">Sign up to see your data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                Everything You Need for AEO
              </h2>
              <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                Comprehensive tools to track, analyze, and optimize your brand presence in AI responses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="interactive" className="h-full p-6">
                    <div className={`w-12 h-12 mb-4 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-secondary-900 mb-3">{feature.title}</h3>
                    <p className="text-secondary-600">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          className="py-20 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
                Loved by Marketing Teams
              </h2>
              <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
                See what our users say about AEO Tracker
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card variant="elevated" className="h-full p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-secondary-700 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                        <div className="text-sm text-secondary-600">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-accent-600"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Optimize Your AI Presence?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses tracking and optimizing their brand mentions in AI responses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="secondary" className="text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="xl" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600">
                Schedule Demo
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Auth Form Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                Get Started Today
              </h3>
              <p className="text-secondary-600">
                Create your account and start tracking your brand in AI responses
              </p>
            </div>
            <AuthForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AEO Tracker</span>
              </div>
              <p className="text-secondary-400">
                The complete solution for tracking and optimizing your brand presence in AI responses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-400">
            <p>&copy; 2024 AEO Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
