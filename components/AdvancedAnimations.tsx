import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ReactNode, useState, useEffect } from 'react'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

// Parallax scrolling component
interface ParallaxProps {
  children: ReactNode
  offset?: number
  className?: string
}

export function Parallax({ children, offset = 50, className = '' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollYProgress = useMotionValue(0)
  const y = useTransform(scrollYProgress, [0, 1], [0, offset])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateScrollProgress = () => {
      const rect = element.getBoundingClientRect()
      const scrollProgress = Math.max(0, Math.min(1, 1 - (rect.top + rect.height) / window.innerHeight))
      scrollYProgress.set(scrollProgress)
    }

    window.addEventListener('scroll', updateScrollProgress)
    updateScrollProgress()

    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [scrollYProgress])

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered list animation
interface StaggeredListProps {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn'
}

export function StaggeredList({ 
  children, 
  className = '', 
  staggerDelay = 0.1,
  animation = 'fadeIn'
}: StaggeredListProps) {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    slideLeft: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    slideRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    }
  }

  return (
    <div className={className}>
      <AnimatePresence>
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={animations[animation].initial}
            animate={animations[animation].animate}
            exit={animations[animation].exit}
            transition={{
              duration: 0.5,
              delay: index * staggerDelay,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Floating animation component
interface FloatingProps {
  children: ReactNode
  className?: string
  duration?: number
  amplitude?: number
}

export function Floating({ 
  children, 
  className = '', 
  duration = 2,
  amplitude = 10 
}: FloatingProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Magnetic hover effect
interface MagneticProps {
  children: ReactNode
  className?: string
  strength?: number
}

export function Magnetic({ 
  children, 
  className = '', 
  strength = 0.3 
}: MagneticProps) {
  const [isHovered, setIsHovered] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = event.clientX - centerX
    const distanceY = event.clientY - centerY
    
    x.set(distanceX * strength)
    y.set(distanceY * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      className={className}
      style={{
        x: springX,
        y: springY,
        scale: isHovered ? 1.05 : 1
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

// Scroll-triggered reveal animation
interface RevealProps {
  children: ReactNode
  className?: string
  threshold?: number
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn'
  delay?: number
}

export function Reveal({ 
  children, 
  className = '', 
  threshold = 0.1,
  animation = 'fadeIn',
  delay = 0
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 }
    },
    slideLeft: {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={animations[animation].initial}
      animate={isInView ? animations[animation].animate : animations[animation].initial}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  )
}

// Pulse animation for loading states
interface PulseProps {
  children: ReactNode
  className?: string
  duration?: number
}

export function Pulse({ 
  children, 
  className = '', 
  duration = 1.5 
}: PulseProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Typewriter effect
interface TypewriterProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  onComplete?: () => void
}

export function Typewriter({ 
  text, 
  className = '', 
  speed = 50,
  delay = 0,
  onComplete 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIndex(0)
      setDisplayText('')
    }, delay)

    return () => clearTimeout(timeout)
  }, [delay])

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-4 bg-current ml-1"
      />
    </span>
  )
}

// Confetti animation
interface ConfettiProps {
  isActive: boolean
  className?: string
}

export function Confetti({ isActive, className = '' }: ConfettiProps) {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
  
  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      <AnimatePresence>
        {isActive && (
          <>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors[i % colors.length],
                  left: `${Math.random() * 100}%`,
                  top: '-10px'
                }}
                initial={{
                  y: -10,
                  x: 0,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  y: window.innerHeight + 10,
                  x: Math.random() * 200 - 100,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Morphing button
interface MorphingButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export function MorphingButton({ 
  children, 
  className = '', 
  onClick,
  disabled = false,
  loading = false
}: MorphingButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <motion.div
        animate={{
          scale: isPressed ? 0.95 : 1,
          rotate: loading ? 360 : 0
        }}
        transition={{
          scale: { duration: 0.1 },
          rotate: { duration: 1, repeat: loading ? Infinity : 0 }
        }}
      >
        {children}
      </motion.div>
    </motion.button>
  )
}

// Gradient text animation
interface GradientTextProps {
  children: ReactNode
  className?: string
  colors?: string[]
  duration?: number
}

export function GradientText({ 
  children, 
  className = '', 
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
  duration = 3
}: GradientTextProps) {
  return (
    <motion.span
      className={className}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        background: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: `${colors.length * 100}% 100%`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      {children}
    </motion.span>
  )
} 