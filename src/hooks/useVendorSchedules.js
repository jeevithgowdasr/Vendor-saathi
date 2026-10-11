/**
 * useVendorSchedules — Custom Hook
 * Manages vendor planned visit / schedule CRUD, validations,
 * real-time Firebase Firestore synchronization, and state transitions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchVendorSchedules,
  createVendorScheduleApi,
  createVendorScheduleWithConflictResolution,
  detectScheduleConflict,
  updateVendorScheduleApi,
  updateVendorScheduleStatusApi,
  cancelVendorScheduleApi,
  deleteVendorScheduleApi,
  getTomorrowDateString,
  PRESET_AREAS
} from '../services/scheduleApi';
import { subscribeToVendorSchedules, formatFirestoreTimestamp } from '../firebase';

export { PRESET_AREAS };

export const SCHEDULE_STATUSES = [
  { value: 'all', label: 'All Schedules' },
  { value: 'scheduled', label: '⏳ Scheduled' },
  { value: 'in_transit', label: '🛵 In Transit' },
  { value: 'arrived', label: '📍 Arrived' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'cancelled', label: '❌ Cancelled' }
];

export const STATUS_NEXT_STEP = {
  scheduled: { next: 'in_transit', label: 'Start Trip (In Transit)', color: '#0284c7' },
  in_transit: { next: 'arrived', label: 'Mark Arrived at Location', color: '#059669' },
  arrived: { next: 'completed', label: 'Complete Visit', color: '#064e3b' }
};

export const DEFAULT_SCHEDULE_FORM = {
  date: getTomorrowDateString(),
  areaName: PRESET_AREAS[0].areaName,
  latitude: PRESET_AREAS[0].lat,
  longitude: PRESET_AREAS[0].lng,
  serviceRadiusKm: 2.0,
  arrivalTime: '09:30',
  departureTime: '11:00',
  availableProductIds: []
};

export function useVendorSchedules({ vendorId = 'v1', vendorName = 'Ramesh Grocery', vendorCategory = 'Produce & Groceries', onToast } = {}) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null); // null = create mode
  const [formData, setFormData] = useState(DEFAULT_SCHEDULE_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Conflict Detection & Resolution state
  const [conflictData, setConflictData] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingSchedulePayload, setPendingSchedulePayload] = useState(null);

  // ─── 1. Load Schedules ────────────────────────────────────────────────────
  const loadSchedules = useCallback(async (opts = {}) => {
    setIsLoading(true);
    try {
      const result = await fetchVendorSchedules(vendorId, {
        status: opts.status || (filterStatus !== 'all' ? filterStatus : undefined),
        date: opts.date || filterDate || undefined
      });
      setSchedules(result.schedules || []);
    } catch (err) {
      console.warn('Load schedules error:', err.message);
      onToast?.(`⚠️ Could not fetch schedules: ${err.message}`, 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, filterStatus, filterDate, onToast]);

  // Initial load
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToVendorSchedules(vendorId, (fbSchedules) => {
      if (fbSchedules && fbSchedules.length > 0) {
        setSchedules(fbSchedules);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [vendorId]);

  // ─── 2. Form Management ───────────────────────────────────────────────────
  const openCreateModal = (defaultProductIds = []) => {
    setEditingSchedule(null);
    setFormData({
      ...DEFAULT_SCHEDULE_FORM,
      date: getTomorrowDateString(),
      availableProductIds: defaultProductIds.length > 0 ? defaultProductIds : []
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);

    // Format times into HH:MM
    let arrTime = '09:30';
    let depTime = '11:00';
    try {
      const arrD = schedule.expectedArrivalDate || formatFirestoreTimestamp(schedule.expectedArrivalTime);
      const depD = schedule.expectedDepartureDate || formatFirestoreTimestamp(schedule.expectedDepartureTime);
      if (arrD) {
        arrTime = arrD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      if (depD) {
        depTime = depD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch {
      // Keep defaults
    }

    setFormData({
      date: schedule.date || getTomorrowDateString(),
      areaName: schedule.area?.areaName || PRESET_AREAS[0].areaName,
      latitude: schedule.area?.coordinates?.latitude || schedule.area?.coordinates?.lat || PRESET_AREAS[0].lat,
      longitude: schedule.area?.coordinates?.longitude || schedule.area?.coordinates?.lng || PRESET_AREAS[0].lng,
      serviceRadiusKm: Number(schedule.area?.serviceRadiusKm || 2.0),
      arrivalTime: arrTime,
      departureTime: depTime,
      availableProductIds: schedule.availableProductIds || []
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsConflictModalOpen(false);
    setConflictData(null);
    setPendingSchedulePayload(null);
    setEditingSchedule(null);
    setFormData(DEFAULT_SCHEDULE_FORM);
    setFormErrors({});
  };

  const closeConflictModal = () => {
    setIsConflictModalOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAreaSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      areaName: preset.areaName,
      latitude: preset.lat,
      longitude: preset.lng,
      serviceRadiusKm: preset.defaultRadius || prev.serviceRadiusKm
    }));
    if (formErrors.areaName) {
      setFormErrors(prev => ({ ...prev, areaName: null }));
    }
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => {
      const exists = prev.availableProductIds.includes(productId);
      const nextList = exists
        ? prev.availableProductIds.filter(id => id !== productId)
        : [...prev.availableProductIds, productId];
      return { ...prev, availableProductIds: nextList };
    });
    if (formErrors.availableProductIds) {
      setFormErrors(prev => ({ ...prev, availableProductIds: null }));
    }
  };

  const selectAllProducts = (productIds) => {
    setFormData(prev => ({ ...prev, availableProductIds: [...productIds] }));
    if (formErrors.availableProductIds) {
      setFormErrors(prev => ({ ...prev, availableProductIds: null }));
    }
  };

  const deselectAllProducts = () => {
    setFormData(prev => ({ ...prev, availableProductIds: [] }));
  };

  // ─── 3. Form Validation ───────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    const todayStr = new Date().toISOString().split('T')[0];

    // Date validation
    if (!formData.date) {
      errs.date = 'Planned visit date is required.';
    } else if (formData.date < todayStr) {
      errs.date = 'Planned date must be today or in the future.';
    }

    // Area validation
    if (!formData.areaName || !formData.areaName.trim()) {
      errs.areaName = 'Target visit area name is required.';
    }

    // Time validation (Arrival must be strictly before Departure)
    if (!formData.arrivalTime) {
      errs.arrivalTime = 'Expected arrival time is required.';
    }
    if (!formData.departureTime) {
      errs.departureTime = 'Expected departure time is required.';
    }

    if (formData.arrivalTime && formData.departureTime) {
      const [arrH, arrM] = formData.arrivalTime.split(':').map(Number);
      const [depH, depM] = formData.departureTime.split(':').map(Number);
      const arrMinutes = arrH * 60 + arrM;
      const depMinutes = depH * 60 + depM;

      if (arrMinutes >= depMinutes) {
        errs.departureTime = 'Departure time must be later than arrival time.';
      }
    }

    // Products checklist validation
    if (!formData.availableProductIds || formData.availableProductIds.length === 0) {
      errs.availableProductIds = 'Select at least one product to carry on this planned visit.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── 4. Create / Update Schedule with Conflict Detection ─────────────────
  const handleSaveSchedule = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    // Convert date + arrival/departure time strings to full Date objects
    const [arrH, arrM] = formData.arrivalTime.split(':').map(Number);
    const [depH, depM] = formData.departureTime.split(':').map(Number);

    const arrivalDate = new Date(`${formData.date}T${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`);
    const departureDate = new Date(`${formData.date}T${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}:00`);

    const schedulePayload = {
      vendorId,
      vendorName,
      vendorCategory,
      date: formData.date,
      area: {
        areaName: formData.areaName.trim(),
        coordinates: {
          latitude: Number(formData.latitude || 13.0682),
          longitude: Number(formData.longitude || 74.9961)
        },
        serviceRadiusKm: Number(formData.serviceRadiusKm || 2.0)
      },
      expectedArrivalTime: arrivalDate,
      expectedDepartureTime: departureDate,
      availableProductIds: formData.availableProductIds,
      status: editingSchedule ? editingSchedule.status : 'scheduled'
    };

    setIsCheckingConflict(true);
    try {
      // Run Conflict Detection before committing
      const conflictResult = await detectScheduleConflict({
        ...schedulePayload,
        scheduleId: editingSchedule ? (editingSchedule.id || editingSchedule.documentId) : null
      });

      if (conflictResult.hasConflict) {
        setConflictData(conflictResult);
        setPendingSchedulePayload(schedulePayload);
        setIsConflictModalOpen(true);
        onToast?.(`⚠️ Market overlap detected in ${schedulePayload.area.areaName}. Review conflict options.`, 'warning');
        return;
      }

      // No conflict detected: persist directly
      await persistSchedule(schedulePayload, null, 'none');
    } catch (err) {
      console.warn('Conflict check error:', err);
      await persistSchedule(schedulePayload, null, 'none');
    } finally {
      setIsCheckingConflict(false);
    }
  };

  const persistSchedule = async (schedulePayload, conflictInfo = null, resolution = 'none') => {
    setIsSaving(true);
    const tempId = editingSchedule ? (editingSchedule.id || editingSchedule.documentId) : `temp_${Date.now()}`;

    const enrichedPayload = {
      ...schedulePayload,
      hasConflict: conflictInfo ? true : false,
      conflictResolution: resolution,
      conflictingVendorInfo: conflictInfo ? {
        competingVendorName: conflictInfo.competingVendorName,
        competingCategory: conflictInfo.competingCategory,
        overlappingTimeWindow: conflictInfo.overlappingTimeWindow,
        areaName: conflictInfo.areaName
      } : null
    };

    // Optimistic UI update
    if (editingSchedule) {
      setSchedules(prev => prev.map(s => (s.id === tempId || s.documentId === tempId ? { ...s, ...enrichedPayload, isOptimistic: true } : s)));
    } else {
      setSchedules(prev => [{ ...enrichedPayload, id: tempId, documentId: tempId, isOptimistic: true }, ...prev]);
    }

    try {
      if (editingSchedule) {
        await updateVendorScheduleApi(tempId, enrichedPayload);
        onToast?.(`✅ Planned visit to ${schedulePayload.area.areaName} updated!`, 'success');
      } else {
        const result = await createVendorScheduleWithConflictResolution(schedulePayload, conflictInfo, resolution);
        const created = result.schedule;
        setSchedules(prev => prev.map(s => (s.id === tempId || s.documentId === tempId ? (created || s) : s)));

        if (conflictInfo) {
          onToast?.(`⚠️ Planned visit saved with market competition warning.`, 'warning');
        } else if (resolution === 'time_adjusted') {
          onToast?.(`⏱️ Planned visit scheduled with adjusted time!`, 'success');
        } else if (resolution === 'area_adjusted') {
          onToast?.(`📍 Planned visit scheduled in recommended area!`, 'success');
        } else {
          onToast?.(`🎉 Planned visit to ${schedulePayload.area.areaName} scheduled for ${formData.date}!`, 'success');
        }
      }
      closeModal();
      loadSchedules();
    } catch (err) {
      onToast?.(`❌ Failed to save schedule: ${err.message}`, 'danger');
      loadSchedules();
    } finally {
      setIsSaving(false);
    }
  };

  // Choice 1: "Suggest Different Time" (adjacent open time slots)
  const handleResolveWithTimeSlot = async (slot) => {
    if (!pendingSchedulePayload) return;
    const [arrH, arrM] = slot.arrivalTime.split(':').map(Number);
    const [depH, depM] = slot.departureTime.split(':').map(Number);
    const arrivalDate = new Date(`${pendingSchedulePayload.date}T${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`);
    const departureDate = new Date(`${pendingSchedulePayload.date}T${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}:00`);

    const updated = {
      ...pendingSchedulePayload,
      expectedArrivalTime: arrivalDate,
      expectedDepartureTime: departureDate
    };
    await persistSchedule(updated, null, 'time_adjusted');
  };

  // Choice 2: "Suggest Different Area" (alternative recommended neighborhood)
  const handleResolveWithRecommendedArea = async (recArea) => {
    if (!pendingSchedulePayload) return;
    const updated = {
      ...pendingSchedulePayload,
      area: {
        areaName: recArea.areaName,
        coordinates: {
          latitude: recArea.coordinates?.latitude || recArea.lat || 13.0682,
          longitude: recArea.coordinates?.longitude || recArea.lng || 74.9961
        },
        serviceRadiusKm: Number(recArea.serviceRadiusKm || 2.0)
      }
    };
    await persistSchedule(updated, null, 'area_adjusted');
  };

  // Choice 3: "Continue Anyway" (Non-blocking bypass)
  const handleResolveContinueAnyway = async () => {
    if (!pendingSchedulePayload) return;
    await persistSchedule(pendingSchedulePayload, conflictData?.primaryConflict, 'ignored');
  };

  // ─── 5. Status Transition Pipeline ────────────────────────────────────────
  const handleAdvanceStatus = async (schedule, nextStatus) => {
    const scheduleId = schedule.id || schedule.documentId;
    setUpdatingStatusId(scheduleId);

    // Optimistic status update
    setSchedules(prev => prev.map(s =>
      (s.id === scheduleId || s.documentId === scheduleId)
        ? { ...s, status: nextStatus, isOptimistic: true }
        : s
    ));

    try {
      await updateVendorScheduleStatusApi(scheduleId, nextStatus);
      onToast?.(`🚀 Visit status updated to "${nextStatus.replace('_', ' ').toUpperCase()}"!`, 'info');
    } catch (err) {
      onToast?.(`❌ Status update failed: ${err.message}`, 'danger');
      loadSchedules();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─── 6. Cancel Schedule ───────────────────────────────────────────────────
  const handleCancelSchedule = async (schedule) => {
    const scheduleId = schedule.id || schedule.documentId;
    if (!window.confirm(`Are you sure you want to cancel the planned visit to ${schedule.area?.areaName} on ${schedule.date}?`)) {
      return;
    }

    setUpdatingStatusId(scheduleId);
    setSchedules(prev => prev.map(s =>
      (s.id === scheduleId || s.documentId === scheduleId)
        ? { ...s, status: 'cancelled', isOptimistic: true }
        : s
    ));

    try {
      await cancelVendorScheduleApi(scheduleId);
      onToast?.(`🛑 Planned visit to ${schedule.area?.areaName} cancelled.`, 'info');
    } catch (err) {
      onToast?.(`❌ Cancellation failed: ${err.message}`, 'danger');
      loadSchedules();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─── 7. Delete Schedule ───────────────────────────────────────────────────
  const handleDeleteSchedule = async (schedule) => {
    const scheduleId = schedule.id || schedule.documentId;
    if (!window.confirm(`Remove this planned visit record permanently?`)) {
      return;
    }

    setSchedules(prev => prev.filter(s => (s.id || s.documentId) !== scheduleId));
    try {
      await deleteVendorScheduleApi(scheduleId);
      onToast?.(`🗑️ Schedule record removed.`, 'info');
    } catch (err) {
      onToast?.(`❌ Delete failed: ${err.message}`, 'danger');
      loadSchedules();
    }
  };

  // ─── 8. Computed & Filtered Schedules ─────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterDate && s.date !== filterDate) return false;
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.date + 'T' + (a.expectedArrivalTime?.seconds ? new Date(a.expectedArrivalTime.seconds * 1000).toISOString().split('T')[1] : '00:00:00')).getTime();
      const timeB = new Date(b.date + 'T' + (b.expectedArrivalTime?.seconds ? new Date(b.expectedArrivalTime.seconds * 1000).toISOString().split('T')[1] : '00:00:00')).getTime();
      return timeA - timeB;
    });
  }, [schedules, filterStatus, filterDate]);

  const metrics = useMemo(() => {
    const total = schedules.length;
    const upcoming = schedules.filter(s => s.status === 'scheduled' || s.status === 'in_transit' || s.status === 'arrived').length;
    const inTransit = schedules.filter(s => s.status === 'in_transit').length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const cancelled = schedules.filter(s => s.status === 'cancelled').length;

    return { total, upcoming, inTransit, completed, cancelled };
  }, [schedules]);

  return {
    schedules,
    filteredSchedules,
    metrics,
    isLoading,
    isSaving,
    updatingStatusId,

    // Filters
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    viewMode,
    setViewMode,

    // Modal & Form
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

    // Actions
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
  };
}

export default useVendorSchedules;
