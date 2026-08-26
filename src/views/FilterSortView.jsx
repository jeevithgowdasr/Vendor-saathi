import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { ArrowLeft, Filter, SlidersHorizontal, Plus, Minus, Star, Heart } from 'lucide-react';

export const FilterSortView = () => {
  const { navigateTo, addToCart, cart, updateCartQuantity, wishlist, toggleWishlist } = useApp();
  
  const [selectedCatId, setSelectedCatId] = useState('vegetables');
  const [maxPrice, setMaxPrice] = useState(200);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  const filteredProducts = PRODUCTS.filter(p => {
    if (selectedCatId && p.category !== selectedCatId) return false;
    if (p.price > maxPrice) return false;
    if (inStockOnly && p.availableStock <= 0) return false;
    return true;
  });

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('home')}
        style={{ 
          fontSize: '13.5px', 
          color: '#059669', 
          fontWeight: '800', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '20px',
          backgroundColor: '#ecfdf5',
          padding: '6px 14px',
          borderRadius: '12px',
          border: '1px solid #a7f3d0'
        }}
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
            {selectedCatId ? `${selectedCatId} Produce` : 'Fresh Produce Catalog'}
          </h1>
          <span style={{ fontSize: '13.5px', color: '#64748b' }}>
            Showing {filteredProducts.length} filtered items available for instant delivery
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} color="#059669" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              padding: '9px 16px', 
              borderRadius: '14px', 
              border: '1.5px solid #cbd5e1', 
              fontSize: '13.5px', 
              fontWeight: '700',
              outline: 'none', 
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="popular">🔥 Most Popular</option>
            <option value="price-low">💵 Price: Low to High</option>
            <option value="price-high">💎 Price: High to Low</option>
            <option value="rating">⭐ Top Rated</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px' }}>
        {/* Left Filter Sidebar */}
        <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', height: 'fit-content', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
            Filter Options
          </h3>

          {/* Category Checkboxes */}
          <div style={{ marginBottom: '22px' }}>
            <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '10px', fontWeight: '800' }}>Categories</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CATEGORIES.map(cat => (
                <label key={cat.id} style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#334155', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={selectedCatId === cat.id}
                    onChange={() => setSelectedCatId(cat.id === selectedCatId ? '' : cat.id)}
                    style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                  />
                  <span>{cat.icon} {cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#334155', fontWeight: '800' }}>Max Price</strong>
              <span style={{ fontSize: '13px', color: '#059669', fontWeight: '900' }}>₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
          </div>

          {/* Stock Availability */}
          <div style={{ marginBottom: '24px' }}>
            <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '10px', fontWeight: '800' }}>Availability</strong>
            <label style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
              <span>🟢 In Stock Today</span>
            </label>
          </div>

          <button 
            onClick={() => { setSelectedCatId(null); setMaxPrice(500); setInStockOnly(false); }}
            className="btn-secondary" 
            style={{ width: '100%', borderRadius: '14px', padding: '11px', fontSize: '13px' }}
          >
            Reset All Filters
          </button>
        </div>

        {/* Product Grid Pane */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '18px'
          }}>
            {filteredProducts.map(product => {
              const cartItem = cart.find(item => item.product.id === product.id);

              return (
                <div key={product.id} className="vs-card vs-card-interactive" style={{ borderRadius: '20px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
                  <div onClick={() => navigateTo('product-detail', { product })} style={{ cursor: 'pointer' }}>
                    <div style={{ height: '170px', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                    </div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.25 }}>{product.shortName || product.name}</h4>
                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>📍 {product.vendorName}</span>
                    <strong style={{ fontSize: '16px', fontWeight: '900', color: '#059669', display: 'block', margin: '8px 0' }}>₹{product.price} / {product.unit}</strong>
                  </div>

                  <button
                    onClick={() => addToCart(product, 1)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', fontSize: '12.5px' }}
                  >
                    <Plus size={15} /> Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
