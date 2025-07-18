'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'
import AdvancedCharts from '@/components/charts/AdvancedCharts'

interface BrandList {
  id: string
  name: string
  description: string
  items: { id: string; brand_name: string }[]
}

interface EnhancedAnalyticsDashboardProps {
  refreshTrigger?: number
}

export function EnhancedAnalyticsDashboard({ refreshTrigger }: EnhancedAnalyticsDashboardProps) {
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [selectedBrandListId, setSelectedBrandListId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBrandLists = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('brand_lists')
      .select(`
        id,
        name,
        description,
        brand_list_items (
          id,
          brand_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const lists = data.map(list => ({
        ...list,
        items: list.brand_list_items || []
      }))
      setBrandLists(lists)
      
      // Auto-select first list if none selected
      if (!selectedBrandListId && lists.length > 0) {
        setSelectedBrandListId(lists[0].id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBrandLists()
  }, [user, selectedBrandListId])

  useEffect(() => {
    if (refreshTrigger) {
      fetchBrandLists()
    }
  }, [refreshTrigger])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Analytics...</h3>
          <p className="text-gray-600">Please wait while we fetch your data.</p>
        </CardContent>
      </Card>
    )
  }

  if (brandLists.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Brand Lists Found</h3>
          <p className="text-gray-600">Create a brand list to start tracking analytics.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h2>
          <p className="text-gray-600">Advanced insights and performance tracking</p>
        </div>
        <Button variant="outline" onClick={fetchBrandLists}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Brand List Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Select Brand List for Analytics
          </CardTitle>
          <CardDescription>Choose which brand list to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandLists.map((list) => (
              <Card 
                key={list.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedBrandListId === list.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedBrandListId(list.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    <Badge variant="secondary">
                      {list.items.length} brands
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {list.description || 'No description'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {list.items.slice(0, 3).map((item) => (
                      <Badge key={item.id} variant="outline" className="text-xs">
                        {item.brand_name}
                      </Badge>
                    ))}
                    {list.items.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{list.items.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      {selectedBrandListId && (
        <AdvancedCharts 
          refreshTrigger={refreshTrigger || 0}
          selectedBrandListId={selectedBrandListId}
        />
      )}
    </div>
  )
} 