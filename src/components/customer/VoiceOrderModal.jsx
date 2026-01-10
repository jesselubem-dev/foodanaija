import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mic, MicOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VoiceOrderModal({ isOpen, onClose, restaurants, onAddToCart }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedOrder, setParsedOrder] = useState(null);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userName, setUserName] = useState('');
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
      setTranscript('');
      setParsedOrder(null);
      setError('');
      setConversationHistory([]);
    } else {
      // Auto-start conversation when modal opens
      initializeConversation();
    }
  }, [isOpen]);

  const initializeConversation = async () => {
    try {
      const user = await base44.auth.me();
      const firstName = user.full_name.split(' ')[0];
      setUserName(firstName);
      
      const greeting = `Hello ${firstName}! Welcome to voice ordering. What would you like to order today?`;
      speak(greeting);
      
      setConversationHistory([{
        role: 'assistant',
        message: greeting
      }]);
      
      // Start listening after greeting
      setTimeout(() => {
        startListening();
      }, 3000);
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
    }
  };

  const speak = (text) => {
    return new Promise((resolve) => {
      stopSpeaking();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => {
        setAiSpeaking(true);
      };
      
      utterance.onend = () => {
        setAiSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setAiSpeaking(false);
        resolve();
      };
      
      synthRef.current.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setAiSpeaking(false);
    }
  };

  const startListening = async () => {
    try {
      // Check browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        toast.error('Voice recognition not supported');
        return;
      }

      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr) {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
        toast.error('Microphone access denied');
        return;
      }

      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false for better stability
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
        console.log('Speech recognition started');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const currentTranscript = (finalTranscript || interimTranscript).trim();
        if (currentTranscript) {
          setTranscript(currentTranscript);
          
          // Auto-process when user stops speaking (final result)
          if (finalTranscript.trim()) {
            setTimeout(() => {
              processConversation(finalTranscript.trim());
            }, 500);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          setError('No speech detected. Please speak clearly into your microphone.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone connection.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Error: ${event.error}. Please try again.`);
        }
        
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current.start();
      toast.success('Listening... Speak now!');
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processConversation = async (userMessage) => {
    if (!userMessage || isProcessing) return;

    setIsProcessing(true);
    stopListening();

    // Add user message to history
    const newHistory = [...conversationHistory, {
      role: 'user',
      message: userMessage
    }];
    setConversationHistory(newHistory);

    try {
      // Create restaurant context for AI
      const restaurantContext = restaurants.map(r => ({
        name: r.name,
        id: r.id,
        cuisine: r.cuisine_types?.join(', ')
      }));

      const conversationContext = newHistory.map(h => `${h.role}: ${h.message}`).join('\n');

      const prompt = `You are a friendly voice assistant helping ${userName} order food. Have a natural conversation.

Conversation so far:
${conversationContext}

Available restaurants: ${JSON.stringify(restaurantContext)}

Analyze the conversation and respond with:
1. A friendly conversational response (ask clarifying questions if needed)
2. If you have enough info to place an order, extract the structured order details

Return JSON with:
- response: your conversational response to the user
- order_ready: boolean (true if you have complete order info)
- restaurant_name: restaurant name (if order_ready)
- restaurant_id: restaurant ID (if order_ready)
- items: array of {name, quantity} (if order_ready)
- special_instructions: any notes (if order_ready)

Be conversational, friendly, and confirm details before finalizing.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' },
            order_ready: { type: 'boolean' },
            restaurant_name: { type: 'string' },
            restaurant_id: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' }
                }
              }
            },
            special_instructions: { type: 'string' }
          }
        }
      });

      // Add AI response to history
      setConversationHistory([...newHistory, {
        role: 'assistant',
        message: aiResponse.response
      }]);

      // Speak AI response
      await speak(aiResponse.response);

      // If order is ready, show confirmation
      if (aiResponse.order_ready && aiResponse.items?.length > 0) {
        setParsedOrder(aiResponse);
      } else {
        // Continue conversation
        setTranscript('');
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } catch (err) {
      console.error('Error processing conversation:', err);
      const errorMsg = 'Sorry, I had trouble understanding. Could you repeat that?';
      await speak(errorMsg);
      setConversationHistory([...newHistory, {
        role: 'assistant',
        message: errorMsg
      }]);
      setTimeout(() => {
        startListening();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmOrder = () => {
    if (!parsedOrder) return;

    toast.success('Order details saved! Please find the restaurant and add items to cart.');
    
    // Store order intent for user to complete
    localStorage.setItem('voice_order_intent', JSON.stringify({
      restaurant_id: parsedOrder.restaurant_id,
      items: parsedOrder.items,
      instructions: parsedOrder.special_instructions
    }));

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Order</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Voice Animation */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              animate={isListening ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${
                isListening 
                  ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                  : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : isListening ? (
                <Mic className="w-16 h-16 text-white" />
              ) : (
                <MicOff className="w-16 h-16 text-gray-500 dark:text-gray-400" />
              )}
            </motion.div>

            <p className="text-center text-gray-600 dark:text-gray-400 font-medium">
              {aiSpeaking
                ? '🔊 AI is speaking...'
                : isProcessing 
                ? '🤔 Thinking...' 
                : isListening 
                ? '👂 Listening...' 
                : 'Starting conversation...'}
            </p>
          </div>

          {/* Conversation History */}
          <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
            {conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ml-8'
                    : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mr-8'
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
              </div>
            ))}
            {transcript && isListening && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ml-8 opacity-60">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">You (speaking...)</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{transcript}</p>
              </div>
            )}
          </div>

          {/* Parsed Order */}
          {parsedOrder && !error && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-green-900 dark:text-green-200">Order Understood:</p>
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Restaurant:</strong> {parsedOrder.restaurant_name}</p>
                <div>
                  <strong>Items:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {parsedOrder.items?.map((item, idx) => (
                      <li key={idx}>{item.quantity}x {item.name}</li>
                    ))}
                  </ul>
                </div>
                {parsedOrder.special_instructions && (
                  <p><strong>Notes:</strong> {parsedOrder.special_instructions}</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!parsedOrder ? (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {isListening ? (
                  <p className="animate-pulse">🎤 Listening to your order...</p>
                ) : isProcessing ? (
                  <p className="animate-pulse">⏳ Processing...</p>
                ) : aiSpeaking ? (
                  <p className="animate-pulse">🔊 AI is speaking...</p>
                ) : (
                  <p>Conversation in progress...</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setParsedOrder(null);
                    setTranscript('');
                    setError('');
                  }}
                  variant="outline"
                  className="h-12 rounded-xl"
                >
                  Try Again
                </Button>
                <Button
                  onClick={confirmOrder}
                  className="h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            💡 Just speak naturally! The AI will guide you through your order.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}