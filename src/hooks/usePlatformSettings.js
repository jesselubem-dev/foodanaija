import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isFarDeliveryArea } from '@/lib/sokotoAreas';

const DEFAULTS = {
  delivery_fee: 800,
  far_zone_delivery_fee: 1500,
  vas_tier_1_fee: 300,
  vas_tier_2_min: 5000,
  vas_tier_2_fee: 700,
  vas_tier_3_min: 10000,
  vas_tier_3_fee: 1500,
  vas_tier_4_min: 25000,
  vas_tier_4_fee: 3000,
};

export function usePlatformSettings() {
  const { data: settingsList = [] } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const settings = settingsList.length > 0 ? { ...DEFAULTS, ...settingsList[0] } : DEFAULTS;

  /** Delivery fee per restaurant for the customer's chosen area (Airport / UDUS Main Campus cost more). */
  const getDeliveryFee = (areaName) => {
    if (isFarDeliveryArea(areaName)) {
      const far = Number(settings.far_zone_delivery_fee);
      return Number.isFinite(far) && far > 0 ? far : DEFAULTS.far_zone_delivery_fee;
    }
    return settings.delivery_fee;
  };

  const getVASForSubtotal = (subtotal) => {
    if (subtotal >= settings.vas_tier_4_min) return settings.vas_tier_4_fee;
    if (subtotal >= settings.vas_tier_3_min) return settings.vas_tier_3_fee;
    if (subtotal >= settings.vas_tier_2_min) return settings.vas_tier_2_fee;
    return settings.vas_tier_1_fee;
  };

  const calculateTotalVAS = (cartItems) => {
    const byRestaurant = {};
    cartItems.forEach(item => {
      if (!byRestaurant[item.restaurant_id]) byRestaurant[item.restaurant_id] = 0;
      byRestaurant[item.restaurant_id] += item.price * item.quantity;
    });
    return Object.values(byRestaurant).reduce((sum, sub) => sum + getVASForSubtotal(sub), 0);
  };

  return {
    settings,
    settingsId: settingsList[0]?.id || null,
    getVASForSubtotal,
    calculateTotalVAS,
    getDeliveryFee,
  };
}