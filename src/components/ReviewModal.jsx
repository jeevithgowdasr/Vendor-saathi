import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, X, Upload, CheckCircle2, ThumbsUp, Sparkles, Flame } from 'lucide-react';
import { saveReviewToFirebase } from '../firebase';
import { FormField } from './FormField';
import { validateRequiredText } from '../utils/validators';

export const ReviewModal = () => {
  const { isReviewModalOpen, setIsReviewModalOpen, reviewOrder, showToast } = useApp();
  const [productRating, setProductRating] = useState(5);
  const [vendorRating, setVendorRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState('Fresh quality produce and super fast doorstep delivery! Highly recommended.');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isReviewModalOpen || !reviewOrder) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const textErr = validateRequiredText(reviewText, 'Review Feedback', 5, 500);
    if (textErr) {
      setError(textErr);
      return;
    }
    setError(null);
    setIsSubmitted(true);
    
    // Save review to Firebase
    saveReviewToFirebase({
      orderId: reviewOrder.id,
      vendorId: reviewOrder.vendorId || 'v1',
      vendorName: reviewOrder.vendorName || 'Local Vendor',
      productRating,
      vendorRating,
      deliveryRating,
      reviewText: reviewText.trim(),
      author: user?.name || user?.fullName || 'Verified Customer'
    });

    setTimeout(() => {
      showToast('⭐ Review submitted & synced to Firebase! Thank you for rating.');
      setIsSubmitted(false);
      setIsReviewModalOpen(false);
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '480px',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '28px 24px',
        borderRadius: '28px',
        backgroundColor: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        border: '1.5px solid #d1fae5',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ paddingRight: '12px' }}>
            <span className="badge badge-warning" style={{ marginBottom: '6px', fontSize: '10.5px' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> CUSTOMER FEEDBACK
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Rate & Review Order
            </h3>
            <span style={{ fontSize: '12.5px', color: '#475569', display: 'block', marginTop: '2px', overflowWrap: 'break-word' }}>
              Order #{reviewOrder.id} • {reviewOrder.vendorName}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setIsReviewModalOpen(false)} 
            className="btn-close-modal touch-target-44"
            aria-label="Close Review Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 14px auto' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Thank You!</h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
              Your rating empowers your local village vendor & helps other villagers discover fresh produce.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Product Rating */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Produce Freshness & Quality
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProductRating(star)}
                    style={{ color: star <= productRating ? '#f59e0b' : '#cbd5e1', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star size={26} fill={star <= productRating ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Rating */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Vendor Service ({reviewOrder.vendorName})
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setVendorRating(star)}
                    style={{ color: star <= vendorRating ? '#f59e0b' : '#cbd5e1', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star size={26} fill={star <= vendorRating ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FormField
                as="textarea"
                rows={3}
                label="Your Feedback"
                name="review_feedback"
                required
                placeholder="Share your experience with products, packaging, and delivery..."
                value={reviewText}
                onChange={(e) => {
                  setReviewText(e.target.value);
                  if (error) setError(null);
                }}
                error={error}
                maxLength={500}
                showCount
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '13px', borderRadius: '14px', width: '100%', fontSize: '14.5px', marginTop: '4px' }}>
              <ThumbsUp size={17} />
              <span>Submit Review</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
