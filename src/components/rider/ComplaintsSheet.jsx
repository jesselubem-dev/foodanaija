import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ComplaintsSheet({ rider }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ['rider-complaints', rider?.id],
    queryFn: () => base44.entities.RiderComplaint.filter({ rider_id: rider.id }, '-created_date'),
    enabled: !!rider?.id && open,
  });

  const sendComplaintMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RiderComplaint.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-complaints'] });
      toast.success('Complaint sent successfully');
      setSubject('');
      setMessage('');
      setShowForm(false);
    },
    onError: () => {
      toast.error('Failed to send complaint');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    sendComplaintMutation.mutate({
      rider_id: rider.id,
      rider_name: rider.full_name,
      rider_email: rider.email,
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending',
    });
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl hover:bg-blue-50 transition-colors">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">Complaints</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            My Complaints
          </SheetTitle>
        </SheetHeader>

        {!showForm ? (
          <>
            <Button 
              onClick={() => setShowForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 mb-4"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send New Complaint
            </Button>

            <div className="space-y-3">
              {complaints.length === 0 ? (
                <Card className="border-gray-100">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No complaints sent yet</p>
                  </CardContent>
                </Card>
              ) : (
                complaints.map((complaint) => (
                  <Card key={complaint.id} className="border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{complaint.subject}</h4>
                        <Badge className={statusColors[complaint.status]}>
                          {complaint.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {complaint.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {complaint.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{complaint.message}</p>
                      {complaint.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Admin Response:</p>
                          <p className="text-sm text-blue-800">{complaint.admin_response}</p>
                          <p className="text-xs text-blue-600 mt-2">
                            {new Date(complaint.responded_at).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Sent {new Date(complaint.created_date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
              <Input
                placeholder="Brief description of your complaint"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
              <Textarea
                placeholder="Describe your complaint in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendComplaintMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600"
              >
                {sendComplaintMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}