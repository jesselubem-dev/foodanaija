import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Send, TestTube, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function EmailCampaign() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const sendTest = async () => {
    setSending(true);
    setResult(null);
    const res = await base44.functions.invoke('sendEmailCampaign', { test_mode: true, test_email: 'jesselubem@gmail.com' });
    setResult({ type: 'test', ...res.data });
    setSending(false);
  };

  const sendAll = async () => {
    setSending(true);
    setResult(null);
    const res = await base44.functions.invoke('sendEmailCampaign', { test_mode: false });
    setResult({ type: 'all', ...res.data });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('SuperAdminDashboard')}>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Campaign</h1>
            <p className="text-sm text-gray-500">Send today's menu to all customers</p>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 mb-6 text-white">
          <p className="font-bold text-lg mb-1">🍛 Today's Menu Campaign</p>
          <p className="text-sm text-white/80 leading-relaxed">
            A personalized, beautifully designed email with today's menu items, pricing, and a free delivery offer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Jollof Rice", "Fried Rice", "Egusi Soup", "Spaghetti", "Drinks"].map(item => (
              <span key={item} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{item}</span>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${result.success ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className={`font-semibold text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>
              {result.type === 'all' && (
                <p className="text-xs text-green-600 mt-1">✅ {result.sent} sent · ❌ {result.failed} failed</p>
              )}
              {result.type === 'test' && (
                <p className="text-xs text-green-600 mt-1">Sent to jesselubem@gmail.com</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={sendTest}
            disabled={sending}
            variant="outline"
            className="w-full h-12 border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold"
          >
            {sending ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> Sending...</span>
            ) : (
              <span className="flex items-center gap-2"><TestTube className="w-4 h-4" /> Send Test Email</span>
            )}
          </Button>

          <Button
            onClick={sendAll}
            disabled={sending}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-base shadow-lg shadow-orange-500/30"
          >
            {sending ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</span>
            ) : (
              <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send to All Customers 🚀</span>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          "Send to All Customers" will send a personalized email to every registered user.
        </p>
      </div>
    </div>
  );
}