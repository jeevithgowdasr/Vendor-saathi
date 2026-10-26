import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useVendorSync } from '../context/VendorSyncContext';
import { 
  Store, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  Plus, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Phone, 
  Check, 
  X, 
  Send,
  Navigation,
  Activity,
  Sliders,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';
import { playOrderNotificationSound, playStatusUpdateSound, playPopSound } from '../utils/audio';
import { FormField } from '../components/FormField';
import { 
  validateForm, 
  validateRequiredText, 
  validateCurrency, 
  validateImageFile 
} from '../utils/validators';
import { useAsyncMutation } from '../hooks/useAsyncMutation';
import { AsyncButton } from '../components/AsyncButton';
import { EmptyStateFallback } from '../components/EmptyStateFallback';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { cacheManager, CACHE_KEYS } from '../utils/cacheManager';
import { VendorProductsTab } from '../components/VendorProductsTab';
import { VendorPlanVisitTab } from '../components/VendorPlanVisitTab';
import {
  respondToAdditionalItemInFirebase,
  streamVendorLiveLocation,
  stopVendorLiveLocationStream
} from '../firebase';

export const VendorPortalView = () => {
  const { 
    orders, 
    products, 
    updateVendorProduct, 
    vendors, 
    updateVendorStore, 
    activeOrderId, 
    setActiveOrderId, 
    navigateTo, 
    showToast,
    setIsVendorChatOpen,
    activeRiderLocation,
    setActiveRiderLocation,
    user,
    currentViewParams
  } = useApp();

  const { updateVendorOrderState, broadcastRiderLocation, broadcastStoreStatus } = useVendorSync();

  // Active vendor selection (Defaults to authenticated user.uid)
  const [selectedVendorId, setSelectedVendorId] = useState(user?.uid || 'v1');
  const [activeTab, setActiveTab] = useState(currentViewParams?.tab === 'inventory' ? 'inventory' : 'orders'); // 'orders' | 'inventory' | 'schedule' | 'gps' | 'chat'

  useEffect(() => {
    if (user?.uid) {
      setSelectedVendorId(user.uid);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (currentViewParams?.tab) {
      setActiveTab(currentViewParams.tab);
    }
  }, [currentViewParams?.tab]);
  
  // GPS Telemetry Simulation state
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [gpsProgress, setGpsProgress] = useState(0.5);
  const [activeGpsWatchId, setActiveGpsWatchId] = useState(null);

  // New Product Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('kg');
  const [newProdCategory, setNewProdCategory] = useState('vegetables');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80');
  const [newProdImageFile, setNewProdImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Handle responding to customer additional item requests
  const handleRespondToAddon = async (orderId, productId, decision) => {
    try {
      const res = await respondToAdditionalItemInFirebase(orderId, productId, decision);
      if (res.success) {
        playPopSound();
        showToast(decision === 'accepted' ? '✅ Accepted additional item! Order total updated.' : '❌ Declined additional item request.', decision === 'accepted' ? 'success' : 'info');
      }
    } catch (err) {
      showToast(`Error updating add-on: ${err.message}`, 'danger');
    }
  };

  // Toggle device GPS streaming for vendor schedule trip
  const handleToggleHardwareGps = (scheduleId = 'sch_demo_01') => {
    if (activeGpsWatchId) {
      stopVendorLiveLocationStream(activeGpsWatchId);
      setActiveGpsWatchId(null);
      setIsSimulatingGps(false);
      showToast('🛑 Device GPS live telemetry stopped.');
    } else {
      const watchId = streamVendorLiveLocation(
        scheduleId,
        (pos) => {
          broadcastRiderLocation(selectedVendorId, {
            lat: pos.latitude,
            lng: pos.longitude,
            progress: 0.75
          });
        },
        (err) => {
          showToast(`Device GPS note: ${err.message}. Using simulated telemetry.`, 'info');
          setIsSimulatingGps(true);
        }
      );
      setActiveGpsWatchId(watchId);
      setIsSimulatingGps(true);
      showToast('🛵 Live Trip Started! Streaming GPS telemetry to customer map 🛰️', 'success');
    }
  };

  // Vendor chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'customer', text: 'Namaste! Please pack fresh crisp produce for delivery.', time: '10:38 AM' },
    { sender: 'vendor', text: 'Namaste! Handpicked fresh batch from Moodbidri farms. Dispatched and on the way.', time: '10:40 AM' }
  ]);
  const [vendorReplyInput, setVendorReplyInput] = useState('');

  const currentVendor = vendors.find(v => v.id === selectedVendorId) || vendors[0];
  const vendorOrders = orders.filter(o => o.vendorId === selectedVendorId || !o.vendorId);
  const vendorProducts = products.filter(p => p.vendorId === selectedVendorId);

  // Stats calculation
  const totalRevenue = vendorOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + (o.total || 0) : sum, 0);
  const pendingOrdersCount = vendorOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const deliveredOrdersCount = vendorOrders.filter(o => o.status === 'Delivered').length;

  // Real-time GPS ride simulation interval
  useEffect(() => {
    let timer;
    if (isSimulatingGps) {
      timer = setInterval(() => {
        setGpsProgress(prev => {
          const next = prev >= 0.98 ? 0.15 : prev + 0.05;
          const coords = {
            lat: 13.0100 + next * 0.0035,
            lng: 74.9820 + next * 0.0040,
            progress: next
          };
          broadcastRiderLocation(selectedVendorId, coords);
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isSimulatingGps, selectedVendorId]);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Order status progression with async mutex lock
  const { mutateAsync: executeOrderStatusUpdate, isPending: isUpdatingStatus } = useAsyncMutation(async ({ orderId, newStatus }) => {
    setUpdatingOrderId(`${orderId}_${newStatus}`);
    await new Promise(r => setTimeout(r, 300));
    updateVendorOrderState(orderId, newStatus);
    playStatusUpdateSound();
    showToast(`Order #${orderId} status changed to "${newStatus}"! Synced live with customer 🚀`);
  }, {
    invalidateKeys: CACHE_KEYS.ORDERS,
    onSuccess: () => {
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    }
  });

  const handleOrderStatusUpdate = (orderId, newStatus) => {
    executeOrderStatusUpdate({ orderId, newStatus });
  };

  // Toggle store online/offline/busy
  const handleStoreStatusChange = (newStatus) => {
    let label = '🟢 Open Now';
    let isOpen = true;
    if (newStatus === 'busy') {
      label = '🟠 Busy (High Demand)';
      isOpen = true;
    } else if (newStatus === 'offline') {
      label = '🔴 Closed';
      isOpen = false;
    }
    broadcastStoreStatus(selectedVendorId, {
      status: newStatus,
      isOpen,
      statusLabel: label
    });
    playPopSound();
    showToast(`Store status updated: ${label}`);
  };

  // Toggle stock availability
  const handleStockToggle = (product) => {
    const nextStatus = product.stockStatus === 'in-stock' ? 'out-of-stock' : 'in-stock';
    const nextStock = nextStatus === 'in-stock' ? 15 : 0;
    updateVendorProduct(product.id, {
      stockStatus: nextStatus,
      availableStock: nextStock
    });
    showToast(`${product.name} marked as ${nextStatus.toUpperCase()}`);
  };

  // Handle secure file upload
  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileErr = validateImageFile(file, 5); // 5MB limit
    if (fileErr) {
      setFieldErrors(prev => ({ ...prev, image: fileErr }));
      showToast(`⚠️ ${fileErr}`, 'danger');
      playPopSound();
      return;
    }

    setFieldErrors(prev => ({ ...prev, image: null }));
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setNewProdImage(loadEvt.target.result);
      showToast('📷 Product image uploaded & verified safely!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Add new product to catalog
  const handleAddProduct = (e) => {
    e.preventDefault();

    const productSchema = {
      name: (v) => validateRequiredText(v, 'Item Name', 2, 100),
      price: (v) => validateCurrency(v, 'Price (₹)', 1, 100000)
    };

    const { isValid, errors, sanitizedData } = validateForm({
      name: newProdName,
      price: newProdPrice
    }, productSchema);

    if (!isValid) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      showToast(`⚠️ ${firstErr}`, 'danger');
      playPopSound();
      return;
    }

    setFieldErrors({});
    const numPrice = Number(sanitizedData.price);

    const newProd = {
      id: `p_custom_${Date.now()}`,
      name: sanitizedData.name,
      shortName: sanitizedData.name.split(' ')[0],
      category: newProdCategory,
      price: numPrice,
      originalPrice: Math.round(numPrice * 1.25),
      unit: newProdUnit,
      availableStock: 20,
      stockStatus: 'in-stock',
      vendorId: selectedVendorId,
      vendorName: currentVendor.name,
      vendorDistance: currentVendor.distance || '1.5 km',
      rating: 4.8,
      reviewCount: 1,
      isPopular: true,
      isOrganic: true,
      image: newProdImage,
      description: `Locally sourced fresh farm produce from ${currentVendor.name}, Moodbidri.`
    };

    updateVendorProduct(newProd.id, newProd);
    cacheManager.invalidate(CACHE_KEYS.PRODUCTS, newProd);
    setIsAddProductOpen(false);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80');
    showToast(`🎉 Added ${newProd.name} to live store catalog!`);
  };

  // Send reply in vendor chat
  const handleVendorChatReply = (e) => {
    e.preventDefault();
    if (!vendorReplyInput.trim()) return;

    const replyMsg = {
      sender: 'vendor',
      text: vendorReplyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, replyMsg]);
    setVendorReplyInput('');
    playPopSound();
    showToast('💬 Message sent to customer!');
  };

  const inventoryColumns = [
    {
      key: 'product',
      label: 'Product Details',
      width: '280px',
      sticky: true,
      render: (_, product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', wordBreak: 'break-word' }}>
              {product.name}
            </strong>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              ID: #{product.id}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      width: '140px',
      render: (val) => (
        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155', textTransform: 'capitalize', fontSize: '11.5px' }}>
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Unit Price',
      width: '130px',
      render: (val, product) => (
        <span style={{ fontSize: '14px', fontWeight: '900', color: '#059669' }}>
          ₹{val} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>/ {product.unit}</span>
        </span>
      )
    },
    {
      key: 'stockStatus',
      label: 'Stock Telemetry',
      width: '150px',
      render: (status, product) => (
        <button
          type="button"
          onClick={() => handleStockToggle(product)}
          className="touch-target-44"
          style={{
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            backgroundColor: status === 'in-stock' ? '#ecfdf5' : '#fee2e2',
            color: status === 'in-stock' ? '#065f46' : '#991b1b',
            border: status === 'in-stock' ? '1.5px solid #a7f3d0' : '1.5px solid #fecaca',
            transition: 'all 0.2s ease'
          }}
          aria-label={`Toggle stock status for ${product.name}, currently ${status}`}
        >
          {status === 'in-stock' ? '🟢 In Stock' : '🔴 Out of Stock'}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'right',
      render: (_, product) => (
        <button
          type="button"
          onClick={() => {
            const newPrice = prompt(`Enter new price for ${product.name} (Current: ₹${product.price}):`, product.price);
            if (newPrice && !isNaN(newPrice)) {
              updateVendorProduct(product.id, { price: Number(newPrice) });
              showToast(`Updated ${product.name} price to ₹${newPrice}`);
            }
          }}
          className="touch-target-44"
          style={{
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            cursor: 'pointer'
          }}
          aria-label={`Edit price for ${product.name}`}
        >
          <Edit3 size={14} style={{ marginRight: '4px' }} />
          <span>Edit Price</span>
        </button>
      )
    }
  ];

  return (
    <div className="container animate-fade-in" style={{ padding: '28px 0 60px 0', width: '100%' }}>
      {/* Top Banner & Mode Switcher */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 16px 36px -8px rgba(6, 78, 59, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}>
            <Store size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                VendorSaathi Partner Portal
              </h1>
              <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontSize: '11px', fontWeight: '800' }}>
                🟢 LIVE CONNECTED
              </span>
            </div>
            <span style={{ fontSize: '13.5px', color: '#a7f3d0', display: 'block', marginTop: '3px' }}>
              Two-Way Realtime Order Terminal, Stock Manager & Live Delivery Dispatch
            </span>
          </div>
        </div>

        {/* Action Buttons & Customer Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigateTo('home')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          >
            <ShoppingBag size={16} color="#6ee7b7" />
            <span>Switch to Customer Website</span>
          </button>
        </div>
      </div>

      {/* Store Selection & Status Bar */}
      <div className="vs-card" style={{
        padding: '18px 24px',
        borderRadius: '20px',
        backgroundColor: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        border: '1.5px solid #e2e8f0'
      }}>
        {/* Select Active Store */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Managing Store:
          </span>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '14px',
              fontWeight: '800',
              color: '#064e3b',
              backgroundColor: '#f0fdf4',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                🏪 {v.name} ({v.location})
              </option>
            ))}
          </select>
        </div>

        {/* Store Open / Busy / Closed Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#64748b' }}>Store Status:</span>
          <button
            onClick={() => handleStoreStatusChange('online')}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: currentVendor.status === 'online' ? '#10b981' : '#f1f5f9',
              color: currentVendor.status === 'online' ? '#ffffff' : '#64748b',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🟢 Open
          </button>
          <button
            onClick={() => handleStoreStatusChange('busy')}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: currentVendor.status === 'busy' ? '#f59e0b' : '#f1f5f9',
              color: currentVendor.status === 'busy' ? '#ffffff' : '#64748b',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🟠 High Demand
          </button>
          <button
            onClick={() => handleStoreStatusChange('offline')}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: currentVendor.status === 'offline' ? '#ef4444' : '#f1f5f9',
              color: currentVendor.status === 'offline' ? '#ffffff' : '#64748b',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🔴 Closed
          </button>
        </div>
      </div>

      {/* Phase 3 Summary Cards: Today's Trip Status, Total Pre-Orders, Revenue Summary, Overall Rating */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Today's Trip Status */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Today's Trip Status</span>
            <span style={{ fontSize: '18px' }}>🛵</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: isSimulatingGps ? '#0284c7' : '#059669', marginTop: '6px' }}>
            {isSimulatingGps ? '🛵 In Transit (Live GPS)' : currentVendor.isOpen ? '🟢 Ready for Route' : '🔴 Closed / Offline'}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', display: 'block', marginTop: '2px' }}>
            {isSimulatingGps ? 'Coordinates broadcasting to buyers' : 'Scheduled visit ready to dispatch'}
          </span>
        </div>

        {/* Card 2: Total Pre-Orders */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Pre-Orders</span>
            <span style={{ fontSize: '18px' }}>📦</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', marginTop: '6px' }}>
            {vendorOrders.length} Pre-Orders
          </div>
          <span style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '700', display: 'block', marginTop: '2px' }}>
            {pendingOrdersCount} awaiting packing & dispatch
          </span>
        </div>

        {/* Card 3: Revenue Summary */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Revenue Summary</span>
            <span style={{ fontSize: '18px' }}>💰</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
            ₹{totalRevenue}
          </div>
          <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: '700', display: 'block', marginTop: '2px' }}>
            ↑ 100% direct instant payout
          </span>
        </div>

        {/* Card 4: Overall Rating */}
        <div className="vs-card" style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Overall Rating</span>
            <span style={{ fontSize: '18px' }}>⭐</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#8b5cf6', marginTop: '6px' }}>
            {currentVendor.rating ? currentVendor.rating.toFixed(1) : '5.0'} / 5.0
          </div>
          <span style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: '700', display: 'block', marginTop: '2px' }}>
            Based on {currentVendor.reviewCount || 0} customer reviews
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '12px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'orders', label: `📦 Live Orders (${vendorOrders.length})`, icon: Package },
          { id: 'inventory', label: `🥬 Produce & Stock Manager (${vendorProducts.length})`, icon: Sliders },
          { id: 'schedule', label: `📅 Plan Visits & Schedules`, icon: Calendar },
          { id: 'gps', label: '🛵 Live Rider GPS Dispatch', icon: Navigation },
          { id: 'chat', label: '💬 Customer Live Chat', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); playPopSound(); }}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              border: activeTab === tab.id ? '2px solid #10b981' : '1px solid #e2e8f0',
              backgroundColor: activeTab === tab.id ? '#ecfdf5' : '#ffffff',
              color: activeTab === tab.id ? '#064e3b' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1: LIVE ORDERS MANAGEMENT
          ============================================================ */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Incoming Customer Orders Queue
            </h2>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Updates click status in real-time on customer's phone
            </span>
          </div>

          {vendorOrders.length === 0 ? (
            <div className="vs-card" style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '20px' }}>
              <Package size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <strong style={{ fontSize: '17px', color: '#334155', display: 'block' }}>No Orders in Queue</strong>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
                When customers place an order from {currentVendor.name}, it will appear here immediately with an audio chime!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {vendorOrders.map((order) => (
                <div key={order.id} className="vs-card" style={{
                  padding: '24px',
                  borderRadius: '22px',
                  backgroundColor: '#ffffff',
                  border: order.status === 'Placed' ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                  boxShadow: '0 6px 18px -4px rgba(15, 23, 42, 0.06)'
                }}>
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '18px', color: '#0f172a', fontWeight: '900' }}>Order #{order.id}</strong>
                        <span className={`badge ${
                          order.status === 'Delivered' ? 'badge-success' :
                          order.status === 'Cancelled' ? 'badge-danger' :
                          order.status === 'Out for Delivery' ? 'badge-info' : 'badge-warning'
                        }`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                          {order.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                        🕒 {order.date} • Payment: <strong>{order.paymentMethod}</strong>
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: '#059669' }}>₹{order.total}</span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block' }}>({order.items.length} items)</span>
                    </div>
                  </div>

                  {/* Customer Info & Address */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    marginBottom: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#334155'
                  }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>👤 Customer Details:</strong>
                      <span>{order.customerName || order.deliveryAddress?.split(',')[0] || 'Registered Customer'}</span><br />
                      <span>📞 {order.deliveryContact || order.phone || '+91 9876543210'}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>📍 Delivery Address & GPS Coordinates:</strong>
                      <span>{order.deliveryAddress}</span>
                      {order.customerGPS && (
                        <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '8px', fontSize: '11.5px', color: '#065f46', fontWeight: '700' }}>
                          <span>🛰️ GPS Lock: {order.customerGPS.lat}° N, {order.customerGPS.lng}° E</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Items Request Banner */}
                  {order.items?.some(i => i.isAdditionalRequest && i.requestStatus === 'pending') && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '2px solid #f59e0b',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <strong style={{ fontSize: '14px', color: '#92400e' }}>
                          Customer Requested Add-On Produce!
                        </strong>
                      </div>
                      {order.items.filter(i => i.isAdditionalRequest && i.requestStatus === 'pending').map((addonItem, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fde68a', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{addonItem.name}</strong>
                            <span style={{ fontSize: '12px', color: '#059669', display: 'block' }}>
                              Quantity: {addonItem.quantity} {addonItem.unit} • +₹{addonItem.price * addonItem.quantity}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleRespondToAddon(order.id, addonItem.productId || addonItem.id, 'accepted')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                            >
                              ✓ Accept (+₹{addonItem.price * addonItem.quantity})
                            </button>
                            <button
                              onClick={() => handleRespondToAddon(order.id, addonItem.productId || addonItem.id, 'rejected')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Items List */}
                  <div style={{ marginBottom: '18px' }}>
                    <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Items to Pack:
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: item.isAdditionalRequest ? '#ecfdf5' : '#f1f5f9', border: item.isAdditionalRequest ? '1px solid #a7f3d0' : 'none', fontSize: '13px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                            {item.quantity}
                          </span>
                          <span style={{ fontWeight: '700', color: '#1e293b', flex: 1 }}>{item.name} {item.isAdditionalRequest ? '*(Add-on)*' : ''}</span>
                          <span style={{ color: '#059669', fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Transition Action Pipeline */}
                  <div style={{ paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Advance Order Lifecycle:
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <AsyncButton
                        isPending={updatingOrderId === `${order.id}_Accepted`}
                        loadingText="Accepting..."
                        onClick={() => handleOrderStatusUpdate(order.id, 'Accepted')}
                        disabled={order.status === 'Accepted' || order.status === 'Preparing' || order.status === 'Out for Delivery' || order.status === 'Delivered'}
                        icon={Check}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          backgroundColor: order.status === 'Accepted' ? '#047857' : '#10b981',
                          color: '#ffffff',
                          opacity: (order.status === 'Preparing' || order.status === 'Out for Delivery' || order.status === 'Delivered') ? 0.5 : 1
                        }}
                      >
                        1. Accept Order
                      </AsyncButton>

                      <AsyncButton
                        isPending={updatingOrderId === `${order.id}_Preparing`}
                        loadingText="Packing..."
                        onClick={() => handleOrderStatusUpdate(order.id, 'Preparing')}
                        disabled={order.status === 'Preparing' || order.status === 'Out for Delivery' || order.status === 'Delivered'}
                        icon={Clock}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          backgroundColor: order.status === 'Preparing' ? '#b45309' : '#f59e0b',
                          color: '#ffffff',
                          opacity: (order.status === 'Out for Delivery' || order.status === 'Delivered') ? 0.5 : 1
                        }}
                      >
                        2. Start Packing
                      </AsyncButton>

                      <AsyncButton
                        isPending={updatingOrderId === `${order.id}_Out for Delivery`}
                        loadingText="Dispatching..."
                        onClick={() => {
                          handleOrderStatusUpdate(order.id, 'Out for Delivery');
                          setIsSimulatingGps(true);
                        }}
                        disabled={order.status === 'Out for Delivery' || order.status === 'Delivered'}
                        icon={Truck}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          backgroundColor: order.status === 'Out for Delivery' ? '#0369a1' : '#0284c7',
                          color: '#ffffff',
                          opacity: order.status === 'Delivered' ? 0.5 : 1
                        }}
                      >
                        3. Dispatch with Rider (GPS)
                      </AsyncButton>

                      <AsyncButton
                        isPending={updatingOrderId === `${order.id}_Delivered`}
                        loadingText="Completing..."
                        onClick={() => {
                          handleOrderStatusUpdate(order.id, 'Delivered');
                          setIsSimulatingGps(false);
                        }}
                        disabled={order.status === 'Delivered'}
                        icon={CheckCircle2}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          backgroundColor: order.status === 'Delivered' ? '#064e3b' : '#059669',
                          color: '#ffffff'
                        }}
                      >
                        4. Mark Delivered
                      </AsyncButton>

                      <button
                        onClick={() => {
                          setActiveOrderId(order.id);
                          navigateTo('order-tracking', { orderId: order.id });
                        }}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={15} /> Customer View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 2: PRODUCE CATALOG & INVENTORY MANAGER
          ============================================================ */}
      {activeTab === 'inventory' && (
        <VendorProductsTab
          token={user?.authToken || (typeof window !== 'undefined' ? localStorage.getItem('vs_auth_token') : null)}
          vendorId={selectedVendorId}
          vendorName={currentVendor.name}
          onToast={showToast}
        />
      )}

      {/* ============================================================
          TAB: PLANNED VISITS & SCHEDULE MANAGEMENT
          ============================================================ */}
      {activeTab === 'schedule' && (
        <VendorPlanVisitTab
          vendorId={selectedVendorId}
          vendorName={currentVendor.name}
          vendorCategory={currentVendor.category || 'Produce & Groceries'}
          vendorProducts={vendorProducts}
          onToast={showToast}
        />
      )}


      {/* ============================================================
          TAB 3: LIVE RIDER GPS DISPATCH
          ============================================================ */}
      {activeTab === 'gps' && (
        <div className="vs-card" style={{ padding: '28px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Live Delivery Rider GPS Telemetry
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Simulate or broadcast live delivery rider movement from {currentVendor.name} store to Mijar / Moodbidri customer homes.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleToggleHardwareGps()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: activeGpsWatchId ? '#ef4444' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Navigation size={16} className={activeGpsWatchId ? 'animate-spin' : ''} />
                <span>{activeGpsWatchId ? 'Stop Hardware GPS' : 'Start Trip & Stream Device GPS'}</span>
              </button>

              <button
                onClick={() => {
                  setIsSimulatingGps(!isSimulatingGps);
                  playPopSound();
                  showToast(isSimulatingGps ? 'GPS Telemetry Paused' : '🛵 Live Rider Ride Activated!');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: isSimulatingGps ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Radio size={16} className={isSimulatingGps ? 'animate-pulse' : ''} />
                <span>{isSimulatingGps ? 'Stop Simulation' : 'Simulate Delivery Run'}</span>
              </button>
            </div>
          </div>

          {/* Interactive GPS Visualizer */}
          <div style={{
            backgroundColor: '#090d16',
            borderRadius: '20px',
            padding: '24px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={18} color="#34d399" />
                <strong style={{ fontSize: '14.5px' }}>Active Route: Mijar Store → Alva’s Campus Gate</strong>
              </div>
              <span className="badge badge-success" style={{ backgroundColor: '#064e3b', color: '#a7f3d0' }}>
                {isSimulatingGps ? '🟢 TRANSMITTING LIVE GPS' : '⏸️ GPS IDLE'}
              </span>
            </div>

            {/* Simulated Road Track */}
            <div style={{ position: 'relative', height: '80px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '20px', right: '20px', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }}>
                <div style={{ width: `${gpsProgress * 100}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '2px', transition: 'width 0.8s ease' }} />
              </div>

              {/* Start Store Point */}
              <div style={{ position: 'absolute', left: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  🏪
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Store</span>
              </div>

              {/* Moving Rider Marker */}
              <div style={{
                position: 'absolute',
                left: `calc(20px + ${gpsProgress} * (100% - 70px))`,
                transition: 'left 0.8s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fbbf24',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px #fbbf24',
                  animation: 'pulseGlowRing 1.5s infinite'
                }}>
                  🛵
                </div>
                <span style={{ fontSize: '10px', color: '#fef08a', fontWeight: '800', marginTop: '2px' }}>
                  {Math.round(gpsProgress * 100)}%
                </span>
              </div>

              {/* Destination Point */}
              <div style={{ position: 'absolute', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  🏠
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Customer</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
              <span>Latitude: <strong>{(13.0100 + gpsProgress * 0.0035).toFixed(4)}° N</strong></span>
              <span>Longitude: <strong>{(74.9820 + gpsProgress * 0.0040).toFixed(4)}° E</strong></span>
              <span>Speed: <strong>24 km/h</strong></span>
              <span>ETA: <strong>{Math.max(1, Math.round((1 - gpsProgress) * 15))} mins</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: CUSTOMER TWO-WAY CHAT
          ============================================================ */}
      {activeTab === 'chat' && (
        <div className="vs-card" style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
              C
            </div>
            <div>
              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>Direct Customer Chat</strong>
              <span style={{ fontSize: '12px', color: '#059669' }}>📍 Mijar Village • Active Orders</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ minHeight: '260px', maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'vendor' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'vendor' ? '#065f46' : '#f1f5f9',
                  color: msg.sender === 'vendor' ? '#ffffff' : '#0f172a',
                  padding: '10px 16px',
                  borderRadius: msg.sender === 'vendor' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  maxWidth: '80%',
                  fontSize: '13.5px'
                }}
              >
                <div>{msg.text}</div>
                <span style={{ fontSize: '10px', opacity: 0.8, display: 'block', textAlign: 'right', marginTop: '4px' }}>{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleVendorChatReply} style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="Reply to customer..."
              value={vendorReplyInput}
              onChange={(e) => setVendorReplyInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 18px', borderRadius: '12px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
