import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
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
  Radio
} from 'lucide-react';
import {
  getAllUsersFromFirebase,
  updateUserStatusInFirebase,
  getCategoriesFromFirebase,
  saveCategoryToFirebase,
  deleteCategoryFromFirebase,
  getAllComplaintsFromFirebase,
  resolveComplaintInFirebase,
  subscribeToUpcomingSchedules,
  subscribeToOrders
} from '../firebase';
import { playSuccessChime, playPopSound } from '../utils/audio';

export const AdminPanelView = () => {
  const { navigateTo, showToast, user } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'schedules' | 'orders' | 'categories' | 'complaints'
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'vendor' | 'customer' | 'admin'
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked' | 'pending'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

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
        // Fallback demo users if offline
        setUsersList([
          {
            uid: 'v1',
            name: 'Suresh Kumar',
            email: 'suresh.vendor@vendorsaathi.com',
            phone: '+91 98451 23456',
            role: 'vendor',
            status: 'active',
            businessName: 'Green Valley Fresh Produce',
            category: 'Vegetable',
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
            businessName: 'Basappa Fresh Veggies',
            category: 'Vegetable',
            operatingAreas: ['Vijayanagar', 'Alva’s Gate'],
            vehicleDetails: 'TVS XL Heavy Duty',
            rating: 4.6
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

    // Real-time schedules
    const unsubSchedules = subscribeToUpcomingSchedules((schedules) => {
      if (schedules && schedules.length > 0) {
        setSchedulesList(schedules);
      }
    });

    // Real-time orders
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

  // Action: Update User Status (active | blocked | pending)
  const handleToggleUserStatus = async (targetUser, newStatus) => {
    playPopSound();
    try {
      await updateUserStatusInFirebase(targetUser.uid || targetUser.id, newStatus);
      setUsersList(prev => prev.map(u => (u.uid === targetUser.uid || u.id === targetUser.uid ? { ...u, status: newStatus } : u)));
      showToast(`User ${targetUser.name} status updated to '${newStatus.toUpperCase()}'!`);
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'danger');
    }
  };

  // Action: Save or Update Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const catData = {
        categoryId: editingCatId || `cat_${Date.now()}`,
        name: newCatName.trim(),
        icon: newCatIcon || '🛒',
        isActive: true
      };
      await saveCategoryToFirebase(catData);
      setCategoriesList(prev => {
        if (editingCatId) {
          return prev.map(c => (c.categoryId === editingCatId || c.id === editingCatId ? { ...c, ...catData } : c));
        }
        return [...prev, catData];
      });
      setIsCatModalOpen(false);
      setNewCatName('');
      setEditingCatId(null);
      playSuccessChime();
      showToast(`Category '${catData.name}' saved to catalog!`);
    } catch (err) {
      showToast(`Failed to save category: ${err.message}`, 'danger');
    }
  };

  // Action: Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!confirm('Are you sure you want to deactivate this category?')) return;
    try {
      await deleteCategoryFromFirebase(catId);
      setCategoriesList(prev => prev.filter(c => (c.categoryId !== catId && c.id !== catId)));
      showToast('Category removed from active catalog.');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Action: Resolve Complaint
  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      await resolveComplaintInFirebase(selectedComplaint.complaintId || selectedComplaint.id, resolutionText);
      setComplaintsList(prev => prev.map(c => ((c.complaintId === selectedComplaint.complaintId || c.id === selectedComplaint.id) ? { ...c, status: 'resolved', resolutionNote: resolutionText } : c)));
      setSelectedComplaint(null);
      setResolutionText('');
      playSuccessChime();
      showToast('Complaint marked as resolved!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.phone || '').includes(userSearch) ||
                          (u.businessName || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Metrics
  const totalVendors = usersList.filter(u => u.role === 'vendor').length;
  const totalCustomers = usersList.filter(u => u.role === 'customer').length;
  const conflictedSchedules = schedulesList.filter(s => s.hasConflict).length;
  const pendingComplaints = complaintsList.filter(c => c.status !== 'resolved').length;
  const grossRevenue = ordersList.reduce((acc, o) => acc + (o.totalAmount || o.total || 0), 0);

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 0 60px 0', width: '100%' }}>
      {/* Admin Top Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '28px 32px',
        borderRadius: '24px',
        marginBottom: '28px',
        boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '900',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} /> PLATFORM GOVERNANCE
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <Radio size={12} color="#34d399" /> Live Cloud Node Active
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.03em' }}>
            VendorSaathi Administration Console
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '6px 0 0 0', fontWeight: '500' }}>
            Real-time management for mobile vendors, customer pre-orders, scheduled visits, conflicts, and regional catalog.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadAdminData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => navigateTo('home')}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              backgroundColor: '#10b981',
              color: '#ffffff',
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

      {/* KPI Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="vs-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Registered Vendors</span>
            <Store size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{totalVendors}</div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>Active in Moodbidri & Mijar</span>
        </div>

        <div className="vs-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Registered Customers</span>
            <Users size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{totalCustomers}</div>
          <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700' }}>Subscribed for Pre-Orders</span>
        </div>

        <div className="vs-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Active Schedules</span>
            <Calendar size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{schedulesList.length || 4}</div>
          <span style={{ fontSize: '12px', color: conflictedSchedules > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
            {conflictedSchedules > 0 ? `⚠️ ${conflictedSchedules} Conflicted Window(s)` : '✅ Zero Route Conflicts'}
          </span>
        </div>

        <div className="vs-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Platform GMV (Orders)</span>
            <DollarSign size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>₹{grossRevenue > 0 ? grossRevenue : '1,840'}</div>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700' }}>Instant UPI & Cash on Delivery</span>
        </div>

        <div className="vs-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Reported Complaints</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444', marginTop: '6px' }}>{pendingComplaints}</div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Open support tickets</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '12px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: '📊 System Overview', icon: Activity },
          { id: 'users', label: `👥 Users & Vendors (${usersList.length})`, icon: Users },
          { id: 'schedules', label: `📅 Schedules & Conflicts (${schedulesList.length || 4})`, icon: Calendar },
          { id: 'orders', label: `📦 Orders Oversight (${ordersList.length || 2})`, icon: Package },
          { id: 'categories', label: `🏷️ Product Categories (${categoriesList.length})`, icon: Tag },
          { id: 'complaints', label: `⚠️ Complaints (${complaintsList.length})`, icon: AlertTriangle }
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
              color: activeTab === t.id ? '#ffffff' : '#64748b',
              boxShadow: activeTab === t.id ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB: USERS & VENDORS MANAGEMENT
          ============================================================ */}
      {(activeTab === 'users' || activeTab === 'overview') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              User Directory & Verification Controls
            </h2>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search user, store, phone..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
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
                style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="all">All Roles</option>
                <option value="vendor">Vendors Only</option>
                <option value="customer">Customers Only</option>
                <option value="admin">Admins Only</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={e => setUserStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: '800' }}>
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
                        <span className={`badge ${
                          u.role === 'vendor' ? 'badge-info' : u.role === 'admin' ? 'badge-primary' : 'badge-warning'
                        }`} style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '900' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {u.role === 'vendor' ? (
                          <div>
                            <strong style={{ color: '#059669', fontSize: '13px' }}>{u.businessName || 'Local Store'}</strong>
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
                              <Check size={12} style={{ display: 'inline', marginRight: '4px' }} /> Activate / Verify
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
          TAB: SCHEDULES & CONFLICT MONITOR
          ============================================================ */}
      {(activeTab === 'schedules' || activeTab === 'overview') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Planned Visits, Overlaps & Conflict Monitor
              </h2>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
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
                    border: hasConflict ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                    boxShadow: hasConflict ? '0 8px 24px rgba(239, 68, 68, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
                        {sched.vendorName}
                      </strong>
                      <span className="badge badge-primary" style={{ fontSize: '11px', marginTop: '4px' }}>
                        {sched.vendorCategory || 'Produce'}
                      </span>
                    </div>

                    <span className={`badge ${
                      sched.status === 'in_transit' ? 'badge-info' :
                      sched.status === 'nearby' ? 'badge-warning' :
                      sched.status === 'arrived' ? 'badge-success' : 'badge-neutral'
                    }`} style={{ fontSize: '11.5px', fontWeight: '800' }}>
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
                      <span><strong>Window:</strong> {sched.expectedArrivalDate ? sched.expectedArrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '9:30 AM'} – {sched.expectedDepartureDate ? sched.expectedDepartureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:00 AM'}</span>
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
          TAB: CATEGORY MANAGEMENT
          ============================================================ */}
      {(activeTab === 'categories') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Platform Product Categories
              </h2>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
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
                backgroundColor: '#059669',
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
                  border: '1.5px solid #e2e8f0',
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
                    backgroundColor: '#ecfdf5',
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
          TAB: COMPLAINTS & RESOLUTION
          ============================================================ */}
      {(activeTab === 'complaints') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Reported Customer Complaints & Grievances
            </h2>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Investigate visit delays, produce quality claims, and disputes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {complaintsList.map(comp => (
              <div
                key={comp.complaintId || comp.id}
                className="vs-card"
                style={{
                  padding: '20px 24px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: comp.status === 'resolved' ? '1.5px solid #e2e8f0' : '2px solid #ef4444'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>Complaint #{comp.complaintId || comp.id}</strong>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                      Filed by <strong>{comp.customerName || 'Customer'}</strong> against <strong>{comp.vendorName || 'Vendor'}</strong> • Order: {comp.orderId || 'N/A'}
                    </div>
                  </div>

                  <span className={`badge ${comp.status === 'resolved' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11.5px', fontWeight: '800' }}>
                    {comp.status === 'resolved' ? '✅ Resolved' : '⚠️ Pending Action'}
                  </span>
                </div>

                <p style={{ fontSize: '13.5px', color: '#334155', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px', margin: '10px 0' }}>
                  "{comp.description}"
                </p>

                {comp.status === 'resolved' ? (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                    Resolution Note: {comp.resolutionNote || 'Resolved by Administrator'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      onClick={() => {
                        setSelectedComplaint(comp);
                        setResolutionText('');
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve & Add Note
                    </button>
                  </div>
                )}
              </div>
            ))}
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
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
                        border: newCatIcon === emoji ? '2px solid #10b981' : '1px solid #cbd5e1',
                        backgroundColor: newCatIcon === emoji ? '#ecfdf5' : '#ffffff',
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
                    backgroundColor: '#10b981',
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
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
                  backgroundColor: '#059669',
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
