import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, X, Store, Phone, CheckCheck, Mic, Flame } from 'lucide-react';
import { sendChatMessageToFirebase } from '../firebase';

export const VendorChatModal = () => {
  const { isVendorChatOpen, setIsVendorChatOpen, activeOrderId, orders, selectedVendor, user } = useApp();
  const [messages, setMessages] = useState([
    { sender: 'vendor', text: `Namaste! Ramesh here from Ramesh Grocery. Fresh farm produce is ready for your doorstep.`, time: '10:36 AM' },
    { sender: 'customer', text: 'Hi Ramesh Gowda, please make sure the produce is fresh and crisp.', time: '10:38 AM' },
    { sender: 'vendor', text: 'Yes! Handpicked from local Moodbidri farms. Ready for express delivery.', time: '10:40 AM' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isVendorChatOpen) return null;

  const currentOrder = (orders || []).find(o => o.id === activeOrderId) || (orders && orders[0]) || null;
  const vendorName = currentOrder?.vendorName || selectedVendor?.name || 'Ramesh Grocery';
  const vendorId = currentOrder?.vendorId || selectedVendor?.id || 'v1';

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'customer', text: userText, time: timeNow };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Sync to Firestore
    sendChatMessageToFirebase(vendorId, newMsg);

    setTimeout(() => {
      setIsTyping(false);
      const customerName = user?.name ? user.name.split(' ')[0] : 'there';
      const vendorReply = { sender: 'vendor', text: `Got it ${customerName}! I have informed our delivery team. Arriving soon.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, vendorReply]);
      // Sync vendor reply to Firestore
      sendChatMessageToFirebase(vendorId, vendorReply);
    }, 1400);
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
        maxWidth: '460px',
        height: 'min(580px, calc(100dvh - 32px))',
        maxHeight: 'calc(100dvh - 32px)',
        borderRadius: '28px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        border: '1.5px solid #d1fae5'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '14px 20px', 
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', 
          color: '#ffffff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              backgroundColor: '#ffffff', 
              color: '#065f46', 
              fontWeight: '900', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '17px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              flexShrink: 0
            }}>
              R
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: '15.5px', display: 'block', lineHeight: 1.2, fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vendorName}
              </strong>
              <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: '600' }}>
                🟢 Online • Direct Kirana Chat
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsVendorChatOpen(false)} 
            className="btn-close-modal-light touch-target-44"
            aria-label="Close Vendor Chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Log */}
        <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto', overscrollBehavior: 'contain', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                maxWidth: '82%',
                fontSize: '13.5px',
                lineHeight: 1.45,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: msg.sender === 'customer' ? 'none' : '1px solid #e2e8f0',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}
            >
              <div>{msg.text}</div>
              <div style={{ fontSize: '10.5px', textAlign: 'right', marginTop: '4px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                <span>{msg.time}</span>
                {msg.sender === 'customer' && <CheckCheck size={13} />}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
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

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '14px 18px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Type message to your vendor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '11px 16px', 
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
