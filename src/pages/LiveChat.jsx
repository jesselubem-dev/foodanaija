import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, MessageCircle, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import FloatingMenu from '../components/customer/FloatingMenu';

export default function LiveChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      }

      // Generate or retrieve chat ID
      const storedChatId = localStorage.getItem(`chat_id_${userData.email}`);
      if (storedChatId) {
        setChatId(storedChatId);
      } else {
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`chat_id_${userData.email}`, newChatId);
        setChatId(newChatId);
        
        // Send welcome message from AI
        setTimeout(async () => {
          try {
            await base44.entities.ChatMessage.create({
              chat_id: newChatId,
              customer_email: userData.email,
              customer_name: userData.full_name,
              sender_type: 'ai',
              sender_name: 'Fooda AI',
              message: `Hello ${userData.full_name.split(' ')[0]}! 👋 Welcome to Fooda Support. I'm here to help you with restaurant recommendations, orders, deliveries, and any questions you have. How can I assist you today?`,
            });
          } catch (error) {
            console.error('Failed to send welcome message:', error);
          }
        }, 500);
      }
    } catch (e) {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => base44.entities.ChatMessage.filter(
      { chat_id: chatId },
      'created_date'
    ),
    enabled: !!chatId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      setMessage('');
      scrollToBottom();
      
      // Trigger AI response
      try {
        await base44.functions.invoke('aiChatResponse', {
          chat_id: chatId,
          customer_message: variables.message,
          customer_name: user.full_name,
          customer_email: user.email,
        });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        toast.error('AI response failed, but your message was sent');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      chat_id: chatId,
      customer_email: user.email,
      customer_name: user.full_name,
      sender_type: 'customer',
      sender_name: user.full_name,
      message: message.trim(),
    });
  };

  const startNewChat = async () => {
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(`chat_id_${user.email}`, newChatId);
    setChatId(newChatId);
    
    // Send welcome message from AI
    setTimeout(async () => {
      try {
        await base44.entities.ChatMessage.create({
          chat_id: newChatId,
          customer_email: user.email,
          customer_name: user.full_name,
          sender_type: 'ai',
          sender_name: 'Fooda AI',
          message: `Hello ${user.full_name.split(' ')[0]}! 👋 Welcome back to Fooda Support. How can I assist you today?`,
        });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', newChatId] });
        toast.success('New chat started');
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    }, 500);
  };

  if (!user || !chatId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-yellow-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('CustomerHome')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <h1 className="text-lg font-bold">Fooda Support</h1>
                  <p className="text-xs text-green-600">● AI Assistant Active</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={startNewChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-200 hover:bg-orange-50 text-orange-600"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-6 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Fooda AI</p>
                  <p className="text-xs text-gray-500">Online now</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Hello! 👋 I'm Fooda AI, your personal food delivery assistant. How can I help you today?
              </p>
            </div>
            <p className="text-sm text-gray-400">Send a message to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${msg.sender_type === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender_type === 'customer' 
                      ? 'bg-orange-100' 
                      : msg.sender_type === 'ai'
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                  }`}>
                    <User className={`w-4 h-4 ${
                      msg.sender_type === 'customer' 
                        ? 'text-orange-600' 
                        : msg.sender_type === 'ai'
                        ? 'text-purple-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    {(msg.sender_type === 'ai' || msg.sender_type === 'admin') && (
                      <p className="text-xs font-semibold text-gray-600 mb-1 px-2">
                        {msg.sender_type === 'ai' ? 'Fooda AI' : 'Fooda'}
                      </p>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${
                      msg.sender_type === 'customer'
                        ? 'bg-orange-500 text-white'
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
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-orange-100 sticky bottom-16 pb-safe">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border-orange-200 focus:border-orange-500"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-orange-600"
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <FloatingMenu cartCount={cartCount} userEmail={user?.email} />
    </div>
  );
}