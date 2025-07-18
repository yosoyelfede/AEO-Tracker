import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:shadow-medium focus:ring-primary-500",
        destructive: "bg-error-600 text-white shadow-soft hover:bg-error-700 hover:shadow-medium focus:ring-error-500",
        outline: "border border-secondary-200 bg-white text-secondary-900 shadow-soft hover:bg-secondary-50 hover:border-secondary-300 focus:ring-secondary-500",
        secondary: "bg-secondary-100 text-secondary-900 shadow-soft hover:bg-secondary-200 hover:shadow-medium focus:ring-secondary-500",
        ghost: "text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:ring-secondary-500",
        link: "text-primary-600 underline-offset-4 hover:underline focus:ring-primary-500",
        gradient: "bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-soft hover:from-primary-700 hover:to-accent-700 hover:shadow-glow focus:ring-primary-500",
        success: "bg-success-600 text-white shadow-soft hover:bg-success-700 hover:shadow-medium focus:ring-success-500",
        warning: "bg-warning-600 text-white shadow-soft hover:bg-warning-700 hover:shadow-medium focus:ring-warning-500",
        ai: "bg-gradient-to-r from-ai-chatgpt to-ai-perplexity text-white shadow-soft hover:shadow-glow focus:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        bounce: "hover:animate-bounce-gentle",
        pulse: "hover:animate-pulse-gentle",
        glow: "hover:animate-glow",
        float: "hover:animate-float",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 