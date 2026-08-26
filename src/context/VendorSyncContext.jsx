import React, { createContext, useContext, useEffect } from 'react';
import { useApp } from './AppContext';
import { playOrderNotificationSound, playStatusUpdateSound } from '../utils/audio';
import { updateOrderStatusInFirebase, updateVendorLiveLocation, updateVendorStoreStatus } from '../firebase';

const VendorSyncContext = createContext();

export const VendorSyncProvider = ({ children }) => {
  const { 
    updateOrderStatus, 
    showToast, 
    setNotifications, 
    setActiveRiderLocation,
    updateVendorProduct,
    updateVendorStore
  } = useApp();

  useEffect(() => {
    // Listen for storage events across tabs or windows
    const handleStorageChange = (e) => {
      // 1. Order Status Updates
      if (e.key === 'vendorsaathi_status_update' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          if (update && update.orderId && update.status) {
            updateOrderStatus(update.orderId, update.status, update.extraData || {});
            setNotifications(prev => [
              {
                id: `n_sync_${Date.now()}`,
                title: `🔔 Order #${update.orderId} Update`,
                body: `Vendor updated your order status to "${update.status}".`,
                time: 'Just now',
                read: false
              },
              ...prev
            ]);
            playStatusUpdateSound();
          }
        } catch (err) {
          console.error("Sync parse error:", err);
        }
      }

      // 2. Incoming New Orders for Vendor App
      if (e.key === 'vendorsaathi_new_order_placed' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.order) {
            playOrderNotificationSound();
            showToast(`🔔 [Vendor App] New incoming order #${data.order.id} from ${data.order.deliveryAddress?.split(',')[0] || 'Customer'}!`, 'info');
          }
        } catch (err) {
          console.error("Order notification parse error:", err);
        }
      }

      // 3. Product Catalog Changes
      if (e.key === 'vendorsaathi_product_sync' && e.newValue) {
        try {
          const { productId, updates } = JSON.parse(e.newValue);
          if (productId && updates) {
            updateVendorProduct(productId, updates);
          }
        } catch (err) {
          console.error("Product sync error:", err);
        }
      }

      // 4. Vendor Store State Changes
      if (e.key === 'vendorsaathi_vendor_sync' && e.newValue) {
        try {
          const { vendorId, updates } = JSON.parse(e.newValue);
          if (vendorId && updates) {
            updateVendorStore(vendorId, updates);
          }
        } catch (err) {
          console.error("Vendor sync error:", err);
        }
      }

      // 5. Rider Live GPS Telemetry Broadcast
      if (e.key === 'vendorsaathi_rider_location_update' && e.newValue) {
        try {
          const { coords } = JSON.parse(e.newValue);
          if (coords) {
            setActiveRiderLocation(coords);
          }
        } catch (err) {
          console.error("Rider GPS sync error:", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [updateOrderStatus, showToast, setNotifications, setActiveRiderLocation, updateVendorProduct, updateVendorStore]);

  const updateVendorOrderState = (orderId, newStatus, extraData = {}) => {
    // Save to local storage to trigger cross-window / tab sync
    localStorage.setItem('vendorsaathi_status_update', JSON.stringify({
      orderId,
      status: newStatus,
      extraData,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new Event('storage'));

    // Update local state directly
    updateOrderStatus(orderId, newStatus, extraData);

    // Sync to Firestore
    updateOrderStatusInFirebase(orderId, newStatus, extraData);
  };

  const broadcastRiderLocation = (vendorId, coords) => {
    setActiveRiderLocation(coords);
    localStorage.setItem('vendorsaathi_rider_location_update', JSON.stringify({
      vendorId,
      coords,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new Event('storage'));
    updateVendorLiveLocation(vendorId, coords);
  };

  const broadcastStoreStatus = (vendorId, storeState) => {
    updateVendorStore(vendorId, storeState);
    updateVendorStoreStatus(vendorId, storeState);
  };

  return (
    <VendorSyncContext.Provider value={{ 
      updateVendorOrderState, 
      broadcastRiderLocation,
      broadcastStoreStatus
    }}>
      {children}
    </VendorSyncContext.Provider>
  );
};

export const useVendorSync = () => useContext(VendorSyncContext);
