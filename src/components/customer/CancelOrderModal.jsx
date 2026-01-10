import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CancelOrderModal({ isOpen, order, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <button
            onClick={onCancel}
            className="ml-auto hover:bg-gray-100 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to cancel this order from <span className="font-semibold">{order?.restaurant_name}</span>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Keep Order
          </Button>
          <Button
            onClick={() => onConfirm(order.id)}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}