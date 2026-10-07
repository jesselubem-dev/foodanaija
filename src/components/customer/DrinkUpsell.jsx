import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus } from 'lucide-react';

// "Add a drink" strip shown at checkout.
export default function DrinkUpsell({ onAddDrink, selectedDrinks = [] }) {
  const { data: drinks = [] } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => base44.entities.Drink.filter({ is_available: true }, 'display_order'),
    staleTime: 10 * 60 * 1000,
  });

  const getDrinkQuantity = (drinkId) => selectedDrinks.find(d => d.id === drinkId)?.quantity || 0;

  if (drinks.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5">
        <h3 className="text-[15px] font-semibold text-gray-900">Add a drink</h3>
        <span className="text-[12px] text-gray-500">Optional</span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {drinks.map((drink) => {
          const quantity = getDrinkQuantity(drink.id);
          return (
            <div
              key={drink.id}
              className={`w-[132px] flex-shrink-0 rounded-2xl border p-2.5 ${quantity > 0 ? 'border-fooda-gold/40 f-tint-cream' : 'border-gray-200 bg-white'}`}
            >
              <div className="h-20 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden mb-2">
                {drink.image_url
                  ? <img src={drink.image_url} alt={drink.name} loading="lazy" className="h-full w-full object-contain" />
                  : <span className="text-2xl">🥤</span>}
              </div>
              <p className="text-[13px] font-medium text-gray-900 truncate">{drink.name}</p>
              <p className="text-[12px] text-gray-500 truncate">{drink.category}</p>
              <p className="text-[13px] font-semibold text-gray-900 mt-1">₦{Number(drink.price || 0).toLocaleString()}</p>

              {quantity === 0 ? (
                <button
                  type="button"
                  onClick={() => onAddDrink(drink, 1)}
                  className="mt-2 w-full h-8 rounded-lg text-[12px] font-semibold uppercase f-btn-gold press"
                >
                  Add +
                </button>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-lg px-1 h-8 bg-fooda-gold">
                  <button
                    type="button"
                    onClick={() => onAddDrink(drink, -1)}
                    aria-label={`One less ${drink.name}`}
                    className="w-6 h-6 rounded-full flex items-center justify-center f-bg-ink press"
                  >
                    <Minus className="w-3 h-3" strokeWidth={3} />
                  </button>
                  <span className="text-[13px] font-semibold f-on-gold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => onAddDrink(drink, 1)}
                    aria-label={`One more ${drink.name}`}
                    className="w-6 h-6 rounded-full flex items-center justify-center f-bg-ink press"
                  >
                    <Plus className="w-3 h-3" strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
