import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, Check, ChevronDown, X, Loader2 } from 'lucide-react';
import {
  SERVICE_CITY, SERVICE_CENTER, SOKOTO_AREAS, distanceKm, isInServiceArea,
  getSavedLocation, saveLocation, clearLocation, getDevicePosition,
} from '@/lib/sokotoLocation';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png';

/** Live copy of the saved location; updates when it changes anywhere in the app. */
export function useSavedLocation() {
  const [loc, setLoc] = useState(() => getSavedLocation());
  useEffect(() => {
    const sync = () => setLoc(getSavedLocation());
    window.addEventListener('fooda-location', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('fooda-location', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return loc;
}

/**
 * Wraps customer screens. Only people whose phone is in Sokoto get through.
 * `bypass` lets admins in from anywhere (for testing and support).
 */
export default function LocationGate({ children, bypass = false }) {
  const saved = useSavedLocation();
  const [step, setStep] = useState('intro'); // intro | checking | outside | denied | unavailable | area
  const [coords, setCoords] = useState(null);

  // Quietly re-check people already let in, if location permission is already on
  useEffect(() => {
    if (!saved || bypass) return;
    let cancelled = false;
    (async () => {
      try {
        const perm = await navigator.permissions?.query({ name: 'geolocation' });
        if (perm?.state !== 'granted') return;
        const pos = await getDevicePosition();
        if (!cancelled && !isInServiceArea(pos)) {
          clearLocation();
          setCoords(pos);
          setStep('outside');
        }
      } catch { /* keep the saved location */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypass]);

  if (bypass || saved) return children;

  const detect = async () => {
    setStep('checking');
    try {
      const pos = await getDevicePosition();
      setCoords(pos);
      setStep(isInServiceArea(pos) ? 'area' : 'outside');
    } catch (e) {
      setStep(e?.code === 'denied' ? 'denied' : 'unavailable');
    }
  };

  const chooseArea = (area) => {
    saveLocation({ area, city: SERVICE_CITY, lat: coords?.lat, lng: coords?.lng, verified_at: Date.now() });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="pt-[calc(1rem+var(--sat))] px-5 flex justify-center">
        <img src={LOGO} alt="Fooda Naija" className="h-9 w-auto object-contain" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'area' ? (
          <motion.div key="area" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="px-5 pt-6 max-w-lg mx-auto w-full">
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#0B4D33]/10 text-[#0B4D33] dark:text-[#4ADE80] text-[12px] font-semibold">
                <Check className="w-3.5 h-3.5" strokeWidth={3} /> You're in {SERVICE_CITY}
              </span>
              <h1 className="text-[22px] font-semibold text-gray-900 mt-3 leading-snug">Which area should we deliver to?</h1>
              <p className="text-[14px] text-gray-500 mt-1">You can change this any time from the home screen.</p>
            </div>
            <AreaList onPick={chooseArea} />
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-center max-w-sm mx-auto w-full">
            <PinIllustration state={step} />
            <GateCopy step={step} coords={coords} />
            <div className="w-full mt-7 space-y-2.5">
              <button
                type="button"
                onClick={detect}
                disabled={step === 'checking'}
                className="w-full h-12 rounded-xl f-btn-gold font-semibold text-[15px] flex items-center justify-center gap-2 press"
              >
                {step === 'checking'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking your location…</>
                  : <><Navigation className="w-4 h-4" /> {step === 'intro' ? 'Use my location' : 'Try again'}</>}
              </button>
              <p className="text-[12px] text-gray-500">We only use your location to confirm you're within our delivery area.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GateCopy({ step, coords }) {
  if (step === 'outside') {
    const km = coords ? Math.round(distanceKm(coords, SERVICE_CENTER)) : null;
    return (
      <>
        <h1 className="text-[22px] font-semibold text-gray-900 mt-6 leading-snug">We're not in your area yet</h1>
        <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
          Fooda Naija currently delivers in {SERVICE_CITY} only{km ? ` — you're about ${km} km away` : ''}. We're expanding soon, so check back later.
        </p>
      </>
    );
  }
  if (step === 'denied') {
    return (
      <>
        <h1 className="text-[22px] font-semibold text-gray-900 mt-6 leading-snug">Turn on location</h1>
        <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
          Location access is blocked. Open your browser or phone settings, allow location for Fooda Naija, then tap Try again.
        </p>
      </>
    );
  }
  if (step === 'unavailable') {
    return (
      <>
        <h1 className="text-[22px] font-semibold text-gray-900 mt-6 leading-snug">Couldn't find you</h1>
        <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
          Make sure location (GPS) is switched on and you have a signal, then try again.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-[22px] font-semibold text-gray-900 mt-6 leading-snug">Find great food near you</h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
        Fooda Naija delivers across {SERVICE_CITY}. Share your location so we can confirm you're in our delivery area.
      </p>
    </>
  );
}

function PinIllustration({ state }) {
  const bad = state === 'outside' || state === 'denied' || state === 'unavailable';
  const color = bad ? '#E5383B' : '#0B4D33';
  return (
    <div className="relative w-40 h-40">
      {/* soft street grid */}
      <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full">
        <defs>
          <clipPath id="lg-clip"><circle cx="80" cy="80" r="78" /></clipPath>
        </defs>
        <g clipPath="url(#lg-clip)">
          <rect width="160" height="160" className="fs-ground" />
          {[30, 80, 130].map(v => <line key={`h${v}`} x1="0" y1={v} x2="160" y2={v} className="fs-road" style={{ strokeWidth: 10 }} />)}
          {[40, 100].map(v => <line key={`v${v}`} x1={v} y1="0" x2={v} y2="160" className="fs-road" style={{ strokeWidth: 10 }} />)}
          <rect x="48" y="38" width="44" height="34" rx="6" className="fs-park" />
          <rect x="108" y="88" width="44" height="34" rx="6" className="fs-block" />
          <rect x="0" y="88" width="32" height="34" rx="6" className="fs-block" />
        </g>
      </svg>
      {!bad && (
        <>
          <span className="absolute left-1/2 top-[58%] -translate-x-1/2 w-16 h-16 -mt-8 rounded-full border-2 lg-ripple" style={{ borderColor: color }} />
          <span className="absolute left-1/2 top-[58%] -translate-x-1/2 w-16 h-16 -mt-8 rounded-full border-2 lg-ripple lg-ripple-2" style={{ borderColor: color }} />
        </>
      )}
      <motion.div
        className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-full"
        initial={{ y: -30, opacity: 0 }}
        animate={state === 'checking' ? { y: [0, -8, 0], opacity: 1 } : { y: 0, opacity: 1 }}
        transition={state === 'checking' ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 260, damping: 16 }}
      >
        <svg width="44" height="54" viewBox="0 0 44 54" className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]">
          <path d="M22 52C22 52 40 33 40 20A18 18 0 1 0 4 20c0 13 18 32 18 32Z" fill={color} stroke="#fff" strokeWidth="3" />
          {bad
            ? <path d="M16 14 L28 26 M28 14 L16 26" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
            : <circle cx="22" cy="20" r="6.5" fill="#F5B700" />}
        </svg>
      </motion.div>
    </div>
  );
}

function AreaList({ onPick, current }) {
  const [q, setQ] = useState('');
  const areas = useMemo(
    () => SOKOTO_AREAS.filter(a => a.toLowerCase().includes(q.trim().toLowerCase())).sort(),
    [q]
  );
  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full min-h-0">
      <div className="px-5 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your area"
            className="w-full pl-10 pr-3 h-12 rounded-[14px] border border-gray-200 bg-white text-[14px] text-gray-900 outline-none focus:ring-1 focus:ring-fooda-gold"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {areas.map(area => (
          <button
            key={area}
            type="button"
            onClick={() => onPick(area)}
            className="w-full flex items-center gap-3 py-3.5 border-b border-gray-100 text-left press"
          >
            <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-fooda-red" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-gray-900 truncate">{area}</span>
              <span className="block text-[12px] text-gray-500">{SERVICE_CITY}</span>
            </span>
            {current === area && <Check className="w-4 h-4 text-[#0B4D33] dark:text-[#4ADE80]" strokeWidth={3} />}
          </button>
        ))}
        {areas.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-[14px] text-gray-500">No area matches "{q}".</p>
            <button type="button" onClick={() => onPick(q.trim())} className="mt-3 text-[14px] font-semibold text-fooda-red">
              Use "{q.trim()}" anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** "Deliver to · Arkilla ▾" button for the home header, opens the area picker. */
export function LocationChip() {
  const loc = useSavedLocation();
  const [open, setOpen] = useState(false);
  if (!loc) return null;
  const pick = (area) => {
    saveLocation({ ...loc, area });
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 min-w-0 press text-left">
        <MapPin className="w-4 h-4 text-fooda-red flex-shrink-0" />
        <span className="text-[12px] text-gray-500 flex-shrink-0">Deliver to</span>
        <span className="text-[13px] font-semibold text-gray-900 truncate">{loc.area}, {loc.city || SERVICE_CITY}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              className="relative bg-white rounded-t-[22px] h-[78vh] flex flex-col"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between px-5 pt-4">
                <h2 className="text-[17px] font-semibold text-gray-900">Choose delivery area</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center press">
                  <X className="w-4 h-4 text-gray-900" />
                </button>
              </div>
              <AreaList onPick={pick} current={loc.area} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
