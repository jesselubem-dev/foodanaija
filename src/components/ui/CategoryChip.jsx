import React from 'react';

const categoryIcons = {
  'Swallow': '🍚',
  'Rice': '🍛',
  'Soups': '🍲',
  'Grills': '🍗',
  'Snacks': '🥟',
  'Drinks': '🥤',
  'Breakfast': '🍳',
  'Desserts': '🍰',
  'All': '🍽️'
};

export default function CategoryChip({ category, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
          : 'bg-white text-gray-600 hover:bg-emerald-50 border border-emerald-100'
      }`}
    >
      <span className="text-lg">{categoryIcons[category] || '🍽️'}</span>
      <span className="font-medium text-sm">{category}</span>
    </button>
  );
}