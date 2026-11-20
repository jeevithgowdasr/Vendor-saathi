import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Star,
  Clock,
  Store,
  Phone,
  CheckCircle2,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Navigation,
  Layers,
  Calendar,
  Package,
  ShoppingBag,
  Filter,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import {
  subscribeToUpcomingSchedules,
  saveOrderToFirebase,
  formatFirestoreTimestamp
} from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { getFormattedDistanceAndETA } from '../utils/geolocation';
import { WeatherWidget } from '../components/WeatherWidget';

export const NearbyVendorsView = () => {
  const {
    navigateTo,
    setSelectedVendor,
    currentLocation,
    setIsLocationModalOpen,
    vendors,
    products,
    user,
    showToast,
    setIsAuthModalOpen
  } = useApp();

  // Mode: 'stores' (Live Stores) | 'schedules' (Upcoming Scheduled Visits & Pre-Orders)
  const [activeTab, setActiveTab] = useState('schedules');
  const [query, setQuery] = useState('');

  // Schedules Filter States
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  // Pre-Order Modal State
  const [preOrderSchedule, setPreOrderSchedule] = useState(null);
  const [selectedPreOrderItems, setSelectedPreOrderItems] = useState({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Subscribe to Live Upcoming Schedules from Firestore
  useEffect(() => {
    const unsub = subscribeToUpcomingSchedules((schedulesList) => {
      setUpcomingSchedules(schedulesList || []);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Filtered Live Stores (Only genuine registered partners)
  const filteredVendors = (vendors || [])
    .filter(v =>
      v &&
      v.id !== 'v1' &&
      v.id !== 'v2' &&
      v.id !== 'v3' &&
      v.id !== 'v4' &&
      !v.name?.toLowerCase().includes('green valley') &&
      !v.name?.toLowerCase().includes('basappa') &&
      !v.name?.toLowerCase().includes('kaveri') &&
      !v.name?.toLowerCase().includes('suresh provision') &&
      !v.name?.toLowerCase().includes('mahesh kirana') &&
      !v.owner?.toLowerCase().includes('suresh kumar')
    )
    .filter(v =>
      (v.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (v.location || '').toLowerCase().includes(query.toLowerCase()) ||
      (v.owner || '').toLowerCase().includes(query.toLowerCase())
    );

  // Filtered Upcoming Schedules
  const filteredSchedules = upcomingSchedules.filter(s => {
    const sArea = (s.areaName || s.area?.areaName || '').toLowerCase();
    const sCat = (s.vendorCategory || '').toLowerCase();
    const sVendor = (s.vendorName || '').toLowerCase();
    const qLower = query.toLowerCase();

    const matchesQuery = sArea.includes(qLower) || sCat.includes(qLower) || sVendor.includes(qLower);
    const matchesArea = selectedAreaFilter === 'all' || sArea.includes(selectedAreaFilter.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || sCat.includes(selectedCategoryFilter.toLowerCase());
    const matchesDate = !selectedDateFilter || s.date === selectedDateFilter;

    return matchesQuery && matchesArea && matchesCat && matchesDate;
  });

  // Helper: Open Pre-Order Drawer
  const handleOpenPreOrder = (schedule) => {
    if (!user?.isLoggedIn) {
      showToast('🔒 Please sign in to pre-order fresh produce!', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    setPreOrderSchedule(schedule);
    // Initialize default item quantity
    const initialMap = {};
    const schedProducts = getScheduleProducts(schedule);
    if (schedProducts.length > 0) {
      initialMap[schedProducts[0].id] = 1;
    }
    setSelectedPreOrderItems(initialMap);
    playPopSound();
  };

  // Helper: Get products attached to schedule
  const getScheduleProducts = (schedule) => {
    if (!schedule) return [];
    const availIds = schedule.availableProductIds || [];
    const matched = products.filter(p => availIds.includes(p.id) || availIds.includes(p._id));
    if (matched.length > 0) return matched;
    // Fallback to vendor's general products
    return products.slice(0, 4);
  };

  // Change quantity for pre-order item
  const updatePreOrderItemQty = (prodId, delta) => {
    setSelectedPreOrderItems(prev => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: next };
    });
  };

  // Calculate Pre-Order Total
  const calculatePreOrderTotal = () => {
    if (!preOrderSchedule) return 0;
    const schedProducts = getScheduleProducts(preOrderSchedule);
    let total = 0;
    Object.entries(selectedPreOrderItems).forEach(([pId, qty]) => {
      const prod = schedProducts.find(p => p.id === pId || p._id === pId);
      if (prod) total += (prod.price || 0) * qty;
    });
    return total;
  };

  // Submit Pre-Order to Firestore
  const handleSubmitPreOrder = async () => {
    const totalAmount = calculatePreOrderTotal();
    if (totalAmount <= 0) {
      showToast('Please select at least 1 item to pre-order.', 'danger');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const schedProducts = getScheduleProducts(preOrderSchedule);
      const itemsList = Object.entries(selectedPreOrderItems).map(([pId, qty]) => {
        const prod = schedProducts.find(p => p.id === pId || p._id === pId) || { name: 'Farm Produce', price: 25, unit: 'kg' };
        return {
          productId: pId,
          name: prod.name,
          price: prod.price,
          unit: prod.unit,
          quantity: qty,
          isAdditionalRequest: false,
          requestStatus: 'accepted'
        };
      });

      const orderPayload = {
        id: `VS-PRE-${Date.now()}`,
        customerId: user.uid || `cust_${Date.now()}`,
        customerName: user.name || 'Customer',
        customerPhone: user.phone || '+91 98765 43210',
        vendorId: preOrderSchedule.vendorId || '',
        vendorName: preOrderSchedule.vendorName || 'Partner Store',
        scheduleId: preOrderSchedule.id || preOrderSchedule.scheduleId,
        items: itemsList,
        totalAmount,
        total: totalAmount,
        status: 'placed', // Module 7 state machine start
        orderDate: new Date().toISOString(),
        deliveryAddress: user.primaryLocation?.address || `${currentLocation.name}`,
        arrivalETA: `Scheduled on ${preOrderSchedule.date}`,
        createdAt: new Date().toISOString()
      };

      await saveOrderToFirebase(orderPayload);

      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      playSuccessChime();
      showToast(`🎉 Pre-order #${orderPayload.id} placed with ${preOrderSchedule.vendorName}!`, 'success');
      setPreOrderSchedule(null);
      setSelectedPreOrderItems({});
      navigateTo('order-tracking');
    } catch (err) {
      showToast(`Failed to place order: ${err.message}`, 'danger');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <button
          onClick={() => navigateTo('home')}
          style={{
            fontSize: '13px',
            color: '#2563eb',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            padding: '6px 14px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div style={{ display: 'block', marginBottom: '8px' }}>
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Store size={13} color="#2563eb" /> ADVANCE VISIT SCHEDULING & PRE-ORDERS
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', margin: '8px 0' }}>
          Discover Mobile Vendors & Planned Visits
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e40af',
            marginTop: '6px',
            cursor: 'pointer'
          }}
          onClick={() => setIsLocationModalOpen(true)}
        >
          <Navigation size={14} color="#2563eb" />
          <span>Showing visits scheduled for <strong>{currentLocation.name}</strong></span>
        </div>
      </div>

      {/* Real-Time Local Weather Forecast Telemetry */}
      <div style={{ marginBottom: '24px' }}>
        <WeatherWidget />
      </div>

      {/* Main Mode Toggle: Upcoming Scheduled Visits vs Open Stores */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '28px'
      }}>
        <button
          onClick={() => { setActiveTab('schedules'); playPopSound(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '20px',
            border: activeTab === 'schedules' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: activeTab === 'schedules' ? '#eff6ff' : '#ffffff',
            color: activeTab === 'schedules' ? '#1e40af' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer',
            boxShadow: activeTab === 'schedules' ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={18} color={activeTab === 'schedules' ? '#2563eb' : '#64748b'} />
          <span>📅 Upcoming Scheduled Visits ({upcomingSchedules.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('stores'); playPopSound(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '20px',
            border: activeTab === 'stores' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            backgroundColor: activeTab === 'stores' ? '#eff6ff' : '#ffffff',
            color: activeTab === 'stores' ? '#1e40af' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer',
            boxShadow: activeTab === 'stores' ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Store size={18} color={activeTab === 'stores' ? '#2563eb' : '#64748b'} />
          <span>🏪 Live Open Stores ({filteredVendors.length})</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '18px 24px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={activeTab === 'schedules' ? 'Search neighborhood, vendor, category...' : 'Search store name or locality...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 16px 11px 42px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>

        {/* Filters for Scheduled Visits */}
        {activeTab === 'schedules' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Area Filter */}
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#f8fafc', color: '#334155' }}
            >
              <option value="all">📍 All Neighborhoods</option>
              <option value="vijayanagar">Vijayanagar</option>
              <option value="alva">Alva’s Campus Gate</option>
              <option value="mijar">Mijar Central</option>
              <option value="moodbidri">Moodbidri Town</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#f8fafc', color: '#334155' }}
            >
              <option value="all">🥕 All Categories</option>
              <option value="vegetable">Vegetables</option>
              <option value="fruit">Fresh Fruits</option>
              <option value="dairy">Dairy & Milk</option>
              <option value="flower">Pooja Flowers</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#f8fafc', color: '#334155' }}
            />
          </div>
        )}
      </div>

      {/* ============================================================
          VIEW 1: UPCOMING SCHEDULED VISITS & PRE-ORDERS
          ============================================================ */}
      {activeTab === 'schedules' && (
        <div>
          {filteredSchedules.length === 0 ? (
            <div className="vs-card" style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px' }}>
              <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <strong style={{ fontSize: '18px', color: '#334155', display: 'block' }}>No Planned Visits Matched</strong>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
                Try selecting "All Neighborhoods" or clearing date filters to view upcoming vendor schedules.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px'
            }}>
              {filteredSchedules.map(schedule => {
                const schedProducts = getScheduleProducts(schedule);
                const arrivalFormatted = schedule.expectedArrivalTime
                  ? new Date(schedule.expectedArrivalTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                  : '9:30 AM';
                const departureFormatted = schedule.expectedDepartureTime
                  ? new Date(schedule.expectedDepartureTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                  : '11:00 AM';

                return (
                  <div
                    key={schedule.id || schedule.scheduleId}
                    className="vs-card vs-card-interactive"
                    style={{
                      borderRadius: '24px',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)'
                    }}
                  >
                    <div>
                      {/* Top Header Card Info */}
                      <div style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #eff6ff 100%)',
                        borderBottom: '1px solid #dbeafe'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                              {schedule.vendorCategory || 'Vegetables'} Partner
                            </span>
                            <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>
                              {schedule.vendorName}
                            </h3>
                          </div>

                          <div style={{
                            backgroundColor: '#ffffff',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12.5px',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span>{schedule.rating || '4.8'}</span>
                          </div>
                        </div>

                        {/* Visit Timing & Area Pill */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#1e40af', fontWeight: '700' }}>
                            <MapPin size={15} color="#2563eb" />
                            <span>Visiting <strong>{schedule.areaName || schedule.area?.areaName}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#1e40af', fontWeight: '700' }}>
                            <Clock size={15} color="#2563eb" />
                            <span>Arrival Window: <strong>{arrivalFormatted} – {departureFormatted}</strong> ({schedule.date})</span>
                          </div>
                        </div>
                      </div>

                      {/* Products on Cart / Truck Preview */}
                      <div style={{ padding: '20px 24px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '10px' }}>
                          Available Produce on Mobile Cart ({schedProducts.length} items):
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {schedProducts.slice(0, 3).map((prod) => (
                            <div
                              key={prod.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#f8fafc',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: '1px solid #f1f5f9'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }}
                                />
                                <div>
                                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{prod.name}</strong>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>₹{prod.price} / {prod.unit}</span>
                                </div>
                              </div>

                              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '8px' }}>
                                Fresh Farm Stock
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bottom Bar */}
                    <div style={{ padding: '0 24px 24px 24px' }}>
                      <button
                        onClick={() => handleOpenPreOrder(schedule)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '13px',
                          borderRadius: '16px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ShoppingBag size={18} />
                        <span>Pre-Order from this Visit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 2: LIVE OPEN STORES
          ============================================================ */}
      {activeTab === 'stores' && (
        filteredVendors.length === 0 ? (
          <div className="vs-card" style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px' }}>
            <Store size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <strong style={{ fontSize: '18px', color: '#334155', display: 'block' }}>No Registered Partners Found</strong>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
              Only verified and registered partner stores appear here. When new partners register, they will be listed automatically.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {filteredVendors.map(vendor => {
            const distInfo = getFormattedDistanceAndETA(currentLocation, vendor.coordinates || vendor);
            return (
              <div
                key={vendor.id}
                className="vs-card vs-card-interactive"
                style={{ borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}
              >
                <div>
                  <div style={{ position: 'relative', height: '190px', overflow: 'hidden' }}>
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Live Open Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: vendor.status === 'offline' ? '#b91c1c' : '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: vendor.status === 'offline' ? '#ef4444' : vendor.status === 'busy' ? '#f59e0b' : '#2563eb'
                      }} />
                      <span>{vendor.statusLabel || (vendor.isOpen ? 'Open Now' : 'Closed')}</span>
                    </div>

                    <span style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Clock size={13} color="#38bdf8" /> {distInfo.formattedETA}
                    </span>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                          {vendor.name}
                        </h3>
                        <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          📍 <strong>{distInfo.formattedDistance}</strong> away • {vendor.location}
                        </span>
                      </div>

                    <div style={{
                      backgroundColor: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{vendor.rating}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {vendor.categories.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          textTransform: 'capitalize'
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <button
                  onClick={() => navigateTo('product-listing', { vendor })}
                  className="btn-primary"
                  style={{ padding: '12px', borderRadius: '14px', fontSize: '13.5px', fontWeight: '800' }}
                >
                  <Store size={16} /> Browse Catalog
                </button>
                <button
                  onClick={() => navigateTo('vendor-chat', { vendor })}
                  className="btn-secondary"
                  style={{ padding: '12px 16px', borderRadius: '14px', fontSize: '13.5px', fontWeight: '800', border: '1px solid #cbd5e1' }}
                >
                  💬 Chat
                </button>
              </div>
            </div>
            );
          })}
        </div>
        )
      )}

      {/* ============================================================
          PRE-ORDER MODAL / DRAWER
          ============================================================ */}
      {preOrderSchedule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(5px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1.5px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  Advance Visit Pre-Order
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0' }}>
                  {preOrderSchedule.vendorName}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  📍 {preOrderSchedule.areaName} • {preOrderSchedule.date}
                </span>
              </div>

              <button
                onClick={() => setPreOrderSchedule(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontWeight: '800'
                }}
              >
                ✕
              </button>
            </div>

            {/* Select Products List */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '12px' }}>
                Select Fresh Items from Vendor's Stock:
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getScheduleProducts(preOrderSchedule).map((product) => {
                  const qty = selectedPreOrderItems[product.id] || 0;

                  return (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: qty > 0 ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: qty > 0 ? '#eff6ff' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }}
                        />
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{product.name}</strong>
                          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '800' }}>
                            ₹{product.price} <span style={{ color: '#64748b', fontWeight: '500' }}>/ {product.unit}</span>
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => updatePreOrderItemQty(product.id, -1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: '900', minWidth: '20px', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updatePreOrderItemQty(product.id, 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            backgroundColor: '#2563eb',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#ffffff'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pre-Order Total Summary */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Delivery Address</span>
                <span style={{ fontWeight: '700', color: '#334155' }}>{currentLocation.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Payment</span>
                <span style={{ fontWeight: '700', color: '#2563eb' }}>UPI or Pay on Arrival</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>Pre-Order Total</strong>
                <strong style={{ fontSize: '20px', color: '#2563eb', fontWeight: '900' }}>₹{calculatePreOrderTotal()}</strong>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitPreOrder}
              disabled={isSubmittingOrder || calculatePreOrderTotal() === 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: calculatePreOrderTotal() > 0 ? '#2563eb' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '15px',
                border: 'none',
                cursor: calculatePreOrderTotal() > 0 ? 'pointer' : 'not-allowed',
                boxShadow: calculatePreOrderTotal() > 0 ? '0 6px 20px rgba(37, 99, 235, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isSubmittingOrder ? 'Submitting to Vendor...' : `Confirm Pre-Order (₹${calculatePreOrderTotal()})`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
