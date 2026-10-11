import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';

// Landscape street map for the order card (viewBox 390 × 210)
const ROUTE = 'M40 170 L40 120 Q40 100 60 100 L180 100 Q200 100 200 80 L200 50 Q200 30 220 30 L326 30';
const START = { x: 40, y: 170 };
const END = { x: 358, y: 30 };
const ROADS_H = [30, 100, 170];
const ROADS_V = [40, 120, 200, 280, 358];
const BLOCKS = [
  [52, 42, 56, 46], [132, 42, 56, 46], [212, 42, 56, 46], [292, 42, 54, 46],
  [52, 112, 56, 46], [212, 112, 56, 46], [292, 112, 54, 46], [370, 112, 40, 46],
  [52, 182, 56, 40], [132, 182, 56, 40], [292, 182, 54, 40], [-10, 42, 38, 46], [-10, 112, 38, 46], [370, 42, 40, 46],
];
const PARKS = [[132, 112, 56, 46], [212, 182, 56, 40], [-10, 182, 38, 40]];

const DEFAULT_MINUTES = 40;

/** "30-45 mins" → 45, "45 mins" → 45 */
export function parseDeliveryMinutes(text) {
  const nums = String(text || '').match(/\d+/g);
  if (!nums) return DEFAULT_MINUTES;
  return Math.max(...nums.map(Number)) || DEFAULT_MINUTES;
}

// Where the rider can be for each delivery stage (share of the route)
const STAGE_RANGE = {
  unassigned: [0.02, 0.4],
  assigned: [0.04, 0.45],
  picked_up: [0.45, 0.75],
  on_the_way: [0.55, 0.96],
  delivered: [1, 1],
};

const STAGE_TEXT = {
  unassigned: 'Restaurant is preparing your food',
  assigned: 'Rider heading to restaurant',
  picked_up: 'Rider has your food',
  on_the_way: 'Your food is on the way',
  delivered: 'Enjoy your meal!',
};

/**
 * Live map of the delivery. The rider starts moving the moment the
 * restaurant accepts, follows the clock towards the ETA, and is kept
 * within the stage the rider has reported (picked up / on the way).
 */
export default function LiveDeliveryMap({ order, totalMinutes = DEFAULT_MINUTES }) {
  const [now, setNow] = useState(() => Date.now());
  const pathRef = useRef(null);
  const trailRef = useRef(null);
  const riderRef = useRef(null);
  const currentRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const delivered = order.status === 'delivered' || order.delivery_status === 'delivered';
  const stage = delivered ? 'delivered' : order.delivery_status || 'unassigned';
  const startedAt = useMemo(
    () => new Date(order.restaurant_accepted_at || order.accepted_at || order.updated_date || order.created_date).getTime(),
    [order.restaurant_accepted_at, order.accepted_at, order.updated_date, order.created_date]
  );
  const total = Math.max(5, totalMinutes);
  const elapsedMin = Math.max(0, (now - startedAt) / 60000);
  const [lo, hi] = STAGE_RANGE[stage] || STAGE_RANGE.unassigned;
  const progress = delivered ? 1 : Math.min(hi, Math.max(lo, elapsedMin / total));
  const minutesLeft = delivered ? 0 : Math.max(0, Math.ceil(total - elapsedMin));
  const arriveAt = new Date(startedAt + total * 60000);
  const arriveText = arriveAt.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

  const address = String(order.delivery_address || '').trim();
  const restaurant = String(order.restaurant_name || '').trim();
  const stageText = stage === 'assigned' && restaurant
    ? `Rider heading to ${restaurant}`
    : stage === 'on_the_way' && address
      ? 'Rider heading to you'
      : STAGE_TEXT[stage];

  targetRef.current = progress;

  // Smoothly glide the rider towards where it should be
  useEffect(() => {
    const path = pathRef.current;
    const trail = trailRef.current;
    const rider = riderRef.current;
    if (!path || !trail || !rider) return;
    const L = path.getTotalLength();
    trail.style.strokeDasharray = `${L}`;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf;
    const tick = () => {
      const cur = currentRef.current;
      const next = reduce ? targetRef.current : cur + (targetRef.current - cur) * 0.05;
      currentRef.current = Math.abs(targetRef.current - next) < 0.0005 ? targetRef.current : next;
      const p = path.getPointAtLength(L * currentRef.current);
      rider.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      trail.style.strokeDashoffset = `${L * (1 - currentRef.current)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100 fs-root">
      <svg viewBox="0 0 390 210" preserveAspectRatio="xMidYMid slice" className="w-full h-[190px] block" aria-label="Live delivery map">
        <rect x="-50" y="-50" width="500" height="320" className="fs-ground" />
        {PARKS.map(([x, y, w, h], i) => <rect key={`p${i}`} x={x} y={y} width={w} height={h} rx="10" className="fs-park" />)}
        {BLOCKS.map(([x, y, w, h], i) => <rect key={`b${i}`} x={x} y={y} width={w} height={h} rx="8" className="fs-block" />)}
        {ROADS_H.map(y => <line key={`h${y}`} x1="-20" y1={y} x2="410" y2={y} className="fs-road" style={{ strokeWidth: 14 }} />)}
        {ROADS_V.map(x => <line key={`v${x}`} x1={x} y1="-20" x2={x} y2="230" className="fs-road" style={{ strokeWidth: 14 }} />)}

        <path d={ROUTE} fill="none" className="fs-route-preview" />
        <path ref={pathRef} d={ROUTE} fill="none" stroke="none" />
        <path ref={trailRef} d={ROUTE} fill="none" stroke="#F5B700" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Restaurant */}
        <g transform={`translate(${START.x} ${START.y})`}>
          <circle r="13" fill="#E5383B" stroke="#fff" strokeWidth="2.5" />
          <path d="M-3.5 -5.5 v4.5 a2 2 0 0 0 4 0 v-4.5 M-1.5 -5.5 v11 M3.5 -5.5 c-2 1.6 -2 4.7 0 5.5 v5.5" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Home */}
        <g transform={`translate(${END.x} ${END.y})`}>
          {!delivered && <circle r="14" fill="none" stroke="#0B4D33" strokeWidth="1.5" className="ld-ping" />}
          <circle r="13" fill="#0B4D33" stroke="#fff" strokeWidth="2.5" />
          <path d="M-5.5 0.5 L0 -4.8 L5.5 0.5 M-4 -0.8 V5 H4 V-0.8" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Rider */}
        <g ref={riderRef} transform={`translate(${START.x} ${START.y})`}>
          <g className={delivered ? '' : 'fs-bob'}>
            <ellipse cx="0" cy="19" rx="12" ry="3" className="fs-shadow" />
            <circle r="18" className="fs-badge" />
            <circle r="18" fill="none" stroke="#F5B700" strokeWidth="2.2" />
            <g transform="translate(-12.6 -13.2) scale(0.53)">
              <rect x="3" y="11" width="15" height="13" rx="3" fill="#F5B700" stroke="#111" strokeWidth="2" />
              <circle cx="12" cy="36" r="6" fill="none" stroke="#111" strokeWidth="3" />
              <circle cx="38" cy="36" r="6" fill="none" stroke="#111" strokeWidth="3" />
              <path d="M12 36 L19 27 H31 L38 36" fill="none" stroke="#111" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M31 27 L34 21 H38" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M21 26 L25 16" stroke="#E5383B" strokeWidth="5" strokeLinecap="round" />
              <path d="M25 18 L33 21" stroke="#E5383B" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="26.5" cy="10" r="5.2" fill="#E5383B" />
            </g>
          </g>
        </g>
      </svg>

      {/* Delivery address tag at the home pin */}
      {address && (
        <div className="absolute top-[46px] right-2 max-w-[62%] pointer-events-none flex flex-col items-end">
          <span className="w-2 h-2 rotate-45 -mb-1 mr-[14px] f-float" />
          <div className="rounded-lg pl-2 pr-2.5 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.12)] f-float min-w-0 max-w-full">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#0B4D33] dark:text-[#4ADE80] leading-none">{delivered ? 'Delivered to' : 'Delivering to'}</p>
            <p className="text-[11.5px] font-semibold leading-tight mt-1 line-clamp-2 break-words">{address}</p>
          </div>
        </div>
      )}

      {/* ETA card */}
      <div className="absolute left-2.5 bottom-2.5 right-2.5 flex items-end justify-between gap-2 pointer-events-none">
        <div className="rounded-xl px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.12)] f-float">
          {delivered ? (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-fooda-gold flex items-center justify-center"><Check className="w-3 h-3 text-[#111]" strokeWidth={3} /></span>
              <p className="text-[15px] font-bold">Delivered</p>
            </div>
          ) : minutesLeft > 1 ? (
            <>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280]">Arriving in</p>
              <p className="text-[20px] font-bold leading-none mt-0.5 tabular-nums">{minutesLeft} <span className="text-[13px] font-semibold">min</span></p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">by {arriveText}</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280]">Almost there</p>
              <p className="text-[15px] font-bold leading-tight mt-0.5">Arriving any minute</p>
            </>
          )}
        </div>
        <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.12)] f-float flex items-center gap-1.5 max-w-[55%]">
          {!delivered && <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] ld-live flex-shrink-0" />}
          <span className="truncate">{stageText}</span>
        </div>
      </div>
    </div>
  );
}
