'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Layout,
  BarChart3,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react'

interface DashboardSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  visible: boolean
  order: number
}

interface DashboardCustomizationProps {
  sections: DashboardSection[]
  onSectionsChange: (sections: DashboardSection[]) => void
  onSave: () => void
  onReset: () => void
}

export function DashboardCustomization({ 
  sections, 
  onSectionsChange, 
  onSave, 
  onReset 
}: DashboardCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localSections, setLocalSections] = useState<DashboardSection[]>(sections)

  const toggleSection = (sectionId: string) => {
    const updatedSections = localSections.map(section =>
      section.id === sectionId 
        ? { ...section, visible: !section.visible }
        : section
    )
    setLocalSections(updatedSections)
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = localSections.findIndex(s => s.id === sectionId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= localSections.length) return

    const updatedSections = [...localSections]
    const [movedSection] = updatedSections.splice(currentIndex, 1)
    updatedSections.splice(newIndex, 0, movedSection)
    
    // Update order numbers
    const reorderedSections = updatedSections.map((section, index) => ({
      ...section,
      order: index
    }))
    
    setLocalSections(reorderedSections)
  }

  const handleSave = () => {
    onSectionsChange(localSections)
    onSave()
    setIsOpen(false)
  }

  const handleReset = () => {
    setLocalSections(sections)
    onReset()
  }

  const visibleSections = localSections.filter(s => s.visible)
  const hiddenSections = localSections.filter(s => !s.visible)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Customize
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 z-50 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layout className="w-5 h-5" />
              Dashboard Layout
            </CardTitle>
            <CardDescription>
              Customize which sections to show and their order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visible Sections */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Visible Sections ({visibleSections.length})
              </h4>
              <div className="space-y-2">
                {visibleSections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <div>
                        <p className="text-sm font-medium">{section.title}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === visibleSections.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection(section.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Sections */}
            {hiddenSections.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                  <EyeOff className="w-4 h-4" />
                  Hidden Sections ({hiddenSections.length})
                </h4>
                <div className="space-y-2">
                  {hiddenSections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        {section.icon}
                        <div>
                          <p className="text-sm font-medium">{section.title}</p>
                          <p className="text-xs text-gray-500">{section.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection(section.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Default dashboard sections
export const defaultDashboardSections: DashboardSection[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'Key metrics and overview',
    icon: <BarChart3 className="w-4 h-4 text-blue-600" />,
    visible: true,
    order: 0
  },
  {
    id: 'brand-performance',
    title: 'Brand Performance',
    description: 'Individual brand analytics',
    icon: <Target className="w-4 h-4 text-green-600" />,
    visible: true,
    order: 1
  },
  {
    id: 'model-insights',
    title: 'Model Insights',
    description: 'AI model comparison',
    icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
    visible: true,
    order: 2
  },
  {
    id: 'query-intelligence',
    title: 'Query Intelligence',
    description: 'Query effectiveness analysis',
    icon: <Activity className="w-4 h-4 text-orange-600" />,
    visible: true,
    order: 3
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Analysis',
    description: 'Competitor tracking',
    icon: <Target className="w-4 h-4 text-red-600" />,
    visible: false,
    order: 4
  },
  {
    id: 'trends-forecasting',
    title: 'Trends & Forecasting',
    description: 'Predictive analytics',
    icon: <TrendingUp className="w-4 h-4 text-indigo-600" />,
    visible: false,
    order: 5
  }
] 