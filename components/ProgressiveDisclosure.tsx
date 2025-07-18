import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Sparkles, Lock, Unlock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedWrapper, AnimatedCard } from '@/components/AnimatedWrapper'
import { Reveal, StaggeredList } from '@/components/AdvancedAnimations'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  requirement: number
  currentProgress: number
  isUnlocked: boolean
  isVisible: boolean
  component?: React.ReactNode
}

interface ProgressiveDisclosureProps {
  features: Feature[]
  onFeatureUnlock?: (featureId: string) => void
  className?: string
}

export function ProgressiveDisclosure({ 
  features, 
  onFeatureUnlock,
  className = '' 
}: ProgressiveDisclosureProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())
  const [showAllFeatures, setShowAllFeatures] = useState(false)

  const toggleFeature = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures)
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId)
    } else {
      newExpanded.add(featureId)
    }
    setExpandedFeatures(newExpanded)
  }

  const visibleFeatures = showAllFeatures 
    ? features 
    : features.filter(f => f.isVisible || f.isUnlocked)

  const lockedFeatures = features.filter(f => !f.isUnlocked)
  const unlockedFeatures = features.filter(f => f.isUnlocked)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Reveal animation="slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Features</h2>
            <p className="text-gray-600">Unlock powerful tools as you use AETrack</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="flex items-center space-x-2"
          >
            {showAllFeatures ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Hide Locked</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Show All</span>
              </>
            )}
          </Button>
        </div>
      </Reveal>

      {/* Progress Overview */}
      <Reveal animation="slideUp" delay={0.1}>
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Feature Progress</h3>
                  <p className="text-sm text-gray-600">
                    {unlockedFeatures.length} of {features.length} features unlocked
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {Math.round((unlockedFeatures.length / features.length) * 100)}% Complete
              </Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedFeatures.length / features.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* Features List */}
      <StaggeredList animation="slideUp" staggerDelay={0.1}>
        {visibleFeatures.map((feature) => (
          <AnimatedCard key={feature.id} delay={0.1}>
            <Card className={`transition-all duration-300 ${
              feature.isUnlocked 
                ? 'border-green-200 bg-green-50/50' 
                : 'border-gray-200 bg-gray-50/50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      feature.isUnlocked
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gray-300'
                    }`}>
                      {feature.isUnlocked ? (
                        <Unlock className="h-5 w-5 text-white" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {!feature.isUnlocked && (
                      <Badge variant="outline" className="text-xs">
                        {feature.currentProgress}/{feature.requirement}
                      </Badge>
                    )}
                    {feature.isUnlocked && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Unlocked
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeature(feature.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedFeatures.has(feature.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedFeatures.has(feature.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0">
                      {feature.isUnlocked ? (
                        <div className="space-y-4">
                          {feature.component}
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <Info className="h-4 w-4" />
                            <span>This feature is now available for use</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Progress to unlock
                              </span>
                              <span className="text-sm text-gray-500">
                                {feature.currentProgress}/{feature.requirement}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${Math.min((feature.currentProgress / feature.requirement) * 100, 100)}%` 
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Lock className="h-4 w-4" />
                            <span>
                              Complete {feature.requirement - feature.currentProgress} more actions to unlock
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </AnimatedCard>
        ))}
      </StaggeredList>

      {/* Empty State */}
      {visibleFeatures.length === 0 && (
        <Reveal animation="fadeIn">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Available</h3>
              <p className="text-gray-600">
                Start using AETrack to unlock advanced features and capabilities.
              </p>
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  )
}

// Hook for managing progressive features
export function useProgressiveFeatures(userId?: string) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [userStats, setUserStats] = useState({
    totalQueries: 0,
    totalBrandLists: 0,
    totalAnalytics: 0,
    daysActive: 0
  })

  // Define available features
  const availableFeatures: Omit<Feature, 'currentProgress' | 'isUnlocked' | 'isVisible'>[] = [
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Detailed performance metrics and trend analysis',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 3
    },
    {
      id: 'data-export',
      title: 'Data Export',
      description: 'Export your analytics data as CSV or JSON',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 5
    },
    {
      id: 'scheduled-reports',
      title: 'Scheduled Reports',
      description: 'Automatically generate and send reports',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 10
    },
    {
      id: 'api-access',
      title: 'API Access',
      description: 'Integrate AETrack with your own applications',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 20
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      description: 'Share dashboards and collaborate with team members',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 15
    },
    {
      id: 'custom-branding',
      title: 'Custom Branding',
      description: 'Customize reports with your company branding',
      icon: <Sparkles className="h-5 w-5" />,
      requirement: 25
    }
  ]

  // Calculate feature progress and unlock status
  useEffect(() => {
    const updatedFeatures = availableFeatures.map(feature => {
      let currentProgress = 0
      
      switch (feature.id) {
        case 'advanced-analytics':
          currentProgress = userStats.totalQueries
          break
        case 'data-export':
          currentProgress = userStats.totalQueries
          break
        case 'scheduled-reports':
          currentProgress = userStats.totalQueries
          break
        case 'api-access':
          currentProgress = userStats.totalQueries
          break
        case 'team-collaboration':
          currentProgress = userStats.totalQueries
          break
        case 'custom-branding':
          currentProgress = userStats.totalQueries
          break
        default:
          currentProgress = 0
      }

      const isUnlocked = currentProgress >= feature.requirement
      const isVisible = currentProgress > 0 || isUnlocked

      return {
        ...feature,
        currentProgress,
        isUnlocked,
        isVisible
      }
    })

    setFeatures(updatedFeatures)
  }, [userStats])

  // Update user stats (this would typically come from your backend)
  const updateUserStats = (newStats: Partial<typeof userStats>) => {
    setUserStats(prev => ({ ...prev, ...newStats }))
  }

  return {
    features,
    userStats,
    updateUserStats
  }
} 