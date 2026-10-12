import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageCircle, ChevronLeft, Sparkles, CheckCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { lastReplyTimes, isUnreadForAdmin } from '@/lib/chatUnread';

const timeOf = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();

export default function AdminLiveChat() {
  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const markingRef = useRef(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const userData = await base44.auth.me();
        if (userData.role !== 'admin' && userData._app_role !== 'admin') {
          window.location.href = createPageUrl('CustomerHome');
          return;
        }
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    })();
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date'),
    enabled: !!user,
    refetchInterval: 3000,
  });

  // Group messages into conversations
  const lastReply = lastReplyTimes(allMessages);
  const sessions = {};
  for (const msg of allMessages) {
    const s = sessions[msg.chat_id] ||= {
      chat_id: msg.chat_id,
      customer_email: msg.customer_email,
      customer_name: msg.customer_name,
      last_message: msg,
      unread_count: 0,
    };
    if (isUnreadForAdmin(msg, lastReply)) s.unread_count++;
    if (new Date(msg.created_date) > new Date(s.last_message.created_date)) s.last_message = msg;
    if (!s.customer_name && msg.customer_name) s.customer_name = msg.customer_name;
  }
  const sortedChats = Object.values(sessions)
    .sort((a, b) => new Date(b.last_message.created_date) - new Date(a.last_message.created_date))
    .filter(c => !search.trim() || `${c.customer_name} ${c.customer_email}`.toLowerCase().includes(search.toLowerCase()));
  const totalUnreadChats = Object.values(sessions).filter(c => c.unread_count > 0).length;
  const selectedChat = selectedId ? sessions[selectedId] : null;

  const { data: currentMessages = [] } = useQuery({
    queryKey: ['chat-messages', selectedId],
    queryFn: () => base44.entities.ChatMessage.filter({ chat_id: selectedId }, 'created_date'),
    enabled: !!selectedId,
    refetchInterval: 2000,
  });

  // Mark the given customer messages as read, then refresh the badges.
  const markRead = async (msgs) => {
    const todo = msgs.filter(m => m.sender_type === 'customer' && !m.is_read && !markingRef.current.has(m.id));
    if (todo.length === 0) return;
    todo.forEach(m => markingRef.current.add(m.id));
    // Clear the badge straight away, before the server round-trip finishes
    const ids = new Set(todo.map(m => m.id));
    queryClient.setQueryData(['all-chat-messages'], (old) =>
      Array.isArray(old) ? old.map(m => (ids.has(m.id) ? { ...m, is_read: true } : m)) : old
    );
    try {
      await Promise.all(todo.map(m => base44.entities.ChatMessage.update(m.id, { is_read: true })));
    } catch (e) {
      todo.forEach(m => markingRef.current.delete(m.id));
    }
    queryClient.invalidateQueries({ queryKey: ['all-chat-messages'] });
  };

  // Opening a chat (and any new message arriving while it's open) marks it read
  useEffect(() => {
    if (selectedId && currentMessages.length) markRead(currentMessages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, currentMessages]);

  const markAllRead = async () => {
    await markRead(allMessages);
    toast.success('All chats marked as read');
  };

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['all-chat-messages'] });
      setMessage('');
    },
    onError: () => toast.error('Message failed to send'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    markRead(currentMessages);
    sendMessageMutation.mutate({
      chat_id: selectedChat.chat_id,
      customer_email: selectedChat.customer_email,
      customer_name: selectedChat.customer_name,
      sender_type: 'admin',
      sender_name: 'Fooda',
      message: message.trim(),
      human_takeover: true,
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-fooda-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="chat-screen flex bg-white">
      {/* Conversation list */}
      <aside className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[340px] flex-col border-r border-gray-100 bg-white`}>
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Chat</h1>
              <p className="text-[13px] text-gray-500">
                {totalUnreadChats > 0 ? `${totalUnreadChats} waiting for a reply` : 'All caught up'}
              </p>
            </div>
            {totalUnreadChats > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold f-btn-outline flex items-center gap-1.5 press"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers"
              className="chat-input w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-fooda-gold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="p-10 text-center">
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No conversations</p>
            </div>
          ) : (
            sortedChats.map((chat) => {
              const active = selectedId === chat.chat_id;
              const unread = chat.unread_count > 0;
              return (
                <button
                  key={chat.chat_id}
                  type="button"
                  onClick={() => setSelectedId(chat.chat_id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'f-tint-gold' : 'hover:bg-gray-50'}`}
                >
                  {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-fooda-gold" />}
                  <div className="w-10 h-10 rounded-full bg-fooda-green text-white flex items-center justify-center text-[14px] font-semibold flex-shrink-0">
                    {initial(chat.customer_name || chat.customer_email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[14px] truncate text-gray-900 ${unread ? 'font-bold' : 'font-medium'}`}>
                        {chat.customer_name || chat.customer_email}
                      </p>
                      <span className={`text-[11px] flex-shrink-0 ${unread ? 'f-text-amber font-semibold' : 'text-gray-400'}`}>
                        {timeOf(chat.last_message.created_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[13px] truncate ${unread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {chat.last_message.sender_type !== 'customer' && <span className="text-gray-400">You: </span>}
                        {chat.last_message.message}
                      </p>
                      {unread && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-fooda-red text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {selectedChat ? (
          <>
            <div className="h-16 px-3 md:px-5 flex items-center gap-3 border-b border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="md:hidden w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center"
                aria-label="Back to chats"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900" />
              </button>
              <div className="w-10 h-10 rounded-full bg-fooda-green text-white flex items-center justify-center text-[14px] font-semibold">
                {initial(selectedChat.customer_name || selectedChat.customer_email)}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate">{selectedChat.customer_name || 'Customer'}</p>
                <p className="text-[12px] text-gray-500 truncate">{selectedChat.customer_email}</p>
              </div>
            </div>

            <div className="chat-thread flex-1 overflow-y-auto px-3 md:px-6 py-5">
              <div className="max-w-3xl mx-auto space-y-3">
                {currentMessages.map((msg) => {
                  const mine = msg.sender_type === 'admin';
                  const ai = msg.sender_type === 'ai';
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        {ai && (
                          <span className="chat-meta flex items-center gap-1 text-[11px] font-semibold mb-1 px-1">
                            <Sparkles className="w-3 h-3" /> Fooda AI
                          </span>
                        )}
                        <div className={`px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                          mine ? 'chat-bubble-admin rounded-2xl rounded-br-md'
                            : ai ? 'chat-bubble-ai rounded-2xl rounded-bl-md'
                            : 'chat-bubble-customer rounded-2xl rounded-bl-md'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="chat-meta text-[11px] mt-1 px-1">{timeOf(msg.created_date)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <div className="max-w-3xl mx-auto flex items-center gap-2">
                <input
                  placeholder="Type a reply…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sendMessageMutation.isPending}
                  className="chat-input flex-1 h-11 px-4 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-fooda-gold"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="w-11 h-11 rounded-xl f-btn-gold flex items-center justify-center press disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-thread flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full f-tint-gold flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 f-text-gold" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">Pick a conversation</p>
              <p className="text-[13px] text-gray-500 mt-1">Choose a customer on the left to reply.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
