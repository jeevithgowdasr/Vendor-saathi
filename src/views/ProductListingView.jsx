import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { MapPin, Star, Plus, Minus, Heart, Filter, Store, Clock, ArrowLeft, Sparkles, Check, MessageSquare, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { EmptyStateFallback } from '../components/EmptyStateFallback';
import { ErrorStateFallback } from '../components/ErrorStateFallback';
import { AsyncButton } from '../components/AsyncButton';
import { getFormattedDistanceAndETA } from '../utils/geolocation';

export const ProductListingView = () => {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    selectedVendor, 
    setSelectedVendor,
    searchQuery, 
    setSearchQuery,
    navigateTo, 
    products,
    cart, 
    addToCart, 
    updateCartQuantity,
    wishlist,
    toggleWishlist,
    setIsVendorChatOpen,
    currentLocation
  } = useApp();

  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high, rating
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Debounce search input for performance & clean query execution
  const debouncedSearch = useDebounce(searchQuery, 250);

  // Filter logic using dynamic products state
  let filteredProducts = (products || []).filter(p => {
    // 1. Strict Category Exclusion for Customer Side (Only Vegetables, Fruits, Greens/Soppu, Flowers)
    const catLower = (p.category || '').toLowerCase();
    const disallowed = ['dry fruit', 'daily essential', 'snack', 'bakery', 'grain', 'pulse', 'grocery & oil', 'grocery', 'oil'];
    if (disallowed.some(d => catLower.includes(d))) return false;

    // 2. Vendor Catalog Active Control: Only show active, approved items
    if (p.status === 'inactive' || p.status === 'blocked' || p.isApproved === false) {
      return false;
    }

    if (inStockOnly && (p.stockStatus === 'out-of-stock' || p.is_available === false)) {
      return false;
    }

    // 3. Category Selection Filter
    if (selectedCategory) {
      const sel = selectedCategory.toLowerCase();
      if (sel === 'greens' || sel.includes('green') || sel.includes('soppu')) {
        if (!catLower.includes('green') && !catLower.includes('soppu') && !catLower.includes('leaf') && !catLower.includes('palak')) return false;
      } else if (sel === 'vegetables' || sel === 'vegetable') {
        if ((!catLower.includes('vegetable') && !catLower.includes('veggie')) || (catLower.includes('green') && !catLower.includes('vegetable'))) return false;
      } else if (sel === 'fruits' || sel === 'fruit') {
        if (!catLower.includes('fruit')) return false;
      } else if (sel === 'flowers' || sel === 'flower') {
        if (!catLower.includes('flower') && !catLower.includes('pooja')) return false;
      } else if (p.category !== selectedCategory) {
        return false;
      }
    }

    if (selectedVendor && (p.vendorId !== selectedVendor.id && p.vendor_id !== selectedVendor.id)) return false;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || 
             p.shortName?.toLowerCase().includes(q) || 
             p.description?.toLowerCase().includes(q) ||
             p.vendorName?.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort logic
  filteredProducts.sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  // Pagination hook: automatically resets to Page 1 on search, category, vendor, sort, or stock filter change
  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    hasPrevPage,
    hasNextPage,
    goToPage,
    nextPage,
    prevPage,
    resetPage
  } = usePagination(filteredProducts, {
    pageSize: 6,
    resetDependencies: [debouncedSearch, selectedCategory, selectedVendor?.id, sortBy, inStockOnly]
  });

  const handleRetryFetch = () => {
    setIsRefreshing(true);
    setFetchError(null);
    setTimeout(() => {
      setIsRefreshing(false);
      resetPage();
    }, 600);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Store Banner (if filtering by specific vendor) */}
      {selectedVendor && (
        <div className="vs-card animate-fade-scale" style={{ 
          padding: '24px', 
          borderRadius: '24px', 
          marginBottom: '28px', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
          border: '1.5px solid #a7f3d0' 
        }}>
          <button 
            onClick={() => setSelectedVendor(null)} 
            style={{ fontSize: '13px', color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to all vendors
          </button>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img 
              src={selectedVendor.avatar} 
              alt={selectedVendor.name}
              style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#064e3b', margin: 0 }}>{selectedVendor.name}</h2>
                <span className="badge badge-success">🟢 Open & Delivering</span>
              </div>
              {(() => {
                const distInfo = selectedVendor ? getFormattedDistanceAndETA(currentLocation, selectedVendor.coordinates || selectedVendor) : null;
                return (
                  <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', margin: '4px 0 0 0' }}>
                    📍 <strong>{distInfo ? distInfo.formattedDistance : selectedVendor.distance}</strong> away • ⚡ {distInfo?.formattedETA || selectedVendor.deliveryTime || '20 mins delivery'} • {selectedVendor.address}
                  </p>
                );
              })()}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 18px', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '17px', fontWeight: '900', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <Star size={16} fill="#059669" /> {selectedVendor.rating}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{selectedVendor.reviewCount} Ratings</span>
              </div>

              <button
                onClick={() => setIsVendorChatOpen(true)}
                className="btn-outline"
                style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '13px' }}
              >
                💬 Chat with Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills Header Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto', 
        paddingBottom: '14px', 
        marginBottom: '20px',
        scrollbarWidth: 'none'
      }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '9px 18px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: '800',
            whiteSpace: 'nowrap',
            backgroundColor: selectedCategory === null ? '#10b981' : '#ffffff',
            color: selectedCategory === null ? '#ffffff' : '#475569',
            border: selectedCategory === null ? '1.5px solid #059669' : '1px solid #cbd5e1',
            boxShadow: selectedCategory === null ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          All Produce ({(products || []).length})
        </button>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            style={{
              padding: '9px 18px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '800',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: selectedCategory === cat.id ? '#10b981' : '#ffffff',
              color: selectedCategory === cat.id ? '#ffffff' : '#475569',
              border: selectedCategory === cat.id ? '1.5px solid #059669' : '1px solid #cbd5e1',
              boxShadow: selectedCategory === cat.id ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Control Bar: Items Count & Sort Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '28px',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
            Showing {filteredProducts.length} Items
          </span>
          {searchQuery && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                for "<strong>{searchQuery}</strong>"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  fontSize: '11px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* In stock toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={inStockOnly} 
              onChange={(e) => setInStockOnly(e.target.checked)}
              style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#059669" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '700',
                color: '#334155',
                outline: 'none',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <option value="popular">🔥 Most Popular</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="price-low">💵 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Fallback */}
      {fetchError ? (
        <ErrorStateFallback
          title="Could Not Load Fresh Produce"
          error={fetchError}
          onRetry={handleRetryFetch}
          isRetrying={isRefreshing}
          onSecondaryAction={() => { setSelectedCategory(null); setSelectedVendor(null); setSearchQuery(''); setFetchError(null); }}
          secondaryActionLabel="Reset All Filters"
        />
      ) : filteredProducts.length === 0 ? (
        /* Empty State Fallback */
        <EmptyStateFallback
          title="No Matching Produce Found"
          description={
            debouncedSearch
              ? `No fresh items found for "${debouncedSearch}". Try checking your spelling or clearing filters.`
              : "No produce available matching this category or stock filter right now."
          }
          icon={Search}
          actionLabel="Reset All Filters"
          onAction={() => {
            setSelectedCategory(null);
            setSelectedVendor(null);
            setSearchQuery('');
            setInStockOnly(false);
          }}
          secondaryActionLabel="Browse Categories"
          onSecondaryAction={() => navigateTo('categories')}
        />
      ) : (
        <>
          {/* Product Grid */}
          <div className="product-grid">
            {paginatedItems.map(prod => {
              const inCart = cart.find(item => item.product.id === prod.id);
              const isWish = wishlist.includes(prod.id);
              const isOutOfStock = prod.stockStatus === 'out-of-stock';

              return (
                <div
                  key={prod.id}
                  className="vs-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    opacity: isOutOfStock ? 0.75 : 1,
                    transition: 'transform 0.22s ease, box-shadow 0.22s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
              {/* Wishlist Heart */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(prod.id)}
                    className="touch-target-44"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '50%',
                      zIndex: 2,
                      color: isWish ? '#ef4444' : '#475569',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    aria-label={`Add ${prod.name} to wishlist`}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Heart size={18} fill={isWish ? '#ef4444' : 'none'} />
                  </button>

                  {/* Popular / Fresh Tag / Out of stock tag */}
                  {isOutOfStock ? (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      zIndex: 2
                    }}>
                      🔴 Out of Stock
                    </span>
                  ) : prod.isPopular && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                    }}>
                      ⭐ Popular
                    </span>
                  )}

                  <div 
                    onClick={() => navigateTo('product-detail', { product: prod })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309' }}>{prod.rating || 4.7}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>({prod.reviewCount || 12})</span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: 1.3, minHeight: '38px', margin: 0 }}>
                      {prod.name}
                    </h4>

                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      📍 {prod.vendorName}
                    </span>

                    <div style={{ margin: '12px 0 6px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#059669' }}>
                        ₹{prod.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        / {prod.unit}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart / Counter */}
                  <div style={{ marginTop: '10px' }}>
                    {isOutOfStock ? (
                      <button
                        disabled
                        style={{ width: '100%', padding: '9px 14px', fontSize: '12.5px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1', cursor: 'not-allowed', fontWeight: '700' }}
                      >
                        Currently Out of Stock
                      </button>
                    ) : inCart ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ecfdf5',
                        border: '1.5px solid #a7f3d0',
                        borderRadius: '12px',
                        padding: '5px 10px'
                      }}>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity - 1)}
                          style={{ color: '#059669', padding: '4px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ fontWeight: '800', color: '#064e3b', fontSize: '14px' }}>
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(prod.id, inCart.quantity + 1)}
                          style={{ color: '#059669', padding: '4px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="btn-primary"
                        style={{ width: '100%', padding: '9px 14px', fontSize: '13px', borderRadius: '12px' }}
                      >
                        <Plus size={16} />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '36px',
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ fontSize: '13px', color: '#334155', fontWeight: '700' }}>
                Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{totalItems}</strong> fresh products
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={!hasPrevPage}
                  onClick={prevPage}
                  className="btn-outline touch-target-44"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: !hasPrevPage ? 0.5 : 1,
                    cursor: !hasPrevPage ? 'not-allowed' : 'pointer'
                  }}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className="touch-target-44"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '800',
                      border: currentPage === pageNum ? '1.5px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: currentPage === pageNum ? '#059669' : '#ffffff',
                      color: currentPage === pageNum ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={nextPage}
                  className="btn-outline touch-target-44"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: !hasNextPage ? 0.5 : 1,
                    cursor: !hasNextPage ? 'not-allowed' : 'pointer'
                  }}
                  aria-label="Next Page"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
