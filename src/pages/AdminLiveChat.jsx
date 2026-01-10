import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminLiveChat() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date'),
    enabled: !!user,
    refetchInterval: 2000,
  });

  // Group messages by chat_id
  const chatSessions = allMessages.reduce((acc, msg) => {
    if (!acc[msg.chat_id]) {
      acc[msg.chat_id] = {
        chat_id: msg.chat_id,
        customer_email: msg.customer_email,
        customer_name: msg.customer_name,
        messages: [],
        last_message: msg,
        unread_count: 0,
      };
    }
    acc[msg.chat_id].messages.push(msg);
    if (msg.sender_type === 'customer' && !msg.is_read) {
      acc[msg.chat_id].unread_count++;
    }
    if (new Date(msg.created_date) > new Date(acc[msg.chat_id].last_message.created_date)) {
      acc[msg.chat_id].last_message = msg;
    }
    return acc;
  }, {});

  const sortedChats = Object.values(chatSessions).sort(
    (a, b) => new Date(b.last_message.created_date) - new Date(a.last_message.created_date)
  );

  const { data: currentMessages = [] } = useQuery({
    queryKey: ['chat-messages', selectedChat?.chat_id],
    queryFn: () => base44.entities.ChatMessage.filter(
      { chat_id: selectedChat.chat_id },
      'created_date'
    ),
    enabled: !!selectedChat,
    refetchInterval: 2000,
  });

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChat?.chat_id] });
      queryClient.invalidateQueries({ queryKey: ['all-chat-messages'] });
      setMessage('');
      scrollToBottom();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    sendMessageMutation.mutate({
      chat_id: selectedChat.chat_id,
      customer_email: selectedChat.customer_email,
      customer_name: selectedChat.customer_name,
      sender_type: 'admin',
      sender_name: user.full_name,
      message: message.trim(),
      human_takeover: true,
    });
  };

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
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('SuperAdminDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-bold">Live Chat Support</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-900">Active Chats</h2>
            <p className="text-sm text-gray-500">{sortedChats.length} conversations</p>
          </div>
          <div className="divide-y">
            {sortedChats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No active chats</p>
              </div>
            ) : (
              sortedChats.map((chat) => (
                <button
                  key={chat.chat_id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedChat?.chat_id === chat.chat_id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-gray-900">{chat.customer_name}</p>
                    {chat.unread_count > 0 && (
                      <Badge className="bg-orange-500 text-white">{chat.unread_count}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.last_message.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(chat.last_message.created_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedChat.customer_name}</p>
                    <p className="text-sm text-gray-500">{selectedChat.customer_email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${msg.sender_type === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender_type === 'admin' 
                            ? 'bg-blue-100' 
                            : msg.sender_type === 'ai'
                            ? 'bg-purple-100'
                            : 'bg-orange-100'
                        }`}>
                          <User className={`w-4 h-4 ${
                            msg.sender_type === 'admin' 
                              ? 'text-blue-600' 
                              : msg.sender_type === 'ai'
                              ? 'text-purple-600'
                              : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          {(msg.sender_type !== 'customer') && (
                            <p className="text-xs font-semibold text-gray-600 mb-1 px-2">
                              {msg.sender_name || (msg.sender_type === 'ai' ? 'Fooda AI' : 'Admin')}
                            </p>
                          )}
                          <div className={`rounded-2xl px-4 py-2 ${
                            msg.sender_type === 'admin'
                              ? 'bg-blue-500 text-white'
                              : msg.sender_type === 'ai'
                              ? 'bg-purple-50 border border-purple-200 text-gray-900'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 px-2">
                            {new Date(msg.created_date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-white border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}