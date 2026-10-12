import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Plus,
  CheckCircle2,
  AlertCircle,
  Truck,
  Edit3,
  Trash2,
  X,
  Check,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Compass,
  Radio,
  Sliders,
  ChevronRight,
  Info,
  CalendarDays,
  List
} from 'lucide-react';
import {
  useVendorSchedules,
  SCHEDULE_STATUSES,
  STATUS_NEXT_STEP
} from '../hooks/useVendorSchedules';
import { PRESET_AREAS } from '../services/scheduleApi';
import { FormField } from './FormField';
import { ConflictResolutionModal } from './ConflictResolutionModal';

export const VendorPlanVisitTab = ({
  vendorId = 'v1',
  vendorName = 'Local Fresh Store',
  vendorCategory = 'Vegetables & Produce',
  vendorProducts = [],
  onToast
}) => {
  const {
    filteredSchedules,
    metrics,
    isLoading,
    isSaving,
    updatingStatusId,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    viewMode,
    setViewMode,
    isModalOpen,
    editingSchedule,
    formData,
    formErrors,
    openCreateModal,
    openEditModal,
    closeModal,
    handleFormChange,
    handleAreaSelect,
    toggleProductSelection,
    selectAllProducts,
    deselectAllProducts,
    loadSchedules,
    handleSaveSchedule,
    handleAdvanceStatus,
    handleCancelSchedule,
    handleDeleteSchedule,

    // Conflict Detection & Resolution
    isCheckingConflict,
    conflictData,
    isConflictModalOpen,
    pendingSchedulePayload,
    closeConflictModal,
    handleResolveWithTimeSlot,
    handleResolveWithRecommendedArea,
    handleResolveContinueAnyway
  } = useVendorSchedules({ vendorId, vendorName, vendorCategory, onToast });

  // Custom area input toggle state
  const [isCustomArea, setIsCustomArea] = useState(false);

  // Helper to get product info by ID
  const getProductById = (id) => {
    return vendorProducts.find(p => (p.id || p._id) === id) || {
      id,
      name: `Product #${id.slice(-4)}`,
      price: '—',
      unit: 'item'
    };
  };

  // Helper to format ISO or Date into readable time (e.g., "9:30 AM")
  const formatTimeDisplay = (timeVal) => {
    if (!timeVal) return '—';
    try {
      const d = timeVal instanceof Date ? timeVal : new Date(timeVal);
      if (isNaN(d.getTime())) return String(timeVal);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return String(timeVal);
    }
  };

  // Helper to format Date string (e.g., "Wed, 12 Oct")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* ─── 1. Header & Live Metrics ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Planned Visits & Route Schedules
            </h2>
            <span
              className="badge"
              style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                fontSize: '11.5px',
                fontWeight: '800'
              }}
            >
              🛰️ Firestore Sync
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
            Schedule future neighborhood rounds in Moodbidri & Mijar so customers can pre-order fresh produce!
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => loadSchedules()}
            disabled={isLoading}
            className="touch-target-44"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh schedules"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden-mobile">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal(vendorProducts.map(p => p.id || p._id))}
            className="touch-target-44"
            style={{
              padding: '11px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px -4px rgba(16, 185, 129, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Plan New Visit</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Counters ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}
      >
        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Total Visits
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: 1.1 }}>
              {metrics.total}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Upcoming Trips
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', lineHeight: 1.1 }}>
              {metrics.upcoming}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: metrics.inTransit > 0 ? '#fef3c7' : '#f8fafc',
              color: metrics.inTransit > 0 ? '#d97706' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Truck size={22} className={metrics.inTransit > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              En Route Now
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: metrics.inTransit > 0 ? '#d97706' : '#64748b', lineHeight: 1.1 }}>
              {metrics.inTransit}
            </div>
          </div>
        </div>

        <div
          className="vs-card"
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Completed
            </span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#7c3aed', lineHeight: 1.1 }}>
              {metrics.completed}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Filter Toolbar & View Toggle ─────────────────────────────── */}
      <div
        className="vs-card"
        style={{
          padding: '16px 20px',
          borderRadius: '18px',
          backgroundColor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px', overflowX: 'auto' }}>
          {SCHEDULE_STATUSES.map(st => {
            const isSel = filterStatus === st.value;
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => setFilterStatus(st.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: isSel ? '800' : '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isSel ? '#ffffff' : 'transparent',
                  color: isSel ? '#0f172a' : '#64748b',
                  boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                outline: 'none'
              }}
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                title="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                color: viewMode === 'list' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <List size={15} />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '6px 10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'calendar' ? '#ffffff' : 'transparent',
                color: viewMode === 'calendar' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'calendar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <CalendarDays size={15} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. Schedule List / Cards ───────────────────────────────────── */}
      {isLoading && filteredSchedules.length === 0 ? (
        <div
          className="vs-card"
          style={{
            padding: '56px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '20px'
          }}
        >
          <RefreshCw size={36} color="#10b981" className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>
            Loading Planned Schedules...
          </strong>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Fetching verified visits from Firebase Firestore
          </span>
        </div>
      ) : filteredSchedules.length === 0 ? (
        /* Empty State */
        <div
          className="vs-card"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '2px dashed #cbd5e1'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
            }}
          >
            <Calendar size={36} />
          </div>

          <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
            No Planned Visits Scheduled
          </strong>

          <p
            style={{
              fontSize: '13.5px',
              color: '#64748b',
              maxWidth: '460px',
              margin: '0 auto 20px auto',
              lineHeight: 1.5
            }}
          >
            Plan your upcoming neighborhood trips to Vijayanagar, Alva’s Campus, or Mijar. Customers get notified and can pre-order from your carry items!
          </p>

          <button
            type="button"
            onClick={() => openCreateModal(vendorProducts.map(p => p.id || p._id))}
            className="btn-primary"
            style={{
              padding: '11px 24px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Plan First Neighborhood Visit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSchedules.map((schedule) => {
            const scheduleId = schedule.id || schedule.documentId;
            const isUpdating = updatingStatusId === scheduleId;
            const nextStep = STATUS_NEXT_STEP[schedule.status];

            return (
              <div
                key={scheduleId}
                className="vs-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '22px',
                  border: schedule.status === 'in_transit'
                    ? '2px solid #0284c7'
                    : schedule.status === 'arrived'
                    ? '2px solid #059669'
                    : '1.5px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 6px 20px -4px rgba(15, 23, 42, 0.05)',
                  transition: 'all 0.2s ease',
                  opacity: schedule.isOptimistic ? 0.7 : 1
                }}
              >
                {/* Header: Date, Area, Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    {/* Date Badge */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px',
                        backgroundColor: '#f0fdf4',
                        border: '1.5px solid #a7f3d0',
                        textAlign: 'center',
                        minWidth: '68px'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', display: 'block' }}>
                        {formatDateDisplay(schedule.date).split(' ')[0]}
                      </span>
                      <strong style={{ fontSize: '18px', fontWeight: '900', color: '#064e3b', lineHeight: 1.1, display: 'block' }}>
                        {formatDateDisplay(schedule.date).split(' ')[1] || '—'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                        {formatDateDisplay(schedule.date).split(' ')[2] || ''}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                          {schedule.area?.areaName || 'Moodbidri Local Round'}
                        </h3>
                        <span
                          className={`badge ${
                            schedule.status === 'completed'
                              ? 'badge-success'
                              : schedule.status === 'cancelled'
                              ? 'badge-danger'
                              : schedule.status === 'in_transit'
                              ? 'badge-info'
                              : schedule.status === 'arrived'
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                          style={{ fontSize: '12px', padding: '4px 10px' }}
                        >
                          {schedule.status === 'scheduled' && '⏳ Scheduled'}
                          {schedule.status === 'in_transit' && '🛵 In Transit (Rider Live)'}
                          {schedule.status === 'arrived' && '📍 Arrived & Selling'}
                          {schedule.status === 'completed' && '✅ Completed'}
                          {schedule.status === 'cancelled' && '❌ Cancelled'}
                        </span>

                        {/* Conflict Status Badges */}
                        {schedule.hasConflict && (
                          <span
                            style={{
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              padding: '3px 9px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Competition detected in same area and time window"
                          >
                            ⚠️ Competition Active
                          </span>
                        )}

                        {schedule.conflictResolution === 'time_adjusted' && (
                          <span
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ⏱️ Time Adjusted
                          </span>
                        )}

                        {schedule.conflictResolution === 'area_adjusted' && (
                          <span
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📍 Alternative Area
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={15} color="#10b981" />
                          <strong>
                            {formatTimeDisplay(schedule.expectedArrivalDate || schedule.expectedArrivalTime)}
                            {' – '}
                            {formatTimeDisplay(schedule.expectedDepartureDate || schedule.expectedDepartureTime)}
                          </strong>
                        </span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Compass size={15} color="#0284c7" />
                          <span>Radius: <strong>{schedule.area?.serviceRadiusKm || 2.0} km</strong></span>
                        </span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Package size={15} color="#7c3aed" />
                          <span><strong>{schedule.availableProductIds?.length || 0}</strong> products carrying</span>
                        </span>
                      </div>

                      {/* Conflict Competing Info Alert Strip */}
                      {schedule.hasConflict && schedule.conflictingVendorInfo && (
                        <div
                          style={{
                            marginTop: '8px',
                            backgroundColor: '#fffbeb',
                            border: '1px dashed #fcd34d',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>⚠️</span>
                          <span>
                            Concurrently visiting with <strong>{schedule.conflictingVendorInfo.competingVendorName}</strong> ({schedule.conflictingVendorInfo.competingCategory}) around {schedule.conflictingVendorInfo.overlappingTimeWindow}.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => openEditModal(schedule)}
                        className="touch-target-44"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Edit Schedule Times"
                      >
                        <Edit3 size={14} />
                        <span>Edit Times</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(schedule)}
                      className="touch-target-44"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                      title="Delete Schedule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Products Attached Checklist / Badges */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: '#475569',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px'
                    }}
                  >
                    Produce Carrying on this Round ({schedule.availableProductIds?.length || 0}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {schedule.availableProductIds && schedule.availableProductIds.length > 0 ? (
                      schedule.availableProductIds.map(prodId => {
                        const prod = getProductById(prodId);
                        return (
                          <div
                            key={prodId}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '10px',
                              fontSize: '12.5px'
                            }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            <strong style={{ color: '#0f172a' }}>{prod.name}</strong>
                            {prod.price && prod.price !== '—' && (
                              <span style={{ color: '#059669', fontWeight: '800', fontSize: '11.5px' }}>
                                (₹{prod.price}/{prod.unit || 'kg'})
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No specific products attached.
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Advancement Lifecycle Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '14px',
                    borderTop: '1px dashed #cbd5e1'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Lifecycle Step:
                    </span>
                    {nextStep ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(schedule, nextStep.next)}
                        disabled={isUpdating}
                        className="touch-target-44"
                        style={{
                          padding: '9px 18px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '800',
                          backgroundColor: nextStep.color,
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: `0 4px 12px ${nextStep.color}40`,
                          opacity: isUpdating ? 0.7 : 1
                        }}
                      >
                        {isUpdating ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Navigation size={14} />
                        )}
                        <span>{nextStep.label}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700' }}>
                        Visit concluded
                      </span>
                    )}
                  </div>

                  {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleCancelSchedule(schedule)}
                      disabled={isUpdating}
                      className="touch-target-44"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel Visit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 5. "Plan New Visit" Modal ──────────────────────────────────── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="vs-card animate-scale-up"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              padding: '28px'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '14px'
              }}
            >
              <div>
                <h3
                  id="schedule-modal-title"
                  style={{
                    fontSize: '19px',
                    fontWeight: '900',
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {editingSchedule ? 'Edit Planned Visit Schedule' : 'Plan New Neighborhood Visit'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Target area rounds for {vendorName} ({vendorCategory})
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date Picker */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Planned Visit Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: formErrors.date ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
                {formErrors.date && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', display: 'block', marginTop: '4px' }}>
                    {formErrors.date}
                  </span>
                )}
              </div>

              {/* Target Area Preset Selector & Custom Input */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#059669" />
                    <span>Target Area & Neighborhood <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomArea(!isCustomArea)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {isCustomArea ? '← Choose Preset Area' : '+ Type Custom Area'}
                  </button>
                </div>

                {!isCustomArea ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PRESET_AREAS.map((preset) => {
                      const isSelected = formData.areaName === preset.areaName;
                      return (
                        <button
                          key={preset.areaName}
                          type="button"
                          onClick={() => handleAreaSelect(preset)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: isSelected ? '800' : '600',
                            border: isSelected ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                            color: isSelected ? '#065f46' : '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <Check size={13} color="#059669" />}
                          <span>{preset.areaName}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <FormField
                    label="Custom Area Name"
                    name="areaName"
                    required
                    placeholder="e.g. Swarna Temple Layout, Moodbidri"
                    value={formData.areaName}
                    onChange={(e) => handleFormChange('areaName', e.target.value)}
                    error={formErrors.areaName}
                  />
                )}

                {/* Service Radius Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                      Delivery Service Radius:
                    </span>
                    <strong style={{ fontSize: '13px', color: '#059669' }}>
                      {formData.serviceRadiusKm} km
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.5"
                    value={formData.serviceRadiusKm}
                    onChange={(e) => handleFormChange('serviceRadiusKm', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    <span>0.5 km (Close vicinity)</span>
                    <span>2.5 km (Standard)</span>
                    <span>5.0 km (Wide district)</span>
                  </div>
                </div>
              </div>

              {/* Time Pickers (Arrival & Departure) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Expected Arrival Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleFormChange('arrivalTime', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formErrors.arrivalTime ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {formErrors.arrivalTime && (
                    <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      {formErrors.arrivalTime}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Expected Departure Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleFormChange('departureTime', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formErrors.departureTime ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {formErrors.departureTime && (
                    <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      {formErrors.departureTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Checklist Multi-Select */}
              <div
                style={{
                  border: formErrors.availableProductIds ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '16px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', display: 'block' }}>
                      Products Checklist to Carry <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Attached items will be visible to residents in {formData.areaName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => selectAllProducts(vendorProducts.map(p => p.id || p._id))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllProducts}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                {/* Product Items Multi-Select Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {vendorProducts.map(prod => {
                    const prodId = prod.id || prod._id;
                    const isChecked = formData.availableProductIds.includes(prodId);

                    return (
                      <div
                        key={prodId}
                        onClick={() => toggleProductSelection(prodId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: isChecked ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          backgroundColor: isChecked ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <img
                          src={prod.image_url || prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'}
                          alt={prod.name}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80';
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>
                            ₹{prod.price}/{prod.unit || 'kg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formErrors.availableProductIds && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', display: 'block', marginTop: '6px' }}>
                    {formErrors.availableProductIds}
                  </span>
                )}
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || isCheckingConflict}
                  className="btn-primary"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: (isSaving || isCheckingConflict) ? 0.7 : 1
                  }}
                >
                  {isCheckingConflict ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Checking Market Conflicts...</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : editingSchedule ? (
                    <>
                      <Check size={16} />
                      <span>Update Schedule</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      <span>Publish Planned Visit 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. Vendor Schedule Conflict Resolution Modal ───────────────── */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={closeConflictModal}
        conflictData={conflictData}
        proposedSchedule={pendingSchedulePayload}
        onSelectTimeSlot={handleResolveWithTimeSlot}
        onSelectRecommendedArea={handleResolveWithRecommendedArea}
        onContinueAnyway={handleResolveContinueAnyway}
        isSaving={isSaving}
      />
    </div>
  );
};

export default VendorPlanVisitTab;
