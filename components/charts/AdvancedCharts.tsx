'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Eye, EyeOff, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

// Color schemes for charts
export const BRAND_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', 
  '#84CC16', '#F97316', '#8B5A2B', '#EC4899', '#6366F1',
  '#3B82F6', '#84CC16', '#F59E0B', '#EF4444', '#8B5CF6'
]

export const MODEL_COLORS = {
  'chatgpt': '#10B981',
  'claude': '#8B5CF6', 
  'gemini': '#F59E0B',
  'perplexity': '#06B6D4',
  'you': '#EC4899'
}

// Enhanced Time Series Chart with Trend Analysis
interface TimeSeriesChartProps {
  data: Record<string, unknown>[]
  title: string
  description?: string
  height?: number
  showTrend?: boolean
  trendData?: {
    trend: 'up' | 'down' | 'stable'
    percentage: number
  }
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  description,
  height = 400,
  showTrend = false,
  trendData
}) => {
  const [visibleSeries, setVisibleSeries] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (data.length > 0) {
      const series = Object.keys(data[0]).filter(key => key !== 'date')
      setVisibleSeries(new Set(series))
    }
  }, [data])

  const toggleSeries = (series: string) => {
    const newVisible = new Set(visibleSeries)
    if (newVisible.has(series)) {
      newVisible.delete(series)
    } else {
      newVisible.add(series)
    }
    setVisibleSeries(newVisible)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {showTrend && trendData && getTrendIcon(trendData.trend)}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            {showTrend && trendData && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={trendData.trend === 'up' ? 'default' : trendData.trend === 'down' ? 'destructive' : 'secondary'}>
                  {trendData.trend === 'up' ? '+' : trendData.trend === 'down' ? '-' : ''}{trendData.percentage.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-600">vs previous period</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.json`
              a.click()
            }}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {data.length > 0 && Object.keys(data[0])
              .filter(key => key !== 'date')
              .map((series, index) => (
                <Button
                  key={series}
                  variant={visibleSeries.has(series) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSeries(series)}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: visibleSeries.has(series) ? BRAND_COLORS[index % BRAND_COLORS.length] : undefined,
                    borderColor: BRAND_COLORS[index % BRAND_COLORS.length]
                  }}
                >
                  {visibleSeries.has(series) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {series}
                </Button>
              ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {data.length > 0 && Object.keys(data[0])
              .filter(key => key !== 'date' && visibleSeries.has(key))
              .map((series, index) => (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={series}
                  stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Distribution Chart for Ranking Analysis
interface DistributionChartProps {
  data: {
    brand: string
    rankDistribution: { rank: string; count: number }[]
  }[]
  title: string
  description?: string
  height?: number
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  title,
  description,
  height = 400
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="brand" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data[0]?.rankDistribution.map((_, index) => (
              <Bar
                key={`rank-${index}`}
                dataKey={`rankDistribution.${index}.count`}
                fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                stackId="a"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Market Share Visualization
interface MarketShareChartProps {
  data: {
    brand: string
    shareOfVoice: number
    totalMentions: number
  }[]
  title: string
  description?: string
  height?: number
}

export const MarketShareChart: React.FC<MarketShareChartProps> = ({
  data,
  title,
  description,
  height = 400
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="shareOfVoice"
              nameKey="brand"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ brand, shareOfVoice }) => `${brand}: ${shareOfVoice.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={item.brand} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                />
                <span className="font-medium">{item.brand}</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{item.shareOfVoice.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">{item.totalMentions} mentions</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Metric Info Tooltip Component
interface MetricInfoTooltipProps {
  metric: string
  explanation: string
}

const MetricInfoTooltip: React.FC<MetricInfoTooltipProps> = ({ metric, explanation }) => {
  return (
    <div className="group relative inline-block">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-semibold mb-1">{metric}</div>
        <div className="max-w-xs">{explanation}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

// Competitive Analysis Radar Chart
interface CompetitiveRadarChartProps {
  data: {
    brand: string
    mentionRate: number
    averageRank: number
    shareOfVoice: number
    topPerformerRate: number
    modelCoverage: number
  }[]
  title: string
  description?: string
  height?: number
}

export const CompetitiveRadarChart: React.FC<CompetitiveRadarChartProps> = ({
  data,
  title,
  description,
  height = 400
}) => {
  // Invert the data structure: metrics become axes, brands become data series
  const metrics = [
    { key: 'mentionRate', label: 'Mention Rate', explanation: 'Percentage of queries where this brand appears. Higher is better - shows how often the brand is mentioned across all searches.' },
    { key: 'avgRank', label: 'Avg Rank', explanation: 'Average ranking position when the brand appears. Lower is better - 1st place is best, 10th place is worst.' },
    { key: 'shareOfVoice', label: 'Share of Voice', explanation: 'Percentage of total brand mentions this brand represents. Higher is better - shows market dominance.' },
    { key: 'topPerformerRate', label: 'Top Performer Rate', explanation: 'Percentage of times this brand achieved 1st place ranking. Higher is better - shows leadership performance.' },
    { key: 'modelCoverage', label: 'Model Coverage', explanation: 'Number of AI models that mentioned this brand. Higher is better - shows broad AI recognition.' }
  ]

  // Transform data for inverted radar chart
  const radarData = metrics.map(metric => {
    const dataPoint: any = { metric: metric.label }
    data.forEach((brand, index) => {
      let value: number
      switch (metric.key) {
        case 'mentionRate':
          value = brand.mentionRate
          break
        case 'avgRank':
          value = Math.max(0, 100 - (brand.averageRank * 10)) // Invert and scale: 1st rank = 90, 10th rank = 0
          break
        case 'shareOfVoice':
          value = brand.shareOfVoice
          break
        case 'topPerformerRate':
          value = brand.topPerformerRate
          break
        case 'modelCoverage':
          value = (brand.modelCoverage / 4) * 100 // Normalize to percentage
          break
        default:
          value = 0
      }
      dataPoint[brand.brand] = value
    })
    return dataPoint
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {metrics.map((metric, index) => (
              <div key={metric.key} className="flex items-center gap-1">
                <span>{metric.label}</span>
                <MetricInfoTooltip metric={metric.label} explanation={metric.explanation} />
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {data.map((brand, index) => (
              <Radar
                key={brand.brand}
                name={brand.brand}
                dataKey={brand.brand}
                stroke={BRAND_COLORS[index % BRAND_COLORS.length]}
                fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'metric') return [name, '']
                return [value.toFixed(1), name]
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Scatter Plot for Correlation Analysis
interface ScatterPlotProps {
  data: {
    brand: string
    mentionRate: number
    averageRank: number
    shareOfVoice: number
  }[]
  title: string
  description?: string
  height?: number
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  title,
  description,
  height = 400
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="mentionRate" 
              name="Mention Rate" 
              unit="%" 
            />
            <YAxis 
              type="number" 
              dataKey="averageRank" 
              name="Average Rank" 
            />
            <ZAxis type="number" dataKey="shareOfVoice" range={[60, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name="Brands" 
              data={data} 
              fill="#8884d8"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Performance Comparison Chart
interface PerformanceComparisonChartProps {
  data: {
    brand: string
    currentPeriod: number
    previousPeriod: number
    change: number
  }[]
  title: string
  description?: string
  height?: number
  metric: string
}

export const PerformanceComparisonChart: React.FC<PerformanceComparisonChartProps> = ({
  data,
  title,
  description,
  height = 400,
  metric
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="brand" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="previousPeriod" fill="#8884d8" name={`Previous ${metric}`} />
            <Bar dataKey="currentPeriod" fill="#82ca9d" name={`Current ${metric}`} />
            <Line type="monotone" dataKey="change" stroke="#ff7300" name="Change %" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {data.map((item, index) => (
            <div key={item.brand} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                />
                <span className="font-medium">{item.brand}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Previous</div>
                  <div className="font-bold">{item.previousPeriod}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="font-bold">{item.currentPeriod}</div>
                </div>
                <Badge 
                  variant={item.change > 0 ? "default" : item.change < 0 ? "destructive" : "secondary"}
                >
                  {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Heatmap for Model Performance
interface ModelPerformanceHeatmapProps {
  data: {
    model: string
    brands: {
      brand: string
      mentions: number
      averageRank: number
    }[]
  }[]
  title: string
  description?: string
}

export const ModelPerformanceHeatmap: React.FC<ModelPerformanceHeatmapProps> = ({
  data,
  title,
  description
}) => {
  const allBrands = Array.from(new Set(data.flatMap(d => d.brands.map(b => b.brand))))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Model</th>
                {allBrands.map(brand => (
                  <th key={brand} className="text-center p-2">{brand}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(model => (
                <tr key={model.model} className="border-b">
                  <td className="p-2 font-medium">{model.model}</td>
                  {allBrands.map(brand => {
                    const brandData = model.brands.find(b => b.brand === brand)
                    const mentions = brandData?.mentions || 0
                    const avgRank = brandData?.averageRank || 0
                    
                    // Color intensity based on mentions
                    const intensity = Math.min(100, (mentions / 10) * 100)
                    const bgColor = `rgba(139, 92, 246, ${intensity / 100})`
                    
                    return (
                      <td key={brand} className="text-center p-2">
                        <div 
                          className="p-2 rounded"
                          style={{ backgroundColor: bgColor }}
                        >
                          <div className="font-bold">{mentions}</div>
                          <div className="text-xs">Rank: {avgRank.toFixed(1)}</div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 