import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

// Floating WhatsApp support button with an animated nudge popup.
const SUPPORT_PHONE = '2347078700001'; // international format, no +
const SUPPORT_MESSAGE = "Hi Fooda Naija! I need some help.";

export default function FloatingWhatsApp() {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    let timers = [];
    const cycle = () => {
      const show = setTimeout(() => setShowNudge(true), 6000);
      const hide = setTimeout(() => setShowNudge(false), 16000);
      const loop = setTimeout(cycle, 38000);
      timers = [show, hide, loop];
    };
    cycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  const href = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;

  return (
    <div className="fixed right-4 bottom-24 z-40 flex items-end gap-2">
      {/* Animated nudge bubble */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, x: 20, y: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="mb-1 relative bg-white rounded-2xl shadow-xl shadow-gray-300/40 px-4 py-3 max-w-[200px] border border-gray-100"
          >
            <button
              onClick={() => setShowNudge(false)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center press-sm"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
            <p className="text-[13px] font-bold text-gray-900 leading-tight">Need help? 💬</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Chat with us on WhatsApp for quick support.</p>
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with support on WhatsApp"
        whileTap={{ scale: 0.9 }}
        className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] shadow-lg shadow-green-600/30 press"
        animate={showNudge ? { scale: [1, 1.08, 1] } : {}}
        transition={showNudge ? { duration: 1, repeat: 2 } : {}}
      >
        <MessageCircle className="w-6 h-6 text-white" fill="white" strokeWidth={1.5} />
        {showNudge && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.a>
    </div>
  );
}