import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/categories';
import { ArrowRight, ShoppingBag, Sparkles, ArrowLeft } from 'lucide-react';

export const CategoriesView = () => {
  const { navigateTo } = useApp();

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <button
          onClick={() => navigateTo('home')}
          style={{
            fontSize: '13.5px',
            color: '#059669',
            fontWeight: '800',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            padding: '7px 16px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div>
          <span className="badge badge-success" style={{ marginBottom: '8px', fontSize: '12px' }}>
            <Sparkles size={14} color="#f59e0b" /> FRESH CATALOG
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
            All Produce Categories
          </h1>
          <p style={{ fontSize: '15.5px', color: '#64748b', maxWidth: '640px', margin: '8px auto 0 auto', lineHeight: 1.55 }}>
            Select a category to browse farm-fresh vegetables, coastal fruits, spices and daily dairy delivered directly to your doorstep.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '28px'
      }}>
        {CATEGORIES.map(cat => (
          <div
            key={cat.id}
            onClick={() => navigateTo('product-listing', { category: cat.id })}
            className="vs-card vs-card-interactive"
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'relative', height: '190px', overflow: 'hidden' }}>
              <img
                src={cat.image}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(6px)',
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 6px 14px rgba(0,0,0,0.12)'
              }}>
                {cat.icon}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {cat.itemCount}+ Items
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                {cat.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                {cat.description}
              </p>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '14px', 
                borderTop: '1px solid #f1f5f9' 
              }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  color: '#059669', 
                  backgroundColor: '#ecfdf5', 
                  padding: '4px 12px', 
                  borderRadius: '14px',
                  border: '1px solid #a7f3d0'
                }}>
                  Farm Direct
                </span>
                <span style={{ 
                  color: '#059669', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '13.5px', 
                  fontWeight: '800' 
                }}>
                  Explore <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
