        {/* Header */}
        <div className="bg-white px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-fooda-red leading-tight">
                  {greeting}{firstName ? `, ${firstName}` : ''}
                </p>
                <h1 className="text-[20px] font-semibold text-gray-900 leading-snug mt-0.5">
                  What are you craving today?
                </h1>
              </div>
              <div className="flex items-center flex-shrink-0">
                {user ? (
                  <NotificationBell userEmail={user.email} />
                ) : (
                  <button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="bg-fooda-gold text-[#111111] font-semibold text-sm px-4 py-2 rounded-lg press"
                  >
                    Log In
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 pointer-events-none" />
              <Input
                placeholder="Search restaurants, dishes, or cuisines"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-[14px] border-gray-200 bg-white text-[14px] shadow-none focus-visible:ring-1 focus-visible:ring-fooda-gold"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-1 pb-28 lg:pb-8">

          {!term && (
            <>
              {/* Promo card (live promo code) */}
              <HomePromoCard />

              {/* Book a Chef */}
              <Link to={createPageUrl('Chefs')} className="block mb-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3 flex items-center gap-3 press-card">
                  <div className="w-11 h-11 rounded-xl bg-fooda-gold flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-5 h-5" style={{ color: '#111111' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-gray-900 leading-tight">Book a Personal Chef</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 truncate">Describe your meal, a chef cooks it for you</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            </>
          )}

          {/* Restaurants */}
          {restaurantsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-[150px] bg-gray-100" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No restaurants found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant, idx) => {
                const isOpen = isRestaurantOpen(restaurant);
                const subtitle = restaurant.description || restaurant.cuisine_types?.slice(0, 3).join(' · ') || '';
                const content = (
                  <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${isOpen ? 'press-card' : 'opacity-60'}`}>
                    <div className="relative">
                      {restaurant.cover_image_url ? (
                        <img
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          loading="lazy"
                          className={`w-full h-[150px] object-cover ${!isOpen ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className={`w-full h-[150px] bg-gradient-to-br from-amber-100 to-emerald-100 ${!isOpen ? 'grayscale' : ''}`} />
                      )}
                      {!isOpen && (
                        <span
                          className="absolute top-2.5 right-2.5 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm"
                          style={{ backgroundColor: '#ffffff', color: '#374151' }}
                        >
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="px-3.5 py-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-[17px] leading-tight truncate">{restaurant.name}</h3>
                        {subtitle && (
                          <p className="text-[13px] text-gray-500 mt-1 truncate">{subtitle}</p>
                        )}
                        <div className="flex items-center gap-5 mt-1.5 text-[12px] text-gray-700">
                          <span>Delivery ₦{Number(restaurant.delivery_fee || 0).toLocaleString()}</span>
                          <span>{restaurant.delivery_time || '30-45 mins'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                );

                return (
                  <StaggerItem key={restaurant.id} index={idx}>
                    {isOpen ? (
                      <Link
                        to={user ? createPageUrl(`RestaurantDetail?id=${restaurant.id}`) : '#'}
                        onClick={!user ? (e) => { e.preventDefault(); base44.auth.redirectToLogin(window.location.href); } : undefined}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div aria-disabled="true">{content}</div>
                    )}
                  </StaggerItem>
                );
              })}
            </div>
          )}
        </div>

