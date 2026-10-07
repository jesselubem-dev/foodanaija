import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export default function CancelOrderModal({ isOpen, order, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full mb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-full f-tint-red flex items-center justify-center">
            <AlertCircle className="w-5 h-5 f-text-red" />
          </div>
          <button onClick={onCancel} aria-label="Close" className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <h3 id="cancel-order-title" className="text-[17px] font-semibold text-gray-900 mb-1">Cancel this order?</h3>
        <p className="text-[14px] text-gray-600 mb-4">
          Your order from <span className="font-semibold text-gray-900">{order?.restaurant_name}</span> will be cancelled.
        </p>
        <div className="rounded-xl p-3 mb-5 f-tint-green">
          <p className="text-[13px] f-text-green">
            <span className="font-semibold">You'll get a full refund within 2 hours</span> of cancelling.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl text-[14px] font-semibold f-btn-outline disabled:opacity-50 press"
          >
            Keep order
          </button>
          <button
            onClick={() => onConfirm(order.id)}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl text-[14px] font-semibold f-btn-danger disabled:opacity-60 press"
          >
            {isLoading ? 'Cancelling...' : 'Cancel order'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
