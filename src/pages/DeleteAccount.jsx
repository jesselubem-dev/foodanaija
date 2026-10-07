import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, AlertTriangle, UserX, LogOut, Lock, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '../components/fooda/ui';

const SUPPORT_WHATSAPP = 'https://wa.me/2347078700001';

export default function DeleteAccount() {
  const [user, setUser] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const clearDevice = () => {
    try {
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('cart');
      sessionStorage.clear();
    } catch {}
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    setFailed(false);
    try {
      // Delete user record (unchanged behaviour)
      await base44.entities.User.delete(user.id);

      toast.success('Your account has been deleted');
      clearDevice();

      // Logout and redirect
      setTimeout(() => {
        base44.auth.logout(createPageUrl('CustomerHome'));
      }, 1000);
    } catch (error) {
      setFailed(true);
      setDeleting(false);
      toast.error('We could not delete your account. Please contact support.');
    }
  };

  const handleLogout = () => {
    clearDevice();
    base44.auth.logout(createPageUrl('CustomerHome'));
  };

  const closeConfirm = () => {
    if (deleting) return;
    setShowConfirm(false);
    setConfirmText('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const initial = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
  const confirmed = confirmText.trim().toUpperCase() === 'DELETE';

  return (
    <div className="min-h-screen bg-white pb-36">
      <PageHeader title="Delete account" backTo="CustomerSettings" />

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Intro */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 f-tint-red">
            <UserX className="w-7 h-7 f-text-red" />
          </div>
          <h2 className="text-[20px] font-semibold text-gray-900">We're sorry to see you go</h2>
          <p className="text-[13px] text-gray-500 mt-1 max-w-[300px]">
            Deleting your account is permanent. Please read this before you continue.
          </p>
        </div>

        {/* Account being deleted */}
        <div className="mt-6 rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-[17px] font-bold flex-shrink-0 f-btn-gold"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 truncate">{user.full_name || 'Fooda customer'}</p>
            <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* What happens */}
        <div className="mt-4 rounded-2xl border p-4 f-border-red f-tint-red">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 f-text-red" />
            <h3 className="text-[14px] font-semibold f-text-red-strong">What happens when you delete</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              { icon: Lock, text: 'Your Fooda account is closed and you will not be able to log in with it again.' },
              { icon: LogOut, text: "You'll be logged out and your cart on this device will be cleared." },
              { icon: AlertTriangle, text: 'This cannot be undone. To use Fooda again you will need to sign up afresh.' },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 f-text-red-strong" />
                <span className="text-[13px] leading-snug f-text-red-strong">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alternatives */}
        <div className="mt-6">
          <h3 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">Not sure yet?</h3>
          <div className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3.5 py-3 text-left press">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 f-tint-gray">
                <LogOut className="w-[18px] h-[18px] f-text-soft" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-gray-900">Just log out instead</p>
                <p className="text-[12px] text-gray-500">Keep your account for later</p>
              </div>
            </button>
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3.5 py-3 press">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 f-tint-green">
                <MessageCircle className="w-[18px] h-[18px] f-text-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-gray-900">Talk to us on WhatsApp</p>
                <p className="text-[12px] text-gray-500">Tell us what went wrong — we'll try to fix it</p>
              </div>
            </a>
          </div>
        </div>

        {failed && (
          <div className="mt-4 rounded-xl px-3.5 py-3 text-[13px] f-tint-red f-text-red-strong">
            Your account could not be deleted from the app. Please{' '}
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              message us on WhatsApp
            </a>{' '}
            and we'll delete it for you.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full h-12 rounded-2xl text-[14px] font-semibold uppercase tracking-wide press f-btn-danger"
          >
            Delete my account
          </button>
          <Link
            to={createPageUrl('CustomerSettings')}
            className="w-full h-11 rounded-2xl text-[14px] font-semibold flex items-center justify-center text-gray-900 press"
          >
            Keep my account
          </Link>
        </div>
      </div>

      {/* Final confirmation */}
      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) closeConfirm(); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 f-text-red-strong">
              <AlertTriangle className="w-5 h-5" /> Final confirmation
            </DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-gray-600">
            This is <strong className="text-gray-900">permanent</strong>. Type <strong className="f-text-red">DELETE</strong> below to confirm.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            autoCapitalize="characters"
            autoComplete="off"
            aria-label="Type DELETE to confirm"
            className="h-12 rounded-xl border-gray-200 text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-red-400"
          />
          <div className="flex gap-2.5 mt-1">
            <button
              onClick={closeConfirm}
              disabled={deleting}
              className="flex-1 h-12 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 disabled:opacity-50 press"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="flex-1 h-12 rounded-xl text-[14px] font-semibold disabled:opacity-40 press f-btn-danger"
            >
              {deleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
