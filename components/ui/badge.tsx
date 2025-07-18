import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-600 text-white hover:bg-primary-700",
        secondary: "border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-200",
        destructive: "border-transparent bg-error-600 text-white hover:bg-error-700",
        outline: "border-secondary-200 bg-transparent text-secondary-700 hover:bg-secondary-50",
        success: "border-transparent bg-success-600 text-white hover:bg-success-700",
        warning: "border-transparent bg-warning-600 text-white hover:bg-warning-700",
        info: "border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200",
        ai: "border-transparent bg-gradient-to-r from-ai-chatgpt to-ai-perplexity text-white",
        gradient: "border-transparent bg-gradient-to-r from-primary-600 to-accent-600 text-white",
        ghost: "border-transparent bg-transparent text-secondary-600 hover:bg-secondary-100",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
      animation: {
        none: "",
        pulse: "animate-pulse-gentle",
        glow: "animate-glow",
        bounce: "animate-bounce-gentle",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Badge({ 
  className, 
  variant, 
  size, 
  animation, 
  leftIcon, 
  rightIcon, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, size, animation, className }))} 
      {...props}
    >
      {leftIcon && <span className="mr-1">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1">{rightIcon}</span>}
    </div>
  )
}

export { Badge, badgeVariants } 