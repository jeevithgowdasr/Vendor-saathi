import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Heart, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { navigateTo, t, vendors } = useApp();

  const registeredVendors = (vendors || []).filter(v =>
    v &&
    v.id !== 'v1' &&
    v.id !== 'v2' &&
    v.id !== 'v3' &&
    v.id !== 'v4' &&
    !v.name?.toLowerCase().includes('green valley') &&
    !v.name?.toLowerCase().includes('basappa') &&
    !v.name?.toLowerCase().includes('kaveri') &&
    !v.name?.toLowerCase().includes('suresh provision') &&
    !v.name?.toLowerCase().includes('mahesh kirana') &&
    !v.owner?.toLowerCase().includes('suresh kumar')
  );

  return (
    <footer style={{ 
      background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)', 
      color: '#cbd5e1', 
      paddingTop: '56px', 
      paddingBottom: '80px', 
      marginTop: '70px',
      borderTop: '1px solid #1e293b'
    }}>
      <div className="container">
        {/* Features Row with Glass Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          paddingBottom: '40px',
          borderBottom: '1px solid #1e293b',
          marginBottom: '40px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '14px', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))', color: '#38bdf8', padding: '12px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '800' }}>{t('footer.qualityTitle', '100% Quality Fresh')}</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t('footer.qualityDesc', 'Farm to table local guarantee')}</p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '14px', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))', color: '#38bdf8', padding: '12px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <Truck size={26} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '800' }}>{t('footer.expressTitle', '20–30 Mins Express')}</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t('footer.expressDesc', 'Delivered directly to doorstep')}</p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '14px', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))', color: '#38bdf8', padding: '12px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <RefreshCw size={26} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '800' }}>{t('footer.replacementTitle', 'Instant Store Replacement')}</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t('footer.replacementDesc', 'Direct support from local vendor')}</p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '14px', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))', color: '#38bdf8', padding: '12px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <Heart size={26} />
            </div>
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '800' }}>{t('footer.empowerTitle', 'Empowering Kirana')}</h4>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{t('footer.empowerDesc', '100% money goes to local vendors')}</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '36px',
          paddingBottom: '40px',
          borderBottom: '1px solid #1e293b'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)', color: '#ffffff', padding: '8px', borderRadius: '10px' }}>
                <ShoppingBag size={20} />
              </div>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
                Vendor<span style={{ color: '#f59e0b' }}>Saathi</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#94a3b8', marginBottom: '18px' }}>
              {t('footer.aboutDesc', 'Bridging local farmers and kirana store owners with rural and urban customers across Karnataka with smart voice assistance & instant delivery.')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="#38bdf8" /> Fast Hyperlocal Grocery Delivery, Karnataka
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#38bdf8" /> +91 98450 12345
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#38bdf8" /> help@vendorsaathi.com
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', marginBottom: '16px', letterSpacing: '0.2px' }}>{t('footer.categoriesHeading', 'Categories')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><button onClick={() => navigateTo('product-listing', { category: 'vegetables' })} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>🥦 {t('categories.vegetables', 'Fresh Farm Vegetables')}</button></li>
              <li><button onClick={() => navigateTo('product-listing', { category: 'fruits' })} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>🍎 {t('categories.fruits', 'Seasonal Coastal Fruits')}</button></li>
              <li><button onClick={() => navigateTo('product-listing', { category: 'greens' })} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>🥬 {t('categories.greens', 'Green Vegetables (Greens / Soppu)')}</button></li>
              <li><button onClick={() => navigateTo('product-listing', { category: 'flowers' })} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>🌸 {t('categories.flowers', 'Fresh Flowers')}</button></li>
            </ul>
          </div>

          {/* Registered Partner Stores (Only displayed when real partners are registered) */}
          {registeredVendors.length > 0 && (
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>{t('footer.partnerStoresHeading', 'Partner Stores')}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {registeredVendors.slice(0, 5).map(v => (
                  <li key={v.id || v.uid}>
                    <button onClick={() => navigateTo('product-listing', { vendor: v })} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      📍 {v.name || v.businessName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer Care */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>{t('footer.customerServiceHeading', 'Customer Service')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><button onClick={() => navigateTo('my-orders')} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>📦 {t('nav.myOrders', 'My Orders & Live Tracking')}</button></li>
              <li><button onClick={() => navigateTo('wishlist')} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>❤️ {t('nav.wishlist', 'Saved Wishlist Items')}</button></li>
              <li><button onClick={() => navigateTo('profile')} style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>👤 {t('nav.myAccount', 'My Account & Settings')}</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Payments */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '28px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div>
            {t('footer.copyright', '© 2026 VendorSaathi. Rural Grocery Network. Built for rural empowerment.')}
          </div>

          {/* Payment Methods Badges */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{t('footer.acceptedPayments', 'Accepted Payments:')}</span>
            <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '4px 9px', borderRadius: '6px', color: '#38bdf8', fontWeight: '800', fontSize: '11px' }}>UPI</span>
            <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '4px 9px', borderRadius: '6px', color: '#60a5fa', fontWeight: '800', fontSize: '11px' }}>GPay</span>
            <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '4px 9px', borderRadius: '6px', color: '#fbbf24', fontWeight: '800', fontSize: '11px' }}>PhonePe</span>
            <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '4px 9px', borderRadius: '6px', color: '#ffffff', fontWeight: '800', fontSize: '11px' }}>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
