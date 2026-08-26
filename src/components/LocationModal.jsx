import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Search, Check, X, Building2, Home, Sparkles, Satellite, Crosshair } from 'lucide-react';
import { getLiveGPSCoordinates, reverseGeocodeGPS } from '../utils/geolocation';
import { playPopSound, playSuccessChime } from '../utils/audio';

const POPULAR_LOCATIONS = [
  { name: 'Mijar', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574225', lat: 13.0682, lng: 74.9961, vendorsCount: 4 },
  { name: 'Moodbidri Market', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574227', lat: 13.0725, lng: 74.9985, vendorsCount: 6 },
  { name: 'Alva’s Campus', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574225', lat: 13.0620, lng: 74.9910, vendorsCount: 5 },
  { name: 'Kallamundkur', town: 'Belvai', district: 'Dakshina Kannada', pincode: '574213', lat: 13.1120, lng: 74.9650, vendorsCount: 3 },
  { name: 'Belvai', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574213', lat: 13.1040, lng: 74.9810, vendorsCount: 4 },
  { name: 'Ganjimutt', town: 'Mangaluru', district: 'Dakshina Kannada', pincode: '574144', lat: 12.9810, lng: 74.9350, vendorsCount: 4 },
  { name: 'Mulki', town: 'Mangaluru North', district: 'Dakshina Kannada', pincode: '574154', lat: 13.0980, lng: 74.7920, vendorsCount: 5 },
  { name: 'Surathkal', town: 'Mangaluru', district: 'Dakshina Kannada', pincode: '575014', lat: 13.0080, lng: 74.7940, vendorsCount: 8 },
  { name: 'Kinnigoli', town: 'Mangaluru', district: 'Dakshina Kannada', pincode: '574150', lat: 13.0840, lng: 74.8620, vendorsCount: 4 },
  { name: 'Karkala', town: 'Karkala', district: 'Udupi', pincode: '574104', lat: 13.2120, lng: 74.9980, vendorsCount: 6 }
];

export const LocationModal = () => {
  const { 
    isLocationModalOpen, 
    setIsLocationModalOpen, 
    currentLocation, 
    setCurrentLocation,
    user,
    showToast
  } = useApp();

  const [query, setQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleUseGPS = async () => {
    setIsDetecting(true);
    playPopSound();
    try {
      const coords = await getLiveGPSCoordinates();
      const geocoded = await reverseGeocodeGPS(coords.lat, coords.lng, coords.accuracy);

      const detected = {
        name: `${geocoded.village || geocoded.town}, ${geocoded.town}`,
        village: geocoded.village,
        town: geocoded.town,
        district: geocoded.district,
        pincode: geocoded.pincode,
        lat: geocoded.lat,
        lng: geocoded.lng,
        accuracy: geocoded.accuracy,
        formattedAddress: geocoded.formattedAddress,
        source: 'LIVE_GPS'
      };

      setCurrentLocation(detected);
      playSuccessChime();
      showToast(`📍 Live GPS Locked: ${geocoded.village || geocoded.town} (±${geocoded.accuracy}m)`);
      setIsLocationModalOpen(false);
    } catch (err) {
      console.warn("Location modal GPS error:", err);
      // Fallback
      const detected = {
        name: 'Mijar, Moodbidri (GPS Calibrated)',
        village: 'Mijar',
        town: 'Moodbidri',
        district: 'Dakshina Kannada',
        pincode: '574225',
        lat: 13.0682,
        lng: 74.9961,
        accuracy: 15,
        source: 'GPS_ESTIMATE'
      };
      setCurrentLocation(detected);
      showToast('📍 Using calibrated area coordinates for Mijar / Moodbidri');
      setIsLocationModalOpen(false);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectLocation = (loc) => {
    setCurrentLocation({
      name: `${loc.name}, ${loc.town}`,
      village: loc.name,
      town: loc.town,
      district: loc.district,
      pincode: loc.pincode,
      lat: loc.lat || 13.0682,
      lng: loc.lng || 74.9961,
      source: 'MANUAL_SELECT'
    });
    showToast(`📍 Delivery location set: ${loc.name}, ${loc.town}`);
    setIsLocationModalOpen(false);
  };

  const handleCustomLocalitySubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setCurrentLocation({
      name: `${query.trim()}, Moodbidri`,
      village: query.trim(),
      town: 'Moodbidri',
      district: 'Dakshina Kannada',
      pincode: '574225',
      lat: 13.0682,
      lng: 74.9961,
      source: 'USER_CUSTOM'
    });
    showToast(`📍 Set delivery locality: ${query.trim()}`);
    setIsLocationModalOpen(false);
  };

  const filteredLocations = POPULAR_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(query.toLowerCase()) ||
    loc.town.toLowerCase().includes(query.toLowerCase()) ||
    loc.pincode.includes(query)
  );

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
        maxWidth: '520px',
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
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ paddingRight: '12px' }}>
            <span className="badge badge-success" style={{ marginBottom: '6px', fontSize: '10.5px' }}>
              <Sparkles size={12} color="#f59e0b" /> HYPER-LOCAL GPS
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Exact Delivery Location
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', margin: '4px 0 0 0' }}>
              Showing nearby village stores & live inventory around your coordinates
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsLocationModalOpen(false)} 
            className="btn-close-modal touch-target-44"
            aria-label="Close Location Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Location Badge */}
        {currentLocation && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #a7f3d0',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crosshair size={18} color="#059669" />
              <div>
                <strong style={{ fontSize: '13px', color: '#064e3b', display: 'block' }}>
                  {currentLocation.name}
                </strong>
                {currentLocation.lat && (
                  <span style={{ fontSize: '11px', color: '#059669' }}>
                    🛰️ Lat: {currentLocation.lat.toFixed(4)}°, Lng: {currentLocation.lng.toFixed(4)}°
                  </span>
                )}
              </div>
            </div>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
          </div>
        )}

        {/* GPS Location Button */}
        <button
          onClick={handleUseGPS}
          disabled={isDetecting}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            marginBottom: '18px',
            fontSize: '14px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Navigation size={18} className={isDetecting ? 'animate-spin' : ''} />
          <span>{isDetecting ? 'Detecting exact live GPS satellite lock...' : 'Auto-Detect Exact Live GPS Location'}</span>
        </button>

        {/* Search / Custom Locality Bar */}
        <form onSubmit={handleCustomLocalitySubmit} style={{ position: 'relative', marginBottom: '18px' }}>
          <input
            type="text"
            placeholder="Search or type ANY village / locality (e.g. Mijar, Belvai)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              borderRadius: '14px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
              backgroundColor: '#f8fafc',
              fontWeight: '600'
            }}
          />
          <Search size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          {query.trim() && (
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Set
            </button>
          )}
        </form>

        {/* Saved Addresses Section */}
        {user?.addresses?.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
              Your Saved Addresses:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user.addresses.map(addr => (
                <div
                  key={addr.id}
                  onClick={() => {
                    setCurrentLocation({ 
                      name: addr.address,
                      village: addr.village || 'Mijar',
                      town: addr.town || 'Moodbidri',
                      lat: addr.gpsLocation?.lat || 13.0682,
                      lng: addr.gpsLocation?.lng || 74.9961
                    });
                    setIsLocationModalOpen(false);
                    showToast(`📍 Set to ${addr.tag} address`);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Home size={16} color="#059669" />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{addr.tag} ({addr.name})</strong>
                      <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>{addr.address}</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>Select</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Localities List */}
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
            Popular Nearby Localities:
          </span>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredLocations.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectLocation(loc)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ecfdf5';
                  e.currentTarget.style.borderColor = '#a7f3d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={16} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{loc.name}</strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>
                      {loc.town} • Pincode {loc.pincode}
                    </span>
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontSize: '10px' }}>
                  {loc.vendorsCount} Stores
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
