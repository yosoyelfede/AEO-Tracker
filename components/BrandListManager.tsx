'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash, List, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'

interface BrandList {
  id: string
  name: string
  description: string
  created_at: string
  items: BrandListItem[]
}

interface BrandListItem {
  id: string
  brand_name: string
}

interface BrandListManagerProps {
  selectedBrandListId: string | null
  onBrandListSelect: (brandListId: string | null, brandNames: string[]) => void
}

export function BrandListManager({ selectedBrandListId, onBrandListSelect }: BrandListManagerProps) {
  const { user } = useAuth()
  const [brandLists, setBrandLists] = useState<BrandList[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingDefault, setCreatingDefault] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [editingList, setEditingList] = useState<string | null>(null)
  const [newBrandName, setNewBrandName] = useState('')
  const [expandedLists, setExpandedLists] = useState<string[]>([])
  const [deletingListId, setDeletingListId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchBrandLists()
    }
  }, [user])

  // Expand only the selected list by default
  useEffect(() => {
    if (selectedBrandListId) {
      setExpandedLists([selectedBrandListId])
    }
  }, [selectedBrandListId])

  const fetchBrandLists = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('brand_lists')
      .select(`
        id,
        name,
        description,
        created_at,
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
      
      // Auto-select first list if none selected and lists exist
      if (!selectedBrandListId && lists.length > 0) {
        const firstList = lists[0]
        const brandNames = firstList.items.map(item => item.brand_name)
        onBrandListSelect(firstList.id, brandNames)
      }
      
      // If no brand lists exist, create a default one for new users
      if (lists.length === 0) {
        await createDefaultBrandList()
      }
    }
    setLoading(false)
  }

  const createDefaultBrandList = async () => {
    if (!user) return
    
    setCreatingDefault(true)
    try {
      const { data, error } = await supabase
        .from('brand_lists')
        .insert({
          user_id: user.id,
          name: 'My Brands',
          description: 'Default brand list for tracking'
        })
        .select()
        .single()

      if (!error && data) {
        // Refresh the lists after creating the default one
        fetchBrandLists()
      }
    } catch (err) {
      console.error('Error creating default brand list:', err)
    } finally {
      setCreatingDefault(false)
    }
  }

  const createBrandList = async () => {
    if (!user || !newListName.trim()) return

    const { data, error } = await supabase
      .from('brand_lists')
      .insert({
        user_id: user.id,
        name: newListName.trim(),
        description: newListDescription.trim()
      })
      .select()
      .single()

    if (!error) {
      setNewListName('')
      setNewListDescription('')
      setIsCreating(false)
      fetchBrandLists()
    }
  }

  const addBrandToList = async (brandListId: string) => {
    if (!newBrandName.trim()) return

    const { error } = await supabase
      .from('brand_list_items')
      .insert({
        brand_list_id: brandListId,
        brand_name: newBrandName.trim()
      })

    if (!error) {
      setNewBrandName('')
      setEditingList(null)
      fetchBrandLists()
    }
  }

  const removeBrandFromList = async (itemId: string) => {
    const { error } = await supabase
      .from('brand_list_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      fetchBrandLists()
    }
  }

  const toggleExpandList = (listId: string) => {
    setExpandedLists(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const deleteBrandList = async (brandListId: string) => {
    console.log('Attempting to delete brand list:', brandListId)
    setDeletingListId(brandListId)
    const { error } = await supabase
      .from('brand_lists')
      .delete()
      .eq('id', brandListId)

    if (error) {
      alert('Error deleting brand list: ' + error.message)
      console.error('Error deleting brand list:', error)
    } else {
      if (selectedBrandListId === brandListId) {
        onBrandListSelect(null, [])
      }
      setExpandedLists(prev => prev.filter(id => id !== brandListId))
      fetchBrandLists()
    }
    setDeletingListId(null)
  }

  const handleBrandListSelect = (brandList: BrandList | null) => {
    if (!brandList) {
      onBrandListSelect(null, [])
    } else {
      const brandNames = brandList.items.map(item => item.brand_name)
      onBrandListSelect(brandList.id, brandNames)
    }
  }

  const selectedList = brandLists.find(list => list.id === selectedBrandListId)

  if (loading || creatingDefault) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            {creatingDefault ? 'Creating your default brand list...' : 'Loading brand lists...'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Brand Lists
        </CardTitle>
        <CardDescription>
          Organize your brands into themed lists for focused tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Brand List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Brand List for Query
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              variant={selectedBrandListId === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleBrandListSelect(null)}
            >
              None (No tracking)
            </Button>
            {brandLists.map((list) => (
              <Button
                key={list.id}
                variant={selectedBrandListId === list.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleBrandListSelect(list)}
                className="flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {list.name} ({list.items.length})
              </Button>
            ))}
          </div>
          {selectedList && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">Currently tracking: {selectedList.name}</p>
              <p className="text-xs mt-1">
                Brands: {selectedList.items.map(item => item.brand_name).join(', ') || 'No brands added yet'}
              </p>
              {selectedList.items.length === 0 && (
                <p className="text-xs mt-2 text-blue-600">
                  💡 Add some brands to your list below to start tracking them in AI responses!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Create New List */}
        <div className="border-t pt-4">
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Brand List
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="List name (e.g., 'Santiago Restaurants' or 'Chilean Retail Stores')"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="flex gap-2">
                <Button onClick={createBrandList} size="sm">Create</Button>
                <Button onClick={() => setIsCreating(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Brand Lists */}
        {brandLists.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Your Brand Lists</h3>
            {brandLists.map((list) => {
              const isExpanded = expandedLists.includes(list.id)
              return (
                <div key={list.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpandList(list.id)}
                        className="focus:outline-none"
                        aria-label={isExpanded ? `Collapse ${list.name}` : `Expand ${list.name}`}
                      >
                        {isExpanded ? '▼' : '►'}
                      </button>
                      <h4 className="font-medium">{list.name}</h4>
                      <span className="text-xs text-gray-500">({list.items.length})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setEditingList(editingList === list.id ? null : list.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => deleteBrandList(list.id)}
                        variant="outline"
                        size="sm"
                        disabled={deletingListId === list.id}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Only show brands and add form if expanded */}
                  {isExpanded && (
                    <>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {list.items.map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {item.brand_name}
                            <button
                              onClick={() => removeBrandFromList(item.id)}
                              className="ml-1 text-xs hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {list.items.length === 0 && (
                          <span className="text-sm text-gray-500">No brands added yet</span>
                        )}
                      </div>
                      {/* Add Brand Form */}
                      {editingList === list.id && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Brand name"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && addBrandToList(list.id)}
                          />
                          <Button onClick={() => addBrandToList(list.id)} size="sm">Add</Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 