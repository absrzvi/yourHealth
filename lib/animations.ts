import { Variants } from 'framer-motion';

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export const slideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'up') => ({
  hidden: { 
    opacity: 0,
    ...(direction === 'left' ? { x: -50 } : 
       direction === 'right' ? { x: 50 } : 
       direction === 'up' ? { y: 50 } : 
       { y: -50 })
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    ...(direction === 'left' ? { x: -50 } : 
       direction === 'right' ? { x: 50 } : 
       direction === 'up' ? { y: 50 } : 
       { y: -50 }),
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1]
    }
  }
});

export const hoverScale = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  tap: {
    scale: 0.98
  }
};

export const tapScale = {
  whileTap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};
