import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

// Clean animated dark/light theme toggle.
// Reads/writes the `theme` localStorage key and toggles the `dark` class
// on <html> (set before first paint by the inline script in index.html).
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (e) {}
  };

  return (
    <button
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