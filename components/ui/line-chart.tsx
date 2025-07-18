"use client"
import React from "react"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  startEndOnly?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
  showAnimation?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  showGridLines?: boolean
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  connectNulls?: boolean
  allowDecimals?: boolean
  noDataText?: string
  onValueChange?: (value: any) => void
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({
    data = [],
    index,
    categories,
    colors = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#65a30d", "#ea580c", "#db2777", "#4f46e5"],
    valueFormatter = (value: number) => value.toString(),
    startEndOnly = false,
    showXAxis = true,
    showYAxis = true,
    yAxisWidth = 60,
    showAnimation = true,
    showTooltip = true,
    showLegend = true,
    showGridLines = true,
    autoMinValue = true,
    minValue,
    maxValue,
    connectNulls = true,
    allowDecimals = true,
    noDataText = "No data",
    onValueChange,
    className,
    ...props
  },
  forwardedRef,
) => {
  if (data.length === 0) {
    return (
      <div
        ref={forwardedRef}
        className={cn("flex h-80 w-full items-center justify-center border border-gray-200 rounded-lg bg-white", className)}
        {...props}
      >
        <p className="text-sm text-gray-600 font-medium">{noDataText}</p>
      </div>
    )
  }

  return (
    <div
      ref={forwardedRef}
      className={cn("w-full bg-white rounded-lg border border-gray-200 p-4", className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height={400}>
        <RechartsLineChart
          data={data}
          margin={{ top: 20, right: 30, left: yAxisWidth, bottom: 20 }}
        >
          {showGridLines && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
              strokeOpacity={0.8}
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ 
                fontSize: 12, 
                fill: "#374151",
                fontWeight: 500
              }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              minTickGap={5}
            />
          )}
          {showYAxis && (
            <YAxis
              tick={{ 
                fontSize: 12, 
                fill: "#374151",
                fontWeight: 500
              }}
              axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
              tickFormatter={valueFormatter}
              width={yAxisWidth}
              allowDecimals={allowDecimals}
            />
          )}
          {showTooltip && (
            <Tooltip
              formatter={(value: any, name: string) => [valueFormatter(value), name]}
              labelFormatter={(label) => `${index}: ${label}`}
              cursor={{ strokeDasharray: "3 3", stroke: "#6b7280" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                fontSize: "12px",
                fontWeight: "500"
              }}
              labelStyle={{
                color: "#374151",
                fontWeight: "600"
              }}
            />
          )}
          {showLegend && (
            <Legend 
              wrapperStyle={{
                paddingTop: "10px",
                fontSize: "12px",
                fontWeight: "500"
              }}
            />
          )}
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{ 
                r: 5, 
                fill: colors[index % colors.length],
                stroke: "white",
                strokeWidth: 2
              }}
              activeDot={{ 
                r: 7,
                stroke: "white",
                strokeWidth: 2
              }}
              connectNulls={connectNulls}
              animationDuration={showAnimation ? 1000 : 0}
              onClick={(data) => onValueChange?.(data)}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
})

LineChart.displayName = "LineChart"

export { LineChart, type LineChartProps } 