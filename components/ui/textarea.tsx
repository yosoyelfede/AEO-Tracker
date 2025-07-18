import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
  {
    variants: {
      variant: {
        default: "border-secondary-200 hover:border-secondary-300 focus:border-primary-500",
        error: "border-error-300 hover:border-error-400 focus:border-error-500 focus-visible:ring-error-500",
        success: "border-success-300 hover:border-success-400 focus:border-success-500 focus-visible:ring-success-500",
        ghost: "border-transparent bg-transparent hover:bg-secondary-50",
      },
      size: {
        default: "min-h-[80px] px-3 py-2",
        sm: "min-h-[60px] px-2 py-1 text-xs",
        lg: "min-h-[100px] px-4 py-3 text-base",
        xl: "min-h-[120px] px-6 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, leftIcon, rightIcon, loading, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-3 text-secondary-400">
            {leftIcon}
          </div>
        )}
        <textarea
          className={cn(
            textareaVariants({ variant, size, className }),
            leftIcon && "pl-10",
            (rightIcon || loading) && "pr-10"
          )}
          ref={ref}
          {...props}
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <svg
              className="h-4 w-4 animate-spin text-secondary-400"
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
          </div>
        )}
        {!loading && rightIcon && (
          <div className="absolute right-3 top-3 text-secondary-400">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants } 