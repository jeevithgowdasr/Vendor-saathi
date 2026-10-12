import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Info, 
  LogOut,
  Star,
  Tag,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  X,
  Store,
  Flame,
  Globe,
  Edit3,
  CheckCircle2,
  Navigation,
  Satellite,
  Crosshair,
  Radio,
  Download,
  Truck,
  Layers,
  Plus
} from 'lucide-react';
import { updateProfileApi, updateOperatingAreasApi, updateCustomerLocationApi } from '../services/authApi';
import { saveUserProfileToFirebase } from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';
import { getLiveGPSCoordinates, reverseGeocodeGPS } from '../utils/geolocation';
import { FormField } from '../components/FormField';
import { 
  validateForm, 
  validateRequiredText, 
  validateEmail, 
  validatePhone, 
  validatePincode 
} from '../utils/validators';

export const ProfileView = () => {
  const { 
    user, 
    setUser, 
    updateUserProfile, 
    setCurrentLocation,
    wishlist, 
    notifications, 
    orders, 
    navigateTo, 
    showToast, 
    setIsVendorSimOpen,
    setIsAuthModalOpen,
    setAuthModalInitialTab,
    secureLogout
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editVillage, setEditVillage] = useState(user?.village || 'Mijar');
  const [editTown, setEditTown] = useState(user?.town || 'Moodbidri');
  const [editDistrict, setEditDistrict] = useState(user?.district || 'Dakshina Kannada');
  const [editPincode, setEditPincode] = useState(user?.pincode || '574225');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editLandmark, setEditLandmark] = useState(user?.landmark || '');
  const [editRole, setEditRole] = useState(user?.role || 'customer');
  const [editLang, setEditLang] = useState(user?.preferredLanguage || 'en');
  const [editGps, setEditGps] = useState(user?.gpsLocation || null);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [editBusinessName, setEditBusinessName] = useState(user?.businessName || user?.name || '');
  const [editVendorCategory, setEditVendorCategory] = useState(user?.vendorCategory || 'Vegetables');
  const [editOperatingAreas, setEditOperatingAreas] = useState(user?.operatingAreas || ['Mijar', 'Moodbidri']);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [editVehicleType, setEditVehicleType] = useState(user?.vehicleDetails?.vehicleType || 'None');
  const [editVehicleRegNo, setEditVehicleRegNo] = useState(user?.vehicleDetails?.registrationNumber || '');
  const [editPreferredAreas, setEditPreferredAreas] = useState(user?.preferredAreas || ['Mijar', 'Moodbidri']);
  const [editPreferredCategories, setEditPreferredCategories] = useState(user?.preferredCategories || ['Vegetables', 'Fruits']);

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || user?.fullName || '');
    setEditBusinessName(user?.businessName || user?.name || '');
    setEditVendorCategory(user?.vendorCategory || 'Vegetables');
    setEditOperatingAreas(Array.isArray(user?.operatingAreas) ? user.operatingAreas : ['Mijar', 'Moodbidri']);
    setEditVehicleType(user?.vehicleDetails?.vehicleType || 'None');
    setEditVehicleRegNo(user?.vehicleDetails?.registrationNumber || '');
    setEditPreferredAreas(Array.isArray(user?.preferredAreas) ? user.preferredAreas : ['Mijar', 'Moodbidri']);
    setEditPreferredCategories(Array.isArray(user?.preferredCategories) ? user.preferredCategories : ['Vegetables', 'Fruits']);
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditVillage(user?.village || 'Mijar');
    setEditTown(user?.town || 'Moodbidri');
    setEditDistrict(user?.district || 'Dakshina Kannada');
    setEditPincode(user?.pincode || '574225');
    setEditAddress(user?.address || user?.streetAddress || '');
    setEditLandmark(user?.landmark || '');
    setEditRole(user?.role || 'customer');
    setEditLang(user?.preferredLanguage || 'en');
    setEditGps(user?.gpsLocation || null);
    setFieldErrors({});
    setIsEditModalOpen(true);
    playPopSound();
  };

  const handleDetectGPSInEdit = async () => {
    setIsDetectingGPS(true);
    playPopSound();
    try {
      const coords = await getLiveGPSCoordinates();
      const geocoded = await reverseGeocodeGPS(coords.lat, coords.lng, coords.accuracy);
      
      setEditGps(geocoded);
      if (geocoded.village) setEditVillage(geocoded.village);
      if (geocoded.town) setEditTown(geocoded.town);
      if (geocoded.district) setEditDistrict(geocoded.district);
      if (geocoded.pincode) setEditPincode(geocoded.pincode);
      if (geocoded.streetAddress) setEditAddress(geocoded.streetAddress);
      if (!editLandmark) setEditLandmark(`Near ${geocoded.village || geocoded.town}`);

      showToast(`📍 Live GPS Locked: ${geocoded.village || geocoded.town} (±${geocoded.accuracy}m)`, 'success');
    } catch (err) {
      console.warn("GPS detection in profile edit notice:", err);
      showToast('⚠️ Could not acquire GPS. Please ensure permissions are enabled.', 'danger');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    
    const profileSchema = {
      name: (v) => validateRequiredText(v, 'Full Name', 2, 100),
      phone: (v) => validatePhone(v, true),
      email: (v) => validateEmail(v, false),
      village: (v) => validateRequiredText(v, 'Village / Locality', 2, 80),
      town: (v) => validateRequiredText(v, 'Town / Taluk', 2, 80),
      pincode: (v) => validatePincode(v, true),
      streetAddress: (v) => validateRequiredText(v, 'Street Address & House Details', 3, 250)
    };

    const { isValid, errors, sanitizedData } = validateForm({
      name: editName,
      phone: editPhone,
      email: editEmail,
      village: editVillage,
      town: editTown,
      pincode: editPincode,
      streetAddress: editAddress
    }, profileSchema);

    if (!isValid) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      showToast(`⚠️ ${firstErr}`, 'danger');
      playPopSound();
      return;
    }

    setFieldErrors({});
    
    const formattedAddr = sanitizedData.streetAddress
      ? `${sanitizedData.streetAddress}, ${sanitizedData.village}, ${sanitizedData.town}, Karnataka - ${sanitizedData.pincode}`
      : `${sanitizedData.village} Village, ${sanitizedData.town}, Karnataka - ${sanitizedData.pincode}`;

    const formattedPhone = sanitizedData.phone.startsWith('+91') 
      ? sanitizedData.phone 
      : `+91 ${sanitizedData.phone.replace(/\D/g, '').slice(-10)}`;

    const updatedUser = {
      ...user,
      isRegistered: true,
      name: editRole === 'vendor' ? (editBusinessName || sanitizedData.name) : sanitizedData.name,
      fullName: sanitizedData.name,
      businessName: editBusinessName || sanitizedData.name,
      vendorCategory: editVendorCategory,
      operatingAreas: editOperatingAreas,
      vehicleDetails: {
        vehicleType: editVehicleType,
        registrationNumber: editVehicleRegNo.trim()
      },
      preferredAreas: editPreferredAreas,
      preferredCategories: editPreferredCategories,
      email: sanitizedData.email,
      phone: formattedPhone,
      streetAddress: sanitizedData.streetAddress,
      village: sanitizedData.village,
      town: sanitizedData.town,
      district: editDistrict.trim() || 'Dakshina Kannada',
      pincode: sanitizedData.pincode,
      address: formattedAddr,
      landmark: editLandmark.trim(),
      role: editRole,
      status: user?.status || 'active',
      preferredLanguage: editLang,
      gpsLocation: editGps || user?.gpsLocation || {
        lat: 13.0682,
        lng: 74.9961,
        accuracy: 15,
        village: sanitizedData.village,
        town: sanitizedData.town,
        capturedAt: new Date().toISOString()
      }
    };

    updateUserProfile(updatedUser);
    
    // Sync to backend profile endpoint if token exists
    if (user?.authToken) {
      try {
        await updateProfileApi(user.authToken, updatedUser);
      } catch (apiErr) {
        console.warn('Backend profile update sync notice:', apiErr.message);
      }
    }

    await saveUserProfileToFirebase(updatedUser.uid, updatedUser);

    // Update global app coordinates
    setCurrentLocation({
      name: `${editVillage.trim()}, ${editTown.trim()}`,
      village: editVillage.trim(),
      town: editTown.trim(),
      district: editDistrict.trim(),
      pincode: editPincode.trim(),
      lat: editGps?.lat || 13.0682,
      lng: editGps?.lng || 74.9961,
      source: 'UPDATED_PROFILE_GPS'
    });

    setIsEditModalOpen(false);
    playSuccessChime();
    showToast('👤 Profile & Operating details updated successfully!');
  };

  if (!user?.isLoggedIn) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 0', textAlign: 'center', maxWidth: '500px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#ecfdf5',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <User size={36} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>Sign In to Your Account</h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', marginBottom: '24px' }}>
          Connect with Google or Mobile OTP to manage your orders, saved village addresses, and linked local stores.
        </p>
        <button
          onClick={() => {
            setAuthModalInitialTab('google');
            setIsAuthModalOpen(true);
          }}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px' }}
        >
          Sign In with Google / Phone
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            👤 Account Profile & Live Location
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Your Google profile, verified GPS coordinates & registered village address.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Left Column: User Profile Card */}
        <div>
          <div className="vs-card animate-fade-scale" style={{ 
            padding: '32px', 
            borderRadius: '28px', 
            backgroundColor: '#ffffff', 
            marginBottom: '24px',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
            border: '1.5px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3.5px solid #10b981',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '900',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'B'}
                  </div>
                )}
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                      {user.name || user.fullName || 'User Profile'}
                    </h2>
                    <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} /> Google Verified
                    </span>
                  </div>
                  <span style={{ fontSize: '13.5px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                    {user.email || (user.phone ? `${user.phone}@vendorsaathi.com` : 'No email linked')}
                  </span>
                  <span style={{ fontSize: '13.5px', color: '#059669', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    📞 {user.phone || 'No phone registered'}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleOpenEdit} 
                className="btn-outline" 
                style={{ fontSize: '13px', padding: '9px 18px', borderRadius: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={15} /> Edit & Update GPS
              </button>
            </div>

            {/* LIVE GPS VERIFIED TELEMETRY CARD */}
            {user.gpsLocation && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #a7f3d0',
                borderRadius: '20px',
                padding: '16px 20px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <Crosshair size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#064e3b' }}>
                        Live GPS Coordinates Saved
                      </strong>
                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 7px' }}>
                        Locked
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#047857', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      🛰️ {user.gpsLocation.lat || '13.0682'}° N, {user.gpsLocation.lng || '74.9961'}° E • Radius: ±{user.gpsLocation.accuracy || 10}m
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOpenEdit}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Update GPS ⟳
                </button>
              </div>
            )}

            {/* Basic Registration Info Matrix */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '20px',
              padding: '18px 20px',
              border: '1.5px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                  {user.role === 'vendor' ? 'Business / Shop Name' : 'Full Name'}
                </span>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                  {user.role === 'vendor' ? (user.businessName || user.name) : (user.fullName || user.name)}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Account Role & Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <strong style={{ color: user.role === 'vendor' ? '#2563eb' : '#059669', fontSize: '14px' }}>
                    {user.role === 'vendor' ? '🏪 Vendor Partner' : '🛒 Customer'}
                  </strong>
                  <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {user.status || 'Active'}
                  </span>
                </div>
              </div>

              {user.role === 'vendor' ? (
                <>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Vendor Category</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      🏷️ {user.vendorCategory || 'Vegetables'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle Details</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      🚚 {user.vehicleDetails?.vehicleType || 'None'} {user.vehicleDetails?.registrationNumber ? `(${user.vehicleDetails.registrationNumber})` : ''}
                    </strong>
                  </div>

                  <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Supported Operating Localities</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {(Array.isArray(user.operatingAreas) && user.operatingAreas.length > 0 ? user.operatingAreas : ['Mijar', 'Moodbidri']).map(area => (
                        <span key={area} style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                          📍 {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Delivery Village / Area</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      📍 {user.village || 'Mijar Village'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Town / District</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>
                      {user.town || 'Moodbidri'}, {user.district || 'DK'}
                    </strong>
                  </div>

                  {user.preferredAreas && user.preferredAreas.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Preferred Localities</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {user.preferredAreas.map(area => (
                          <span key={area} style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                            📍 {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                  {user.role === 'vendor' ? 'Store / Depot Address' : 'Registered Delivery Address'}
                </span>
                <strong style={{ display: 'block', color: '#334155', fontSize: '13.5px', marginTop: '2px', lineHeight: 1.4 }}>
                  {user.address || 'Near Alva’s Campus Entrance, Mijar Village, Moodbidri - 574225'}
                </strong>
                {user.landmark && (
                  <span style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '2px', fontWeight: '600' }}>
                    Landmark: {user.landmark}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginTop: '18px',
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid #d1fae5',
              textAlign: 'center'
            }}>
              <div>
                <strong style={{ fontSize: '20px', fontWeight: '900', color: '#059669', display: 'block' }}>
                  {orders.length}
                </strong>
                <span style={{ fontSize: '11.5px', color: '#065f46', fontWeight: '700' }}>Orders</span>
              </div>
              <div style={{ borderLeft: '1px solid #a7f3d0', borderRight: '1px solid #a7f3d0' }}>
                <strong style={{ fontSize: '20px', fontWeight: '900', color: '#059669', display: 'block' }}>
                  ₹420
                </strong>
                <span style={{ fontSize: '11.5px', color: '#065f46', fontWeight: '700' }}>Saved</span>
              </div>
              <div>
                <strong style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b', display: 'block' }}>
                  4
                </strong>
                <span style={{ fontSize: '11.5px', color: '#92400e', fontWeight: '700' }}>Nearby Stores</span>
              </div>
            </div>
          </div>

          {/* Quick Village Direct Connect Card */}
          <div style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 24px -4px rgba(6, 95, 70, 0.3)'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '12px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={28} color="#a7f3d0" />
            </div>
            <div>
              <strong style={{ fontSize: '15.5px', display: 'block', marginBottom: '2px' }}>
                Direct Farm-to-Kitchen Connection
              </strong>
              <p style={{ fontSize: '12.5px', color: '#d1fae5', margin: 0, lineHeight: 1.4 }}>
                100% of your payment directly supports local village farmers and kirana merchants across Moodbidri.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Menu Items & Actions */}
        <div>
          <div className="vs-card" style={{ padding: '16px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', padding: '8px 12px 14px 12px', borderBottom: '1px solid #f1f5f9', margin: 0 }}>
              Quick Account Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
              {user.role === 'vendor' && (
                <button
                  onClick={() => navigateTo('vendor-portal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    marginBottom: '6px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Store size={20} color="#2563eb" />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e40af', display: 'block' }}>Vendor Partner Dashboard</strong>
                      <span style={{ fontSize: '12px', color: '#2563eb' }}>Manage inventory, pricing & operating areas</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#2563eb" />
                </button>
              )}
              <button
                onClick={() => navigateTo('my-orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Package size={18} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>My Orders & Deliveries</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Track active delivery scooters & past history</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigateTo('saved-addresses-support')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={18} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Saved Village Addresses</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Manage delivery pins, homes, and farms</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigateTo('wishlist')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Heart size={18} color="#ef4444" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>My Wishlist Items</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{wishlist.length} saved local groceries</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigateTo('offers')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Tag size={18} color="#f59e0b" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Offers & Promo Codes</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Claim harvest coupons & village discounts</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigateTo('my-reviews')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Star size={18} color="#f59e0b" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>My Product Reviews</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Ratings and feedback given to local stores</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigateTo('nearby-vendors')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Store size={18} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Explore Nearby Kirana Stores</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Find and chat with local village merchants</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </button>

              <button
                onClick={() => {
                  alert('To install the VendorSaathi PWA App:\n• Android / Chrome: Tap the 3 dots (⋮) and choose "Install App" or "Add to Home Screen".\n• iPhone / iPad (Safari): Tap Share (⬆) and select "Add to Home Screen".\n• Windows / Mac: Look for the Install icon (⊕) in your browser address bar.');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d1fae5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Smartphone size={18} color="#059669" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#064e3b', display: 'block' }}>Install Mobile PWA App</strong>
                      <span className="badge" style={{ backgroundColor: '#059669', color: '#fff', fontSize: '9.5px', padding: '1px 6px', fontWeight: '900' }}>PWA 2.0</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#047857' }}>Install on your home screen for instant offline access</span>
                  </div>
                </div>
                <Download size={16} color="#059669" />
              </button>

              {/* Session Security & Logout Card */}
              <div style={{
                marginTop: '12px',
                padding: '18px',
                borderRadius: '16px',
                backgroundColor: '#fff1f2',
                border: '1.5px solid #fecdd3',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#e11d48" />
                    <strong style={{ fontSize: '14px', color: '#9f1239' }}>Account & Session Security</strong>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    backgroundColor: user?.role === 'vendor' ? '#eff6ff' : '#ecfdf5',
                    color: user?.role === 'vendor' ? '#2563eb' : '#059669',
                    border: `1px solid ${user?.role === 'vendor' ? '#bfdbfe' : '#a7f3d0'}`
                  }}>
                    ROLE: {(user?.role || 'customer').toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#be123c', margin: 0, lineHeight: '1.5' }}>
                  Signing out destroys your active tokens, wipes all session caches from this browser, and restricts access to protected views.
                </p>
                <button
                  onClick={() => secureLogout()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
                >
                  <LogOut size={16} /> Sign Out Securely (Destroy Session)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EDIT PROFILE & GPS LOCATION MODAL
          ============================================================ */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 2100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="vs-card animate-modal-pop" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '28px 24px',
            borderRadius: '28px',
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
            border: '1.5px solid #d1fae5',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="#059669" />
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  Edit Profile & GPS Details
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn-close-modal touch-target-44"
                aria-label="Close Edit Profile Dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* GPS Auto-Detect Button in Edit Modal */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #a7f3d0',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px'
              }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#064e3b', display: 'block' }}>
                    Live GPS Telemetry Lock
                  </strong>
                  <span style={{ fontSize: '11px', color: '#059669' }}>
                    {editGps ? `Lat: ${editGps.lat}°, Lng: ${editGps.lng}° (±${editGps.accuracy || 10}m)` : 'Click to fetch exact satellite coordinates'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGPSInEdit}
                  disabled={isDetectingGPS}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Navigation size={13} className={isDetectingGPS ? 'animate-spin' : ''} />
                  <span>{isDetectingGPS ? 'Locking...' : 'Detect GPS'}</span>
                </button>
              </div>

              <FormField
                label="Full Name"
                name="edit_name"
                required
                placeholder="e.g. Ananya Sharma"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  clearFieldError('name');
                }}
                error={fieldErrors.name}
                maxLength={100}
                icon={User}
              />

              {editRole === 'vendor' && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <FormField
                    label="Business / Shop Name"
                    name="edit_bizName"
                    required
                    placeholder="e.g. Green Fresh Mart"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    icon={Store}
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Vendor Category
                    </label>
                    <select
                      value={editVendorCategory}
                      onChange={(e) => setEditVendorCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fresh Fruits</option>
                      <option value="Flowers">Pooja Flowers</option>
                      <option value="Ice-cream">Ice Cream</option>
                      <option value="Dairy">Dairy & Milk</option>
                      <option value="Snacks">Street Snacks</option>
                      <option value="Grocery">Daily Grocery</option>
                      <option value="Bakery">Bakery & Sweets</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      Supported Operating Localities
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {editOperatingAreas.map(area => (
                        <span
                          key={area}
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => setEditOperatingAreas(prev => prev.filter(a => a !== area))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Add locality..."
                        value={newAreaInput}
                        onChange={(e) => setNewAreaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newAreaInput.trim() && !editOperatingAreas.includes(newAreaInput.trim())) {
                              setEditOperatingAreas(prev => [...prev, newAreaInput.trim()]);
                              setNewAreaInput('');
                            }
                          }
                        }}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAreaInput.trim() && !editOperatingAreas.includes(newAreaInput.trim())) {
                            setEditOperatingAreas(prev => [...prev, newAreaInput.trim()]);
                            setNewAreaInput('');
                          }
                        }}
                        style={{ padding: '7px 12px', borderRadius: '8px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Vehicle Type
                      </label>
                      <select
                        value={editVehicleType}
                        onChange={(e) => setEditVehicleType(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      >
                        <option value="None">None</option>
                        <option value="Cart">Push Cart</option>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Two-Wheeler">Two-Wheeler</option>
                        <option value="Three-Wheeler / Auto">Three-Wheeler / Auto</option>
                        <option value="Van / Small Truck">Van / Truck</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        Plate Number
                      </label>
                      <input
                        type="text"
                        placeholder="KA-19-MB-4521"
                        value={editVehicleRegNo}
                        onChange={(e) => setEditVehicleRegNo(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FormField
                  label="Mobile Number"
                  name="edit_phone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  error={fieldErrors.phone}
                  maxLength={15}
                  icon={Smartphone}
                />

                <FormField
                  label="Email Address"
                  name="edit_email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  error={fieldErrors.email}
                  maxLength={100}
                />
              </div>

              {/* Village Input */}
              <FormField
                label="Village / Locality Name"
                name="edit_village"
                required
                placeholder="Type ANY village or locality name..."
                value={editVillage}
                onChange={(e) => {
                  setEditVillage(e.target.value);
                  clearFieldError('village');
                }}
                error={fieldErrors.village}
                maxLength={80}
                icon={MapPin}
              />

              {/* Town & Pincode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <FormField
                  label="Town / Taluk"
                  name="edit_town"
                  required
                  placeholder="e.g. Moodbidri"
                  value={editTown}
                  onChange={(e) => {
                    setEditTown(e.target.value);
                    clearFieldError('town');
                  }}
                  error={fieldErrors.town}
                  maxLength={80}
                />

                <FormField
                  label="Pincode"
                  name="edit_pincode"
                  required
                  placeholder="574225"
                  value={editPincode}
                  onChange={(e) => {
                    setEditPincode(e.target.value);
                    clearFieldError('pincode');
                  }}
                  error={fieldErrors.pincode}
                  maxLength={6}
                />
              </div>

              <FormField
                label="Street Address & House Details"
                name="edit_address"
                required
                placeholder="e.g. Door No. 12, Main Street"
                value={editAddress}
                onChange={(e) => {
                  setEditAddress(e.target.value);
                  clearFieldError('streetAddress');
                }}
                error={fieldErrors.streetAddress}
                maxLength={250}
              />

              <FormField
                label="Landmark"
                name="edit_landmark"
                placeholder="e.g. Near Bus Stand"
                value={editLandmark}
                onChange={(e) => setEditLandmark(e.target.value)}
                maxLength={150}
              />

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '13px', borderRadius: '14px', fontSize: '14.5px', fontWeight: '900', marginTop: '6px' }}
              >
                Save Profile & GPS Coordinates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
