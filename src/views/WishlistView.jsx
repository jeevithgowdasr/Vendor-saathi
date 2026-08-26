import React from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/products';
import { Heart, ShoppingBag, ArrowLeft, Trash2, Plus } from 'lucide-react';

export const WishlistView = () => {
  const { wishlist, toggleWishlist, addToCart, navigateTo, showToast } = useApp();

  const wishlistProducts = PRODUCTS.filter(p => wishlist.includes(p.id));

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach(p => addToCart(p, 1));
    showToast(`Moved all ${wishlistProducts.length} items to cart 🛒`);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('profile')}
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
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
            ❤️ My Saved Wishlist ({wishlistProducts.length} Items)
          </h1>
          <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
            Save your favorite local produce to quickly re-order whenever in stock.
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <button
            onClick={handleMoveAllToCart}
            className="btn-primary"
            style={{ padding: '12px 24px', borderRadius: '16px', fontSize: '15px', fontWeight: '800' }}
          >
            <ShoppingBag size={18} />
            <span>Move All to Cart</span>
          </button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="vs-card animate-fade-scale" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '28px', backgroundColor: '#ffffff' }}>
          <Heart size={56} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>Your wishlist is empty</h3>
          <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '6px' }}>Save items you love by tapping the heart icon on any product.</p>
          <button onClick={() => navigateTo('categories')} className="btn-primary" style={{ marginTop: '22px', borderRadius: '14px', padding: '12px 24px' }}>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {wishlistProducts.map(product => (
            <div key={product.id} className="vs-card vs-card-interactive" style={{ padding: '16px', borderRadius: '22px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
              <button
                onClick={() => toggleWishlist(product.id)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  padding: '7px',
                  borderRadius: '50%',
                  color: '#ef4444',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 2
                }}
                title="Remove from wishlist"
              >
                <Heart size={18} fill="#ef4444" />
              </button>

              <div onClick={() => navigateTo('product-detail', { product })} style={{ cursor: 'pointer' }}>
                <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: 1.25 }}>{product.shortName || product.name}</h4>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>📍 {product.vendorName}</span>
                <strong style={{ fontSize: '18px', fontWeight: '900', color: '#059669', display: 'block', margin: '8px 0' }}>₹{product.price} / {product.unit}</strong>
              </div>

              <button
                onClick={() => addToCart(product, 1)}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '13.5px', marginTop: '6px' }}
              >
                <Plus size={16} /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
