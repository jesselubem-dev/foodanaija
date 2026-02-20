import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteAccount() {
  const [user, setUser] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
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

  const [reason, setReason] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Check if request already exists
      const existing = await base44.entities.AccountDeletionRequest.filter({ user_email: user.email });
      const pendingRequest = existing.find(r => r.status === 'pending');
      if (pendingRequest) {
        toast.error('You already have a pending deletion request');
        setDeleting(false);
        setShowConfirm(false);
        return;
      }

      await base44.entities.AccountDeletionRequest.create({
        user_email: user.email,
        user_name: user.full_name || user.email,
        reason: reason || '',
        status: 'pending'
      });

      toast.success('Deletion request submitted. Our team will process it shortly.');
      setRequestSubmitted(true);
      setShowConfirm(false);
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Delete Account</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {requestSubmitted ? (
          <Card className="border-green-200 bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted</h2>
              <p className="text-gray-600 mb-6">
                Your account deletion request has been submitted. Our team will review and process it within 24–48 hours. You will be notified via email.
              </p>
              <Link to={createPageUrl('CustomerHome')}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
        <Card className="border-red-200 bg-white">
          <CardHeader className="border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-900">Request Account Deletion</CardTitle>
                <p className="text-sm text-red-700 mt-1">Submit a request to have your account permanently deleted</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-2">⚠️ Warning</h3>
              <p className="text-sm text-red-800">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                <li>Your profile and personal information</li>
                <li>Order history and tracking</li>
                <li>Saved addresses</li>
                <li>All account data</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Account:</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Reason (Optional)</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us why you want to delete your account..."
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 h-12"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Request Account Deletion
              </Button>

              <Link to={createPageUrl('CustomerHome')}>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Final Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-700">
              This action is <strong>permanent</strong> and cannot be reversed. All your data will be permanently deleted.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="border-red-200 focus:border-red-400"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={confirmText !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}