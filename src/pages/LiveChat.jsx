import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, Plus, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { LanguageProvider } from '../components/LanguageContext';
import ChatPaymentCard from '../components/customer/ChatPaymentCard';
import { Spinner } from '../components/fooda/ui';

function LiveChatContent() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  
  // Create modern notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // High-pitched, glassy tone (similar to iPhone notification)
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      
      // Smooth attack, quick decay
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Quick decay
      
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cart = JSON.parse(savedCart);
          setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        }

        const storedChatId = localStorage.getItem(`chat_id_${userData.email}`);
        if (storedChatId) {
          setChatId(storedChatId);
        } else {
          const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(`chat_id_${userData.email}`, newChatId);
          setChatId(newChatId);
          
          setTimeout(async () => {
            try {
              await base44.entities.ChatMessage.create({
                chat_id: newChatId,
                customer_email: userData.email,
                customer_name: userData.full_name,
                sender_type: 'ai',
                sender_name: 'Fooda',
                message: `Hello ${(userData.full_name || 'there').split(' ')[0]}! 👋 Welcome to Fooda Support. I'm here to help you with restaurant recommendations, orders, deliveries, and any questions you have. How can I assist you today?`,
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
    initChat();
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => base44.entities.ChatMessage.filter(
      { chat_id: chatId },
      'created_date'
    ),
    enabled: !!chatId,
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 1000,
    refetchOnWindowFocus: true,
  });

  // Play a beep when a NEW support reply arrives (not on first load)
  const seenCount = useRef(null);
  useEffect(() => {
    if (isLoading) return;
    if (seenCount.current === null) { seenCount.current = messages.length; return; }
    if (messages.length > seenCount.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_type === 'ai' || lastMessage.sender_type === 'admin') playNotificationSound();
    }
    seenCount.current = messages.length;
  }, [messages.length, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      setMessage('');
      
      // Show typing indicator
      setAiTyping(true);
      
      // Trigger AI response
      try {
        const response = await base44.functions.invoke('aiChatResponse', {
          chat_id: chatId,
          customer_message: variables.message,
          customer_name: user.full_name,
          customer_email: user.email,
        });
        
        queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        
        // Send fallback message
        try {
          await base44.entities.ChatMessage.create({
            chat_id: chatId,
            customer_email: user.email,
            customer_name: user.full_name,
            sender_type: 'ai',
            sender_name: 'Fooda',
            message: "I'm having trouble connecting right now. Please try browsing our restaurants directly or contact support if you need immediate help.",
          });
          
          queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
        } catch (fallbackError) {
          console.error('Failed to send fallback message:', fallbackError);
          toast.error('Connection issue. Please try again.');
        }
      } finally {
        setAiTyping(false);
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
    seenCount.current = null;
    setChatId(newChatId);
    
    // Send welcome message from AI
    setTimeout(async () => {
      try {
        await base44.entities.ChatMessage.create({
          chat_id: newChatId,
          customer_email: user.email,
          customer_name: user.full_name,
          sender_type: 'ai',
          sender_name: 'Fooda',
          message: `Hello ${(user.full_name || 'there').split(' ')[0]}! 👋 Welcome back to Fooda Support. How can I assist you today?`,
        });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', newChatId] });
        toast.success('New chat started');
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    }, 500);
  };

  if (!user || !chatId) {
    return <Spinner fullScreen />;
  }

  const isSupport = (msg) => msg.sender_type === 'ai' || msg.sender_type === 'admin';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            to={createPageUrl('CustomerSettings')}
            aria-label="Back"
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center flex-shrink-0 press"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-fooda-gold flex items-center justify-center flex-shrink-0">
            <Headphones className="w-5 h-5 f-on-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">Fooda Support</h1>
            <p className="text-[12px] f-text-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Online
            </p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="h-9 px-3 rounded-lg text-[12px] font-semibold flex items-center gap-1 f-btn-outline press"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-lg w-full mx-auto px-4 py-4 pb-28">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-2xl rounded-tl-md p-4 mb-4 max-w-[85%] text-left bg-gray-100">
              <p className="text-[12px] font-semibold text-gray-700 mb-1">Fooda</p>
              <p className="text-[14px] text-gray-900">Hello! 👋 I'm Fooda, your food delivery assistant. How can I help you today?</p>
            </div>
            <p className="text-[13px] text-gray-400">Send a message to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              // Messages carrying an order become a payment card
              if (msg.message?.startsWith('ORDER_DATA:')) {
                try {
                  const orderInfo = JSON.parse(msg.message.replace('ORDER_DATA:', ''));
                  const ordersByRestaurant = orderInfo.reduce((acc, item) => {
                    const existing = acc.find(o => o.restaurant_id === item.restaurant_id);
                    if (existing) {
                      existing.items.push(item);
                      existing.total += item.price * item.quantity;
                    } else {
                      acc.push({
                        restaurant_id: item.restaurant_id,
                        restaurant_name: item.restaurant_name,
                        items: [item],
                        total: item.price * item.quantity,
                        delivery_address: 'Set during checkout'
                      });
                    }
                    return acc;
                  }, []);

                  return (
                    <ChatPaymentCard
                      key={msg.id}
                      orderData={ordersByRestaurant}
                      onPaymentSuccess={() => toast.success('Order placed successfully!')}
                      onCancel={() => toast.info('Order cancelled')}
                    />
                  );
                } catch (error) {
                  console.error('Error parsing order data:', error);
                  return null;
                }
              }

              const mine = !isSupport(msg);
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-3.5 py-2.5 text-[14px] leading-snug whitespace-pre-wrap break-words ${
                        mine
                          ? 'rounded-2xl rounded-br-md f-btn-gold'
                          : 'rounded-2xl rounded-bl-md bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 px-1">
                      {!mine && <span className="font-medium text-gray-500">{msg.sender_type === 'admin' ? (msg.sender_name || 'Fooda team') : 'Fooda'} · </span>}
                      {new Date(msg.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {aiTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 flex gap-1" aria-label="Fooda is typing">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-2">
          <Input
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Message"
            className="flex-1 h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="submit"
            aria-label="Send"
            className="w-12 h-12 rounded-xl flex items-center justify-center f-btn-gold press"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LiveChat() {
  return (
    <LanguageProvider>
      <LiveChatContent />
    </LanguageProvider>
  );
}