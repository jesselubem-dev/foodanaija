import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollableRef = useRef(null);
  const threshold = 80;

  useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    let touchStartY = 0;
    let currentPullDistance = 0;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0 || element.scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || startY.current === 0) return;
      
      const touchY = e.touches[0].clientY;
      const pullDist = Math.max(0, touchY - startY.current);
      
      if (pullDist > 0 && (window.scrollY === 0 || element.scrollTop === 0)) {
        e.preventDefault();
        currentPullDistance = Math.min(pullDist * 0.5, threshold * 1.5);
        setPullDistance(currentPullDistance);
        setIsPulling(currentPullDistance > 20);
      }
    };

    const handleTouchEnd = async () => {
      if (currentPullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 500);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      
      startY.current = 0;
      currentPullDistance = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, threshold]);

  return (
    <div ref={scrollableRef} className="relative h-full w-full overflow-auto">
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 flex justify-center items-center z-50"
            style={{ height: pullDistance }}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
              className={`p-2 rounded-full ${
                pullDistance >= threshold ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ paddingTop: isPulling || isRefreshing ? pullDistance : 0 }}>
        {children}
      </div>
    </div>
  );
}