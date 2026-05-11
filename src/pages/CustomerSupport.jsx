import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import FloatingMenu from '../components/customer/FloatingMenu';

export default function CustomerSupport() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.email],
    queryFn: () => base44.entities.CustomerSupport.filter(
      { customer_email: user.email },
      '-created_date'
    ),
    enabled: !!user?.email,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerSupport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSubject('');
      setMessage('');
      toast.success('Message sent successfully!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    createTicketMutation.mutate({
      customer_email: user.email,
      customer_name: user.full_name,
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending',
    });
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    in_progress: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    resolved: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Resolved' },
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" className="flex items-center gap-1 text-orange-500 font-medium pl-0">
                <ChevronLeft className="w-6 h-6" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-bold">Customer Support</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* New Message Form */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="What's this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Tell us what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-32 border-orange-200 focus:border-orange-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
                disabled={createTicketMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createTicketMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Messages */}
        <div>
          <h2 className="text-lg font-bold mb-4">Your Messages</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                const StatusIcon = status.icon;
                return (
                  <Card key={ticket.id} className="border-orange-100">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(ticket.created_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-4">{ticket.message}</p>
                      {ticket.admin_response && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                          <p className="text-sm font-semibold text-orange-800 mb-2">
                            Admin Response:
                          </p>
                          <p className="text-gray-700">{ticket.admin_response}</p>
                          {ticket.responded_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Responded on {new Date(ticket.responded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FloatingMenu cartCount={cartCount} userEmail={user?.email} />
    </div>
  );
}