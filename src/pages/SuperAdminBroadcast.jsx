import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Megaphone, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const LINK_OPTIONS = [
  { value: 'CustomerHome', label: 'Home' },
  { value: 'OrderHistory', label: 'Order History' },
  { value: 'Chefs', label: 'Chefs' },
  { value: 'Notifications', label: 'Notifications' },
  { value: 'CustomerSupport', label: 'Customer Support' },
];

export default function SuperAdminBroadcast() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('CustomerHome');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin' && u?._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const broadcastMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('broadcastNotification', { title, message, link, image_url: imageUrl }),
    onSuccess: (res) => {
      const d = res.data || {};
      toast.success(`Broadcast sent — ${d.notifications_created || 0} in-app, ${d.push_sent || 0} push`);
      setTitle('');
      setMessage('');
      setImageUrl('');
    },
    onError: (e) => {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to send broadcast');
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    broadcastMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('SuperAdminDashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" />
              Broadcast Notification
            </h1>
            <p className="text-sm text-gray-500">Send a custom push & in-app notification to all app users</p>
          </div>
        </div>
        <Badge className="bg-orange-100 text-orange-700 gap-1">
          <Users className="w-3.5 h-3.5" />
          {users.length} users
        </Badge>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compose Message</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              This will create an in-app notification for every user and send a native push to their phone.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. 🎉 20% off all orders this weekend!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
              />
              <p className="text-xs text-gray-400">{title.length}/80</p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write the notification body here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-gray-400">{message.length}/200</p>
            </div>

            {/* Image URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                placeholder="https://... (shown in the in-app banner)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Link destination */}
            <div className="space-y-2">
              <Label>Tap destination</Label>
              <div className="flex flex-wrap gap-2">
                {LINK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLink(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      link === opt.value
                        ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">Where users go when they tap the notification</p>
            </div>
          </CardContent>
        </Card>

        {/* Send */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
            className="bg-orange-500 hover:bg-orange-600 gap-2 px-8"
          >
            {broadcastMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Sending to {users.length} users...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to All Users
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}