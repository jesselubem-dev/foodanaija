import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69368f4e914ed234d96b991a/d631c2743_db683a19d_1765440879235-removebg-preview.png';

/** Only allow redirects back into this app. */
function safeNext() {
  const n = new URLSearchParams(window.location.search).get('next') || '/CustomerHome';
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/Login') ? n : '/CustomerHome';
}

function errorText(err, fallback) {
  const d = err?.response?.data || err?.data;
  return d?.detail || d?.message || err?.message || fallback;
}

export default function Login() {
  const initialMode = new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode); // login | signup | verify | forgot | sent
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Gold strip behind the phone's clock while on this screen
  useEffect(() => {
    document.documentElement.classList.add('gold-top');
    return () => document.documentElement.classList.remove('gold-top');
  }, []);

  // Already signed in? Go straight in.
  useEffect(() => {
    if (base44.auth.hasToken?.()) {
      base44.auth.isAuthenticated().then(ok => { if (ok) window.location.replace(safeNext()); }).catch(() => {});
    }
  }, []);

  const go = (m) => { setError(''); setMode(m); };

  const finishLogin = async () => {
    await base44.auth.loginViaEmailPassword(email.trim(), password);
    if (name.trim()) {
      try { await base44.auth.updateMe({ full_name: name.trim() }); } catch { /* name can be set later */ }
    }
    window.location.replace(safeNext());
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await finishLogin();
    } catch (err) {
      const msg = errorText(err, 'Could not log in. Please try again.');
      if (/verif/i.test(msg)) {
        try { await base44.auth.resendOtp(email.trim()); } catch { /* ignore */ }
        go('verify');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    setBusy(true); setError('');
    try {
      await base44.auth.register({ email: email.trim(), password });
      go('verify');
    } catch (err) {
      setError(errorText(err, 'Could not create your account. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (code) => {
    setBusy(true); setError('');
    try {
      await base44.auth.verifyOtp({ email: email.trim(), otpCode: code });
      await finishLogin();
    } catch (err) {
      setError(errorText(err, 'That code didn\'t work. Check it and try again.'));
      setBusy(false);
    }
  };

  const onForgot = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await base44.auth.resetPasswordRequest(email.trim());
      go('sent');
    } catch (err) {
      setError(errorText(err, 'Could not send the reset link. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const google = () => base44.auth.loginWithProvider('google', safeNext());

  const compactHero = mode === 'verify' || mode === 'forgot' || mode === 'sent';

  return (
    <div className="min-h-screen bg-[#F5B700] flex flex-col">
      <Hero compact={compactHero} />

      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 px-6 pt-7 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {(mode === 'login' || mode === 'signup') && (
              <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.12 }}>
                <Tabs mode={mode} onChange={go} />

                <h1 className="text-[24px] font-semibold text-gray-900 mt-6 leading-tight">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-[14px] text-gray-500 mt-1">
                  {mode === 'login' ? 'Log in to order your favourite meals.' : 'Hot meals from the best kitchens in Sokoto.'}
                </p>

                <form onSubmit={mode === 'login' ? onLogin : onSignup} className="mt-6 space-y-3">
                  {mode === 'signup' && (
                    <Field icon={User} type="text" value={name} onChange={setName} placeholder="Full name" autoComplete="name" required />
                  )}
                  <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="Email address" autoComplete="email" required />
                  <Field
                    icon={Lock}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    right={
                      <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="p-1.5 -mr-1 text-gray-500">
                        {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    }
                  />

                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => go('forgot')} className="text-[13px] font-semibold text-fooda-red">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <ErrorLine text={error} />

                  <PrimaryButton busy={busy}>{mode === 'login' ? 'Log in' : 'Create account'}</PrimaryButton>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <span className="h-px flex-1 bg-gray-100" />
                  <span className="text-[12px] text-gray-400">or</span>
                  <span className="h-px flex-1 bg-gray-100" />
                </div>

                <button
                  type="button"
                  onClick={google}
                  className="w-full h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center gap-2.5 text-[15px] font-semibold text-gray-900 press"
                >
                  <GoogleMark /> Continue with Google
                </button>

                <p className="text-[12px] text-gray-400 text-center mt-6 leading-relaxed">
                  By continuing you agree to Fooda Naija's terms of service and privacy policy.
                </p>
              </motion.div>
            )}

            {mode === 'verify' && (
              <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.12 }}>
                <BackLink onClick={() => go('signup')} />
                <h1 className="text-[24px] font-semibold text-gray-900 mt-4 leading-tight">Check your email</h1>
                <p className="text-[14px] text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
                </p>
                <OtpInput onComplete={onVerify} disabled={busy} />
                <ErrorLine text={error} />
                {busy && (
                  <p className="flex items-center justify-center gap-2 text-[14px] text-gray-500 mt-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                  </p>
                )}
                <ResendCode email={email} />
              </motion.div>
            )}

            {mode === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.12 }}>
                <BackLink onClick={() => go('login')} />
                <h1 className="text-[24px] font-semibold text-gray-900 mt-4 leading-tight">Reset your password</h1>
                <p className="text-[14px] text-gray-500 mt-1">Enter your email and we'll send you a link to set a new password.</p>
                <form onSubmit={onForgot} className="mt-6 space-y-3">
                  <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="Email address" autoComplete="email" required />
                  <ErrorLine text={error} />
                  <PrimaryButton busy={busy}>Send reset link</PrimaryButton>
                </form>
              </motion.div>
            )}

            {mode === 'sent' && (
              <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="text-center pt-4">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
                  <CheckCircle2 className="w-14 h-14 mx-auto text-[#0B4D33] dark:text-[#4ADE80]" />
                </motion.div>
                <h1 className="text-[22px] font-semibold text-gray-900 mt-4">Check your inbox</h1>
                <p className="text-[14px] text-gray-500 mt-1">If an account exists for {email}, a reset link is on its way.</p>
                <button type="button" onClick={() => go('login')} className="w-full h-12 rounded-xl f-btn-gold font-semibold text-[15px] mt-7 press">
                  Back to log in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function Hero({ compact }) {
  return (
    <motion.div
      layout
      className={`relative overflow-hidden flex-shrink-0 pt-[calc(1.25rem+var(--sat))] px-6 ${compact ? 'pb-12' : 'pb-10'}`}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      {/* soft rings */}
      <span className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/15" />
      <span className="absolute -left-20 top-24 w-48 h-48 rounded-full bg-white/10" />

      <div className="relative flex items-center justify-center">
        <div className="bg-white rounded-2xl px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <img src={LOGO} alt="Fooda Naija" className="h-9 w-auto object-contain" />
        </div>
      </div>

      <AnimatePresence>
        {!compact && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
            <p className="text-center text-[#111] text-[15px] font-semibold mt-4">Sokoto's favourite meals, delivered hot.</p>
            <RiderScene />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RiderScene() {
  return (
    <svg viewBox="0 0 340 110" className="w-full max-w-[340px] mx-auto block mt-2 overflow-visible" aria-hidden="true">
      {/* road */}
      <path d="M-10 92 Q 90 62 170 80 T 350 70" fill="none" stroke="#111" strokeOpacity="0.12" strokeWidth="16" strokeLinecap="round" />
      <path d="M-10 92 Q 90 62 170 80 T 350 70" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" strokeDasharray="8 10" className="lg-road" />
      {/* skyline blocks */}
      <g fill="#fff" fillOpacity="0.28">
        <rect x="22" y="30" width="26" height="34" rx="5" />
        <rect x="54" y="18" width="20" height="46" rx="5" />
        <rect x="250" y="24" width="24" height="40" rx="5" />
        <rect x="280" y="36" width="30" height="28" rx="5" />
      </g>
      {/* plate pin */}
      <g transform="translate(300 40)">
        <path d="M0 22C0 22 12 10 12 1A12 12 0 1 0 -12 1c0 9 12 21 12 21Z" fill="#E5383B" stroke="#fff" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="4.5" fill="#fff" />
      </g>
      {/* rider rides back and forth along the road */}
      <g>
        <animateMotion dur="6s" repeatCount="indefinite" path="M-10 92 Q 90 62 170 80 T 350 70" keyPoints="0;0.82;0.82" keyTimes="0;0.85;1" calcMode="linear" />
        <g className="fs-bob">
          <ellipse cx="0" cy="22" rx="14" ry="3" fill="#000" fillOpacity="0.12" />
          <g transform="translate(-24 -22) scale(0.95)">
            <rect x="3" y="11" width="15" height="13" rx="3" fill="#fff" stroke="#111" strokeWidth="2" />
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
  );
}

function Tabs({ mode, onChange }) {
  return (
    <div className="relative grid grid-cols-2 p-1 rounded-xl bg-gray-100">
      <motion.span
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[10px] bg-white shadow-sm"
        animate={{ x: mode === 'login' ? '0%' : '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      />
      {[['login', 'Log in'], ['signup', 'Sign up']].map(([m, label]) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`relative h-10 text-[14px] font-semibold transition-colors ${mode === m ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({ icon: Icon, value, onChange, right, ...props }) {
  return (
    <label className="flex items-center gap-2.5 h-[52px] px-3.5 rounded-xl border border-gray-200 bg-white focus-within:border-fooda-gold focus-within:ring-1 focus-within:ring-fooda-gold transition-colors">
      <Icon className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
      />
      {right}
    </label>
  );
}

function PrimaryButton({ busy, children }) {
  return (
    <button type="submit" disabled={busy} className="w-full h-12 rounded-xl f-btn-gold font-semibold text-[15px] flex items-center justify-center gap-2 press mt-1">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function ErrorLine({ text }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="text-[13px] text-fooda-red font-medium text-center pt-1"
          role="alert"
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function BackLink({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 text-[14px] font-semibold text-gray-500 -ml-1 press">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

function OtpInput({ onComplete, disabled }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i, v) => {
    const clean = v.replace(/\D/g, '');
    if (!clean) { const n = [...digits]; n[i] = ''; setDigits(n); return; }
    const n = [...digits];
    clean.slice(0, 6 - i).split('').forEach((c, k) => { n[i + k] = c; });
    setDigits(n);
    const next = Math.min(i + clean.length, 5);
    refs.current[next]?.focus();
    if (n.every(Boolean)) onComplete(n.join(''));
  };

  return (
    <div className="flex justify-between gap-2 mt-7">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
          className={`w-12 h-14 rounded-xl border text-center text-[22px] font-semibold text-gray-900 bg-white outline-none transition-colors ${d ? 'border-fooda-gold' : 'border-gray-200'} focus:border-fooda-gold focus:ring-1 focus:ring-fooda-gold`}
        />
      ))}
    </div>
  );
}

function ResendCode({ email }) {
  const [wait, setWait] = useState(30);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const resend = async () => {
    try { await base44.auth.resendOtp(email.trim()); setSent(true); } catch { /* ignore */ }
    setWait(30);
  };
  return (
    <p className="text-[13px] text-gray-500 text-center mt-6">
      Didn't get it?{' '}
      {wait > 0
        ? <span>Resend in {wait}s</span>
        : <button type="button" onClick={resend} className="font-semibold text-fooda-red">Resend code</button>}
      {sent && wait > 25 && <span className="block text-[12px] text-[#0B4D33] dark:text-[#4ADE80] mt-1">New code sent</span>}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
