'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Plus, X, Building2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
  created_at: string
}

interface BrandManagerProps {
  onBrandsChange?: (brands: string[]) => void
}

export function BrandManager({ onBrandsChange }: BrandManagerProps) {
  const { user } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [newBrand, setNewBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchBrands = useCallback(async () => {
    if (!user) return // Don't fetch if no user is logged in
    
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id) // Filter by current user
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching brands:', error)
    } else {
      console.log('Fetched brands for user:', data)
      setBrands(data || [])
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchBrands()
    }
  }, [user, fetchBrands])

  useEffect(() => {
    if (onBrandsChange) {
      onBrandsChange(brands.map(b => b.name))
    }
  }, [brands, onBrandsChange])

  const addBrand = async () => {
    if (!newBrand.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name: newBrand.trim(), user_id: user.id })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setError('This brand already exists')
        } else {
          setError('Failed to add brand')
        }
      } else {
        setBrands([...brands, data])
        setNewBrand('')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const removeBrand = async (id: string) => {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (!error) {
      setBrands(brands.filter(b => b.id !== id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Your Tracked Brands</span>
        </CardTitle>
        <CardDescription>
          Add the brand names you want to track in AI responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Brand Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addBrand()}
            placeholder="Enter brand name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <Button
            onClick={addBrand}
            disabled={!newBrand.trim() || loading}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Brand
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        {/* Brand List */}
        <div className="space-y-2">
          {brands.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No brands added yet. Add your first brand above!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Badge
                  key={brand.id}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1"
                >
                  {brand.name}
                  <button
                    onClick={() => removeBrand(brand.id)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${brand.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 italic">
          Tip: These brands will be automatically detected and highlighted in AI responses
        </div>
      </CardContent>
    </Card>
  )
} 