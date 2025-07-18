import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, HelpCircle, Sparkles, Search, BarChart3, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AEO Tracker! 🎉',
    description: 'Let\'s take a quick tour to help you get started with tracking your brand mentions across AI assistants.',
    icon: <Sparkles className="h-6 w-6" />
  },
  {
    id: 'brand-lists',
    title: 'Brand Lists',
    description: 'First, create a brand list with the businesses you want to track. You can organize them by category or location.',
    icon: <Users className="h-6 w-6" />,
    target: 'brand-list-manager',
    position: 'top'
  },
  {
    id: 'query-builder',
    title: 'Query Builder',
    description: 'Enter questions that potential customers might ask AI assistants about your industry or location.',
    icon: <Search className="h-6 w-6" />,
    target: 'query-input',
    position: 'bottom'
  },
  {
    id: 'model-selection',
    title: 'AI Model Selection',
    description: 'Choose which AI assistants to test. Each model may give different responses, so it\'s good to compare them.',
    icon: <Sparkles className="h-6 w-6" />,
    target: 'model-selection',
    position: 'top'
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'View detailed analytics about your brand mentions, rankings, and trends over time.',
    icon: <BarChart3 className="h-6 w-6" />,
    target: 'analytics-tab',
    position: 'left'
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    description: 'Configure your API keys and manage your account settings here.',
    icon: <Settings className="h-6 w-6" />,
    target: 'profile-button',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You now know the basics of AEO Tracker. Start by creating a brand list and running your first query!',
    icon: <Sparkles className="h-6 w-6" />
  }
]

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
      setCurrentStep(0)
    }, 300)
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
      setCurrentStep(0)
    }, 300)
  }

  const currentTourStep = tourSteps[currentStep]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                      {currentTourStep.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {currentTourStep.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Step {currentStep + 1} of {tourSteps.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mb-6"
                >
                  <p className="text-slate-700 leading-relaxed">
                    {currentTourStep.description}
                  </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex space-x-2">
                    {currentStep < tourSteps.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/80"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleComplete}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600"
                      >
                        <span>Get Started</span>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Tooltip component for contextual help
interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ children, content, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          >
            {content}
            <div className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Feature discovery component
interface FeatureDiscoveryProps {
  feature: string
  title: string
  description: string
  isVisible: boolean
  onDismiss: () => void
  onAction?: () => void
  actionText?: string
}

export function FeatureDiscovery({ 
  feature, 
  title, 
  description, 
  isVisible, 
  onDismiss, 
  onAction, 
  actionText = 'Try it' 
}: FeatureDiscoveryProps) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl max-w-sm">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                <p className="text-sm text-slate-600 mb-3">{description}</p>
                <div className="flex space-x-2">
                  {onAction && (
                    <Button
                      size="sm"
                      onClick={onAction}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      {actionText}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDismiss}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 