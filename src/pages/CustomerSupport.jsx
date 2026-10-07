import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import moment from 'moment';
import { PageHeader, EmptyState, Spinner } from '../components/fooda/ui';

const STATUS = {
  pending:     { label: 'Pending',     cls: 'f-tint-gold f-text-amber' },
  in_progress: { label: 'In progress', cls: 'f-tint-gray f-text-soft' },
  resolved:    { label: 'Resolved',    cls: 'f-tint-green f-text-green' },
};

const fieldClass = "h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold";

export default function CustomerSupport() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.email],
    queryFn: () => base44.entities.CustomerSupport.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerSupport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSubject('');
      setMessage('');
      toast.success("Message sent — we'll reply here soon");
    },
    onError: () => toast.error('Could not send your message. Please try again.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both fields');
      return;
    }
    createTicketMutation.mutate({
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending',
    });
  };

  if (!user) return <Spinner fullScreen />;

  return (
    <div className="min-h-screen bg-white pb-10">
      <PageHeader title="Contact support" backTo="CustomerSettings" />

      <div className="max-w-lg mx-auto px-4">
        <p className="text-[13px] text-gray-500 text-center -mt-1 mb-5">Tell us what happened and our team will reply here.</p>

        {/* New message */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cs-subject" className="block text-[13px] font-medium text-gray-900 mb-1.5">Subject</label>
            <Input
              id="cs-subject"
              placeholder="e.g. Missing item in my order"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="cs-message" className="block text-[13px] font-medium text-gray-900 mb-1.5">Message</label>
            <Textarea
              id="cs-message"
              placeholder="Share as much detail as you can"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
            />
          </div>
          <button
            type="submit"
            disabled={createTicketMutation.isPending}
            className="w-full h-12 rounded-2xl text-[14px] font-semibold uppercase tracking-wide f-btn-gold press"
          >
            {createTicketMutation.isPending ? 'Sending...' : 'Send message'}
          </button>
        </form>

        {/* Previous messages */}
        <section className="mt-8">
          <h2 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">Your messages</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet" message="Messages you send will appear here with our replies." className="py-10" />
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const status = STATUS[ticket.status] || STATUS.pending;
                return (
                  <div key={ticket.id} className="rounded-2xl border border-gray-200 bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                        <p className="text-[12px] text-gray-500">{moment(ticket.created_date).format('D MMM YYYY · h:mm A')}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-[14px] text-gray-700 mt-2 whitespace-pre-wrap">{ticket.message}</p>
                    {ticket.admin_response && (
                      <div className="mt-3 rounded-xl p-3 f-tint-green">
                        <p className="text-[12px] font-semibold f-text-green mb-1">Fooda team replied</p>
                        <p className="text-[14px] text-gray-900 whitespace-pre-wrap">{ticket.admin_response}</p>
                        {ticket.responded_at && (
                          <p className="text-[11px] text-gray-500 mt-1.5">{moment(ticket.responded_at).format('D MMM YYYY')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
