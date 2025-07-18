'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Edit, 
  Trash, 
  List, 
  Tag, 
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  FolderOpen,
  X,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [searchTerm, setSearchTerm] = useState('')

  const fetchBrandLists = useCallback(async () => {
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
    }
    setLoading(false)
  }, [user, selectedBrandListId])

  const createDefaultBrandList = useCallback(async () => {
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
        fetchBrandLists()
      }
    } catch (err) {
      console.error('Error creating default brand list:', err)
    } finally {
      setCreatingDefault(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchBrandLists()
    }
  }, [user, selectedBrandListId])

  useEffect(() => {
    if (!loading && brandLists.length === 0 && user && !creatingDefault) {
      createDefaultBrandList()
    }
  }, [loading, brandLists.length, user, creatingDefault, createDefaultBrandList])

  useEffect(() => {
    if (selectedBrandListId) {
      setExpandedLists([selectedBrandListId])
    }
  }, [selectedBrandListId])

  const createBrandList = async () => {
    if (!user || !newListName.trim()) return

    const { error } = await supabase
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
  const filteredLists = brandLists.filter(list => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.items.some(item => item.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalBrands = brandLists.reduce((sum, list) => sum + list.items.length, 0)

  if (loading || creatingDefault) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="py-16">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <RefreshCw className="h-10 w-10 text-slate-400 animate-spin" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {creatingDefault ? 'Setting up your brand lists...' : 'Loading brand lists...'}
              </h3>
              <p className="text-slate-600">
                {creatingDefault ? 'Creating your default brand list for tracking' : 'Fetching your brand lists'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Brand Lists</CardTitle>
              <CardDescription className="text-slate-600">
                Organize your brands into themed lists for focused AEO tracking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Lists</p>
              <p className="text-3xl font-bold text-slate-900">{brandLists.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Brands</p>
              <p className="text-3xl font-bold text-slate-900">{totalBrands}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Tag className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active List</p>
              <p className="text-lg font-bold text-slate-900">
                {selectedList ? selectedList.name : 'None'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selected Brand List */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <List className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Active Brand List</CardTitle>
              <CardDescription className="text-slate-600">
                Select which brand list to use for tracking in your queries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand List Selection */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={selectedBrandListId === null ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleBrandListSelect(null)}
                  className={`flex items-center space-x-2 ${
                    selectedBrandListId === null 
                      ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg' 
                      : 'bg-white/50 hover:bg-white border-slate-200'
                  }`}
                >
                  <X className="h-4 w-4" />
                  <span>No Tracking</span>
                </Button>
              </motion.div>
              
              {brandLists.map((list) => (
                <motion.div
                  key={list.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={selectedBrandListId === list.id ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleBrandListSelect(list)}
                    className={`flex items-center space-x-2 ${
                      selectedBrandListId === list.id 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg' 
                        : 'bg-white/50 hover:bg-white border-slate-200'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                    <span>{list.name}</span>
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                      {list.items.length}
                    </Badge>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Selected List Info */}
            {selectedList && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Currently Tracking: {selectedList.name}</h4>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  {selectedList.description || 'No description provided'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedList.items.length > 0 ? (
                    selectedList.items.map((item) => (
                      <Badge key={item.id} variant="outline" className="bg-white/80 border-blue-300 text-blue-700">
                        {item.brand_name}
                      </Badge>
                    ))
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">No brands added yet</span>
                    </div>
                  )}
                </div>
                {selectedList.items.length === 0 && (
                  <p className="text-xs mt-3 text-blue-600 bg-blue-100 p-2 rounded-lg">
                    💡 Add some brands to your list below to start tracking them in AI responses!
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New List */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  size="lg"
                  className="w-full h-16 bg-white/50 hover:bg-white border-slate-200 border-dashed"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">Create New Brand List</p>
                      <p className="text-sm text-slate-600">Organize brands into themed lists</p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200"
              >
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="List name (e.g., 'Santiago Restaurants' or 'Chilean Retail Stores')"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="bg-white/80 border-slate-200 focus:border-primary"
                  />
                  <Input
                    type="text"
                    placeholder="Description (optional)"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    className="bg-white/80 border-slate-200 focus:border-primary"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={createBrandList} 
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create List
                  </Button>
                  <Button 
                    onClick={() => setIsCreating(false)} 
                    variant="outline" 
                    size="lg"
                    className="bg-white/50 hover:bg-white border-slate-200"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Existing Brand Lists */}
      {brandLists.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Your Brand Lists</CardTitle>
                  <CardDescription className="text-slate-600">
                    Manage and organize your brand collections
                  </CardDescription>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search lists and brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200 focus:border-primary w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {filteredLists.map((list, index) => {
                const isExpanded = expandedLists.includes(list.id)
                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleExpandList(list.id)}
                          className="w-8 h-8 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg flex items-center justify-center hover:from-slate-200 hover:to-slate-300 transition-all"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-600" />
                          )}
                        </motion.button>
                        <div>
                          <h4 className="font-semibold text-slate-900">{list.name}</h4>
                          <p className="text-sm text-slate-600">{list.description || 'No description'}</p>
                        </div>
                        <Badge variant="outline" className="bg-white/80 border-slate-300">
                          {list.items.length} brands
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => setEditingList(editingList === list.id ? null : list.id)}
                            variant="outline"
                            size="sm"
                            className="bg-white/50 hover:bg-white border-slate-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => deleteBrandList(list.id)}
                            variant="outline"
                            size="sm"
                            disabled={deletingListId === list.id}
                            className="bg-white/50 hover:bg-white border-slate-200 hover:border-red-300 hover:text-red-600"
                          >
                            {deletingListId === list.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex flex-wrap gap-2">
                            {list.items.length > 0 ? (
                              list.items.map((item) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Badge
                                    variant="outline"
                                    className="bg-white/80 border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-600 transition-colors"
                                  >
                                    <span className="mr-2">{item.brand_name}</span>
                                    <button
                                      onClick={() => removeBrandFromList(item.id)}
                                      className="hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))
                            ) : (
                              <div className="flex items-center space-x-2 text-slate-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">No brands added yet</span>
                              </div>
                            )}
                          </div>

                          <AnimatePresence>
                            {editingList === list.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                              >
                                <Input
                                  type="text"
                                  placeholder="Brand name"
                                  value={newBrandName}
                                  onChange={(e) => setNewBrandName(e.target.value)}
                                  className="flex-1 bg-white/80 border-slate-200 focus:border-primary"
                                  onKeyPress={(e) => e.key === 'Enter' && addBrandToList(list.id)}
                                />
                                <Button 
                                  onClick={() => addBrandToList(list.id)} 
                                  size="sm"
                                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            
            {filteredLists.length === 0 && searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 text-slate-500"
              >
                <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No brand lists found matching "{searchTerm}"</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
} 