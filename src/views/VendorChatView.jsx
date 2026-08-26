import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VENDORS } from '../data/vendors';
import { Send, Phone, ArrowLeft, CheckCheck, Paperclip, Store, Sparkles, Mic } from 'lucide-react';

export const VendorChatView = () => {
  const { navigateTo, selectedVendor, vendors, orders } = useApp();
  const vendor = selectedVendor || (vendors && vendors[0]) || VENDORS[0];

  const [messages, setMessages] = useState([
    { sender: 'customer', text: 'Hello Ramesh Gowda, is fresh tomato available today?', time: '10:20 AM' },
    { sender: 'vendor', text: 'Namaste! Yes, farm-fresh tomatoes just arrived from local Belvai farms.', time: '10:21 AM' },
    { sender: 'customer', text: 'Great! Please add ripe tomatoes to my order.', time: '10:22 AM' },
    { sender: 'vendor', text: 'Sure! Handpicked and packed. Delivery rider is starting now.', time: '10:22 AM' },
    { sender: 'customer', text: 'Thank you so much 😊', time: '10:23 AM' }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'customer', text: userText, time: timeNow }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "Yes! Fresh produce is available. Delivery will take 20-30 mins.";
      if (userText.toLowerCase().includes('offer') || userText.toLowerCase().includes('discount')) {
        reply = "Special offer today: Get 10% OFF on all vegetables using code FRESH10!";
      }
      setMessages(prev => [...prev, { sender: 'vendor', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  const handleChipClick = (chipText) => {
    setInput(chipText);
  };

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="container animate-fade-in" style={{ padding: '24px 0 60px 0', width: '100%' }}>
      <button 
        onClick={() => hasOrders ? navigateTo('order-tracking') : navigateTo('nearby-vendors')}
        style={{ 
          fontSize: '13.5px', 
          color: '#059669', 
          fontWeight: '800', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '16px',
          backgroundColor: '#ecfdf5',
          padding: '6px 14px',
          borderRadius: '12px',
          border: '1px solid #a7f3d0',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} /> {hasOrders ? 'Back to Live Order Tracking' : 'Back to Nearby Stores'}
      </button>

      {/* Main Chat Screen Card */}
      <div className="vs-card animate-fade-scale" style={{
        height: '660px',
        maxHeight: '85vh',
        borderRadius: '28px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.1)',
        border: '1.5px solid #e2e8f0'
      }}>
        {/* Vendor Header */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={vendor.avatar} alt={vendor.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff' }} />
            <div>
              <strong style={{ fontSize: '16px', display: 'block', lineHeight: 1.2, fontWeight: '800' }}>{vendor.name}</strong>
              <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '600' }}>🟢 Online • Verified Local Store</span>
            </div>
          </div>

          <a 
            href={`tel:${vendor.phone}`} 
            style={{ 
              color: '#ffffff', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              padding: '8px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Phone size={18} />
          </a>
        </div>

        {/* Message Log */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'customer' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : '#ffffff',
                color: msg.sender === 'customer' ? '#ffffff' : '#0f172a',
                padding: '12px 16px',
                borderRadius: msg.sender === 'customer' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                maxWidth: '80%',
                fontSize: '13.5px',
                lineHeight: 1.45,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: msg.sender === 'customer' ? 'none' : '1px solid #e2e8f0'
              }}
            >
              <div>{msg.text}</div>
              <div style={{ fontSize: '10.5px', textAlign: 'right', marginTop: '4px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                <span>{msg.time}</span>
                {msg.sender === 'customer' && <CheckCheck size={13} />}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff',
              padding: '10px 16px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'typingDots 1.2s infinite 0s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'typingDots 1.2s infinite 0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'typingDots 1.2s infinite 0.4s' }} />
            </div>
          )}
        </div>

        {/* Fast Suggestion Chips */}
        <div style={{ padding: '10px 18px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['Price for fresh potato?', 'Estimated delivery time?', 'Any active promo codes?'].map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(chip)}
              className="tag-pill"
              style={{ whiteSpace: 'nowrap' }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '14px 18px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type your message to vendor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '11px 18px', 
              borderRadius: '24px', 
              border: '1.5px solid #cbd5e1', 
              fontSize: '13.5px', 
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '11px 18px', borderRadius: '24px' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
