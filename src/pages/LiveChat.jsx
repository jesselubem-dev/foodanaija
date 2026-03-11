import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { LanguageProvider } from '../components/LanguageContext';
import ChatPaymentCard from '../components/customer/ChatPaymentCard';
import BottomNav from '../components/customer/BottomNav';

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
                message: `Hello ${userData.full_name.split(' ')[0]}! 👋 Welcome to Fooda Support. I'm here to help you with restaurant recommendations, orders, deliveries, and any questions you have. How can I assist you today?`,
              });
            } catch (error) {
              console.error('Failed to send welcome message:', error);
            }
          }, 500);
        }
      } catch (e) {
        // User not logged in, Layout will handle redirect
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

  // Play beep sound when AI messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_type === 'ai' || lastMessage.sender_type === 'admin') {
        playNotificationSound();
      }
    }
  }, [messages.length]);

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
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('CustomerHome')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Fooda Support</h1>
              <p className="text-xs text-green-600">● Online</p>
            </div>
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
              <div className="mb-3">
                <p className="font-semibold text-gray-900">Fooda</p>
                <p className="text-xs text-gray-500">Online now</p>
              </div>
              <p className="text-gray-700 text-sm">
                Hello! 👋 I'm Fooda, your personal food delivery assistant. How can I help you today?
              </p>
            </div>
            <p className="text-sm text-gray-400">Send a message to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              // Check if message contains order data
              if (msg.message.startsWith('ORDER_DATA:')) {
                try {
                  const orderInfo = JSON.parse(msg.message.replace('ORDER_DATA:', ''));
                  
                  // Group items by restaurant
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
                      onPaymentSuccess={() => {
                        toast.success('Order placed successfully!');
                      }}
                      onCancel={() => {
                        toast.info('Order cancelled');
                      }}
                    />
                  );
                } catch (error) {
                  console.error('Error parsing order data:', error);
                  return null;
                }
              }

              return (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${msg.sender_type === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div>
                    {(msg.sender_type === 'ai' || msg.sender_type === 'admin') && (
                      <p className="text-xs font-semibold text-gray-600 mb-1 px-2">
                        Fooda
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
              );
            })}
            
            {/* AI Typing Indicator */}
            {aiTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1 px-2">Fooda</p>
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-orange-100 sticky bottom-16 pb-safe">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button 
            onClick={startNewChat}
            variant="outline"
            size="sm"
            className="border-orange-200 hover:bg-orange-50 text-orange-600 mb-3 w-full"
          >
            Start New Chat
          </Button>
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