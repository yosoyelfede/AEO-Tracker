'use client'

import { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react'

const benefits = [
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Get started in minutes with our guided onboarding'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared'
  },
  {
    icon: TrendingUp,
    title: 'Proven Results',
    description: 'Average 40% increase in AI mentions'
  }
]

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      // Auth context will handle the redirect
    } catch (error: any) {
      console.error('Auth error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Auth Form */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="p-8 border-0 shadow-large">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gradient">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isSignUp 
                      ? 'Join thousands of businesses optimizing their AI presence'
                      : 'Sign in to access your AEO dashboard'
                    }
                  </CardDescription>
                </div>
              </div>
              
              <Badge variant="ai" size="lg" className="w-fit">
                <Zap className="w-4 h-4 mr-2" />
                Free 14-day trial
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-secondary-700">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder="your@email.com"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-secondary-700">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-secondary-400 hover:text-secondary-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      placeholder="Enter your password"
                      className="h-12 text-base pr-12"
                    />
                  </div>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0" />
                      <p className="text-error-700 text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  size="xl"
                  className="w-full h-12 text-base font-medium"
                  loading={loading}
                  animation="glow"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-secondary-500">or</span>
                </div>
              </div>

              <Button variant="outline" size="lg" className="w-full h-12">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Side - Benefits */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Join the AEO Revolution
            </h2>
            <p className="text-lg text-secondary-600 mb-8">
              Track, analyze, and optimize your brand presence in AI responses with our comprehensive platform.
            </p>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-secondary-600">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-xl p-6 border border-secondary-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-medium">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold text-secondary-900">2,500+ businesses</div>
                <div className="text-sm text-secondary-600">trust AEO Tracker</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span>4.9/5 from 500+ reviews</span>
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-4"
          >
            <div className="text-center p-4 bg-white rounded-lg border border-secondary-200">
              <div className="text-2xl font-bold text-gradient mb-1">4</div>
              <div className="text-sm text-secondary-600">AI Models</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-secondary-200">
              <div className="text-2xl font-bold text-gradient mb-1">94%</div>
              <div className="text-sm text-secondary-600">Success Rate</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
} 