import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  MapPin,
  Phone,
  MessageSquare,
  Info,
  ArrowLeft,
  Smartphone,
  Truck,
  Sparkles,
  Radio,
  Clock,
  ChevronRight,
  Store,
  Navigation,
  Plus,
  AlertCircle,
  Star,
  Package,
  Check,
  X,
  Bell,
  Satellite
} from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  requestAdditionalItemInFirebase,
  submitOrderRatingToFirebase,
  subscribeToOrders
} from '../firebase';
import { playPopSound, playSuccessChime, playStatusUpdateSound } from '../utils/audio';
import confetti from 'canvas-confetti';

// 7-Step Order Lifecycle State Machine
export const ORDER_LIFECYCLE_STEPS = [
  { key: 'placed', label: 'Pre-Order Placed', time: 'Just now' },
  { key: 'accepted', label: 'Accepted by Vendor', time: '+5 mins' },
  { key: 'preparing', label: 'Preparing Order', time: '+10 mins' },
  { key: 'on_the_way', label: 'Vendor On the Way', time: '+15 mins' },
  { key: 'nearby', label: 'Vendor Nearby (<500m)', time: 'Under 3 mins' },
  { key: 'arrived', label: 'Arrived at Doorstep', time: 'Now' },
  { key: 'completed', label: 'Order Completed', time: 'Delivered' }
];

export const OrderTrackingView = () => {
  const {
    orders,
    activeOrderId,
    navigateTo,
    setIsVendorChatOpen,
    activeRiderLocation,
    products,
    user,
    showToast
  } = useApp();

  const [activeOrder, setActiveOrder] = useState(() => {
    return orders.find(o => o.id === activeOrderId) || orders[0];
  });

  const [mapProgress, setMapProgress] = useState(0.5);

  // Additional Item Request Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedAddonProduct, setSelectedAddonProduct] = useState(null);
  const [addonQty, setAddonQty] = useState(1);
  const [isSubmittingAddon, setIsSubmittingAddon] = useState(false);

  // Ratings State
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(activeOrder?.isRated || false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Real-time Firestore sync for active order
  useEffect(() => {
    const unsub = subscribeToOrders((allOrders) => {
      const match = allOrders.find(o => o.id === activeOrderId);
      if (match) {
        setActiveOrder(match);
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [activeOrderId]);

  // Keep activeOrder synced with context
  useEffect(() => {
    const current = orders.find(o => o.id === activeOrderId) || orders[0];
    if (current) setActiveOrder(current);
  }, [orders, activeOrderId]);

  // Vector map interpolation
  useEffect(() => {
    if (activeRiderLocation && activeRiderLocation.progress) {
      setMapProgress(activeRiderLocation.progress);
    } else {
      const interval = setInterval(() => {
        setMapProgress(prev => (prev >= 0.95 ? 0.35 : prev + 0.03));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeRiderLocation]);

  if (!activeOrder) return null;

  // Normalize order status to match 7-step lifecycle
  const normalizeStatus = (statusStr) => {
    if (!statusStr) return 'placed';
    const s = statusStr.toLowerCase();
    if (s.includes('place')) return 'placed';
    if (s.includes('accept')) return 'accepted';
    if (s.includes('prepar')) return 'preparing';
    if (s.includes('out') || s.includes('way') || s.includes('transit')) return 'on_the_way';
    if (s.includes('near')) return 'nearby';
    if (s.includes('arriv')) return 'arrived';
    if (s.includes('deliver') || s.includes('complet')) return 'completed';
    if (s.includes('cancel')) return 'cancelled';
    return 'on_the_way';
  };

  const currentStatusCode = normalizeStatus(activeOrder.status);
  const isCompleted = currentStatusCode === 'completed';
  const isNearby = currentStatusCode === 'nearby';
  const isOnTheWay = currentStatusCode === 'on_the_way';
  const isArrived = currentStatusCode === 'arrived';
  const isCancelled = currentStatusCode === 'cancelled';

  // Can request additional item while vendor is on the way or nearby
  const canRequestAddon = (isOnTheWay || isNearby) && !isCompleted && !isCancelled;

  // Step progression index (0 to 6)
  const stepIndex = ORDER_LIFECYCLE_STEPS.findIndex(s => s.key === currentStatusCode);
  const activeStepIdx = stepIndex >= 0 ? stepIndex : 3;

  // Vector curved route coordinates
  const startX = 60;
  const startY = 180;
  const endX = 340;
  const endY = 60;
  const currentX = startX + (endX - startX) * mapProgress;
  const currentY = startY + (endY - startY) * mapProgress - Math.sin(mapProgress * Math.PI) * 45;

  // Approximate distance & ETA calculation
  const distanceKm = Number((1.8 * (1 - mapProgress)).toFixed(1));
  const etaMinutes = Math.max(1, Math.round(distanceKm * 4));

  // Vendor available products for add-on
  const vendorProducts = products.filter(p => p.vendorId === (activeOrder.vendorId || 'v1'));

  // Action: Submit Additional Item Request
  const handleRequestAddon = async () => {
    if (!selectedAddonProduct) {
      showToast('Please select a product from vendor stock.', 'danger');
      return;
    }

    setIsSubmittingAddon(true);
    try {
      const res = await requestAdditionalItemInFirebase(activeOrder.id, {
        productId: selectedAddonProduct.id,
        name: selectedAddonProduct.name,
        price: selectedAddonProduct.price,
        unit: selectedAddonProduct.unit,
        quantity: addonQty
      });

      if (res.success) {
        playPopSound();
        showToast(`Requested ${selectedAddonProduct.name} (+₹${selectedAddonProduct.price * addonQty})! Sent to vendor cart.`, 'success');
        setIsAddonModalOpen(false);
        setSelectedAddonProduct(null);
        setAddonQty(1);
      }
    } catch (err) {
      showToast(`Error requesting item: ${err.message}`, 'danger');
    } finally {
      setIsSubmittingAddon(false);
    }
  };

  // Action: Submit Rating
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setIsSubmittingRating(true);
    try {
      await submitOrderRatingToFirebase({
        orderId: activeOrder.id,
        vendorId: activeOrder.vendorId || 'v1',
        customerId: user?.uid || activeOrder.customerId || 'c1',
        customerName: user?.name || activeOrder.customerName || 'Customer',
        score: ratingScore,
        feedbackText: ratingFeedback
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      playSuccessChime();
      setIsRatingSubmitted(true);
      showToast(`⭐ Thank you for reviewing ${activeOrder.vendorName}! Rating logged.`, 'success');
    } catch (err) {
      showToast(`Could not submit review: ${err.message}`, 'danger');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '28px 0 60px 0', width: '100%' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => navigateTo('my-orders')}
          style={{
            fontSize: '13.5px',
            color: '#059669',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ecfdf5',
            padding: '7px 16px',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to My Orders
        </button>

        {/* Proximity / Status Badge */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isNearby ? '#fef3c7' : '#f0fdf4',
          color: isNearby ? '#b45309' : '#047857',
          border: `1.5px solid ${isNearby ? '#fde68a' : '#bbf7d0'}`,
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12.5px',
          fontWeight: '800'
        }}>
          <Radio size={14} className="animate-pulse" />
          <span>{isNearby ? '🛵 Vendor Nearby (< 500m)' : `Live ETA: ~${etaMinutes} mins (${distanceKm} km)`}</span>
        </span>
      </div>

      {/* Header Banner & Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        background: '#ffffff',
        padding: '22px 28px',
        borderRadius: '24px',
        border: isNearby ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Live Order #{activeOrder.id}
            </h1>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isCompleted ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b',
              animation: 'pulseGlowRing 2s infinite'
            }} />
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'block', marginTop: '4px' }}>
            Mobile Vendor: <strong>{activeOrder.vendorName}</strong> • {activeOrder.date || activeOrder.orderDate || 'Today'} • Express Hyper-Local Route
          </span>
        </div>

        <span className={`badge ${
          isCompleted ? 'badge-success' : isCancelled ? 'badge-danger' : isNearby ? 'badge-warning' : 'badge-info'
        }`} style={{ fontSize: '13.5px', padding: '8px 18px', fontWeight: '800', textTransform: 'uppercase' }}>
          {activeOrder.status || 'On The Way'}
        </span>
      </div>

      {/* Geofencing Proximity Alert Banner (< 500m) */}
      {isNearby && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: '20px',
          padding: '16px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 6px 18px rgba(245, 158, 11, 0.18)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🛵
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#92400e', display: 'block' }}>
                Vendor is Nearby! (Within 500 Meters)
              </strong>
              <span style={{ fontSize: '12.5px', color: '#b45309' }}>
                {activeOrder.vendorName} has entered your delivery perimeter. Please be available at your doorstep!
              </span>
            </div>
          </div>

          <span style={{
            fontSize: '12px',
            fontWeight: '900',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '12px'
          }}>
            Arriving in ~2 Mins
          </span>
        </div>
      )}

      {/* Grid: 7-Step Lifecycle Timeline & Live Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Module 7: 7-Step Lifecycle State Machine Timeline */}
        <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
            <Radio size={17} color="#10b981" />
            <span>Order Lifecycle Checkpoints</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
              const isPastOrCurrent = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <div key={step.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  {idx < ORDER_LIFECYCLE_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '13px',
                      top: '26px',
                      bottom: '-16px',
                      width: '2px',
                      backgroundColor: isPastOrCurrent && idx < activeStepIdx ? '#10b981' : '#e2e8f0',
                      transition: 'background-color 0.3s ease'
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isPastOrCurrent ? '#10b981' : '#f1f5f9',
                      color: isPastOrCurrent ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '900',
                      zIndex: 2,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.25)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {isPastOrCurrent ? '✓' : idx + 1}
                    </div>

                    <div>
                      <strong style={{
                        fontSize: '13.5px',
                        color: isPastOrCurrent ? '#0f172a' : '#94a3b8',
                        display: 'block',
                        lineHeight: 1.2
                      }}>
                        {step.label}
                      </strong>
                      {isCurrent && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>
                          ● Current Stage
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>
                    {step.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Module 8: Live Vector Route Animated Map & Proximity */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Satellite size={16} color="#059669" /> Live GPS Satellite Telemetry
            </span>
            <span className="badge badge-info" style={{ fontSize: '11px' }}>
              {activeOrder?.vendorName || 'Local Vendor'} ⇄ Your Delivery Point
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '240px',
            backgroundColor: '#0f172a',
            borderRadius: '18px',
            position: 'relative',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
          }}>
            <svg width="100%" height="100%" viewBox="0 0 400 240" style={{ position: 'absolute', inset: 0 }}>
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <path d="M 60 180 Q 200 70, 340 60" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="8 6" strokeLinecap="round" />

              {/* Vendor Starting Point */}
              <g transform="translate(60, 180)">
                <circle r="18" fill="rgba(16, 185, 129, 0.3)" />
                <circle r="14" fill="#059669" />
                <text x="-7" y="5" fill="#ffffff" fontSize="13">🏪</text>
              </g>

              {/* Customer Delivery Point */}
              <g transform="translate(340, 60)">
                <circle r="18" fill="rgba(245, 158, 11, 0.3)" />
                <circle r="14" fill="#ea580c" />
                <text x="-6" y="5" fill="#ffffff" fontSize="13">📍</text>
              </g>

              {/* Live Moving Vendor / Scooter */}
              {!isCompleted && !isCancelled && (
                <g transform={`translate(${currentX}, ${currentY})`}>
                  <circle r="18" fill="rgba(6, 182, 212, 0.4)" className="animate-pulse-glow" />
                  <circle r="13" fill="#06b6d4" />
                  <text x="-7" y="4" fill="#ffffff" fontSize="12">🛵</text>
                </g>
              )}
            </svg>

            {/* Floating Live Telemetry Badge */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '8px 14px',
              borderRadius: '14px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                  {activeOrder.vendorName}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Speed: ~24 km/h • GPS Active • {distanceKm} km away
                </span>
              </div>
              <a
                href={`tel:${activeOrder.vendorPhone || '+919876543210'}`}
                style={{
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <Phone size={13} /> Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Module 7: Interactive Additional Item Request Section */}
      {canRequestAddon && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #a7f3d0',
          borderRadius: '24px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                On-The-Way Add-On
              </span>
              <strong style={{ fontSize: '15px', color: '#065f46' }}>
                Forgot an ingredient? Add an extra item from vendor's stock!
              </strong>
            </div>
            <p style={{ fontSize: '12.5px', color: '#047857', margin: 0 }}>
              While the vendor is en-route, you can request an additional item directly from their remaining inventory.
            </p>
          </div>

          <button
            onClick={() => setIsAddonModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '14px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Plus size={16} /> Request Additional Item
          </button>
        </div>
      )}

      {/* Order Items & Contact CTAs */}
      <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px', border: '1.5px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', margin: '0 0 16px 0' }}>
          Items in this Delivery ({(activeOrder.items || []).length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {(activeOrder.items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{item.name}</strong>
                    {item.isAdditionalRequest && (
                      <span className={`badge ${
                        item.requestStatus === 'accepted' ? 'badge-success' : item.requestStatus === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`} style={{ fontSize: '10.5px' }}>
                        Add-On: {item.requestStatus?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {item.quantity} {item.unit} • ₹{item.price} / {item.unit}
                  </span>
                </div>
              </div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>₹{(item.price || 0) * (item.quantity || 1)}</strong>
            </div>
          ))}
        </div>

        {/* Contact CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <a
            href={`tel:${activeOrder.vendorPhone || '+919876543210'}`}
            className="btn-outline"
            style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center' }}
          >
            <Phone size={16} /> Call {activeOrder.vendorName}
          </a>
          <button
            onClick={() => setIsVendorChatOpen(true)}
            className="btn-outline"
            style={{ padding: '12px', fontSize: '13.5px', borderRadius: '12px', justifyContent: 'center' }}
          >
            <MessageSquare size={16} /> Direct Vendor Chat
          </button>
        </div>
      </div>

      {/* Module 9: Ratings & Reviews Form (Upon Order Marked Completed) */}
      {isCompleted && (
        <div className="vs-card" style={{
          padding: '24px',
          borderRadius: '24px',
          marginBottom: '24px',
          border: '1.5px solid #fde68a',
          backgroundColor: '#fffbeb'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#92400e', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
            <span>Rate Your Experience with {activeOrder.vendorName}</span>
          </h3>

          {isRatingSubmitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: '800', fontSize: '14px', marginTop: '10px' }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>Review submitted! Rating score: {ratingScore} Stars. Thank you!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} style={{ marginTop: '14px' }}>
              {/* Star Selection */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '28px'
                    }}
                  >
                    <Star
                      size={28}
                      fill={star <= ratingScore ? '#f59e0b' : 'none'}
                      color={star <= ratingScore ? '#f59e0b' : '#cbd5e1'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="How was the freshness, arrival timing, and service? (Optional)"
                value={ratingFeedback}
                onChange={e => setRatingFeedback(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #fde68a',
                  fontSize: '13.5px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />

              <button
                type="submit"
                disabled={isSubmittingRating}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit 1-5 Star Rating'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer Total Card */}
      <div className="vs-card" style={{
        padding: '18px 24px',
        borderRadius: '20px',
        backgroundColor: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block' }}>Total Amount</span>
          <strong style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>
            ₹{activeOrder.totalAmount || activeOrder.total || 140}
          </strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Payment Mode</span>
          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginTop: '2px' }}>
            {activeOrder.paymentMethod || 'Cash on Delivery'}
          </strong>
        </div>
      </div>

      {/* ============================================================
          MODAL: REQUEST ADDITIONAL ITEM
          ============================================================ */}
      {isAddonModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
              Add Item from Vendor's Mobile Stock
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              The vendor will receive an instant banner to accept or pack this item before reaching you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' }}>
              {vendorProducts.map((p) => {
                const isSelected = selectedAddonProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedAddonProduct(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{p.name}</strong>
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>₹{p.price} / {p.unit}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="#059669" />}
                  </div>
                );
              })}
            </div>

            {selectedAddonProduct && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAddonQty(Math.max(1, addonQty - 1))}
                    style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <strong style={{ fontSize: '15px' }}>{addonQty}</strong>
                  <button
                    type="button"
                    onClick={() => setAddonQty(addonQty + 1)}
                    style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAddonModalOpen(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestAddon}
                disabled={!selectedAddonProduct || isSubmittingAddon}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', backgroundColor: selectedAddonProduct ? '#059669' : '#cbd5e1', color: '#ffffff', fontWeight: '800', cursor: selectedAddonProduct ? 'pointer' : 'not-allowed' }}
              >
                {isSubmittingAddon ? 'Sending...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
