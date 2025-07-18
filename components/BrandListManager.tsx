'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Search,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface Brand {
  id: string
  name: string
  created_at: string
}

interface BrandList {
  id: string
  name: string
  description?: string
  created_at: string
  brands: Brand[]
}

interface BrandListManagerProps {
  onBrandListSelect: (brandListId: string, brandNames: string[]) => void
  selectedBrandListId: string | null
}

export default function BrandListManager({ onBrandListSelect, selectedBrandListId }: BrandListManagerProps) {
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchBrandLists = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data: lists, error: listsError } = await supabase
        .from('brand_lists')
        .select(`
          id,
          name,
          description,
          created_at,
          brand_list_items (
            id,
            brand_name,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (listsError) {
        console.error('Error fetching brand lists:', listsError)
        setError('Failed to load brand lists')
        return
      }

      // Transform brand_list_items to brands format for compatibility
      const transformedLists = (lists || []).map((list: any) => ({
        ...list,
        brands: (list.brand_list_items || []).map((item: { id: string; brand_name: string; created_at: string }) => ({
          id: item.id,
          name: item.brand_name,
          created_at: item.created_at
        }))
      }))

      setBrandLists(transformedLists)

      // Auto-select the first list if none is selected
      if (transformedLists && transformedLists.length > 0 && !selectedBrandListId) {
        const firstList = transformedLists[0]
        const brandNames = firstList.brands?.map((brand: { name: string }) => brand.name) || []
        onBrandListSelect(firstList.id, brandNames)
      }
    } catch (err) {
      console.error('Error in fetchBrandLists:', err)
      setError('Failed to load brand lists')
    } finally {
      setLoading(false)
    }
  }, [user, selectedBrandListId, onBrandListSelect])

  useEffect(() => {
    fetchBrandLists()
  }, [fetchBrandLists])

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return

    try {
      const { data: newList, error } = await supabase
        .from('brand_lists')
        .insert({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating brand list:', error)
        setError('Failed to create brand list')
        return
      }

      setBrandLists(prev => [newList, ...prev])
      setNewListName('')
      setNewListDescription('')
      setShowCreateForm(false)

      // Auto-select the newly created list
      onBrandListSelect(newList.id, [])
    } catch (err) {
      console.error('Error in handleCreateList:', err)
      setError('Failed to create brand list')
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this brand list? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('brand_lists')
        .delete()
        .eq('id', listId)

      if (error) {
        console.error('Error deleting brand list:', error)
        setError('Failed to delete brand list')
        return
      }

      setBrandLists(prev => prev.filter(list => list.id !== listId))

      // If the deleted list was selected, select the first available list
      if (selectedBrandListId === listId) {
        const remainingLists = brandLists.filter(list => list.id !== listId)
        if (remainingLists.length > 0) {
          const firstList = remainingLists[0]
          const brandNames = firstList.brands?.map((brand: { name: string }) => brand.name) || []
          onBrandListSelect(firstList.id, brandNames)
        } else {
          onBrandListSelect('', [])
        }
      }
    } catch (err) {
      console.error('Error in handleDeleteList:', err)
      setError('Failed to delete brand list')
    }
  }

  const handleAddBrand = async (listId: string) => {
    if (!newBrandName.trim()) return

    try {
      const { data: newBrandItem, error } = await supabase
        .from('brand_list_items')
        .insert({
          brand_name: newBrandName.trim(),
          brand_list_id: listId
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding brand:', error)
        setError('Failed to add brand')
        return
      }

      // Transform the new item to match the brands format
      const newBrand = {
        id: newBrandItem.id,
        name: newBrandItem.brand_name,
        created_at: newBrandItem.created_at
      }

      setBrandLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, brands: [...(list.brands || []), newBrand] }
          : list
      ))

      setNewBrandName('')

      // Update selected brands if this list is currently selected
      if (selectedBrandListId === listId) {
        const updatedList = brandLists.find(list => list.id === listId)
        if (updatedList) {
          const brandNames = [...(updatedList.brands || []), newBrand].map(brand => brand.name)
          onBrandListSelect(listId, brandNames)
        }
      }
    } catch (err) {
      console.error('Error in handleAddBrand:', err)
      setError('Failed to add brand')
    }
  }

  const handleDeleteBrand = async (listId: string, brandId: string) => {
    try {
      const { error } = await supabase
        .from('brand_list_items')
        .delete()
        .eq('id', brandId)

      if (error) {
        console.error('Error deleting brand:', error)
        setError('Failed to delete brand')
        return
      }

      setBrandLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, brands: (list.brands || []).filter(brand => brand.id !== brandId) }
          : list
      ))

      // Update selected brands if this list is currently selected
      if (selectedBrandListId === listId) {
        const updatedList = brandLists.find(list => list.id === listId)
        if (updatedList) {
          const brandNames = (updatedList.brands || []).filter(brand => brand.id !== brandId).map(brand => brand.name)
          onBrandListSelect(listId, brandNames)
        }
      }
    } catch (err) {
      console.error('Error in handleDeleteBrand:', err)
      setError('Failed to delete brand')
    }
  }

  const handleUpdateListName = async (listId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const { error } = await supabase
        .from('brand_lists')
        .update({ name: newName.trim() })
        .eq('id', listId)

      if (error) {
        console.error('Error updating brand list:', error)
        setError('Failed to update brand list')
        return
      }

      setBrandLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, name: newName.trim() }
          : list
      ))

      setEditingListId(null)
    } catch (err) {
      console.error('Error in handleUpdateListName:', err)
      setError('Failed to update brand list')
    }
  }

  const filteredLists = brandLists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.brands?.some(brand => brand.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading brand lists...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Brand Lists</h2>
          <p className="text-gray-600">Manage your brand lists for AI tracking</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New List
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
        <Input
          placeholder="Search brand lists or brands..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Brand List</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Name
                </label>
                <Input
                  placeholder="Enter list name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Enter description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  Create List
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Lists */}
      <div className="space-y-4">
        {filteredLists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No brand lists found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No lists match your search.' : 'Create your first brand list to start tracking.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First List
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLists.map((list) => (
            <Card 
              key={list.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedBrandListId === list.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                const brandNames = list.brands?.map(brand => brand.name) || []
                onBrandListSelect(list.id, brandNames)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedBrandListId === list.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      {editingListId === list.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="w-48"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleUpdateListName(list.id, newListName)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingListId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                      )}
                      {list.description && (
                        <CardDescription>{list.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {list.brands?.length || 0} brands
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingListId(list.id)
                          setNewListName(list.name)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteList(list.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Brands */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Brands</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add brand name"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="w-48"
                        onClick={(e) => e.stopPropagation()}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddBrand(list.id)
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddBrand(list.id)
                        }}
                        disabled={!newBrandName.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {list.brands && list.brands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {list.brands.map((brand) => (
                        <Badge
                          key={brand.id}
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <span>{brand.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBrand(list.id, brand.id)
                            }}
                            className="ml-1 text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No brands added yet. Add some brands to start tracking.</p>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {list.brands?.length || 0}
                      </div>
                      <div className="text-gray-600">Brands</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">0</div>
                      <div className="text-gray-600">Mentions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">0</div>
                      <div className="text-gray-600">Queries</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 