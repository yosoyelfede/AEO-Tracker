import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, ExternalLink, Eye, EyeOff, Settings, Download, Link, Users, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedWrapper, AnimatedCard } from '@/components/AnimatedWrapper'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-context'

interface ShareableDashboardProps {
  analyticsData: any
  onClose: () => void
}

interface DashboardShare {
  id: string
  title: string
  description: string
  isPublic: boolean
  shareUrl: string
  createdAt: string
  viewCount: number
  expiresAt?: string
}

export function ShareableDashboard({ analyticsData, onClose }: ShareableDashboardProps) {
  const { user } = useAuth()
  const [shares, setShares] = useState<DashboardShare[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newShare, setNewShare] = useState({
    title: '',
    description: '',
    isPublic: true,
    expiresInDays: 30
  })
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchShares()
  }, [])

  const fetchShares = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('dashboard_shares')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setShares(data.map((share: any) => ({
        id: share.id,
        title: share.title,
        description: share.description,
        isPublic: share.is_public,
        shareUrl: `${window.location.origin}/share/${share.id}`,
        createdAt: share.created_at,
        viewCount: share.view_count || 0,
        expiresAt: share.expires_at
      })))
    }
  }

  const createShare = async () => {
    if (!user || !newShare.title.trim()) return

    setIsCreating(true)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newShare.expiresInDays)

      const { data, error } = await supabase
        .from('dashboard_shares')
        .insert({
          user_id: user.id,
          title: newShare.title,
          description: newShare.description,
          is_public: newShare.isPublic,
          expires_at: expiresAt.toISOString(),
          analytics_data: analyticsData
        })
        .select()
        .single()

      if (!error && data) {
        const shareUrl = `${window.location.origin}/share/${data.id}`
        setShares(prev => [{
          id: data.id,
          title: data.title,
          description: data.description,
          isPublic: data.is_public,
          shareUrl,
          createdAt: data.created_at,
          viewCount: 0,
          expiresAt: data.expires_at
        }, ...prev])

        setNewShare({
          title: '',
          description: '',
          isPublic: true,
          expiresInDays: 30
        })
      }
    } catch (error) {
      console.error('Error creating share:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const deleteShare = async (shareId: string) => {
    const { error } = await supabase
      .from('dashboard_shares')
      .delete()
      .eq('id', shareId)

    if (!error) {
      setShares(prev => prev.filter(share => share.id !== shareId))
    }
  }

  const toggleShareVisibility = async (shareId: string, isPublic: boolean) => {
    const { error } = await supabase
      .from('dashboard_shares')
      .update({ is_public: !isPublic })
      .eq('id', shareId)

    if (!error) {
      setShares(prev => prev.map(share => 
        share.id === shareId 
          ? { ...share, isPublic: !isPublic }
          : share
      ))
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Share Dashboard</h2>
                <p className="text-sm text-gray-500">Create public links to share your analytics</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Create New Share */}
            <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
              <AnimatedWrapper animation="slideRight" delay={0.1}>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Link className="h-5 w-5" />
                      <span>Create New Share</span>
                    </CardTitle>
                    <CardDescription>
                      Generate a public link to share your dashboard analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dashboard Title
                      </label>
                      <input
                        type="text"
                        value={newShare.title}
                        onChange={(e) => setNewShare(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Q1 Brand Performance Report"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newShare.description}
                        onChange={(e) => setNewShare(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of what this dashboard shows..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newShare.isPublic}
                          onChange={(e) => setNewShare(prev => ({ ...prev, isPublic: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Public access</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires in (days)
                      </label>
                      <select
                        value={newShare.expiresInDays}
                        onChange={(e) => setNewShare(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                        <option value={365}>1 year</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>

                    <Button
                      onClick={createShare}
                      disabled={isCreating || !newShare.title.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {isCreating ? 'Creating...' : 'Create Share Link'}
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedWrapper>
            </div>

            {/* Right Panel - Existing Shares */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <AnimatedWrapper animation="slideLeft" delay={0.2}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Your Shared Dashboards</h3>
                  <span className="text-sm text-gray-500">{shares.length} total</span>
                </div>

                <div className="space-y-4">
                  {shares.map((share, index) => (
                    <AnimatedCard key={share.id} delay={index * 0.1}>
                      <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900">{share.title}</h4>
                                <div className="flex items-center space-x-1">
                                  {share.isPublic ? (
                                    <Eye className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {share.viewCount} views
                                  </span>
                                </div>
                              </div>
                              
                              {share.description && (
                                <p className="text-sm text-gray-600 mb-3">{share.description}</p>
                              )}

                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>Created {new Date(share.createdAt).toLocaleDateString()}</span>
                                {share.expiresAt && (
                                  <span>• Expires {new Date(share.expiresAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(share.shareUrl)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {copiedUrl === share.shareUrl ? (
                                  <span className="text-green-500">Copied!</span>
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(share.shareUrl, '_blank')}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShareVisibility(share.id, share.isPublic)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {share.isPublic ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteShare(share.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  ))}

                  {shares.length === 0 && (
                    <AnimatedWrapper animation="fadeIn" delay={0.3}>
                      <div className="text-center py-12">
                        <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No shared dashboards yet</h3>
                        <p className="text-gray-500">Create your first share to start sharing your analytics</p>
                      </div>
                    </AnimatedWrapper>
                  )}
                </div>
              </AnimatedWrapper>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 