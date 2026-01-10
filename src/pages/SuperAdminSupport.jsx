import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function SuperAdminSupport() {
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('CustomerHome');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['all-support-tickets'],
    queryFn: () => base44.entities.CustomerSupport.list('-created_date'),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomerSupport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-support-tickets'] });
      setSelectedTicket(null);
      setResponse('');
      toast.success('Response sent successfully!');
    },
  });

  const handleRespond = () => {
    if (!response.trim()) {
      toast.error('Please write a response');
      return;
    }

    updateTicketMutation.mutate({
      id: selectedTicket.id,
      data: {
        admin_response: response.trim(),
        status: 'resolved',
        responded_at: new Date().toISOString(),
      },
    });
  };

  const handleStatusChange = (ticketId, newStatus) => {
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: newStatus },
    });
  };

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    in_progress: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    resolved: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Resolved' },
  };

  const pendingCount = tickets.filter(t => t.status === 'pending').length;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('SuperAdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-bold">Customer Support</h1>
                {pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white">{pendingCount} pending</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-gray-500" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No support messages</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status];
              const StatusIcon = status.icon;
              return (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <h3 className="font-bold text-lg mb-2">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      From: <span className="font-medium">{ticket.customer_name}</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {new Date(ticket.created_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-gray-700 mb-4 line-clamp-3">{ticket.message}</p>

                    <Button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setResponse(ticket.admin_response || '');
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {ticket.admin_response ? 'View/Edit Response' : 'Respond'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Support Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">Subject:</p>
                <p className="font-bold mb-3">{selectedTicket.subject}</p>
                <p className="text-sm font-semibold text-gray-600 mb-1">Message:</p>
                <p className="text-gray-700">{selectedTicket.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  From: {selectedTicket.customer_name} ({selectedTicket.customer_email})
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Response</label>
                <Textarea
                  placeholder="Write your response here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="h-32"
                />
              </div>

              <Button
                onClick={handleRespond}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={updateTicketMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {updateTicketMutation.isPending ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}