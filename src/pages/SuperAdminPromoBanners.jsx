import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Plus, Trash2, Eye, EyeOff, ChevronLeft,
  Loader2, Wand2, Search, Check, X, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function SuperAdminPromoBanners() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [generatedBanner, setGeneratedBanner] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(userData => {
      if (userData.role !== 'admin' && userData._app_role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(userData);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: banners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => base44.entities.PromoBanner.list('-created_date'),
    enabled: !!user,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['all-menu-items-banners'],
    queryFn: () => base44.entities.MenuItem.list(),
    enabled: !!user,
  });

  const { data: restaurants = [] } = useQuery({
    queryKey: ['all-restaurants-banners'],
    queryFn: () => base44.entities.Restaurant.filter({ is_approved: true }),
    enabled: !!user,
  });

  const resetForm = () => {
    setShowCreate(false);
    setDescription('');
    setGeneratedBanner(null);
    setSelectedItem(null);
    setMenuSearch('');
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PromoBanner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner created!');
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PromoBanner.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-banners'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoBanner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner deleted');
    },
  });

  const filteredMenuItems = menuItems.filter(item => {
    const restaurant = restaurants.find(r => r.id === item.restaurant_id);
    return (
      item.is_available &&
      (item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
       restaurant?.name.toLowerCase().includes(menuSearch.toLowerCase()))
    );
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const generateBanner = async () => {
    if (!description.trim()) { toast.error('Please describe your promotion'); return; }
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a creative marketing AI for Fooda Naija, a Nigerian food delivery app. 
Generate a vibrant, eye-catching promotional popup banner based on this description: "${description}"

Return a JSON object with these exact fields:
- title: Short punchy headline (max 6 words, ALL CAPS or Title Case, exciting)
- subtitle: Supporting line (max 10 words, friendly and enticing)
- badge_text: Short badge label like "🔥 HOT DEAL", "⚡ FLASH SALE", "🎉 SPECIAL OFFER", "💥 LIMITED TIME" (max 3 words + emoji)
- cta_text: Call to action button text like "Order Now!", "Grab This Deal!", "Add to Cart" (max 4 words)
- emoji: A single relevant food emoji (e.g. 🍕, 🍜, 🍗, 🌮, 🍔, 🥘, 🍱)
- bg_gradient_from: Vibrant hex color for gradient start (choose colors that evoke appetite and excitement, avoid plain white)
- bg_gradient_to: Complementary hex color for gradient end
- accent_color: Bright accent/highlight hex color for the badge and CTA

Make it feel premium, exciting, and culturally relevant to Nigerian food culture. Colors should be warm, vibrant, and appetizing.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            badge_text: { type: 'string' },
            cta_text: { type: 'string' },
            emoji: { type: 'string' },
            bg_gradient_from: { type: 'string' },
            bg_gradient_to: { type: 'string' },
            accent_color: { type: 'string' }
          }
        }
      });
      setGeneratedBanner(result);
    } catch (e) {
      toast.error('Failed to generate banner, please try again');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedBanner) { toast.error('Please generate a banner first'); return; }
    if (!selectedItem) { toast.error('Please select a menu item to promote'); return; }
    const restaurant = restaurants.find(r => r.id === selectedItem.restaurant_id);
    createMutation.mutate({
      ...generatedBanner,
      description,
      menu_item_id: selectedItem.id,
      menu_item_name: selectedItem.name,
      menu_item_price: selectedItem.price,
      menu_item_image: selectedItem.images?.[0] || '',
      restaurant_id: selectedItem.restaurant_id,
      restaurant_name: restaurant?.name || '',
      is_active: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('SuperAdminDashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Promo Banners
            </h1>
            <p className="text-sm text-gray-500">AI-generated popup banners for your app</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" />
          Create Banner
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner Grid */}
        {banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No banners yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first AI-generated promo banner</p>
            <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600">
              Create First Banner
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map(banner => (
              <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Banner Preview */}
                <BannerPreview banner={banner} mini />

                {/* Controls */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{banner.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {banner.menu_item_name && (
                        <span className="text-xs text-gray-400">🍽️ {banner.menu_item_name}</span>
                      )}
                      {banner.restaurant_name && (
                        <span className="text-xs text-gray-400">• {banner.restaurant_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewBanner(banner)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Full Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: banner.id, is_active: !banner.is_active })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {banner.is_active ? <><Eye className="w-3 h-3" />Live</> : <><EyeOff className="w-3 h-3" />Hidden</>}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(banner.id)}
                      className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Banner Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-orange-500" />
                Create AI Promo Banner
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Describe your promo → AI generates → Pick an item → Publish</p>
            </div>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Describe */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                <h3 className="font-semibold text-gray-800">Describe your promotion</h3>
              </div>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. A spicy jollof rice flash sale, 20% off tonight only, make it feel exciting and urgent..."
                className="min-h-[90px] resize-none"
              />
              <Button
                onClick={generateBanner}
                disabled={generating || !description.trim()}
                className="mt-3 bg-orange-500 hover:bg-orange-600 gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generate Banner</>
                )}
              </Button>
            </div>

            {/* Step 2: Preview */}
            {generatedBanner && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                  <h3 className="font-semibold text-gray-800">Preview your banner</h3>
                  <button
                    onClick={generateBanner}
                    disabled={generating}
                    className="ml-auto text-xs text-orange-500 font-medium flex items-center gap-1 hover:text-orange-600"
                  >
                    <Wand2 className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <BannerPreview banner={{ ...generatedBanner, menu_item_name: selectedItem?.name, menu_item_price: selectedItem?.price, menu_item_image: selectedItem?.images?.[0] }} />
              </div>
            )}

            {/* Step 3: Select menu item */}
            {generatedBanner && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">3</div>
                  <h3 className="font-semibold text-gray-800">Select the menu item to promote</h3>
                </div>

                {selectedItem ? (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    {selectedItem.images?.[0] ? (
                      <img src={selectedItem.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{selectedItem.name}</p>
                      <p className="text-xs text-gray-500">{restaurants.find(r => r.id === selectedItem.restaurant_id)?.name} · ₦{selectedItem.price?.toLocaleString()}</p>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="text-orange-400 hover:text-orange-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={menuSearch}
                        onChange={e => setMenuSearch(e.target.value)}
                        placeholder="Search menu items or restaurants..."
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2">
                      {filteredMenuItems.slice(0, 30).map(item => {
                        const restaurant = restaurants.find(r => r.id === item.restaurant_id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-orange-50 rounded-lg transition-colors text-left"
                          >
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">🍽️</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400 truncate">{restaurant?.name} · ₦{item.price?.toLocaleString()}</p>
                            </div>
                          </button>
                        );
                      })}
                      {filteredMenuItems.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-6">No items found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {generatedBanner && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedItem ? `✅ Ready to publish` : '⚠️ Select a menu item to continue'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button
                  onClick={handlePublish}
                  disabled={!selectedItem || createMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                >
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Publishing...</> : '🚀 Publish Banner'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
          {previewBanner && <BannerPreview banner={previewBanner} fullscreen />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerPreview({ banner, mini = false, fullscreen = false }) {
  const from = banner.bg_gradient_from || '#FF6B35';
  const to = banner.bg_gradient_to || '#F7931E';
  const accent = banner.accent_color || '#FFD700';

  return (
    <div
      className={`relative overflow-hidden ${mini ? 'rounded-none' : fullscreen ? 'rounded-3xl' : 'rounded-2xl'} ${mini ? 'h-44' : 'h-72'}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: accent }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15" style={{ background: accent }} />
      <div className="absolute top-1/2 right-4 w-16 h-16 rounded-full opacity-10" style={{ background: 'white' }} />

      <div className={`relative h-full flex flex-col justify-between ${mini ? 'p-4' : 'p-6'}`}>
        {/* Badge */}
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full font-bold text-xs px-3 py-1 shadow-lg ${mini ? 'text-[10px]' : 'text-xs'}`}
            style={{ background: accent, color: '#1a1a1a' }}
          >
            {banner.badge_text || '🔥 SPECIAL OFFER'}
          </span>
        </div>

        {/* Center content */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 text-white">
            <div className={`font-black leading-tight mb-1 ${mini ? 'text-lg' : 'text-2xl'}`}>
              {banner.emoji && <span className="mr-1">{banner.emoji}</span>}
              {banner.title || 'SPECIAL DEAL'}
            </div>
            <p className={`text-white/80 leading-snug ${mini ? 'text-xs' : 'text-sm'} line-clamp-2`}>
              {banner.subtitle || 'Limited time offer'}
            </p>

            {/* Menu item preview */}
            {banner.menu_item_name && (
              <div className="flex items-center gap-2 mt-2 bg-white/15 backdrop-blur-sm rounded-xl px-2.5 py-1.5 w-fit">
                {banner.menu_item_image ? (
                  <img src={banner.menu_item_image} alt="" className={`rounded-lg object-cover ${mini ? 'w-7 h-7' : 'w-9 h-9'}`} />
                ) : (
                  <span className="text-base">🍽️</span>
                )}
                <div>
                  <p className={`font-semibold text-white leading-tight ${mini ? 'text-[10px]' : 'text-xs'}`}>{banner.menu_item_name}</p>
                  {banner.menu_item_price && (
                    <p className={`text-white/70 ${mini ? 'text-[9px]' : 'text-[11px]'}`}>₦{banner.menu_item_price?.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div>
            <div
              className={`text-center font-bold rounded-xl shadow-lg ${mini ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}
              style={{ background: accent, color: '#1a1a1a' }}
            >
              {banner.cta_text || 'Order Now'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}