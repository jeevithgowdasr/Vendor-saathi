import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Store,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Star,
  Layers,
  Activity,
  Ban,
  Check,
  MapPin,
  Clock,
  Tag,
  DollarSign,
  TrendingUp,
  HelpCircle,
  Eye,
  Radio,
  ShoppingBag,
  Sliders,
  ChevronRight,
  X,
  Lock
} from 'lucide-react';
import {
  getAllUsersFromFirebase,
  updateUserStatusInFirebase,
  updateVendorStoreStatus,
  getCategoriesFromFirebase,
  saveCategoryToFirebase,
  deleteCategoryFromFirebase,
  getAllComplaintsFromFirebase,
  resolveComplaintInFirebase,
  subscribeToUpcomingSchedules,
  subscribeToOrders,
  toggleProductAvailabilityInFirebase,
  deleteProductFromFirebase
} from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';

export const AdminPanelView = () => {
  const { navigateTo, showToast, user, vendors, products } = useApp();

  // Active Navigation Tab
  // 'overview' | 'verification' | 'stores' | 'users' | 'schedules' | 'orders' | 'categories' | 'complaints'
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'vendor' | 'customer' | 'admin'
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked' | 'pending'
  const [storeSearch, setStoreSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all'); // 'all' | 'active' | 'suspended'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Moderation modal / inspect state
  const [moderatingStore, setModeratingStore] = useState(null);

  // Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🥦');
  const [editingCatId, setEditingCatId] = useState(null);

  // Complaint Resolution Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  // Initial Load & Real-time Subscriptions
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await getAllUsersFromFirebase();
      if (usersRes.success && usersRes.users.length > 0) {
        setUsersList(usersRes.users);
      } else {
        setUsersList([
          {
            uid: 'v1',
            name: 'Suresh Kumar',
            email: 'suresh.vendor@vendorsaathi.com',
            phone: '+91 98451 23456',
            role: 'vendor',
            status: 'active',
            isVerified: true,
            businessName: 'Green Valley Fresh Produce',
            category: 'Vegetables & Greens',
            operatingAreas: ['Mijar', 'Moodbidri Town', 'Vijayanagar'],
            vehicleDetails: 'Ape Piaggio Auto (KA-19-M-4821)',
            rating: 4.8
          },
          {
            uid: 'v2',
            name: 'Basappa Fresh',
            email: 'basappa@gmail.com',
            phone: '+91 98452 34567',
            role: 'vendor',
            status: 'active',
            isVerified: true,
            businessName: 'Basappa Fresh Veggies',
            category: 'Vegetables',
            operatingAreas: ['Vijayanagar', 'Alva’s Gate'],
            vehicleDetails: 'TVS XL Heavy Duty (KA-19-K-1092)',
            rating: 4.6
          },
          {
            uid: 'v3_pending',
            name: 'Ramesh Gowda',
            email: 'ramesh.fruits@gmail.com',
            phone: '+91 98453 98765',
            role: 'vendor',
            status: 'pending',
            isVerified: false,
            businessName: 'Malnad Organic Fruits Cart',
            category: 'Fresh Fruits',
            operatingAreas: ['Kallabettu', 'Moodbidri East'],
            vehicleDetails: 'Mahindra Bolero Pickup (KA-19-B-7712)',
            rating: 4.9,
            appliedAt: 'Today, 10:30 AM'
          },
          {
            uid: 'c1',
            name: 'Ananya Sharma',
            email: 'ananya.customer@gmail.com',
            phone: '+91 98765 43210',
            role: 'customer',
            status: 'active',
            primaryLocation: { address: 'Mijar Village, Moodbidri - 574225' },
            preferredCategories: ['Vegetables', 'Fruits', 'Dairy'],
            preferredAreas: ['Mijar', 'Moodbidri']
          },
          {
            uid: 'c2',
            name: 'Karthik Shenoy',
            email: 'karthik.s@gmail.com',
            phone: '+91 98765 11223',
            role: 'customer',
            status: 'pending',
            primaryLocation: { address: 'Vijayanagar Layout, Moodbidri' },
            preferredCategories: ['Vegetables', 'Pooja Flowers'],
            preferredAreas: ['Vijayanagar']
          },
          {
            uid: 'adm1',
            name: 'Principal Platform Admin',
            email: 'admin@vendorsaathi.com',
            phone: '+91 99000 00001',
            role: 'admin',
            status: 'active'
          }
        ]);
      }

      // 2. Fetch Categories
      const catRes = await getCategoriesFromFirebase();
      if (catRes.success && catRes.categories.length > 0) {
        setCategoriesList(catRes.categories);
      } else {
        setCategoriesList([
          { id: 'cat_1', categoryId: 'cat_1', name: 'Vegetables & Produce', icon: '🥕', isActive: true },
          { id: 'cat_2', categoryId: 'cat_2', name: 'Fresh Fruits', icon: '🍎', isActive: true },
          { id: 'cat_3', categoryId: 'cat_3', name: 'Pooja Flowers', icon: '🌸', isActive: true },
          { id: 'cat_4', categoryId: 'cat_4', name: 'Dairy & Farm Milk', icon: '🥛', isActive: true },
          { id: 'cat_5', categoryId: 'cat_5', name: 'Daily Groceries & Spices', icon: '🛒', isActive: true },
          { id: 'cat_6', categoryId: 'cat_6', name: 'Street Snacks & Sweets', icon: '🥟', isActive: true }
        ]);
      }

      // 3. Fetch Complaints
      const compRes = await getAllComplaintsFromFirebase();
      if (compRes.success && compRes.complaints.length > 0) {
        setComplaintsList(compRes.complaints);
      } else {
        setComplaintsList([
          {
            id: 'cmp_101',
            complaintId: 'cmp_101',
            customerName: 'Ananya Sharma',
            customerId: 'c1',
            vendorName: 'Basappa Fresh Veggies',
            vendorId: 'v2',
            orderId: 'VS10215',
            description: 'Arrival was 15 minutes later than the scheduled 9:30 AM arrival window.',
            status: 'pending',
            createdAt: '11 Oct 2026, 11:15 AM'
          }
        ]);
      }
    } catch (err) {
      console.warn('Admin load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    // Real-time schedules subscription
    const unsubSchedules = subscribeToUpcomingSchedules((schedules) => {
      if (schedules && schedules.length > 0) {
        setSchedulesList(schedules);
      }
    });

    // Real-time orders subscription
    const unsubOrders = subscribeToOrders((orders) => {
      if (orders && orders.length > 0) {
        setOrdersList(orders);
      }
    });

    return () => {
      if (typeof unsubSchedules === 'function') unsubSchedules();
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, []);

  // ROLE-BASED ROUTE GUARD
  // Restricts access solely to verified admin accounts
  if (!user?.isLoggedIn || user?.role !== 'admin') {
    return (
      <div className="container animate-fade-in" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '24px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          border: '1px solid #bfdbfe',
          boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.2)'
        }}>
          <ShieldAlert size={38} />
        </div>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.05em',
          marginBottom: '12px'
        }}>
          RESTRICTED ACCESS
        </span>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em' }}>
          Admin Authorization Required
        </h2>
        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '8px', marginBottom: '28px', lineHeight: '1.6' }}>
          This console is strictly restricted to platform administrators. Your current session ({user?.email || 'Guest'}) does not possess administrative privileges.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigateTo('login', { role: 'admin' })}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              fontSize: '15px',
              fontWeight: '800',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Lock size={16} />
            <span>Sign In as Platform Admin</span>
          </button>
          <button
            onClick={() => navigateTo('home')}
            style={{
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Return to Consumer Home
          </button>
        </div>
      </div>
    );
  }

  // Action: Approve Vendor Onboarding
  const handleApproveVendor = async (targetUser) => {
    playSuccessChime();
    try {
      await updateUserStatusInFirebase(targetUser.uid || targetUser.id, 'active');
      setUsersList(prev => prev.map(u => 
        (u.uid === targetUser.uid || u.id === targetUser.uid) 
          ? { ...u, status: 'active', isVerified: true } 
          : u
      ));
      showToast(`✅ Store '${targetUser.businessName || targetUser.name}' approved & active on platform!`);
    } catch (err) {
      showToast(`Error approving vendor: ${err.message}`, 'danger');
    }
  };

  // Action: Reject Vendor Onboarding
  const handleRejectVendor = async (targetUser) => {
    playPopSound();
    try {
      await updateUserStatusInFirebase(targetUser.uid || targetUser.id, 'blocked');
      setUsersList(prev => prev.map(u => 
        (u.uid === targetUser.uid || u.id === targetUser.uid) 
          ? { ...u, status: 'blocked', isVerified: false } 
          : u
      ));
      showToast(`🚫 Vendor registration for '${targetUser.businessName || targetUser.name}' rejected.`, 'info');
    } catch (err) {
      showToast(`Error rejecting vendor: ${err.message}`, 'danger');
    }
  };

  // Action: Toggle Store Active Status
  const handleToggleStoreStatus = async (store) => {
    playPopSound();
    const newStatus = (store.status === 'suspended' || store.status === 'blocked') ? 'active' : 'suspended';
    try {
      if (store.id) {
        await updateVendorStoreStatus(store.id, {
          status: newStatus,
          isOpen: newStatus === 'active',
          statusLabel: newStatus === 'active' ? '🟢 Open Now' : '🔴 Suspended'
        });
      }
      setUsersList(prev => prev.map(u => 
        (u.uid === store.id || u.uid === store.uid || u.id === store.id)
          ? { ...u, status: newStatus }
          : u
      ));
      showToast(`Store '${store.name || store.businessName}' status set to ${newStatus.toUpperCase()}`);
    } catch (err) {
      showToast(`Failed to update store status: ${err.message}`, 'danger');
    }
  };

  // Action: Toggle Product Stock / Availability in Catalog Moderation
  const handleToggleProductStatus = async (prod) => {
    playPopSound();
    try {
      const nextAvailability = prod.is_available === false ? true : false;
      await toggleProductAvailabilityInFirebase(prod.id, nextAvailability);
      showToast(`Item '${prod.title || prod.name}' marked ${nextAvailability ? 'IN STOCK' : 'OUT OF STOCK'}`);
    } catch (err) {
      showToast(`Error toggling product: ${err.message}`, 'danger');
    }
  };

  // Action: Remove / Flag Product
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to flag and remove this item from the store catalog?')) return;
    try {
      await deleteProductFromFirebase(prodId);
      showToast('Item removed from store catalog');
    } catch (err) {
      showToast(`Error removing item: ${err.message}`, 'danger');
    }
  };

  // Action: Update User Status (active | blocked | pending)
  const handleToggleUserStatus = async (targetUser, newStatus) => {
    playPopSound();
    try {
      await updateUserStatusInFirebase(targetUser.uid || targetUser.id, newStatus);
      setUsersList(prev => prev.map(u => 
        (u.uid === targetUser.uid || u.id === targetUser.uid) ? { ...u, status: newStatus } : u
      ));
      showToast(`User ${targetUser.name} status updated to '${newStatus.toUpperCase()}'!`);
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'danger');
    }
  };

  // Action: Save / Create Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const catPayload = {
        name: newCatName.trim(),
        icon: newCatIcon || '🥦',
        isActive: true
      };
      if (editingCatId) {
        catPayload.categoryId = editingCatId;
      }
      await saveCategoryToFirebase(catPayload);
      playSuccessChime();
      showToast(editingCatId ? 'Category updated!' : 'Category added successfully!');
      setIsCatModalOpen(false);
      setNewCatName('');
      setEditingCatId(null);
      loadAdminData();
    } catch (err) {
      showToast(`Error saving category: ${err.message}`, 'danger');
    }
  };

  // Action: Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategoryFromFirebase(catId);
      setCategoriesList(prev => prev.filter(c => c.categoryId !== catId && c.id !== catId));
      showToast('Category deleted from taxonomy.');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Action: Resolve Complaint
  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      await resolveComplaintInFirebase(
        selectedComplaint.complaintId || selectedComplaint.id,
        resolutionText || 'Resolved by Platform Administrator'
      );
      setComplaintsList(prev => prev.map(c => 
        (c.id === selectedComplaint.id || c.complaintId === selectedComplaint.complaintId)
          ? { ...c, status: 'resolved', resolution: resolutionText }
          : c
      ));
      setSelectedComplaint(null);
      setResolutionText('');
      playSuccessChime();
      showToast('Complaint marked as resolved!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Filtered Users Directory
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.phone || '').includes(userSearch) ||
                          (u.businessName || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Vendor Onboarding Queue (pending approval or verification)
  const pendingVendors = usersList.filter(u => 
    u.role === 'vendor' && (u.status === 'pending' || u.isVerified === false)
  );

  // Partner Stores List
  // Combine dynamic vendors list with registered vendor users
  const partnerStores = (vendors && vendors.length > 0)
    ? vendors
    : usersList.filter(u => u.role === 'vendor').map(u => ({
        id: u.uid || u.id,
        name: u.businessName || u.name,
        owner: u.name,
        category: u.category || 'Fresh Produce',
        categories: [u.category || 'Produce'],
        location: (u.operatingAreas && u.operatingAreas[0]) || 'Moodbidri Town',
        status: u.status || 'active',
        rating: u.rating || 4.8,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'
      }));

  const filteredStores = partnerStores.filter(s => {
    const sName = (s.name || s.businessName || '').toLowerCase();
    const sLoc = (s.location || (s.operatingAreas || []).join(' ')).toLowerCase();
    const matches = sName.includes(storeSearch.toLowerCase()) || sLoc.includes(storeSearch.toLowerCase());
    if (storeFilter === 'active') return matches && (s.status === 'active' || !s.status);
    if (storeFilter === 'suspended') return matches && (s.status === 'suspended' || s.status === 'blocked');
    return matches;
  });

  // Metrics
  const totalVendors = usersList.filter(u => u.role === 'vendor').length || partnerStores.length;
  const activeVendorsCount = usersList.filter(u => u.role === 'vendor' && u.status === 'active').length || partnerStores.length;
  const totalCustomers = usersList.filter(u => u.role === 'customer').length || 18;
  const conflictedSchedules = schedulesList.filter(s => s.hasConflict).length;
  const pendingComplaints = complaintsList.filter(c => c.status !== 'resolved').length;
  const grossRevenue = ordersList.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0);

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Admin Top Header Banner - Contrasting Deep Navy & Indigo */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '30px 36px',
        borderRadius: '24px',
        marginBottom: '28px',
        boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid #334155'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: '900',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.04em'
            }}>
              <ShieldCheck size={14} /> PLATFORM GOVERNANCE
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#38bdf8'
            }}>
              <Radio size={12} color="#38bdf8" /> Live Cloud Node Active
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>
            VendorSaathi Administration Console
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '8px 0 0 0', fontWeight: '500' }}>
            Real-time multi-tenant management: Vendor onboarding, partner store moderation, catalog compliance, and user directories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={loadAdminData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 18px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Telemetry</span>
          </button>
          <button
            onClick={() => navigateTo('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Go to Consumer App
          </button>
        </div>
      </div>

      {/* Analytics Overview Cards - Cool Tone Color Palette */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="vs-card" style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Vendors</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>{activeVendorsCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700' }}>{totalVendors} total registered</span>
            {pendingVendors.length > 0 && (
              <span style={{ fontSize: '11px', color: '#d97706', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>
                {pendingVendors.length} pending
              </span>
            )}
          </div>
        </div>

        <div className="vs-card" style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered Customers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>{totalCustomers}</div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>Subscribed for Pre-Orders & ETA</span>
        </div>

        <div className="vs-card" style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Platform GMV (Orders)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>
            ₹{grossRevenue > 0 ? grossRevenue.toLocaleString() : '2,450'}
          </div>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700' }}>Instant UPI & Cash on Delivery</span>
        </div>

        <div className="vs-card" style={{ padding: '22px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Route Reliability</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#0f172a" />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>
            {conflictedSchedules > 0 ? `${conflictedSchedules} Alert` : '100%'}
          </div>
          <span style={{ fontSize: '12px', color: conflictedSchedules > 0 ? '#ef4444' : '#059669', fontWeight: '700' }}>
            {conflictedSchedules > 0 ? 'Route overlap flagged' : 'Zero route conflicts across towns'}
          </span>
        </div>
      </div>

      {/* Main Administrative Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '12px',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: '📊 Platform Metrics', icon: Activity },
          { id: 'verification', label: `📋 Vendor Onboarding (${pendingVendors.length})`, icon: ShieldCheck, badge: pendingVendors.length > 0 },
          { id: 'stores', label: `🏪 Partner Stores & Catalog (${partnerStores.length})`, icon: Store },
          { id: 'users', label: `👥 User Directory (${usersList.length})`, icon: Users },
          { id: 'schedules', label: `📅 Schedules (${schedulesList.length || 4})`, icon: Calendar },
          { id: 'orders', label: `📦 Orders (${ordersList.length || 2})`, icon: Package },
          { id: 'categories', label: `🏷️ Taxonomies (${categoriesList.length})`, icon: Tag },
          { id: 'complaints', label: `⚠️ Support (${complaintsList.length})`, icon: AlertTriangle }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); playPopSound(); }}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              border: activeTab === t.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
              backgroundColor: activeTab === t.id ? '#0f172a' : '#ffffff',
              color: activeTab === t.id ? '#ffffff' : '#475569',
              boxShadow: activeTab === t.id ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t.label}</span>
            {t.badge && (
              <span style={{
                backgroundColor: activeTab === t.id ? '#f59e0b' : '#ef4444',
                color: '#ffffff',
                fontSize: '10.5px',
                padding: '2px 6px',
                borderRadius: '8px',
                fontWeight: '900'
              }}>
                Action
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1: VENDOR ONBOARDING & VERIFICATION QUEUE
          ============================================================ */}
      {(activeTab === 'verification' || (activeTab === 'overview' && pendingVendors.length > 0)) && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Vendor Onboarding & Verification Queue
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Review incoming merchant registrations, verify store credentials, and grant mobile marketplace access.
              </p>
            </div>
            <span style={{
              padding: '6px 14px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              {pendingVendors.length} Application(s) Pending Review
            </span>
          </div>

          {pendingVendors.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px dashed #cbd5e1'
            }}>
              <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 12px auto' }} />
              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                Onboarding Queue Clear
              </strong>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '6px auto 0 auto' }}>
                All registered local merchants and mobile street cart vendors have been reviewed and approved.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
              {pendingVendors.map((vendor, idx) => (
                <div
                  key={vendor.uid || idx}
                  className="vs-card"
                  style={{
                    padding: '24px',
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #fed7aa',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        backgroundColor: '#fff7ed',
                        color: '#c2410c',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        marginBottom: '6px'
                      }}>
                        NEW REGISTRATION
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                        {vendor.businessName || vendor.name}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                        Owner: <strong>{vendor.name}</strong> • {vendor.phone || 'No phone provided'}
                      </p>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      ⏳ Pending
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    color: '#334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '18px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>🏷️ <strong>Category:</strong> {vendor.category || 'Produce / Vegetables'}</div>
                    <div>📍 <strong>Operating Route:</strong> {(vendor.operatingAreas || ['Moodbidri Town']).join(', ')}</div>
                    {vendor.vehicleDetails && <div>🚗 <strong>Transport:</strong> {vendor.vehicleDetails}</div>}
                    <div>✉️ <strong>Email:</strong> {vendor.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleApproveVendor(vendor)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={14} />
                      <span>Approve Shop</span>
                    </button>
                    <button
                      onClick={() => handleRejectVendor(vendor)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Ban size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 2: PARTNER STORE & CATALOG MODERATION
          ============================================================ */}
      {(activeTab === 'stores' || (activeTab === 'overview' && pendingVendors.length === 0)) && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Partner Store & Catalog Moderation
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Supervise partner stores, inspect live inventory catalogs, and toggle merchant active/suspended status.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search store name, area..."
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  style={{
                    padding: '9px 14px 9px 34px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    outline: 'none',
                    minWidth: '220px'
                  }}
                />
              </div>

              <select
                value={storeFilter}
                onChange={e => setStoreFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="all">All Stores ({partnerStores.length})</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredStores.map(store => {
              const isSuspended = store.status === 'suspended' || store.status === 'blocked';
              const storeProducts = (products || []).filter(p => 
                p.vendorId === store.id || p.vendorId === store.uid || (p.vendorName && p.vendorName === store.name)
              );

              return (
                <div
                  key={store.id || store.uid}
                  className="vs-card"
                  style={{
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          backgroundColor: isSuspended ? '#fef2f2' : '#eff6ff',
                          color: isSuspended ? '#dc2626' : '#2563eb',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          marginBottom: '4px'
                        }}>
                          {isSuspended ? 'SUSPENDED' : 'VERIFIED PARTNER'}
                        </span>
                        <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                          {store.name || store.businessName}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                          📍 {store.location || 'Moodbidri Local Hub'}
                        </p>
                      </div>

                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: isSuspended ? '#fee2e2' : '#ecfdf5',
                        color: isSuspended ? '#b91c1c' : '#047857',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSuspended ? '#ef4444' : '#10b981' }}></span>
                        <span>{isSuspended ? 'Suspended' : 'Live on Map'}</span>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '12.5px',
                      color: '#475569',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Catalog Items: </span>
                        <strong>{storeProducts.length} Products</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#b45309', fontWeight: '800' }}>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>{store.rating || '4.8'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(store.categories || ['Fresh Produce']).map((c, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fcfcfc', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setModeratingStore(store)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <ShoppingBag size={14} color="#2563eb" />
                      <span>Moderate Catalog</span>
                    </button>

                    <button
                      onClick={() => handleToggleStoreStatus(store)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '10px',
                        backgroundColor: isSuspended ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${isSuspended ? '#a7f3d0' : '#fecaca'}`,
                        color: isSuspended ? '#059669' : '#dc2626',
                        fontSize: '12.5px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      {isSuspended ? 'Reactivate' : 'Suspend'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: USER & VENDOR MANAGEMENT DIRECTORY
          ============================================================ */}
      {(activeTab === 'users') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Platform Users & Merchants Directory
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Full customer, vendor, and administrator account database with status toggles
              </span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search user, store, phone..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="all">All Roles</option>
                <option value="vendor">Vendors Only</option>
                <option value="customer">Customers Only</option>
                <option value="admin">Admins Only</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={e => setUserStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '800' }}>
                  <th style={{ padding: '14px 18px' }}>User Details</th>
                  <th style={{ padding: '14px 18px' }}>Role</th>
                  <th style={{ padding: '14px 18px' }}>Business / Location</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const isBlocked = u.status === 'blocked';
                  const isPending = u.status === 'pending';
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.uid || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{u.name}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{u.email} • {u.phone || 'No phone'}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: u.role === 'vendor' ? '#eff6ff' : u.role === 'admin' ? '#0f172a' : '#f0fdf4',
                          color: u.role === 'vendor' ? '#2563eb' : u.role === 'admin' ? '#ffffff' : '#059669',
                          textTransform: 'uppercase'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {u.role === 'vendor' ? (
                          <div>
                            <strong style={{ color: '#2563eb', fontSize: '13px' }}>{u.businessName || 'Local Store'}</strong>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              Areas: {(u.operatingAreas || ['Moodbidri']).join(', ')}
                            </div>
                            {u.vehicleDetails && <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚗 {u.vehicleDetails}</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12.5px', color: '#475569' }}>
                            {u.primaryLocation?.address || u.village || 'Moodbidri Region'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          backgroundColor: isActive ? '#ecfdf5' : isBlocked ? '#fef2f2' : '#fffbeb',
                          color: isActive ? '#065f46' : isBlocked ? '#991b1b' : '#b45309',
                          border: `1px solid ${isActive ? '#a7f3d0' : isBlocked ? '#fecaca' : '#fde68a'}`
                        }}>
                          {isActive ? '🟢 Active' : isBlocked ? '🔴 Blocked' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {isActive && (
                            <button
                              onClick={() => handleToggleUserStatus(u, 'blocked')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '10px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                fontWeight: '800',
                                fontSize: '11.5px',
                                cursor: 'pointer'
                              }}
                            >
                              <Ban size={12} style={{ display: 'inline', marginRight: '4px' }} /> Block
                            </button>
                          )}
                          {(isBlocked || isPending) && (
                            <button
                              onClick={() => handleToggleUserStatus(u, 'active')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '10px',
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                fontWeight: '800',
                                fontSize: '11.5px',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={12} style={{ display: 'inline', marginRight: '4px' }} /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: SCHEDULES & CONFLICT MONITOR
          ============================================================ */}
      {(activeTab === 'schedules') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Planned Visits, Overlaps & Conflict Monitor
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Monitors route overlaps and competitive same-category visits across neighborhoods
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {schedulesList.map((sched, idx) => {
              const hasConflict = sched.hasConflict;
              return (
                <div
                  key={sched.id || idx}
                  className="vs-card"
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    border: hasConflict ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    boxShadow: hasConflict ? '0 8px 24px rgba(239, 68, 68, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                        {sched.vendorName}
                      </strong>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginTop: '4px'
                      }}>
                        {sched.vendorCategory || 'Produce'}
                      </span>
                    </div>

                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      {sched.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#059669" />
                      <span><strong>Area:</strong> {sched.area?.areaName || sched.areaName || 'Moodbidri'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#0284c7" />
                      <span><strong>Date:</strong> {sched.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#f59e0b" />
                      <span><strong>Window:</strong> 9:30 AM – 11:00 AM</span>
                    </div>
                  </div>

                  {hasConflict && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: '#991b1b',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                        <AlertTriangle size={14} /> CONFLICT FLAGGED
                      </div>
                      <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        Overlapping route slot with competing merchant. Resolution choice: <strong>{sched.conflictResolution || 'ignored'}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 5: ORDERS OVERSIGHT
          ============================================================ */}
      {(activeTab === 'orders') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Platform Order Stream & Dispatch
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Real-time booking transactions across all customer-vendor interactions
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '800' }}>
                  <th style={{ padding: '14px 18px' }}>Order ID</th>
                  <th style={{ padding: '14px 18px' }}>Customer</th>
                  <th style={{ padding: '14px 18px' }}>Vendor / Store</th>
                  <th style={{ padding: '14px 18px' }}>Amount</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(ordersList.length > 0 ? ordersList : [
                  { id: 'ORD-9912', orderId: 'ORD-9912', customerName: 'Ananya Sharma', vendorName: 'Suresh Kumar - Green Valley', totalAmount: 180, status: 'confirmed' },
                  { id: 'ORD-9913', orderId: 'ORD-9913', customerName: 'Karthik Shenoy', vendorName: 'Basappa Fresh Veggies', totalAmount: 320, status: 'pending' }
                ]).map((ord, i) => (
                  <tr key={ord.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0f172a' }}>
                      #{ord.orderId || ord.id}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#334155' }}>
                      {ord.customerName || ord.customerId || 'Customer'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#059669', fontWeight: '700' }}>
                      {ord.vendorName || ord.vendorId || 'Vendor'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0f172a' }}>
                      ₹{ord.totalAmount || ord.total || 0}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: ord.status === 'confirmed' ? '#ecfdf5' : '#eff6ff',
                        color: ord.status === 'confirmed' ? '#065f46' : '#2563eb',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 6: PRODUCT CATEGORIES TAXONOMY
          ============================================================ */}
      {(activeTab === 'categories') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Platform Product Categories
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Control regional item taxonomies shown in vendor catalogs and customer filters
              </span>
            </div>

            <button
              onClick={() => {
                setEditingCatId(null);
                setNewCatName('');
                setNewCatIcon('🛒');
                setIsCatModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '14px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {categoriesList.map(cat => (
              <div
                key={cat.categoryId || cat.id}
                className="vs-card"
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px'
                  }}>
                    {cat.icon || '🥦'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>{cat.name}</strong>
                    <span style={{ fontSize: '11.5px', color: cat.isActive !== false ? '#059669' : '#94a3b8', fontWeight: '700' }}>
                      {cat.isActive !== false ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setEditingCatId(cat.categoryId || cat.id);
                      setNewCatName(cat.name);
                      setNewCatIcon(cat.icon || '🥦');
                      setIsCatModalOpen(true);
                    }}
                    style={{
                      padding: '6px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.categoryId || cat.id)}
                    style={{
                      padding: '6px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 7: COMPLAINTS & DISPUTE RESOLUTION
          ============================================================ */}
      {(activeTab === 'complaints') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Consumer Complaints & Escalations
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Quality, late arrival, and price dispute tickets submitted by buyers
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {complaintsList.map(comp => (
              <div
                key={comp.complaintId || comp.id}
                className="vs-card"
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: comp.status === 'resolved' ? '1px solid #a7f3d0' : '1.5px solid #fed7aa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>
                      #{comp.complaintId || comp.id} • Order: {comp.orderId || 'Direct'}
                    </span>
                    <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                      Against: {comp.vendorName || 'Local Merchant'}
                    </strong>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: comp.status === 'resolved' ? '#ecfdf5' : '#fff7ed',
                    color: comp.status === 'resolved' ? '#065f46' : '#c2410c'
                  }}>
                    {comp.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#334155', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '12px', margin: '10px 0', border: '1px solid #f1f5f9' }}>
                  "{comp.description}"
                </p>

                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px' }}>
                  By: <strong>{comp.customerName || 'Customer'}</strong> • {comp.createdAt || 'Recent'}
                </div>

                {comp.status !== 'resolved' && (
                  <button
                    onClick={() => setSelectedComplaint(comp)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '10px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: STORE CATALOG MODERATION
          ============================================================ */}
      {moderatingStore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                  Catalog Moderation
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0' }}>
                  {moderatingStore.name || moderatingStore.businessName}
                </h3>
              </div>
              <button
                onClick={() => setModeratingStore(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const storeProds = (products || []).filter(p => 
                  p.vendorId === moderatingStore.id || p.vendorId === moderatingStore.uid || (p.vendorName && p.vendorName === moderatingStore.name)
                );

                if (storeProds.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                      <Package size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                      <p style={{ margin: 0, fontWeight: '700' }}>No products listed yet under this store catalog.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {storeProds.map(prod => (
                      <div
                        key={prod.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={prod.imageUrl || prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200'}
                            alt={prod.title || prod.name}
                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                          />
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                              {prod.title || prod.name}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              ₹{prod.price} / {prod.unit || 'kg'} • {prod.category}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleToggleProductStatus(prod)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: prod.is_available === false ? '#fffbeb' : '#ecfdf5',
                              border: `1px solid ${prod.is_available === false ? '#fde68a' : '#a7f3d0'}`,
                              color: prod.is_available === false ? '#b45309' : '#059669',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                          >
                            {prod.is_available === false ? 'Out of Stock' : 'In Stock'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                onClick={() => setModeratingStore(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Moderation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT CATEGORY
          ============================================================ */}
      {isCatModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0' }}>
              {editingCatId ? 'Edit Product Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Greens, Farm Eggs"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Icon / Emoji
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['🥕', '🍎', '🌸', '🥛', '🛒', '🥟', '🥖', '🥚', '🍦', '🥥'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        fontSize: '20px',
                        border: newCatIcon === emoji ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: newCatIcon === emoji ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: RESOLVE COMPLAINT
          ============================================================ */}
      {selectedComplaint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0' }}>
              Resolve Complaint #{selectedComplaint.complaintId || selectedComplaint.id}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Customer statement: <em>"{selectedComplaint.description}"</em>
            </p>

            <textarea
              placeholder="Enter resolution notes / merchant warning / refund details..."
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveComplaint}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
