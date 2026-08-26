import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, Truck, Tag, Package, Star, ArrowLeft, Sparkles } from 'lucide-react';

const NOTIFICATIONS_FULL = [
  { id: '1', title: 'Your order #VS10245 has been accepted by Ramesh Grocery.', time: 'Today, 10:35 AM', type: 'success', icon: CheckCircle2, bg: '#ecfdf5', color: '#059669', unread: true },
  { id: '2', title: 'Your order #VS10245 is out for express delivery with rider.', time: 'Today, 11:00 AM', type: 'info', icon: Truck, bg: '#e0f2fe', color: '#0284c7', unread: true },
  { id: '3', title: 'Special Village Offer! Get 10% OFF on all vegetables today with FRESH10.', time: 'Today, 09:00 AM', type: 'promo', icon: Tag, bg: '#f3e8ff', color: '#7e22ce', unread: false },
  { id: '4', title: 'Your order #VS10205 has been delivered successfully to Mijar.', time: 'Yesterday, 12:15 PM', type: 'success', icon: Package, bg: '#ecfdf5', color: '#059669', unread: false },
  { id: '5', title: 'Farm-fresh coastal vegetables & Byadgi chillies are now in stock.', time: '10 May 2026, 09:30 AM', type: 'update', icon: Bell, bg: '#fff7ed', color: '#ea580c', unread: false },
  { id: '6', title: 'Rate your shopping experience for order #VS10105.', time: '08 May 2026, 02:45 PM', type: 'rating', icon: Star, bg: '#fef9c3', color: '#b45309', unread: false }
];

export const NotificationsView = () => {
  const { navigateTo, notifications, setNotifications, showToast } = useApp();

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read! ✓');
  };

  const activeNotifs = (notifications && notifications.length > 0) ? notifications.map(n => ({
    id: n.id,
    title: n.title,
    desc: n.body || '',
    time: n.time || 'Just now',
    type: n.title?.toLowerCase().includes('offer') ? 'promo' : 'info',
    icon: n.title?.toLowerCase().includes('offer') ? Tag : n.title?.toLowerCase().includes('delivered') ? CheckCircle2 : Truck,
    bg: n.title?.toLowerCase().includes('offer') ? '#f3e8ff' : '#ecfdf5',
    color: n.title?.toLowerCase().includes('offer') ? '#7e22ce' : '#059669',
    unread: !n.read
  })) : NOTIFICATIONS_FULL;

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => navigateTo('profile')}
          style={{ 
            fontSize: '13.5px', 
            color: '#059669', 
            fontWeight: '800', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            backgroundColor: '#ecfdf5',
            padding: '6px 14px',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>

        <button
          onClick={handleMarkAllRead}
          style={{
            fontSize: '12.5px',
            color: '#047857',
            backgroundColor: '#ffffff',
            border: '1px solid #a7f3d0',
            padding: '6px 14px',
            borderRadius: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ✓ Mark all as read
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          🔔 Order Updates & Alerts
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
          Real-time notifications about your village deliveries, vendor status & promo codes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {activeNotifs.map(n => {
          const Icon = n.icon;
          const handleNotifClick = () => {
            if (n.type === 'promo') navigateTo('offers');
            else if (n.type === 'rating') navigateTo('my-reviews');
            else if (n.type === 'update') navigateTo('categories');
            else navigateTo('my-orders');
          };

          return (
            <div 
              key={n.id} 
              onClick={handleNotifClick}
              className="vs-card vs-card-interactive" 
              style={{ 
                padding: '18px 20px', 
                borderRadius: '20px', 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'flex-start',
                backgroundColor: n.unread ? '#ffffff' : '#f8fafc',
                border: n.unread ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                boxShadow: n.unread ? '0 4px 14px rgba(16, 185, 129, 0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                backgroundColor: n.bg, 
                color: n.color, 
                padding: '12px', 
                borderRadius: '14px', 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', lineHeight: 1.35, display: 'block', fontWeight: '800' }}>
                    {n.title}
                  </strong>
                  {n.unread && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                  ⏰ {n.time} • Tap to view →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
