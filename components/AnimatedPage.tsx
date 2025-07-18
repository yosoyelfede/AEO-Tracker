import { motion, easeOut } from 'framer-motion'
import { ReactNode } from 'react'
import { animationPresets, scrollAnimations } from '@/lib/animations'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'none'
  delay?: number
}

export function AnimatedPage({ 
  children, 
  className = '', 
  animation = 'fadeInUp',
  delay = 0 
}: AnimatedPageProps) {
  if (animation === 'none') {
    return (
      <motion.div
        className={className}
        initial={animationPresets.pageTransition.initial}
        animate={animationPresets.pageTransition.animate}
        exit={animationPresets.pageTransition.exit}
        transition={{
          ...animationPresets.pageTransition.transition,
          delay
        }}
      >
        {children}
      </motion.div>
    )
  }

  const animationConfig = scrollAnimations[animation]

  return (
    <motion.div
      className={className}
      initial={animationConfig.initial}
      whileInView={animationConfig.whileInView}
      viewport={animationConfig.viewport}
      transition={{
        ...animationConfig.transition,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// Animated section component for scroll-triggered animations
interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn'
  delay?: number
  threshold?: number
}

export function AnimatedSection({ 
  children, 
  className = '', 
  animation = 'fadeInUp',
  delay = 0,
  threshold = 0.1
}: AnimatedSectionProps) {
  const animationConfig = scrollAnimations[animation]

  return (
    <motion.div
      className={className}
      initial={animationConfig.initial}
      whileInView={animationConfig.whileInView}
      viewport={{ 
        once: true, 
        margin: '-50px',
        amount: threshold
      }}
      transition={{
        ...animationConfig.transition,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// Animated card component with hover effects
interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: 'lift' | 'glow' | 'pulse' | 'none'
  delay?: number
}

export function AnimatedCard({ 
  children, 
  className = '', 
  hoverEffect = 'lift',
  delay = 0 
}: AnimatedCardProps) {
  const cardAnimation = animationPresets.card
  const hoverAnimation = hoverEffect !== 'none' 
    ? { hover: { y: -4, scale: 1.02 } }
    : {}

  return (
    <motion.div
      className={className}
      initial={cardAnimation.initial}
      animate={cardAnimation.animate}
      transition={{
        ...cardAnimation.transition,
        delay
      }}
      whileHover={hoverAnimation.hover}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Animated list container with stagger effects
interface AnimatedListProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedList({ 
  children, 
  className = '', 
  staggerDelay = 0.1 
}: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  )
}

// Animated list item component
interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedListItem({ 
  children, 
  className = '', 
  delay = 0 
}: AnimatedListItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  )
}

// Loading skeleton component with animation
interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ 
  className = '', 
  lines = 3 
}: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 rounded animate-pulse"
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

// Animated button component
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
  const buttonAnimation = animationPresets.button

  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : buttonAnimation.hover}
      whileTap={disabled ? {} : buttonAnimation.tap}
      transition={buttonAnimation.transition}
    >
      {children}
    </motion.button>
  )
} 