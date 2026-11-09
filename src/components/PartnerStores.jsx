import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Store, ArrowRight, Clock, Star, Navigation } from 'lucide-react';
import { subscribeToVendors } from '../firebase';
import { getFormattedDistanceAndETA } from '../utils/geolocation';

export const PartnerStores = () => {
  const { navigateTo, currentLocation, vendors } = useApp();
  const [liveStores, setLiveStores] = useState(vendors || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Connect directly to live Firestore database for authentic partner stores
    const unsubscribe = subscribeToVendors((fetchedStores) => {
      setLiveStores(fetchedStores || []);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Use either active live stores or context stores (both connected to Firestore)
  const activeVendors = (liveStores && liveStores.length > 0) ? liveStores : (vendors || []);

  return (
    <section style={{ marginBottom: '52px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px' }}>
        <div>
          <span style={{ 
            display: 'inline-block',
            padding: '4px 10px', 
            backgroundColor: '#eff6ff', 
            color: '#2563eb', 
            border: '1px solid #bfdbfe', 
            borderRadius: '9999px',
            fontSize: '11px', 
            fontWeight: '800', 
            letterSpacing: '0.05em',
            marginBottom: '8px' 
          }}>
            AUTHENTIC PARTNER STORES
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Partner Stores & Local Vendors
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            Buy directly from authentic, verified neighbourhood vendors & partner stores
          </p>
        </div>
        <button 
          onClick={() => navigateTo('nearby-vendors')}
          style={{ 
            color: '#2563eb', 
            fontWeight: '800', 
            fontSize: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '8px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>View All Stores</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {activeVendors.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200" style={{
          padding: '36px 24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)'
        }}>
          <Store size={36} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
          <p className="font-medium text-slate-700" style={{ fontWeight: '600', color: '#334155', fontSize: '15px', marginBottom: '4px' }}>
            No partner stores listed yet in your area.
          </p>
          <p className="text-sm" style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0' }}>
            Verified local vendors will appear here soon.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigateTo('nearby-vendors')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Navigation size={14} />
              <span>Explore Nearby Map</span>
            </button>
            <button
              onClick={() => navigateTo('login', { role: 'vendor', mode: 'register' })}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Register as Store Partner
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {activeVendors.map(v => {
            const distInfo = getFormattedDistanceAndETA(currentLocation, v.coordinates || v);
            return (
              <div
                key={v.id}
                className="vs-card vs-card-interactive"
                style={{ 
                  borderRadius: '20px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                }}
              >
                <div>
                  <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={v.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
                      alt={v.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
                      <span>Verified Store</span>
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} color="#38bdf8" />
                      <span>{distInfo.formattedETA}</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0f172a' }}>
                        {v.name}
                      </h3>
                      <div style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>{v.rating || '4.8'}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      📍 <strong>{distInfo.formattedDistance}</strong> away • {v.location || 'Local Area'}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(v.categories || ['Produce', 'Vegetables']).map((c, i) => (
                        <span 
                          key={i} 
                          style={{ 
                            backgroundColor: '#f1f5f9', 
                            color: '#334155', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 16px 16px 16px' }}>
                  <button
                    onClick={() => navigateTo('product-listing', { vendor: v })}
                    className="btn-primary"
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      fontSize: '13px', 
                      borderRadius: '12px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontWeight: '700'
                    }}
                  >
                    <Store size={15} />
                    <span>Browse Store Catalog</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PartnerStores;

