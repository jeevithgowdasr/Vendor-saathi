import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, ThumbsUp, ArrowLeft, MoreVertical, Plus, Sparkles, Gift } from 'lucide-react';

const REVIEWS_DATA = [
  {
    id: 'r1',
    vendorName: 'Ramesh Grocery (Mijar)',
    date: '12 May 2026',
    rating: 5.0,
    categories: 'Vegetables, Fresh Farm Tomatoes, Fruits',
    comment: 'Very fresh vegetables and fruits harvested from Belvai farms. Super fast 20-min express delivery and very courteous service. Highly recommended for villagers in Moodbidri!',
    helpfulCount: 4,
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=150&q=80'
    ]
  },
  {
    id: 'r2',
    vendorName: 'Suresh Provision Store (Moodbidri)',
    date: '10 May 2026',
    rating: 4.5,
    categories: 'Groceries, Byadgi Dry Chillies, Spices',
    comment: 'Top grade authentic Byadgi chillies and whole spices. Packaging was neat in eco-friendly brown bags. Fast response on Kirana chat.',
    helpfulCount: 2,
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1508061252966-f72886f45778?auto=format&fit=crop&w=150&q=80'
    ]
  },
  {
    id: 'r3',
    vendorName: 'Mahesh Kirana (Belvai)',
    date: '08 May 2026',
    rating: 4.8,
    categories: 'Dairy, Nandini Milk, Curd, Vegetables',
    comment: 'Fresh Nandini dairy products delivered chilled at 7 AM. Very reliable morning delivery service for rural households.',
    helpfulCount: 3,
    images: [
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=150&q=80'
    ]
  }
];

export const MyReviewsView = () => {
  const { navigateTo, orders, setIsReviewModalOpen, setReviewOrder, showToast } = useApp();
  const [tab, setTab] = useState('my-reviews'); // to-review | my-reviews
  const [helpfulVotes, setHelpfulVotes] = useState({ r1: 4, r2: 2, r3: 3 });

  const handleHelpful = (id) => {
    setHelpfulVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
    showToast('Marked review as helpful 👍');
  };

  const handleShareInvite = () => {
    navigator.clipboard?.writeText('https://customervendor.vercel.app/?ref=VILLAGE50');
    showToast('🎁 Referral link copied! Share with friends to give ₹50 off.');
  };

  const deliveredOrders = (orders || []).filter(o => o.status === 'Delivered');

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
          border: '1px solid #a7f3d0',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
          ⭐ Customer Reviews & Feedback
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
          Verified feedback on local produce quality, freshness, and delivery service.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '28px' }}>
        <button
          onClick={() => setTab('my-reviews')}
          style={{
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '14.5px',
            color: tab === 'my-reviews' ? '#059669' : '#64748b',
            borderBottom: tab === 'my-reviews' ? '3.5px solid #10b981' : '3.5px solid transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none'
          }}
        >
          My Reviews ({REVIEWS_DATA.length})
        </button>

        <button
          onClick={() => setTab('to-review')}
          style={{
            padding: '12px 20px',
            fontWeight: '800',
            fontSize: '14.5px',
            color: tab === 'to-review' ? '#059669' : '#64748b',
            borderBottom: tab === 'to-review' ? '3.5px solid #10b981' : '3.5px solid transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none'
          }}
        >
          To Review <span className="badge badge-warning" style={{ fontSize: '11px', marginLeft: '4px' }}>{deliveredOrders.length || 1}</span>
        </button>
      </div>

      {/* Review Cards Grid */}
      {tab === 'my-reviews' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {REVIEWS_DATA.map(rev => (
            <div key={rev.id} className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>{rev.vendorName}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>📅 {rev.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: '900', fontSize: '16px' }}>
                    <Star size={18} fill="#10b981" color="#10b981" /> {rev.rating.toFixed(1)}
                  </div>
                </div>

                <span className="badge badge-info" style={{ fontSize: '11.5px', marginBottom: '12px', display: 'inline-block' }}>
                  {rev.categories}
                </span>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.55, marginBottom: '16px' }}>{rev.comment}</p>

                {/* Product Thumbnail Chips */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', overflowX: 'auto' }}>
                  {rev.images.map((img, i) => (
                    <img key={i} src={img} alt="item" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  ))}
                </div>
              </div>

              {/* Helpful Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => handleHelpful(rev.id)}
                  style={{ fontSize: '13px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                >
                  <ThumbsUp size={15} color="#059669" /> Helpful ({helpfulVotes[rev.id] || 3})
                </button>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Verified Purchase</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {(deliveredOrders.length > 0 ? deliveredOrders : [{ id: 'VS10245', vendorName: 'Ramesh Grocery', date: 'Today, 10:25 AM', items: [{ name: 'Fresh Farm Tomatoes' }, { name: 'Byadgi Chilli' }] }]).map(order => (
            <div key={order.id} className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>{order.vendorName}</strong>
                <span className="badge badge-success">Delivered ✓</span>
              </div>
              <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginBottom: '14px' }}>
                Order #{order.id} • {order.date}
              </span>
              <p style={{ fontSize: '13.5px', color: '#334155', marginBottom: '20px' }}>
                How was the quality and doorstep delivery of your order?
              </p>
              <button
                onClick={() => {
                  setReviewOrder(order);
                  setIsReviewModalOpen(true);
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '14px', fontSize: '14px', fontWeight: '800' }}
              >
                ⭐ Rate & Write Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Friends Banner */}
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1.5px solid #bbf7d0',
        borderRadius: '24px',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={28} />
          </div>
          <div>
            <strong style={{ fontSize: '18px', color: '#064e3b', fontWeight: '900' }}>Invite Village Friends & Earn Discounts</strong>
            <p style={{ fontSize: '13.5px', color: '#059669', marginTop: '3px' }}>Share VendorSaathi with friends in your village & local area and get ₹50 coupon on their first order.</p>
          </div>
        </div>
        <button 
          onClick={handleShareInvite}
          className="btn-primary" 
          style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '14px', fontWeight: '800' }}
        >
          Share Invite Link
        </button>
      </div>
    </div>
  );
};
