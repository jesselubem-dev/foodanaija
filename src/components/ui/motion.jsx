import React from 'react';
import { motion } from 'framer-motion';

// Shared native motion primitives for the whole app.
// Subtle, iOS-style: gentle fade + slight rise on page changes, spring tap
// feedback on pressable elements. No bouncy / AI-style flourishes.

const EASE_NATIVE = [0.32, 0.72, 0, 1];
const SPRING = { type: 'spring', stiffness: 500, damping: 32, mass: 0.6 };

/**
 * Native page transition. Use inside <AnimatePresence mode="wait"> with a
 * stable key (e.g. location.pathname) so exit animations run between routes.
 */
export function PageTransition({ children, k, className = '' }) {
  return (
    <motion.div
      key={k}
      className={className}
      initial={{ opacity: 0, y: 8, scale: 0.996 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.998 }}
      transition={{ duration: 0.24, ease: EASE_NATIVE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tap feedback wrapper. Wraps any content with a native press scale-down.
 * Use around cards, list rows, buttons that aren't <Button>.
 */
export function Tap({ children, className = '', scale = 0.97, ...props }) {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={SPRING}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list item entrance — gives lists a native, sequential reveal.
 */
export function StaggerItem({ children, index = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EASE_NATIVE, delay: Math.min(index * 0.04, 0.24) }}
    >
      {children}
    </motion.div>
  );
}

export { SPRING, EASE_NATIVE };