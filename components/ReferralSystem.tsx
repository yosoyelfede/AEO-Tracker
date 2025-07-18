'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Gift,
  Users,
  Share2,
  Copy,
  CheckCircle,
  TrendingUp,
  Award,
  Link,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/components/auth-context'
import { supabase } from '@/lib/supabase'

interface ReferralStats {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalRewards: number
  availableRewards: number
}

interface Referral {
  id: string
  referredEmail: string
  status: 'pending' | 'completed' | 'expired'
  createdAt: string
  completedAt?: string
  rewardEarned: number
}

export function ReferralSystem() {
  const { user } = useAuth()
  const [referralLink, setReferralLink] = useState('')
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalRewards: 0,
    availableRewards: 0
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      generateReferralLink()
      fetchReferralStats()
      fetchReferrals()
    }
  }, [user])

  const generateReferralLink = () => {
    if (!user) return
    
    const baseUrl = window.location.origin
    const referralCode = btoa(user.id).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
    const link = `${baseUrl}/?ref=${referralCode}`
    setReferralLink(link)
  }

  const fetchReferralStats = async () => {
    if (!user) return

    try {
      // This would typically fetch from a referrals table
      // For now, we'll use mock data
      const mockStats: ReferralStats = {
        totalReferrals: 3,
        successfulReferrals: 2,
        pendingReferrals: 1,
        totalRewards: 20,
        availableRewards: 15
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    }
  }

  const fetchReferrals = async () => {
    if (!user) return

    try {
      // This would typically fetch from a referrals table
      // For now, we'll use mock data
      const mockReferrals: Referral[] = [
        {
          id: '1',
          referredEmail: 'john@example.com',
          status: 'completed',
          createdAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-20T14:30:00Z',
          rewardEarned: 10
        },
        {
          id: '2',
          referredEmail: 'sarah@example.com',
          status: 'completed',
          createdAt: '2024-01-10T09:00:00Z',
          completedAt: '2024-01-18T16:45:00Z',
          rewardEarned: 10
        },
        {
          id: '3',
          referredEmail: 'mike@example.com',
          status: 'pending',
          createdAt: '2024-01-25T11:00:00Z',
          rewardEarned: 0
        }
      ]
      setReferrals(mockReferrals)
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AETrack - AI Visibility Tracking',
          text: 'Track your brand mentions across AI models with AETrack. Use my referral link to get started!',
          url: referralLink
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyReferralLink()
    }
  }

  const claimRewards = async () => {
    if (!user || stats.availableRewards === 0) return

    try {
      // This would typically update the user's query credits
      // For now, we'll just show a success message
      alert(`Successfully claimed ${stats.availableRewards} free queries!`)
      setStats(prev => ({ ...prev, availableRewards: 0 }))
    } catch (error) {
      console.error('Error claiming rewards:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Referral System...</h3>
          <p className="text-gray-600">Please wait while we fetch your referral data.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>
          <p className="text-gray-600">Invite friends and earn free queries</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Gift className="w-4 h-4" />
          Earn 10 free queries per referral
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulReferrals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReferrals}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRewards}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.availableRewards}</p>
              </div>
              <Gift className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends to earn free queries when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
              <code className="text-sm text-gray-700 break-all">{referralLink}</code>
            </div>
            <Button
              variant="outline"
              onClick={copyReferralLink}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={shareReferralLink}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          
          {stats.availableRewards > 0 && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  You have {stats.availableRewards} free queries to claim!
                </span>
              </div>
              <Button onClick={claimRewards} className="bg-green-600 hover:bg-green-700">
                Claim Rewards
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Referrals
          </CardTitle>
          <CardDescription>
            Track the status of your referrals and earned rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referrals Yet</h3>
              <p className="text-gray-600">Share your referral link to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {referral.referredEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referral.referredEmail}</p>
                      <p className="text-sm text-gray-500">
                        Referred on {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        referral.status === 'completed' ? 'default' :
                        referral.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {referral.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Badge>
                    {referral.rewardEarned > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Gift className="w-4 h-4" />
                        <span className="font-medium">+{referral.rewardEarned}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Share your unique referral link with friends, colleagues, or on social media
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. They Sign Up</h3>
              <p className="text-sm text-gray-600">
                When someone uses your link to create an account, they get started with AETrack
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Earn Rewards</h3>
              <p className="text-sm text-gray-600">
                You both earn 10 free queries when they complete their first query
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 