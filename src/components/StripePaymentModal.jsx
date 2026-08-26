import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { processCardPayment, STRIPE_PUBLISHABLE_KEY } from '../services/stripeService';
import { 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  Check, 
  Loader2,
  Calendar,
  KeyRound,
  User,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StripePaymentModal = ({
  isOpen,
  onClose,
  amount,
  orderDetails,
  onPaymentSuccess
}) => {
  const { user, showToast } = useApp();

  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState(user?.name || 'Bhavana Bai');
  const [postalCode, setPostalCode] = useState(user?.pincode || '574225');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cardBrand, setCardBrand] = useState('generic');

  if (!isOpen) return null;

  // Format and detect card brand
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    // Detect brand
    if (/^4/.test(val)) setCardBrand('visa');
    else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) setCardBrand('mastercard');
    else if (/^3[47]/.test(val)) setCardBrand('amex');
    else if (/^(60|65|81|82)/.test(val)) setCardBrand('rupay');
    else if (/^6(?:011|5)/.test(val)) setCardBrand('discover');
    else setCardBrand('generic');

    // Format with spaces
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    if (errorMessage) setErrorMessage('');
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      const month = val.slice(0, 2);
      const year = val.slice(2, 4);
      setExpMonth(month);
      setExpYear(year ? `20${year}` : '');
    } else {
      setExpMonth(val);
      setExpYear('');
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardBrand('visa');
    setExpMonth('12');
    setExpYear('2028');
    setCvc('123');
    setCardholderName(user?.name || 'Bhavana Bai');
    setPostalCode('574225');
    setErrorMessage('');
    showToast('Loaded Stripe 4242 Test Card Credentials ✨');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      setErrorMessage('Please enter a valid 16-digit card number.');
      return;
    }
    if (!expMonth || !expYear) {
      setErrorMessage('Please enter a valid expiration date (MM/YY).');
      return;
    }
    if (!cvc || cvc.length < 3) {
      setErrorMessage('Please enter a valid 3 or 4-digit CVC code.');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentResult = await processCardPayment({
        amount: amount || 140,
        currency: 'inr',
        cardNumber: cleanCard,
        expMonth: parseInt(expMonth, 10),
        expYear: parseInt(expYear, 10),
        cvc,
        cardholderName,
        customerEmail: user?.email || 'customer@vendorsaathi.com',
        postalCode,
        orderId: orderDetails?.orderId || `VS${Date.now().toString().slice(-5)}`,
        itemsSummary: orderDetails?.itemsSummary || 'Village Fresh Produce',
        vendorName: orderDetails?.vendorName || 'Ramesh Grocery'
      });

      if (paymentResult.success) {
        try {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        showToast(`Stripe Payment Verified: ₹${paymentResult.amount} Authorized! 💳`);
        setIsProcessing(false);
        onPaymentSuccess(paymentResult);
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment authorization failed on Stripe gateway. Please check card details.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(8px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="vs-card animate-modal-pop" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '94vh',
        backgroundColor: '#ffffff',
        borderRadius: '28px',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1.5px solid #d1fae5'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              color: '#065f46',
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#ffffff' }}>
                  Stripe Payment Gateway
                </h3>
                <span className="badge" style={{ backgroundColor: '#635bff', color: '#ffffff', fontSize: '10px', padding: '2px 8px', fontWeight: '800' }}>
                  STRIPE LIVE
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: '600' }}>
                256-Bit SSL Encrypted • PCI DSS Level 1 Certified
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="btn-close-modal-light touch-target-44"
            aria-label="Close Stripe Payment Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Payable Total Header Box */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Amount to Pay
              </span>
              <strong style={{ fontSize: '26px', fontWeight: '900', color: '#064e3b', display: 'block', lineHeight: 1.1 }}>
                ₹{amount}
              </strong>
            </div>

            <button
              type="button"
              onClick={fillTestCard}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #10b981',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '800',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>Fill 4242 Test Card</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Card Number */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Card Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="4242  4242  4242  4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  style={{
                    width: '100%',
                    padding: '12px 48px 12px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                  required
                />
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cardBrand === 'visa' && <span className="badge" style={{ backgroundColor: '#1a1f71', color: '#fff', fontSize: '10px', fontWeight: '900' }}>VISA</span>}
                  {cardBrand === 'mastercard' && <span className="badge" style={{ backgroundColor: '#eb001b', color: '#fff', fontSize: '10px', fontWeight: '900' }}>MC</span>}
                  {cardBrand === 'rupay' && <span className="badge" style={{ backgroundColor: '#008542', color: '#fff', fontSize: '10px', fontWeight: '900' }}>RuPay</span>}
                  {cardBrand === 'generic' && <CreditCard size={20} color="#94a3b8" />}
                </div>
              </div>
            </div>

            {/* Expiry and CVC Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Valid Thru (MM/YY)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={expMonth && expYear ? `${expMonth}/${expYear.slice(-2)}` : expMonth}
                    onChange={handleExpiryChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                    required
                  />
                  <Calendar size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  CVC / CVV
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                    required
                  />
                  <KeyRound size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Name on Card
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Bhavana Bai"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            {/* Postal PIN Code */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Billing Postal / PIN Code
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="574225"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  required
                />
                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '900',
                letterSpacing: '0.3px',
                marginTop: '10px',
                backgroundColor: isProcessing ? '#047857' : undefined
              }}
            >
              {isProcessing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Authorizing via Stripe Gateway...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Lock size={18} />
                  <span>PAY ₹{amount} SECURELY NOW</span>
                </div>
              )}
            </button>
          </form>

          {/* Security Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '20px', fontSize: '11.5px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} color="#059669" /> Stripe Certified
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={14} color="#059669" /> 256-Bit SSL
            </span>
            <span>•</span>
            <span>Zero Gateway Surcharge</span>
          </div>
        </div>
      </div>
    </div>
  );
};
