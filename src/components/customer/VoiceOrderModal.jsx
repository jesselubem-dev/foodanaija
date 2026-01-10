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
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setParsedOrder(null);
      setError('');
    }
  }, [isOpen]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser');
      toast.error('Voice recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError('Error recognizing speech. Please try again.');
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processOrder = async () => {
    if (!transcript) {
      toast.error('Please say your order first');
      return;
    }

    setIsProcessing(true);
    stopListening();

    try {
      // Create restaurant context for AI
      const restaurantContext = restaurants.map(r => ({
        name: r.name,
        id: r.id,
        cuisine: r.cuisine_types?.join(', ')
      }));

      const prompt = `You are a food ordering assistant. Parse this customer's voice order and extract structured information.

Customer said: "${transcript}"

Available restaurants: ${JSON.stringify(restaurantContext)}

Extract and return ONLY the following information in JSON format:
- restaurant_name: the restaurant they want to order from (match from available restaurants)
- restaurant_id: the ID of the matched restaurant
- items: array of items they want to order with quantities
- special_instructions: any special notes or dietary requirements
- confidence: how confident you are this is correct (0-100)

If you cannot determine the restaurant or items clearly, set confidence to low and explain what's missing in a "clarification_needed" field.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
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
            special_instructions: { type: 'string' },
            confidence: { type: 'number' },
            clarification_needed: { type: 'string' }
          }
        }
      });

      setParsedOrder(response);

      if (response.confidence < 70 || response.clarification_needed) {
        setError(response.clarification_needed || 'I need more details about your order. Please try again.');
      }
    } catch (err) {
      console.error('Error processing order:', err);
      setError('Failed to process your order. Please try again.');
      toast.error('Failed to process order');
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
              {isProcessing 
                ? 'Processing your order...' 
                : isListening 
                ? 'Listening... Speak your order' 
                : 'Tap the button to start'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">You said:</p>
              <p className="text-gray-700 dark:text-gray-300">{transcript}</p>
            </div>
          )}

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
              <>
                {!isListening ? (
                  <Button
                    onClick={startListening}
                    disabled={isProcessing}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Speaking
                  </Button>
                ) : (
                  <Button
                    onClick={stopListening}
                    className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                {transcript && !isListening && (
                  <Button
                    onClick={processOrder}
                    disabled={isProcessing}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process Order'
                    )}
                  </Button>
                )}
              </>
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
            Example: "I want to order 2 plates of jollof rice and 1 fried chicken from XYZ Restaurant"
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}