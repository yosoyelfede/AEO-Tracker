import { Variants, easeInOut, easeOut } from 'framer-motion'

// Animation presets for consistent motion across the app
export const animationPresets = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: easeInOut }
  },

  // Card animations
  card: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.4, ease: easeOut }
  },

  // List item animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: easeOut }
  },

  // Modal animations
  modal: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: easeOut }
  },

  // Button hover effects
  button: {
    hover: { scale: 1.02, y: -1 },
    tap: { scale: 0.98 },
    transition: { duration: 0.1, ease: easeOut }
  },

  // Loading states
  loading: {
    animate: { 
      opacity: [0.5, 1, 0.5],
      scale: [0.98, 1, 0.98]
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: easeInOut 
    }
  },

  // Success/error states
  success: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      type: 'spring', 
      stiffness: 500, 
      damping: 30 
    }
  },

  error: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 25 
    }
  }
}

// Stagger animations for lists
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Chart animations
export const chartAnimations = {
  bar: {
    initial: { scaleY: 0 },
    animate: { scaleY: 1 },
    transition: { duration: 0.8, ease: easeOut }
  },
  
  line: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 1.2, ease: easeInOut }
  },
  
  pie: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { duration: 0.8, ease: easeOut }
  }
}

// Scroll-triggered animations
export const scrollAnimations = {
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: easeOut }
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: easeOut }
  },

  fadeInRight: {
    initial: { opacity: 0, x: 30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: easeOut }
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5, ease: easeOut }
  }
}

// Tab transition animations
export const tabAnimations = {
  tab: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: easeOut }
  }
}

// Utility functions for common animation patterns
export const createStaggerAnimation = (delay: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delay
    }
  }
})

export const createFadeInAnimation = (direction: 'up' | 'down' | 'left' | 'right' = 'up', distance: number = 20) => {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  }

  return {
    initial: { opacity: 0, ...directionMap[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.4, ease: easeOut }
  }
}

// Hover animations for interactive elements
export const hoverAnimations = {
  lift: {
    hover: { y: -4, scale: 1.02 },
    transition: { duration: 0.2, ease: easeOut }
  },
  
  glow: {
    hover: { 
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      scale: 1.02 
    },
    transition: { duration: 0.2, ease: easeOut }
  },
  
  pulse: {
    hover: { scale: 1.05 },
    transition: { 
      duration: 0.2, 
      ease: easeOut,
      repeat: 1,
      repeatType: 'reverse'
    }
  }
} 