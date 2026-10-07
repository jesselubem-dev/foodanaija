  const fieldClass = "h-12 rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold";
  const labelClass = "block text-[13px] font-medium text-gray-900 mb-1.5";

  if (cart.length === 0) {
    return (
      <ErrorBoundary>
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_NATIVE }}
          className="text-center"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your order is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add some food before checking out</p>
          <Link
            to={createPageUrl('CustomerHome')}
            className="inline-flex h-11 px-6 rounded-xl text-sm font-semibold items-center press"
            style={{ backgroundColor: '#F5B700', color: '#111111' }}
          >
            Browse restaurants
          </Link>
        </motion.div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <div className="max-w-lg mx-auto relative flex items-center justify-center h-10">
          <Link
            to={createPageUrl('Cart')}
            aria-label="Back to your order"
            className="absolute left-0 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center press"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </Link>
          <h1 className="text-[17px] font-semibold text-gray-900">Checkout</h1>
        </div>
      </header>

      <form id="checkout-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4">
        <h2 className="text-[15px] font-semibold text-gray-900 text-center mt-2 mb-4">Delivery details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="co-name" className={labelClass}>Full name</label>
            <Input
              id="co-name"
              required
              autoComplete="name"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-email" className={labelClass}>Email</label>
            <Input
              id="co-email"
              required
              type="email"
              autoComplete="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-phone" className={labelClass}>Phone number</label>
            <Input
              id="co-phone"
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              placeholder="e.g. 08012345678"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-address" className={labelClass}>Delivery address</label>
            <Input
              id="co-address"
              required
              autoComplete="street-address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="co-notes" className={labelClass}>Special instruction</label>
            <Textarea
              id="co-notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional — e.g. no pepper, call when you arrive"
              className="min-h-[96px] rounded-xl border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
            />
          </div>

          {/* Promo code */}
          <div>
            <label htmlFor="co-promo" className={labelClass}>Promo code</label>
            <AnimatePresence mode="wait">
            {appliedPromo ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_NATIVE }}
                className="rounded-xl border p-3 flex items-start justify-between gap-3"
                style={{ backgroundColor: '#ECFDF3', borderColor: '#BBF7D0' }}
              >
                <div className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 mt-0.5" style={{ color: '#15803D' }} />
                  <div>
                    <p className="font-semibold text-[14px]" style={{ color: '#111111' }}>{appliedPromo.code}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#15803D' }}>
                      {(appliedPromo.discount_type === 'free_delivery' || appliedPromo.is_free_delivery) ? 'Free delivery & service fee' :
                       appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}% off` :
                       `₦${Number(appliedPromo.discount_value).toLocaleString()} off`}
                    </p>
                    {appliedPromo.description && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#6B7280' }}>{appliedPromo.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePromoCode}
                  aria-label="Remove promo code"
                  className="p-1"
                  style={{ color: '#6B7280' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.24, ease: EASE_NATIVE }}
              >
                <div className="flex gap-2.5">
                  <Input
                    id="co-promo"
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); } }}
                    className={`${fieldClass} flex-1 uppercase`}
                  />
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                    className="h-12 px-5 rounded-xl text-[12px] font-semibold uppercase tracking-wide disabled:opacity-60 press"
                    style={{ backgroundColor: '#F5B700', color: '#111111' }}
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-[12px] mt-1.5" style={{ color: '#DC2626' }}>{promoError}</p>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Drinks upsell (existing feature) */}
        <div className="mt-6">
          <DrinkUpsell onAddDrink={handleAddDrink} selectedDrinks={selectedDrinks} />
        </div>

        {/* Order summary */}
        <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: '#FDE68A' }}>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Order summary</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal{drinksSubtotal > 0 ? ' (incl. drinks)' : ''}</span>
              <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Service charge</span>
              <span className="text-gray-900">₦{valueAddedService.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Delivery{restaurantCount > 1 ? ` (${restaurantCount} restaurants)` : ''}</span>
              <span className="text-gray-900">₦{deliveryFee.toLocaleString()}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between">
                <span className="font-medium" style={{ color: '#15803D' }}>Promo discount</span>
                <span className="font-medium" style={{ color: '#15803D' }}>-₦{promoDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 text-[16px]">
              <span className="font-bold text-gray-900">Total</span>
              <motion.span
                key={total}
                initial={{ scale: 0.85, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                className="font-bold text-gray-900 origin-right inline-block"
              >
                ₦{total.toLocaleString()}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Place order */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            disabled={processing}
            className="w-full max-w-lg mx-auto h-14 rounded-2xl flex items-center justify-center gap-1 text-[14px] font-semibold uppercase tracking-wide disabled:opacity-70"
            style={{ backgroundColor: '#F5B700', color: '#111111' }}
          >
            {processing ? 'Processing...' : <>Place order · ₦{total.toLocaleString()} <ChevronRight className="w-4 h-4" /></>}
          </motion.button>
        </div>
      </form>
    </div>
    </ErrorBoundary>
  );
}
