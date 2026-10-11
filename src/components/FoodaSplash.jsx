import React, { useEffect, useRef, useState } from 'react';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/9ad72bcd8_20260225_165100.png';

// Timeline (ms)
const RIDE_START = 450;
const RIDE_END = 2050;
const HOLD_UNTIL = 3400;
const LEAVE_MS = 450;

// Street route from the restaurant to the customer's door (rounded corners)
const ROUTE = 'M80 590 L80 470 Q80 450 100 450 L220 450 Q240 450 240 430 L240 330 Q240 310 260 310 L310 310 Q330 310 330 290 L330 238';
const START = { x: 80, y: 590 };
const END = { x: 330, y: 228 };

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const ROADS_H = [170, 310, 450, 590, 700];
const ROADS_V = [80, 170, 240, 330];
const BLOCKS = [
  [96, 186, 58, 108], [186, 186, 38, 108], [256, 186, 58, 108], [346, 186, 70, 108],
  [96, 326, 128, 108], [256, 326, 58, 108], [346, 326, 70, 108],
  [96, 466, 58, 108], [256, 466, 58, 108], [346, 466, 70, 108],
  [96, 606, 58, 78], [186, 606, 38, 78], [256, 606, 58, 78], [-10, 186, 74, 108], [-10, 326, 74, 108],
];
const PARKS = [[186, 466, 38, 108], [346, 606, 70, 78], [96, 40, 128, 114]];

/** Side-view dispatch rider with the gold Fooda box. */
function Rider() {
  return (
    <g transform="translate(-17 -18) scale(0.72)">
      {/* box */}
      <rect x="3" y="11" width="15" height="13" rx="3" fill="#F5B700" stroke="#111" strokeWidth="2" />
      <path d="M6.5 17.5c1.5 1.6 5.5 1.6 8 0" stroke="#111" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* bike */}
      <circle cx="12" cy="36" r="6" fill="none" stroke="#111" strokeWidth="3" />
      <circle cx="38" cy="36" r="6" fill="none" stroke="#111" strokeWidth="3" />
      <path d="M12 36 L19 27 H31 L38 36" fill="none" stroke="#111" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M31 27 L34 21 H38" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* rider */}
      <path d="M21 26 L25 16" stroke="#E5383B" strokeWidth="5" strokeLinecap="round" />
      <path d="M25 18 L33 21" stroke="#E5383B" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M22 26 L28 29" stroke="#111" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="26.5" cy="10" r="5.2" fill="#E5383B" />
      <path d="M28 8.5 h3.6" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/**
 * Fooda intro: a rider takes the route from the restaurant to the customer,
 * the camera follows, the door pin pulses on arrival, then the logo pops in.
 */
export default function FoodaSplash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const pathRef = useRef(null);
  const trailRef = useRef(null);
  const riderRef = useRef(null);
  const cameraRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const path = pathRef.current;
    const trail = trailRef.current;
    const rider = riderRef.current;
    const camera = cameraRef.current;
    let raf;

    if (path && trail && rider && camera) {
      const L = path.getTotalLength();
      trail.style.strokeDasharray = `${L}`;
      const place = (t) => {
        const p = path.getPointAtLength(L * t);
        rider.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
        trail.style.strokeDashoffset = `${L * (1 - t)}`;
        // gentle camera follow
        camera.setAttribute('transform', `translate(0 ${(-(p.y - 420) * 0.35).toFixed(2)})`);
      };
      if (reduce) {
        place(1);
      } else {
        place(0);
        const start = performance.now();
        const tick = (now) => {
          const e = now - start;
          const k = Math.min(1, Math.max(0, (e - RIDE_START) / (RIDE_END - RIDE_START)));
          place(easeInOut(k));
          if (e < RIDE_END + 50) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    }

    const hold = reduce ? 900 : HOLD_UNTIL;
    const t1 = setTimeout(() => setLeaving(true), hold);
    const t2 = setTimeout(() => doneRef.current?.(), hold + LEAVE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`fs-root fixed inset-0 z-[200] overflow-hidden select-none ${leaving ? 'fs-leave' : ''}`} role="img" aria-label="Fooda Naija">
      {/* Map */}
      <div className="fs-map absolute inset-0">
        <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden="true">
          <g ref={cameraRef}>
            <rect x="-200" y="-200" width="800" height="1200" className="fs-ground" />
            {PARKS.map(([x, y, w, h], i) => <rect key={`p${i}`} x={x} y={y} width={w} height={h} rx="14" className="fs-park" />)}
            {BLOCKS.map(([x, y, w, h], i) => <rect key={`b${i}`} x={x} y={y} width={w} height={h} rx="10" className="fs-block" />)}
            {ROADS_H.map(y => <line key={`h${y}`} x1="-40" y1={y} x2="440" y2={y} className="fs-road" />)}
            {ROADS_V.map(x => <line key={`v${x}`} x1={x} y1="-60" x2={x} y2="860" className="fs-road" />)}
            <line x1="-40" y1="780" x2="440" y2="560" className="fs-road fs-road-wide" />

            {/* Route preview + drawn trail */}
            <path d={ROUTE} fill="none" className="fs-route-preview" />
            <path ref={pathRef} d={ROUTE} fill="none" stroke="none" />
            <path ref={trailRef} d={ROUTE} fill="none" stroke="#F5B700" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            {/* Restaurant pin */}
            <g transform={`translate(${START.x} ${START.y})`}>
              <g className="fs-pin-drop">
                <circle r="17" fill="#E5383B" />
                <circle r="17" fill="none" stroke="#fff" strokeWidth="3" />
                <path d="M-4.5 -7 v6 a2.5 2.5 0 0 0 5 0 v-6 M-2 -7 v14 M4.5 -7 c-2.5 2 -2.5 6 0 7 v7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>

            {/* Home pin */}
            <g transform={`translate(${END.x} ${END.y})`}>
              <circle r="20" fill="none" stroke="#0B4D33" strokeWidth="2" className="fs-ripple" />
              <circle r="20" fill="none" stroke="#0B4D33" strokeWidth="1.5" className="fs-ripple fs-ripple-2" />
              <g className="fs-pin-drop fs-pin-drop-2">
                <circle r="17" fill="#0B4D33" />
                <circle r="17" fill="none" stroke="#fff" strokeWidth="3" />
                <path d="M-7 0.5 L0 -6 L7 0.5 M-5 -1 V6.5 H5 V-1" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g className="fs-check">
                <circle cx="13" cy="-13" r="8" fill="#F5B700" stroke="#fff" strokeWidth="2.5" />
                <path d="M9.5 -13 l2.4 2.4 l4.4 -4.6" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>

            {/* Rider */}
            <g ref={riderRef} transform={`translate(${START.x} ${START.y})`}>
              <g className="fs-bob">
                <ellipse cx="0" cy="25" rx="16" ry="4" className="fs-shadow" />
                <circle r="24" className="fs-badge" />
                <circle r="24" fill="none" stroke="#F5B700" strokeWidth="2.5" />
                <Rider />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Logo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <img src={LOGO} alt="Fooda Naija" className="fs-logo w-[230px] h-auto" />
        <p className="fs-tagline text-[15px] font-medium mt-2">Hot food, delivered fast</p>
      </div>
    </div>
  );
}
