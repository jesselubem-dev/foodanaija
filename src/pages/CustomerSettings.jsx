import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Plus, MapPin, Trash2, Pencil, Check, LogOut, UserX,
  MessageCircle, Bell, ReceiptText, Moon, Headphones, Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LanguageProvider } from '../components/LanguageContext';
import NoInternet from '../components/NoInternet';
import BottomNav from '../components/customer/BottomNav';
import ThemeToggle from '../components/customer/ThemeToggle';

const EMPTY_FORM = { label: '', address: '', city: 'Sokoto' };
const CITIES = ['Sokoto', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];

const fieldClass = "h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold";

// Small building blocks so every row on the page looks the same.
function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="text-[13px] font-semibold text-gray-500">{children}</h2>
      {action}
    </div>
  );
}

function RowIcon({ icon: Icon, bg = '#FFFBEB', fg = '#B45309' }) {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <Icon className="w-[18px] h-[18px]" style={{ color: fg }} />
    </div>
  );
}

function Row({ icon, iconBg, iconFg, title, subtitle, to, href, onClick, right, danger }) {
  const content = (
    <>
      <RowIcon icon={icon} bg={iconBg} fg={iconFg} />
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-[14px] font-medium truncate ${danger ? 'f-text-red' : 'text-gray-900'}`}>{title}</p>
        {subtitle && <p className="text-[12px] text-gray-500 truncate">{subtitle}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
    </>
  );
  const cls = "w-full flex items-center gap-3 px-3.5 py-3 press";
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{content}</button>;
  return <div className={cls}>{content}</div>;
}

function Card({ children }) {
  return <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">{children}</div>;
}

function CustomerSettingsContent() {
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: addresses = [] } = useQuery({
    queryKey: ['saved-addresses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.SavedAddress.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20),
    enabled: !!user?.email,
    staleTime: 15000,
  });

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingAddress(null);
    setFormData(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedAddress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      closeDialog();
      toast.success('Address saved');
    },
    onError: () => toast.error('Could not save address. Try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedAddress.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      closeDialog();
      toast.success('Address updated');
    },
    onError: () => toast.error('Could not update address. Try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedAddress.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Address deleted');
    },
    onError: () => toast.error('Could not delete address. Try again.'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (addressId) => {
      // First, unset all defaults, then set the selected one
      await Promise.all(addresses.map(addr =>
        base44.entities.SavedAddress.update(addr.id, { is_default: false })
      ));
      return await base44.entities.SavedAddress.update(addressId, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast.success('Default address updated');
    },
    onError: () => toast.error('Could not update default address. Try again.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.label.trim() || !formData.address.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingAddress) {
      // Keep the address's existing default status when editing.
      updateMutation.mutate({
        id: editingAddress.id,
        data: { label: formData.label.trim(), address: formData.address.trim(), city: formData.city },
      });
    } else {
      createMutation.mutate({
        label: formData.label.trim(),
        address: formData.address.trim(),
        city: formData.city,
        user_email: user.email,
        is_default: addresses.length === 0, // First address is default
      });
    }
  };

  const openAdd = () => {
    setEditingAddress(null);
    setFormData(EMPTY_FORM);
    setShowAddDialog(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({ label: address.label || '', address: address.address || '', city: address.city || 'Sokoto' });
    setShowAddDialog(true);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('cart');
    sessionStorage.clear();
    base44.auth.logout(createPageUrl('CustomerHome'));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-7 h-7 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const initial = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-white pb-28">
      <NoInternet />

      {/* Header */}
      <div className="px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-2">
        <div className="max-w-lg mx-auto">
          <h1 className="text-[20px] font-semibold text-gray-900">Profile</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage your account and delivery details</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-3 space-y-6">
        {/* Profile card */}
        <div className="rounded-2xl p-4 flex items-center gap-3.5 bg-gradient-to-br from-fooda-green to-fooda-green-light">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-bold flex-shrink-0 f-btn-gold"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-white leading-tight truncate">{user.full_name || 'Fooda customer'}</p>
            <p className="text-[13px] text-white/80 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Quick links */}
        <section>
          <SectionTitle>My activity</SectionTitle>
          <Card>
            <Row icon={ReceiptText} title="My orders" subtitle="Track and reorder" to={createPageUrl('OrderHistory')} />
            <Row
              icon={Bell}
              title="Notifications"
              subtitle={unreadNotifications.length ? `${unreadNotifications.length} unread` : 'Order updates'}
              to={createPageUrl('Notifications')}
              right={
                <div className="flex items-center gap-1.5">
                  {unreadNotifications.length > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center text-white bg-fooda-red">
                      {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              }
            />
          </Card>
        </section>

        {/* Saved addresses */}
        <section>
          <SectionTitle
            action={
              <button
                onClick={openAdd}
                className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide press-sm f-text-green"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add
              </button>
            }
          >
            Saved addresses
          </SectionTitle>

          {addresses.length === 0 ? (
            <button
              onClick={openAdd}
              className="w-full rounded-2xl border border-dashed border-gray-300 p-5 flex flex-col items-center text-center press"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2 f-tint-gold">
                <MapPin className="w-5 h-5 f-text-gold" />
              </div>
              <p className="text-[14px] font-medium text-gray-900">Add a delivery address</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Your default address fills in at checkout</p>
            </button>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`rounded-2xl border p-3 ${address.is_default ? 'border-fooda-gold/40 f-tint-cream' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <RowIcon icon={MapPin} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-gray-900 truncate">{address.label}</h3>
                        {address.is_default && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 f-tint-green f-text-green">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{address.address}</p>
                      {address.city && <p className="text-[11px] text-gray-400 mt-0.5">{address.city}</p>}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(address)}
                        aria-label={`Edit ${address.label}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50 press-sm"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(address.id)}
                        aria-label={`Delete ${address.label}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50 press-sm"
                      >
                        <Trash2 className="w-4 h-4 f-text-red" />
                      </button>
                    </div>
                  </div>
                  {!address.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(address.id)}
                      disabled={setDefaultMutation.isPending}
                      className="mt-2 ml-12 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-50 press-sm f-text-green"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} /> Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferences */}
        <section>
          <SectionTitle>Preferences</SectionTitle>
          <Card>
            <Row icon={Moon} title="Dark mode" subtitle="Easier on the eyes at night" right={<ThemeToggle />} />
          </Card>
        </section>

        {/* Help */}
        <section>
          <SectionTitle>Help</SectionTitle>
          <Card>
            <Row icon={Headphones} title="Chat with Fooda" subtitle="Ask about an order in the app" to={createPageUrl('LiveChat')} />
            <Row icon={Mail} title="Contact support" subtitle="Send a message, get a written reply" to={createPageUrl('CustomerSupport')} />
            <Row
              icon={MessageCircle}
              iconBg="#ECFDF3"
              iconFg="#15803D"
              title="Chat on WhatsApp"
              subtitle="We're here to help"
              href="https://wa.me/2347078700001"
            />
          </Card>
        </section>

        {/* Account */}
        <section>
          <SectionTitle>Account</SectionTitle>
          <Card>
            <Row icon={LogOut} iconBg="#F3F4F6" iconFg="#374151" title="Log out" onClick={() => setLogoutConfirm(true)} />
            <Row icon={UserX} iconBg="#FEF2F2" iconFg="#DC2626" title="Delete account" danger to={createPageUrl('DeleteAccount')} />
          </Card>
        </section>
      </div>

      <BottomNav user={user} />

      {/* Delete address confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this address?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-gray-600">You can add it again any time.</p>
          <div className="flex gap-2.5 mt-2">
            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 press">
              Keep it
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 h-11 rounded-xl text-[14px] font-semibold disabled:opacity-60 press f-btn-danger"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout confirmation */}
      <Dialog open={logoutConfirm} onOpenChange={setLogoutConfirm}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out of Fooda?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-gray-600">Your cart will be cleared on this device.</p>
          <div className="flex gap-2.5 mt-2">
            <button onClick={() => setLogoutConfirm(false)} className="flex-1 h-11 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 press">
              Stay
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 h-11 rounded-xl text-[14px] font-semibold press f-btn-gold"
            >
              Log out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / edit address */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit address' : 'Add address'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="addr-label" className="block text-[13px] font-medium text-gray-900 mb-1.5">Label</label>
              <Input
                id="addr-label"
                placeholder="e.g. Home, Office, School"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="addr-address" className="block text-[13px] font-medium text-gray-900 mb-1.5">Address</label>
              <Input
                id="addr-address"
                placeholder="House number, street, area"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-900 mb-1.5">City</label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={closeDialog} className="flex-1 h-12 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 press">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-12 rounded-xl text-[14px] font-semibold uppercase tracking-wide disabled:opacity-60 press f-btn-gold"
              >
                {saving ? 'Saving...' : editingAddress ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerSettings() {
  return (
    <LanguageProvider>
      <CustomerSettingsContent />
    </LanguageProvider>
  );
}
