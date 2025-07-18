import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedWrapperProps {
  children: ReactNode
  className?: string
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'slideDown' | 'none'
  delay?: number
  duration?: number
}

export function AnimatedWrapper({ 
  children, 
  className = '', 
  animation = 'fadeIn',
  delay = 0,
  duration = 0.3
}: AnimatedWrapperProps) {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration, delay }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, delay }
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, delay }
    },
    slideLeft: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, delay }
    },
    slideRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, delay }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration, delay }
    },
    none: {
      initial: {},
      animate: {},
      transition: {}
    }
  }

  const config = animations[animation]

  return (
    <motion.div
      className={className}
      initial={config.initial}
      animate={config.animate}
      transition={config.transition}
    >
      {children}
    </motion.div>
  )
}

// Animated card with hover effects
interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Animated list item
interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function AnimatedListItem({ children, className = '', index = 0 }: AnimatedListItemProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Animated button
interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function AnimatedButton({ 
  children, 
  className = '', 
  onClick,
  disabled = false 
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.button>
  )
}

// Loading skeleton with animation
interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = '', lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 rounded"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  )
}

// Scroll-triggered animation wrapper
interface ScrollAnimatedProps {
  children: ReactNode
  className?: string
  threshold?: number
}

export function ScrollAnimated({ 
  children, 
  className = '', 
  threshold = 0.1 
}: ScrollAnimatedProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px', amount: threshold }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  )
} 