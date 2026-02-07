import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DrinkUpsell({ onAddDrink, selectedDrinks = [] }) {
  const { data: drinks = [] } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => base44.entities.Drink.filter({ is_available: true }, 'display_order'),
  });

  const getDrinkQuantity = (drinkId) => {
    const drink = selectedDrinks.find(d => d.id === drinkId);
    return drink ? drink.quantity : 0;
  };

  if (drinks.length === 0) return null;

  return (
    <Card className="border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">🥤 Add Drinks to Your Order</h3>
        <p className="text-sm text-gray-600 mb-4">Refresh your meal with a cold drink!</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drinks.map((drink) => {
            const quantity = getDrinkQuantity(drink.id);
            return (
              <div key={drink.id} className="bg-white rounded-xl p-3 border border-orange-100 hover:shadow-md transition-all">
                <img 
                  src={drink.image_url} 
                  alt={drink.name} 
                  className="w-full h-24 object-contain rounded-lg mb-2"
                />
                <Badge className="text-xs mb-1" variant="outline">{drink.category}</Badge>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{drink.name}</h4>
                <p className="text-orange-600 font-bold text-sm mb-2">₦{drink.price?.toLocaleString()}</p>
                
                {quantity === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onAddDrink(drink, 1)}
                    className="w-full bg-orange-500 hover:bg-orange-600 h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => onAddDrink(drink, -1)}
                      className="h-8 w-8"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-bold text-sm">{quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      className="bg-orange-600 h-8 w-8"
                      onClick={() => onAddDrink(drink, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}