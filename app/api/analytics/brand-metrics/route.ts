import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { 
  calculateComprehensiveAnalytics,
  createTimeRange
} from '@/lib/analytics'
import { AnalyticsDataPoint, ModelType } from '@/types/analytics'

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics API called')
    const supabase = await createClient()
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check result:', { user: !!user, error: authError })
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const brandListId = searchParams.get('brandListId')
    const timeRange = searchParams.get('timeRange') || '30d'

    if (!brandListId) {
      return NextResponse.json({ error: 'Brand list ID is required' }, { status: 400 })
    }

    // Verify user has access to this brand list
    const { data: brandList, error: brandListError } = await supabase
      .from('brand_lists')
      .select('*')
      .eq('id', brandListId)
      .eq('user_id', user.id)
      .single()

    if (brandListError || !brandList) {
      return NextResponse.json({ error: 'Brand list not found' }, { status: 404 })
    }

    // Calculate date range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const dateRange = createTimeRange(days)

    // Fetch comprehensive query data
    const { data: queries, error: queriesError } = await supabase
      .from('queries')
      .select(`
        id,
        prompt,
        created_at,
        brand_list_id,
        runs (
          id,
          model,
          raw_response,
          created_at,
          mentions (
            rank,
            brand_id,
            brands (
              name
            )
          )
        )
      `)
      .eq('brand_list_id', brandListId)
      .eq('user_id', user.id)
      .gte('created_at', dateRange.start.toISOString())
      .order('created_at', { ascending: false })

    if (queriesError) {
      console.error('Error fetching queries:', queriesError)
      return NextResponse.json({ error: 'Failed to fetch query data' }, { status: 500 })
    }

    // Get brand list items
    const { data: brandListItems, error: itemsError } = await supabase
      .from('brand_list_items')
      .select('brand_name')
      .eq('brand_list_id', brandListId)

    if (itemsError) {
      console.error('Error fetching brand list items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch brand data' }, { status: 500 })
    }

    const brandNames = brandListItems.map(item => item.brand_name)

    // Transform data to match AnalyticsDataPoint type
    const analyticsData: AnalyticsDataPoint[] = (queries || []).flatMap((query, queryIndex) => 
      query.runs?.flatMap((run, runIndex) => 
        run.mentions?.map((mention, mentionIndex) => ({
          id: `${query.id}-${run.id}-${mentionIndex}`,
          query_id: query.id,
          query_text: query.prompt,
          brand: mention.brands?.name || mention.brands?.[0]?.name || '',
          model: run.model as ModelType,
          timestamp: run.created_at,
          mentioned: true,
          first_rank: mention.rank,
          sentiment: null, // Will be calculated later
          evidence_count: 0, // Will be calculated later
          has_citation: false // Will be calculated later
        })) || []
      ) || []
    )

    // Get unique models from the data
    const models = Array.from(new Set(analyticsData.map(d => d.model))) as ModelType[]
    
    // Calculate comprehensive analytics
    const comprehensiveAnalytics = calculateComprehensiveAnalytics(
      analyticsData, 
      brandNames, 
      models, 
      dateRange
    )

    // Prepare response data
    const response = {
      success: true,
      data: {
        comprehensiveAnalytics,
        summary: {
          totalQueries: queries?.length || 0,
          totalMentions: analyticsData.length,
          totalBrands: brandNames.length,
          totalModels: models.length,
          timeRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
            days: dateRange.days
          }
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 