'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserApiKey, ApiProvider, FreeQueryStatus, ApiProviderConfig } from '@/types'
import { ArrowLeft, Home, BarChart3, User, LogOut } from 'lucide-react'

// Provider configurations
const API_PROVIDERS: ApiProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'For ChatGPT queries with web search',
    keyFormat: 'sk-...',
    documentationUrl: 'https://platform.openai.com/api-keys',
    icon: '🤖'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'For Claude queries',
    keyFormat: 'sk-ant-...',
    documentationUrl: 'https://console.anthropic.com/dashboard',
    icon: '🧠'
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'For Gemini queries',
    keyFormat: 'AIza...',
    documentationUrl: 'https://aistudio.google.com/app/apikey',
    icon: '💎'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'For Perplexity searches',
    keyFormat: 'pplx-...',
    documentationUrl: 'https://www.perplexity.ai/settings/api',
    icon: '🔍'
  }
]

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  
  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([])
  const [freeQueryStatus, setFreeQueryStatus] = useState<FreeQueryStatus | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'api-keys' | 'usage'>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    company: '',
    job_title: '',
    phone: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }
    fetchProfileData()
  }, [user, loading, router])

  const fetchProfileData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }

      setProfile(profileData)
      setProfileForm({
        full_name: profileData.full_name || '',
        company: profileData.company || '',
        job_title: profileData.job_title || '',
        phone: profileData.phone || ''
      })

      // Fetch API keys (without the actual keys)
      const { data: keysData, error: keysError } = await supabase
        .from('user_api_keys')
        .select('id, user_id, provider, key_hint, is_valid, last_validated_at, created_at, updated_at')
        .eq('user_id', user.id)

      if (keysError) {
        console.error('API keys fetch error:', keysError)
        throw keysError
      }
      setApiKeys(keysData || [])

      // Fetch usage status
      const { data: usageData, error: usageError } = await supabase
        .from('user_query_usage')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!usageError && usageData) {
        setFreeQueryStatus({
          has_free_queries: usageData.free_queries_used < 1,
          queries_used: usageData.free_queries_used,
          queries_remaining: Math.max(0, 1 - usageData.free_queries_used)
        })
      } else {
        // New user - hasn't used free query yet
        setFreeQueryStatus({
          has_free_queries: true,
          queries_used: 0,
          queries_remaining: 1
        })
      }

    } catch (error) {
      console.error('Error fetching profile data:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setMessage(null) // Clear previous messages
    
    try {
      console.log('🔄 Attempting profile update:', {
        userId: user.id,
        updates: {
          full_name: profileForm.full_name || null,
          company: profileForm.company || null,
          job_title: profileForm.job_title || null,
          phone: profileForm.phone || null
        }
      })

      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: profileForm.full_name || null,
          company: profileForm.company || null,
          job_title: profileForm.job_title || null,
          phone: profileForm.phone || null
        })
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('❌ Profile update error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ Profile update successful:', data)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      await fetchProfileData() // Refresh data
    } catch (error: any) {
      console.error('❌ Error updating profile:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      })
      
      const errorMessage = error?.message || 'Failed to update profile. Please try again.'
      setMessage({ 
        type: 'error', 
        text: `Failed to update profile: ${errorMessage}` 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const runDiagnostics = async () => {
    try {
      const response = await fetch('/api/debug')
      const result = await response.json()
      console.log('🔍 Diagnostics result:', result)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Database connection is working correctly' })
      } else {
        setMessage({ type: 'error', text: `Database issue: ${result.error}` })
      }
    } catch (error) {
      console.error('❌ Diagnostics failed:', error)
      setMessage({ type: 'error', text: 'Failed to run diagnostics' })
    }
  }

  const handleDeleteApiKey = async (provider: ApiProvider) => {
    if (!user) return
    if (!confirm(`Are you sure you want to delete your ${provider} API key?`)) return

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (error) throw error

      setMessage({ type: 'success', text: `${provider} API key deleted successfully` })
      fetchProfileData() // Refresh data
    } catch (error) {
      console.error('Error deleting API key:', error)
      setMessage({ type: 'error', text: 'Failed to delete API key' })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Navigation Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="h-6 border-l border-gray-300"></div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <Button 
              variant="outline" 
              onClick={runDiagnostics}
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>🔍</span>
              <span>Debug</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings, API keys, and usage</p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="float-right text-lg font-bold cursor-pointer hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Personal Info', icon: '👤' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'api-keys', label: 'API Keys', icon: '🔑' },
            { id: 'usage', label: 'Usage', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title</label>
                  <input
                    type="text"
                    value={profileForm.job_title}
                    onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Marketing Director"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Password</h3>
                <p className="text-gray-600 mb-4">Change your password to keep your account secure</p>
                <Button variant="outline">Change Password</Button>
                <p className="text-xs text-gray-500 mt-2">You will be redirected to reset your password via email</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Account Role</h3>
                <Badge variant="secondary">{profile?.role || 'user'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Store your API keys securely to continue using AEO Tracker after your free query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {API_PROVIDERS.map((provider) => {
                  const existingKey = apiKeys.find(k => k.provider === provider.id)
                  return <ApiKeySection key={provider.id} provider={provider} existingKey={existingKey} onDelete={handleDeleteApiKey} onUpdate={fetchProfileData} />
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'usage' && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Track your query usage and API key activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Free Queries</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Queries Used:</span>
                    <span className="font-medium">{freeQueryStatus?.queries_used || 0} / 1</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Remaining:</span>
                    <span className="font-medium">{freeQueryStatus?.queries_remaining || 0}</span>
                  </div>
                  {!freeQueryStatus?.has_free_queries && (
                    <p className="text-sm text-orange-600 mt-2">
                      You've used your free query. Add API keys to continue using the service.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">API Key Status</h3>
                <div className="space-y-2">
                  {API_PROVIDERS.map((provider) => {
                    const key = apiKeys.find(k => k.provider === provider.id)
                    return (
                      <div key={provider.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center">
                          <span className="mr-2">{provider.icon}</span>
                          <span>{provider.name}</span>
                        </div>
                        <Badge variant={key?.is_valid ? "default" : "secondary"}>
                          {key ? (key.is_valid ? 'Active' : 'Invalid') : 'Not Set'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// API Key Section Component
function ApiKeySection({ 
  provider, 
  existingKey, 
  onDelete, 
  onUpdate 
}: { 
  provider: ApiProviderConfig, 
  existingKey?: UserApiKey, 
  onDelete: (provider: ApiProvider) => void,
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const handleSave = async () => {
    if (!apiKey.trim()) return

    setIsValidating(true)
    setValidationMessage('')

    try {
      const response = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider.id,
          api_key: apiKey
        })
      })

      const data = await response.json()

      if (data.success) {
        setValidationMessage('API key saved and validated successfully!')
        setIsEditing(false)
        setApiKey('')
        onUpdate()
      } else {
        setValidationMessage(data.message || 'Failed to save API key')
      }
    } catch (error) {
      setValidationMessage('Error saving API key')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center mb-1">
            <span className="mr-2 text-lg">{provider.icon}</span>
            <h3 className="text-lg font-medium">{provider.name}</h3>
          </div>
          <p className="text-sm text-gray-600">{provider.description}</p>
          <p className="text-xs text-gray-500">Format: {provider.keyFormat}</p>
        </div>
        <div className="flex items-center space-x-2">
          {existingKey && (
            <Badge variant={existingKey.is_valid ? "default" : "destructive"}>
              {existingKey.is_valid ? 'Valid' : 'Invalid'}
            </Badge>
          )}
        </div>
      </div>

      {existingKey && !isEditing && (
        <div className="bg-gray-50 p-3 rounded mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Key: {existingKey.key_hint}</span>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete(provider.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {(!existingKey || isEditing) && (
        <div className="space-y-3">
          <div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider.name} API key`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {validationMessage && (
            <p className={`text-sm ${validationMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {validationMessage}
            </p>
          )}
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={isValidating || !apiKey.trim()}
              size="sm"
            >
              {isValidating ? 'Validating...' : 'Save Key'}
            </Button>
            {isEditing && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setApiKey('')
                  setValidationMessage('')
                }}
                size="sm"
              >
                Cancel
              </Button>
            )}
            <a 
              href={provider.documentationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              Get API Key →
            </a>
          </div>
        </div>
      )}
    </div>
  )
} 