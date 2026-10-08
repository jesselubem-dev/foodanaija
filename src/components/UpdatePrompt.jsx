import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

// Bump this version string with each new Play Store release to re-prompt users.
const UPDATE_VERSION = '2026.10.08';
const STORAGE_KEY = `fooda_update_dismissed_${UPDATE_VERSION}`;
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.base69368f4e914ed234d96b991a.app&pcampaignid=web_share';

export default function UpdatePrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it appears after page content loads
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleUpdate = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    window.open(PLAY_STORE_URL, '_blank');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header band */}
            <div className="f-btn-gold px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-black/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-[#111111]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]/70">New Update</p>
                  <p className="text-base font-bold text-[#111111]">Fooda Naija</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#111111]/60 hover:text-[#111111] hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                A new version is available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                We've released an update with improvements and new features. Please update to the latest version on the Play Store for the best experience.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2.5">
              <button
                onClick={handleUpdate}
                className="w-full h-13 py-3.5 rounded-2xl f-btn-gold text-[14px] font-semibold uppercase tracking-wide flex items-center justify-center gap-2 press"
              >
                <Download className="w-4 h-4" />
                Update Now
              </button>
              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}