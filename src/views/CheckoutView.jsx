import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Wallet, 
  Banknote, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  Truck, 
  ShieldCheck, 
  Smartphone,
  QrCode,
  Sparkles,
  Zap,
  Lock,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { processCardPayment } from '../services/stripeService';
import { playSuccessChime } from '../utils/audio';
import { FormField } from '../components/FormField';
import { validateRequiredText } from '../utils/validators';
import { useAsyncMutation } from '../hooks/useAsyncMutation';
import { AsyncButton } from '../components/AsyncButton';
import { EmptyStateFallback } from '../components/EmptyStateFallback';
import { CACHE_KEYS } from '../utils/cacheManager';

export const CheckoutView = () => {
  const { cart, user, placeOrder, navigateTo, showToast } = useApp();
  const [selectedAddress, setSelectedAddress] = useState(user?.address || 'Mijar Village, Moodbidri, Karnataka - 574225');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Call before arrival. Leave at front door if away.');
  const [deliverySlot, setDeliverySlot] = useState('instant'); // instant | evening | tomorrow
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI | Card | Cash on Delivery
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(user?.name || 'Customer');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (user?.address) {
      setSelectedAddress(user.address);
    }
    if (user?.name) {
      setCardName(user.name);
    }
  }, [user]);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = subtotal > 300 || subtotal === 0 ? 0 : 20;
  const total = subtotal + deliveryFee;

  // Async Mutation with double-submission and double-charge prevention
  const { mutateAsync: executeOrderPlacement, isPending: isPlacingOrder } = useAsyncMutation(async (orderPayload) => {
    if (orderPayload.paymentMethod === 'Card') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (!cleanCard || cleanCard.length < 13 || !/^\d+$/.test(cleanCard)) {
        setCardError('Please enter a valid 13-19 digit card number.');
        throw new Error('Please enter a valid 13-19 digit card number.');
      }
      if (!cardExp.trim() || !/^\d{2}\/\d{2}$/.test(cardExp.trim())) {
        setCardError('Please enter expiry date in MM/YY format (e.g. 12/28).');
        throw new Error('Please enter expiry date in MM/YY format.');
      }
      if (!cardCvc.trim() || !/^\d{3,4}$/.test(cardCvc.trim())) {
        setCardError('Please enter a valid 3 or 4-digit CVC/CVV security code.');
        throw new Error('Please enter a valid 3 or 4-digit CVC.');
      }

      setCardError('');
      const [expMonth, expYear] = cardExp.split('/').map(s => s.trim());
      const cardResult = await processCardPayment({
        amount: total,
        currency: 'inr',
        cardNumber,
        expMonth: expMonth || '12',
        expYear: expYear || '28',
        cvc: cardCvc,
        cardholderName: cardName || user?.name || 'Customer',
        customerEmail: user?.email || 'customer@vendorsaathi.com',
        orderId: `VS${Math.floor(10000 + Math.random() * 90000)}`,
        itemsSummary: cart.map(i => `${i.quantity}x ${i.product.shortName || i.product.name}`).join(', '),
        vendorName: cart[0]?.product.vendorName || 'Local Partner Store'
      });

      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        playSuccessChime();
      } catch (err) {}

      showToast(`Stripe Card Payment of ₹${total} Succeeded! 🎉`);

      placeOrder({
        items: cart.map(i => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          unit: i.product.unit,
          quantity: i.quantity,
          image: i.product.image
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod: `Credit / Debit Card (${cardResult.cardBrand || 'Visa'} •••• ${cardResult.cardLast4 || '4242'})`,
        stripePaymentId: cardResult.paymentIntentId,
        paymentStatus: `Paid via Stripe Card Gateway (${cardResult.paymentIntentId.slice(0, 16)})`,
        deliveryAddress: selectedAddress,
        vendorId: cart[0]?.product.vendorId || 'v1',
        vendorName: cart[0]?.product.vendorName || 'Local Partner Store'
      });
      return;
    }

    // Cash on Delivery
    placeOrder({
      items: cart.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
        image: i.product.image
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: 'Cash on Delivery (Doorstep)',
      paymentStatus: 'Pending (Cash on Delivery)',
      deliveryAddress: selectedAddress,
      vendorId: cart[0]?.product.vendorId || 'v1',
      vendorName: cart[0]?.product.vendorName || 'Local Partner Store'
    });
  }, {
    invalidateKeys: [CACHE_KEYS.ORDERS, CACHE_KEYS.CART],
    onError: (err) => {
      setCardError(err.message || 'Payment processing failed.');
    }
  });

  const handleFillTestCard = (e) => {
    e.preventDefault();
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvc('888');
    setCardName(user?.name || 'Customer');
    setCardError('');
    showToast('🧪 Stripe Test Card details auto-filled!');
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      navigateTo('categories');
      return;
    }

    if (paymentMethod === 'UPI') {
      setIsUpiModalOpen(true);
      return;
    }

    executeOrderPlacement({ paymentMethod });
  };

  const handleUpiSuccess = (upiResult) => {
    setIsUpiModalOpen(false);
    placeOrder({
      items: cart.map(i => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        unit: i.product.unit,
        quantity: i.quantity,
        image: i.product.image
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: upiResult.paymentMethod || 'UPI (Instant QR)',
      upiRefId: upiResult.upiRefId,
      upiVpa: upiResult.upiVpa,
      upiApp: upiResult.upiApp,
      stripePaymentId: upiResult.stripePaymentId,
      paymentStatus: upiResult.paymentStatus || `Paid via Stripe UPI (UTR #${upiResult.upiRefId})`,
      deliveryAddress: selectedAddress,
      vendorId: cart[0]?.product.vendorId || 'v1',
      vendorName: cart[0]?.product.vendorName || 'Local Partner Store'
    });
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => navigateTo('cart')}
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
          borderRadius: '20px',
          border: '1px solid #a7f3d0',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> Back to Cart
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          🛒 Final Review & Secure Checkout
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
          Select delivery slot, verify village address and choose instant UPI or Stripe payment.
        </p>
      </div>

      <form onSubmit={handlePlaceOrderSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Delivery & Payment Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Delivery Address */}
          <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '12px', color: '#059669' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Delivery Location</h3>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>GPS Coordinates Calibrated</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => navigateTo('profile')}
                style={{ fontSize: '12.5px', color: '#059669', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change Address
              </button>
            </div>

            <div style={{ padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{user?.name || 'Customer'}</strong>
              <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                {selectedAddress}
              </p>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                📞 Contact: <strong>{user?.phone || '+91 9876543210'}</strong>
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Delivery Instructions for Village Rider (Optional):
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Near yellow gate, call when at junction..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Section 2: Delivery Slot */}
          <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '12px', color: '#2563eb' }}>
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Delivery Speed & Time Slot</h3>
                <span style={{ fontSize: '12px', color: '#475569' }}>Delivered directly from nearest local vendor</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeliverySlot('instant')}
                className="touch-target-44"
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: deliverySlot === 'instant' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                  backgroundColor: deliverySlot === 'instant' ? '#f0fdf4' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="#059669" />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>⚡ Instant (20 Mins)</strong>
                </div>
                <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', display: 'block' }}>Rider departing immediately</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('evening')}
                className="touch-target-44"
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: deliverySlot === 'evening' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                  backgroundColor: deliverySlot === 'evening' ? '#f0fdf4' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={16} color="#475569" />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Evening Slot</strong>
                </div>
                <span style={{ fontSize: '11.5px', color: '#475569', display: 'block' }}>5:00 PM – 7:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('tomorrow')}
                className="touch-target-44"
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: deliverySlot === 'tomorrow' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                  backgroundColor: deliverySlot === 'tomorrow' ? '#f0fdf4' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Truck size={16} color="#475569" />
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Tomorrow Morning</strong>
                </div>
                <span style={{ fontSize: '11.5px', color: '#475569', display: 'block' }}>7:00 AM – 9:00 AM</span>
              </button>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#fdf2f8', padding: '8px', borderRadius: '12px', color: '#db2777' }}>
                <Wallet size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Choose Payment Method</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>100% Encrypted & NPCI Bharat UPI Guaranteed</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* UPI Instant Gateway Option (Primary) */}
              <label style={{
                padding: '18px 20px',
                borderRadius: '20px',
                border: paymentMethod === 'UPI' ? '2.5px solid #059669' : '1.5px solid #e2e8f0',
                backgroundColor: paymentMethod === 'UPI' ? '#f0fdf4' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: paymentMethod === 'UPI' ? '0 6px 20px -4px rgba(5, 150, 105, 0.18)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                    />
                    <div style={{
                      backgroundColor: '#ecfdf5',
                      padding: '10px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#059669'
                    }}>
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15.5px', color: '#0f172a', fontWeight: '900', display: 'block' }}>
                        UPI Instant Payment (QR / GPay / PhonePe / Paytm)
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: '#059669', fontWeight: '700', marginTop: '1px' }}>
                        ⚡ 0% Transaction Fee • Dynamic QR & 1-Tap App Payment (Stripe Powered)
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 9px', fontWeight: '900' }}>
                    Recommended
                  </span>
                </div>

                {paymentMethod === 'UPI' && (
                  <div style={{
                    marginLeft: '36px',
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1.5px solid #a7f3d0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', fontSize: '11px', fontWeight: '800' }}>🔵 Google Pay</span>
                      <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#5f259f', fontSize: '11px', fontWeight: '800' }}>🟣 PhonePe</span>
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#00baf2', fontSize: '11px', fontWeight: '800' }}>🔵 Paytm</span>
                      <span className="badge" style={{ backgroundColor: '#e0f2f1', color: '#00796b', fontSize: '11px', fontWeight: '800' }}>🟠 BHIM UPI</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                      <QrCode size={16} color="#059669" />
                      <span>Clicking below opens the <strong>Live Dynamic QR Code & UPI Apps Modal</strong> to scan & pay instantly.</span>
                    </div>
                  </div>
                )}
              </label>

              {/* Stripe Credit / Debit Card Option */}
              <label style={{
                padding: '18px 20px',
                borderRadius: '20px',
                border: paymentMethod === 'Card' ? '2.5px solid #635bff' : '1.5px solid #e2e8f0',
                backgroundColor: paymentMethod === 'Card' ? '#f8f9ff' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: paymentMethod === 'Card' ? '0 6px 20px -4px rgba(99, 91, 255, 0.18)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="Card"
                      checked={paymentMethod === 'Card'}
                      onChange={() => setPaymentMethod('Card')}
                      style={{ accentColor: '#635bff', width: '18px', height: '18px' }}
                    />
                    <div style={{
                      backgroundColor: '#eef2ff',
                      padding: '10px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#635bff'
                    }}>
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15.5px', color: '#0f172a', fontWeight: '900' }}>
                          Credit / Debit / ATM Card
                        </strong>
                        <span className="badge" style={{ backgroundColor: '#635bff', color: '#ffffff', fontSize: '10px', fontWeight: '800' }}>
                          Stripe Gateway
                        </span>
                      </div>
                      <span style={{ display: 'block', fontSize: '12px', color: '#635bff', fontWeight: '700', marginTop: '1px' }}>
                        🔒 256-Bit SSL Encrypted • Visa, MasterCard, RuPay & Amex
                      </span>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'Card' && (
                  <div style={{
                    marginLeft: '36px',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #c7d2fe',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155' }}>Card Details (Stripe Test Gateway)</span>
                      <button
                        type="button"
                        onClick={handleFillTestCard}
                        style={{
                          backgroundColor: '#eef2ff',
                          color: '#635bff',
                          border: '1px solid #c7d2fe',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        🧪 Fill Stripe Test Card
                      </button>
                    </div>

                    {cardError && (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={15} color="#ef4444" />
                        <span>{cardError}</span>
                      </div>
                    )}

                    <div>
                      <FormField
                        label="Card Number"
                        name="checkout_card_num"
                        required
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={(e) => {
                          setCardNumber(e.target.value);
                          if (cardError) setCardError('');
                        }}
                        maxLength={23}
                        icon={CreditCard}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <FormField
                        label="Expiry (MM/YY)"
                        name="checkout_card_exp"
                        required
                        placeholder="12/28"
                        value={cardExp}
                        onChange={(e) => {
                          setCardExp(e.target.value);
                          if (cardError) setCardError('');
                        }}
                        maxLength={5}
                      />

                      <FormField
                        label="CVC / CVV"
                        name="checkout_card_cvc"
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => {
                          setCardCvc(e.target.value);
                          if (cardError) setCardError('');
                        }}
                        icon={Lock}
                      />
                    </div>
                  </div>
                )}
              </label>

              {/* Cash on Delivery Option */}
              <label style={{
                padding: '16px 20px',
                borderRadius: '18px',
                border: paymentMethod === 'Cash on Delivery' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                backgroundColor: paymentMethod === 'Cash on Delivery' ? '#f0fdf4' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="radio"
                  name="payment"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                />
                <div style={{
                  backgroundColor: '#fff7ed',
                  padding: '9px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c'
                }}>
                  <Banknote size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: '800', display: 'block' }}>
                    Cash on Delivery (COD)
                  </strong>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>
                    Pay in cash directly to your trusted village vendor on doorstep delivery
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Action */}
        <div>
          <div className="vs-card" style={{ padding: '26px', borderRadius: '24px', position: 'sticky', top: '90px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              Order Breakdown ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </h3>

            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', color: '#334155' }}>
                  <span>{item.quantity} x {item.product.shortName || item.product.name}</span>
                  <strong style={{ color: '#0f172a' }}>₹{item.product.price * item.quantity}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13.5px', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee {subtotal > 300 && '(FREE above ₹300)'}</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '20px', 
                fontWeight: '900', 
                color: '#064e3b', 
                paddingTop: '10px', 
                borderTop: '1px dashed #cbd5e1' 
              }}>
                <span>Payable Total</span>
                <span style={{ color: '#059669' }}>₹{total}</span>
              </div>
            </div>

            <AsyncButton
              type="submit"
              isPending={isPlacingOrder}
              loadingText={paymentMethod === 'Card' ? 'Authorizing with Stripe...' : 'Placing Order...'}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                letterSpacing: '0.01em',
                backgroundColor: paymentMethod === 'Card' ? '#635bff' : '#059669'
              }}
            >
              {paymentMethod === 'UPI' ? (
                <>
                  <Zap size={19} />
                  <span>PAY ₹{total} VIA INSTANT UPI</span>
                </>
              ) : paymentMethod === 'Card' ? (
                <>
                  <Lock size={18} />
                  <span>PAY ₹{total} VIA STRIPE CARD</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>CONFIRM & PLACE ORDER (COD)</span>
                </>
              )}
            </AsyncButton>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', marginTop: '14px' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>100% NPCI Bharat UPI & Stripe 256-Bit SSL Protection</span>
            </div>
          </div>
        </div>
      </form>

      {/* Production UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        amount={total}
        orderDetails={{
          orderId: `VS${Math.floor(10000 + Math.random() * 90000)}`,
          itemsSummary: cart.map(i => `${i.quantity}x ${i.product.shortName || i.product.name}`).join(', '),
          vendorName: cart[0]?.product.vendorName || 'Local Partner Store'
        }}
        onPaymentSuccess={handleUpiSuccess}
      />
    </div>
  );
};
