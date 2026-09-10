import React from 'react';
import { MessageCircle } from 'lucide-react';

// Floating WhatsApp support button shown across customer screens.
const SUPPORT_PHONE = '2347078700001'; // international format, no +
const SUPPORT_MESSAGE = "Hi Fooda Naija! I need some help.";

export default function FloatingWhatsApp() {
  const href = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed right-4 bottom-24 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] shadow-lg shadow-green-600/30 press"
    >
      <MessageCircle className="w-6 h-6 text-white" fill="white" strokeWidth={1.5} />
    </a>
  );
}