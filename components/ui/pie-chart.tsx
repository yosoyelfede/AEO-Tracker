"use client"
import React from "react"
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  category: string
  value: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  showAnimation?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  showLabel?: boolean
  labelFormatter?: (value: any, name: string) => string
  noDataText?: string
  onValueChange?: (value: any) => void
}

const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  ({
    data = [],
    category,
    value,
    colors = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#65a30d", "#ea580c", "#db2777", "#4f46e5"],
    valueFormatter = (value: number) => value.toString(),
    showAnimation = true,
    showTooltip = true,
    showLegend = true,
    showLabel = false,
    labelFormatter,
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
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabel}
            label={showLabel ? (entry) => entry[category] : undefined}
            outerRadius={120}
            fill="#8884d8"
            dataKey={value}
            onClick={(data) => onValueChange?.(data)}
            animationDuration={showAnimation ? 1000 : 0}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              formatter={(value: any, name: string) => [valueFormatter(value), name]}
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
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
})

PieChart.displayName = "PieChart"

export { PieChart, type PieChartProps } 