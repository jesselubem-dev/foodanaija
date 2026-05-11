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
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const silenceTimerRef = useRef(null);
  const fullTranscriptRef = useRef('');

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
      
      setConversationHistory([{
        role: 'assistant',
        message: `Hello ${firstName}! Let me recommend some delicious meals for you...`
      }]);
      
      // Auto-generate recommendations
      setTimeout(() => {
        generateRecommendation();
      }, 1000);
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
    }
  };

  const speak = (text) => {
    return new Promise((resolve) => {
      // Stop listening while AI speaks
      stopListening();
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
      
      if (synthRef.current) {
        synthRef.current.speak(utterance);
      } else {
        setAiSpeaking(false);
        resolve();
      }
    });
  };

  const stopSpeaking = () => {
    if (synthRef.current?.speaking) {
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
      recognitionRef.current.continuous = true;
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

        for (let i = 0; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        // Accumulate final transcripts
        if (finalTranscript.trim()) {
          fullTranscriptRef.current += finalTranscript;
        }

        // Show current transcript (accumulated + interim)
        const displayTranscript = (fullTranscriptRef.current + interimTranscript).trim();
        setTranscript(displayTranscript);

        // Clear previous silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Set new timer - process after 1.5 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          if (fullTranscriptRef.current.trim()) {
            const messageToProcess = fullTranscriptRef.current.trim();
            fullTranscriptRef.current = '';
            setTranscript('');
            generateRecommendation();
          }
        }, 1500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Ignore no-speech errors and keep listening
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
          return;
        }
        
        // Handle other errors
        if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone connection.');
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access.');
          toast.error('Microphone access denied');
          setIsListening(false);
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
          setIsListening(false);
        } else if (event.error !== 'aborted') {
          setError(`Error: ${event.error}. Please try again.`);
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if not processing and AI not speaking
        if (!isProcessing && !aiSpeaking && isOpen && !parsedOrder) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 500);
        }
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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    fullTranscriptRef.current = '';
  };

  const generateRecommendation = async () => {
    setIsProcessing(true);

    try {
      // Create restaurant context for AI
      const restaurantContext = restaurants.map(r => ({
        name: r.name,
        id: r.id,
        cuisine: r.cuisine_types?.join(', ')
      }));

      const prompt = `You are an AI food recommendation assistant for ${userName}. 

Available restaurants: ${JSON.stringify(restaurantContext)}

Generate a delicious meal recommendation based on:
- Popular Nigerian cuisine
- Time of day (it's currently ${new Date().getHours()}:00)
- What people usually crave

Return JSON with:
- recommendation_message: A friendly, appetizing description of the recommended meal (2-3 sentences)
- restaurant_name: the restaurant name
- restaurant_id: the restaurant ID
- items: array of {name, quantity} for the recommended items
- why_recommend: Brief reason why this is a great choice right now

Make it sound delicious and irresistible!`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            recommendation_message: { type: 'string' },
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
            why_recommend: { type: 'string' }
          }
        }
      });

      // Add AI recommendation to history
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        message: aiResponse.recommendation_message + '\n\n' + aiResponse.why_recommend
      }]);

      // Speak recommendation
      await speak(aiResponse.recommendation_message);

      // Set parsed order for confirmation
      setParsedOrder(aiResponse);
    } catch (err) {
      console.error('Error generating recommendation:', err);
      const errorMsg = 'Sorry, I had trouble generating a recommendation. Please try again.';
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        message: errorMsg
      }]);
      await speak(errorMsg);
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🤖 AI Auto Order</h2>
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
                {isProcessing ? (
                  <p className="animate-pulse">⏳ Generating recommendation...</p>
                ) : aiSpeaking ? (
                  <p className="animate-pulse">🔊 AI is speaking...</p>
                ) : (
                  <p>AI is thinking of something delicious for you...</p>
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
            ✨ Let AI recommend the perfect meal for you!
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}