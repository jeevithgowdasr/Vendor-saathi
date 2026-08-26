import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Star, Clock, Store, Phone, CheckCircle2, Search, ArrowRight, ArrowLeft, Sparkles, Navigation, Layers } from 'lucide-react';

export const NearbyVendorsView = () => {
  const { navigateTo, setSelectedVendor, currentLocation, setIsLocationModalOpen, vendors } = useApp();
  const [query, setQuery] = useState('');

  const filteredVendors = (vendors || []).filter(v => 
    v.name.toLowerCase().includes(query.toLowerCase()) ||
    v.location.toLowerCase().includes(query.toLowerCase()) ||
    v.owner.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <button
          onClick={() => navigateTo('home')}
          style={{
            fontSize: '13px',
            color: '#059669',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            padding: '6px 14px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div style={{ display: 'block', marginBottom: '8px' }}>
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Store size={13} color="#059669" /> HYPER-LOCAL VILLAGE NETWORK
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: '8px 0' }}>
          Nearby Village Kirana Stores
        </h1>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '700',
          color: '#065f46',
          marginTop: '6px',
          cursor: 'pointer'
        }}
        onClick={() => setIsLocationModalOpen(true)}
        >
          <Navigation size={14} color="#059669" />
          <span>Showing stores delivering to <strong>{currentLocation.name}</strong></span>
        </div>
      </div>

      {/* Search Vendors Bar */}
      <div style={{ maxWidth: '520px', margin: '0 auto 36px auto', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search store name or locality (e.g. Ramesh, Moodbidri)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '13px 18px 13px 44px',
            borderRadius: '24px',
            border: '1.5px solid #cbd5e1',
            fontSize: '14px',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            backgroundColor: '#ffffff',
            fontWeight: '600'
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      </div>

      {/* Grid of Stores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            className="vs-card vs-card-interactive"
            style={{ borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}
          >
            <div>
              <div style={{ position: 'relative', height: '190px', overflow: 'hidden' }}>
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                />
                
                {/* Live Open Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: vendor.status === 'offline' ? '#b91c1c' : '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: vendor.status === 'offline' ? '#ef4444' : vendor.status === 'busy' ? '#f59e0b' : '#10b981',
                    animation: 'pulseGlowRing 2s infinite'
                  }}></span>
                  <span>{vendor.statusLabel || (vendor.isOpen ? 'Open Now' : 'Closed')}</span>
                </div>

                {/* Delivery Time */}
                <span style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Clock size={13} color="#34d399" /> Delivery in {vendor.deliveryTime}
                </span>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                      {vendor.name}
                    </h3>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      📍 {vendor.distance} away • {vendor.location}
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span>{vendor.rating}</span>
                    <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '600' }}>({vendor.reviewCount})</span>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '8px 12px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  color: '#475569', 
                  marginBottom: '14px',
                  border: '1px solid #f1f5f9'
                }}>
                  <strong>Storekeeper:</strong> {vendor.owner} • <strong>Phone:</strong> {vendor.phone}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {vendor.categories.map((c, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        backgroundColor: '#ecfdf5', 
                        color: '#059669', 
                        fontSize: '11.5px', 
                        fontWeight: '700', 
                        padding: '4px 10px', 
                        borderRadius: '8px', 
                        textTransform: 'capitalize' 
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '0 20px 20px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
              <button
                onClick={() => navigateTo('product-listing', { vendor })}
                className="btn-primary"
                style={{ padding: '12px', borderRadius: '14px', fontSize: '13.5px', fontWeight: '800' }}
              >
                <Store size={16} /> Browse Catalog
              </button>

              <button
                onClick={() => navigateTo('vendor-chat', { vendor })}
                className="btn-secondary"
                style={{ padding: '12px 16px', borderRadius: '14px', fontSize: '13.5px', fontWeight: '800', border: '1px solid #cbd5e1' }}
                title="Chat with Vendor"
              >
                💬 Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
