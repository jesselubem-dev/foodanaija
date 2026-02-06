import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, MessageSquare, Clock, CheckCircle, AlertCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SuperAdminRiderComplaints() {
  const [user, setUser] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['all-rider-complaints'],
    queryFn: async () => {
      try {
        return await base44.entities.RiderComplaint.list('-created_date');
      } catch (error) {
        console.error('Error fetching complaints:', error);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ complaintId, responseText, status }) => {
      return await base44.entities.RiderComplaint.update(complaintId, {
        admin_response: responseText,
        status: status,
        responded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rider-complaints'] });
      toast.success('Response sent successfully');
      setSelectedComplaint(null);
      setResponse('');
    },
  });

  const handleRespond = () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    respondMutation.mutate({
      complaintId: selectedComplaint.id,
      responseText: response.trim(),
      status: 'resolved',
    });
  };

  const filteredComplaints = statusFilter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === statusFilter);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('SuperAdminDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rider Complaints</h1>
              <p className="text-gray-600">Manage rider concerns and feedback</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white px-4 py-2 text-base">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Complaints</h3>
              <p className="text-gray-500">No rider complaints to display</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => (
              <Card 
                key={complaint.id} 
                className={`border-gray-200 hover:shadow-lg transition-all cursor-pointer ${
                  complaint.status === 'pending' ? 'border-l-4 border-l-red-500' : ''
                }`}
                onClick={() => setSelectedComplaint(complaint)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{complaint.subject}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">{complaint.rider_name}</span>
                        <span>•</span>
                        <span>{complaint.rider_email}</span>
                        <span>•</span>
                        <span>
                          {new Date(complaint.created_date).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusColors[complaint.status]}>
                      {complaint.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {complaint.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {complaint.status === 'in_progress' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{complaint.message}</p>
                  {complaint.admin_response && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Your Response:</p>
                      <p className="text-sm text-blue-800">{complaint.admin_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Response Dialog */}
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Respond to Complaint</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{selectedComplaint.subject}</p>
                    <Badge className={statusColors[selectedComplaint.status]}>
                      {selectedComplaint.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    From: <span className="font-medium">{selectedComplaint.rider_name}</span> ({selectedComplaint.rider_email})
                  </p>
                  <p className="text-gray-700">{selectedComplaint.message}</p>
                </div>

                {selectedComplaint.admin_response ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Previous Response:</p>
                    <p className="text-blue-800">{selectedComplaint.admin_response}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Your Response
                      </label>
                      <Textarea
                        placeholder="Type your response to the rider..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="w-full h-32 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedComplaint(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRespond}
                        disabled={respondMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                      >
                        {respondMutation.isPending ? (
                          <>Sending...</>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Response
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}