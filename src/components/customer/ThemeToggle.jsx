import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

// Clean animated dark/light theme toggle with a Telegram-style circular
// reveal using the View Transitions API. Falls back to an instant switch
// when the API or motion is unavailable.
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle('dark', next);
      setDark(next);
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (e) {}
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsVT = typeof document.startViewTransition === 'function';

    if (!supportsVT || reduceMotion) {
      apply();
      return;
    }

    // Compute the origin point + radius for the circular reveal.
    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty('--vt-x', `${x}px`);
    document.documentElement.style.setProperty('--vt-y', `${y}px`);
    document.documentElement.style.setProperty('--vt-r', `${radius}px`);

    document.startViewTransition(() => apply());
  };

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center press-sm relative overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && dark ? (
          <motion.span
            key="moon"
            initial={{ y: 16, opacity: 0, rotate: -30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -16, opacity: 0, rotate: 30 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <Moon className="w-[18px] h-[18px] text-amber-400" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: 16, opacity: 0, rotate: 30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -16, opacity: 0, rotate: -30 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <Sun className="w-[18px] h-[18px] text-orange-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}