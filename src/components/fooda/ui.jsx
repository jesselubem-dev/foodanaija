// Fooda shared UI building blocks for customer screens.
// Keep page headers, empty states, chips and loaders consistent everywhere.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { createPageUrl } from '../../utils';

/**
 * Centred page title with a round back button.
 * `backTo` = page name to go to; omit to go back in history (falls back to home).
 */
export function PageHeader({ title, backTo, right, sticky = true }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('CustomerHome'));
  };
  const backClass = 'absolute left-0 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center press';

  return (
    <div className={`bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 ${sticky ? 'sticky top-0 z-30' : ''}`}>
      <div className="max-w-lg mx-auto relative flex items-center justify-center h-10">
        {backTo ? (
          <Link to={createPageUrl(backTo)} aria-label="Back" className={backClass}>
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </Link>
        ) : (
          <button type="button" onClick={goBack} aria-label="Back" className={backClass}>
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
        )}
        <h1 className="text-[17px] font-semibold text-gray-900 truncate max-w-[60%]">{title}</h1>
        {right && <div className="absolute right-0">{right}</div>}
      </div>
    </div>
  );
}

/** Left-aligned large title used on bottom-tab pages (Orders, Profile). */
export function TabPageTitle({ title, subtitle, children }) {
  return (
    <div className="bg-white px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-2 sticky top-0 z-30">
      <div className="max-w-lg mx-auto">
        <h1 className="text-[20px] font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/** Gold-circle icon, title, message and an optional gold action button. */
export function EmptyState({ icon: Icon, title, message, actionLabel, actionTo, onAction, className = 'py-20' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="w-20 h-20 rounded-full f-tint-gold flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 f-text-gold" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      {message && <p className="text-sm text-gray-500 mb-6 max-w-[280px]">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={createPageUrl(actionTo)} className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center f-btn-gold press">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="h-11 px-6 rounded-xl text-sm font-semibold f-btn-gold press">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Row of filter chips. options: [{ id, label }] */
export function ChipGroup({ options, value, onChange, wrap = false, className = '' }) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'} ${className}`}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`f-chip flex-shrink-0 ${value === o.id ? 'f-chip-active' : ''}`}
          aria-pressed={value === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Small gold spinner for loading screens. */
export function Spinner({ fullScreen = false }) {
  const s = <div className="w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full animate-spin" />;
  return fullScreen ? <div className="min-h-screen bg-white flex items-center justify-center">{s}</div> : s;
}

/** Full-width gold action bar fixed to the bottom of the screen. */
export function BottomActionBar({ children }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto">{children}</div>
    </div>
  );
}
