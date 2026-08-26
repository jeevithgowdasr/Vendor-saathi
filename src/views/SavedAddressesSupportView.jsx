import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Briefcase, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ChevronRight, 
  PhoneCall,
  Check,
  MapPin,
  Sparkles,
  Headphones,
  X
} from 'lucide-react';
import { saveUserProfileToFirebase } from '../firebase';
import { FormField } from '../components/FormField';
import { validateRequiredText } from '../utils/validators';

export const SavedAddressesSupportView = () => {
  const { user, updateUserProfile, navigateTo, showToast, setIsVendorChatOpen } = useApp();
  const [selectedAddrId, setSelectedAddrId] = useState('addr1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [isNewDefault, setIsNewDefault] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const userAddresses = user?.addresses || [
    { id: 'addr1', tag: 'Home', address: user?.address || 'Mijar Village, Moodbidri, Karnataka - 574225', isDefault: true }
  ];

  const handleDeleteAddress = (id) => {
    if (userAddresses.length <= 1) {
      showToast('Cannot delete primary default address', 'danger');
      return;
    }
    const updatedAddresses = userAddresses.filter(a => a.id !== id);
    const updatedUser = { ...user, addresses: updatedAddresses };
    updateUserProfile(updatedUser);
    showToast('Address removed from saved list');
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    const err = validateRequiredText(newAddressText, 'Full Address', 5, 250);
    if (err) {
      setAddressError(err);
      showToast(`⚠️ ${err}`, 'danger');
      return;
    }
    setAddressError(null);

    const newId = `addr_${Date.now()}`;
    const newAddressObj = {
      id: newId,
      tag: newTag,
      address: newAddressText.trim(),
      isDefault: isNewDefault || userAddresses.length === 0
    };

    let updatedAddresses = [...userAddresses];
    if (newAddressObj.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddressObj);

    const updatedUser = {
      ...user,
      address: newAddressObj.isDefault ? newAddressObj.address : user.address,
      addresses: updatedAddresses
    };

    updateUserProfile(updatedUser);
    setSelectedAddrId(newId);
    setNewAddressText('');
    setIsAddModalOpen(false);
    showToast(`📍 New ${newTag} address saved successfully!`);
  };

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
          border: '1px solid #a7f3d0'
        }}
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>
          📍 Delivery Addresses & Support
        </h1>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px' }}>
          Manage your saved drop-off locations or get instant customer assistance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        {/* Saved Addresses Section */}
        <div className="vs-card" style={{ padding: '30px', borderRadius: '28px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Saved Addresses
            </h2>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '12px', fontWeight: '800' }}
            >
              <Plus size={16} /> Add Address
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userAddresses.map(addr => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddrId(addr.id)}
                style={{
                  padding: '18px 20px',
                  borderRadius: '20px',
                  border: selectedAddrId === addr.id ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                  backgroundColor: selectedAddrId === addr.id ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: selectedAddrId === addr.id ? '6px solid #10b981' : '2px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      marginTop: '3px',
                      flexShrink: 0
                    }} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>{addr.tag}</strong>
                        {addr.isDefault && (
                          <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            Default
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#475569', marginTop: '6px', lineHeight: 1.45 }}>
                        {addr.address}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr.id);
                    }}
                    style={{ color: '#94a3b8', padding: '6px', borderRadius: '8px', transition: 'color 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Quick Resolution Section */}
        <div className="vs-card" style={{ padding: '30px', borderRadius: '28px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '20px' }}>
            Help & Customer Care
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* FAQ Accordion Items */}
            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
              {[
                { label: 'How fast is village express delivery?', desc: 'Deliveries are completed within 20–30 minutes directly from your local village store to your doorstep.' },
                { label: 'Can I pay Cash on Delivery (COD)?', desc: 'Yes! We support 100% Cash on Delivery along with UPI (GPay, PhonePe, Paytm) and Debit/Credit cards.' },
                { label: 'What if items are not fresh?', desc: 'We offer instant replacement or full refund on the spot with our 100% Freshness Guarantee.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>{item.label}</strong>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.45 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Need Help Callout Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              color: '#ffffff',
              borderRadius: '22px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <Headphones size={32} color="#a7f3d0" style={{ margin: '0 auto 8px auto' }} />
              <strong style={{ fontSize: '18px', display: 'block', marginBottom: '4px', fontWeight: '900' }}>
                Need Help with your Order?
              </strong>
              <p style={{ fontSize: '13px', color: '#d1fae5', marginBottom: '18px' }}>
                Our local support team & Kirana coordinators are active 7 days a week.
              </p>
              <button
                onClick={() => setIsVendorChatOpen(true)}
                className="btn-primary"
                style={{ backgroundColor: '#ffffff', color: '#065f46', fontWeight: '900', width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px' }}
              >
                💬 Chat with Support / Vendor
              </button>
              <span style={{ fontSize: '11px', color: '#a7f3d0', display: 'block', marginTop: '10px' }}>
                Monday to Sunday: 7:00 AM - 10:00 PM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Address Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="vs-card animate-modal-pop" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #d1fae5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#064e3b' }}>
                Add New Delivery Address
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ color: '#64748b', padding: '6px', borderRadius: '50%', backgroundColor: '#f1f5f9' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Address Type / Label
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Home', 'Farm / Land', 'Work / Shop'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewTag(tag)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700',
                        border: newTag === tag ? '2px solid #10b981' : '1px solid #cbd5e1',
                        backgroundColor: newTag === tag ? '#ecfdf5' : '#ffffff',
                        color: newTag === tag ? '#059669' : '#475569'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FormField
                  as="textarea"
                  rows={3}
                  label="Full Village Address & Landmarks"
                  name="saved_addr_text"
                  required
                  placeholder="e.g. Near Alva's Campus, Near Post Office, Mijar, Moodbidri - 574225"
                  value={newAddressText}
                  onChange={(e) => {
                    setNewAddressText(e.target.value);
                    if (addressError) setAddressError(null);
                  }}
                  error={addressError}
                  maxLength={250}
                  showCount
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isNewDefault}
                  onChange={(e) => setIsNewDefault(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                />
                <span>Set as primary default delivery address</span>
              </label>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', marginTop: '6px' }}
              >
                Save & Select Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
