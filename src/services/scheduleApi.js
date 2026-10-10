/**
 * Schedule & Planned Visit API Service
 * Powered directly by Firebase Firestore for real-time schedule management,
 * with conflict detection & resolution algorithms and resilient offline caching.
 */

import {
  createScheduleInFirebase,
  getVendorSchedulesFromFirebase,
  getScheduleFromFirebase,
  updateScheduleInFirebase,
  updateScheduleStatusInFirebase,
  cancelScheduleInFirebase,
  deleteScheduleFromFirebase,
  logConflictToFirebase,
  formatFirestoreTimestamp
} from '../firebase.js';

const LOCAL_STORAGE_KEY = 'vs_firebase_schedules_cache';

// Standard known areas for autocomplete in Moodbidri & Mijar
export const PRESET_AREAS = [
  { areaName: 'Vijayanagar, Moodbidri', lat: 13.0720, lng: 74.9980, defaultRadius: 2.0 },
  { areaName: 'Alva’s Campus Gate, Moodbidri', lat: 13.0690, lng: 74.9940, defaultRadius: 1.5 },
  { areaName: 'Mijar Central Market, Mijar', lat: 13.0682, lng: 74.9961, defaultRadius: 2.5 },
  { areaName: 'Moodbidri Bus Stand & Market', lat: 13.0645, lng: 74.9912, defaultRadius: 2.0 },
  { areaName: 'Kallamundkur Village Center', lat: 13.0850, lng: 75.0120, defaultRadius: 3.0 },
  { areaName: 'Vidyagiri Residential Layout', lat: 13.0705, lng: 74.9890, defaultRadius: 1.5 },
  { areaName: 'Swarna Temple Road, Moodbidri', lat: 13.0620, lng: 74.9880, defaultRadius: 2.0 }
];

// Helper to compute tomorrow's date string YYYY-MM-DD
export const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// Initial schedules for demo / offline fallback
const getInitialFallbackSchedules = () => {
  const tomorrow = getTomorrowDateString();
  const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  return [
    {
      id: 'sch_demo_01',
      documentId: 'sch_demo_01',
      vendorId: 'v2', // Competing vendor in Vijayanagar on tomorrow
      vendorName: 'Basappa Fresh Veggies',
      vendorCategory: 'Vegetable & Produce',
      date: tomorrow,
      area: {
        areaName: 'Vijayanagar, Moodbidri',
        coordinates: { latitude: 13.0720, longitude: 74.9980 },
        serviceRadiusKm: 2.0
      },
      expectedArrivalTime: `${tomorrow}T09:30:00.000Z`,
      expectedDepartureTime: `${tomorrow}T11:00:00.000Z`,
      availableProductIds: ['prod_tomato_01', 'prod_potato_02'],
      status: 'scheduled',
      hasConflict: false,
      conflictResolution: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sch_demo_02',
      documentId: 'sch_demo_02',
      vendorId: 'v1',
      vendorName: 'Ramesh Grocery',
      vendorCategory: 'Vegetable & Groceries',
      date: dayAfter,
      area: {
        areaName: 'Alva’s Campus Gate, Moodbidri',
        coordinates: { latitude: 13.0690, longitude: 74.9940 },
        serviceRadiusKm: 1.5
      },
      expectedArrivalTime: `${dayAfter}T16:00:00.000Z`,
      expectedDepartureTime: `${dayAfter}T18:00:00.000Z`,
      availableProductIds: ['prod_tomato_01', 'prod_rose_03', 'prod_chips_05'],
      status: 'scheduled',
      hasConflict: false,
      conflictResolution: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};

function getStoredFallbackSchedules() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialFallbackSchedules();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialFallbackSchedules();
  }
}

function saveStoredFallbackSchedules(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not cache schedules to localStorage', err);
  }
}

/**
 * Calculate Great-Circle Distance (in Kilometers) using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if two vendor category strings conflict or overlap
 */
export function isCategoryConflicting(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const c1 = cat1.toLowerCase().trim();
  const c2 = cat2.toLowerCase().trim();

  if (c1 === c2) return true;
  if (c1.includes(c2) || c2.includes(c1)) return true;

  const vegTerms = ['veg', 'vegetable', 'produce', 'sabzi', 'grocery'];
  if (vegTerms.some(t => c1.includes(t)) && vegTerms.some(t => c2.includes(t))) return true;

  const fruitTerms = ['fruit', 'fruits'];
  if (fruitTerms.some(t => c1.includes(t)) && fruitTerms.some(t => c2.includes(t))) return true;

  const flowerTerms = ['flower', 'flowers', 'pooja'];
  if (flowerTerms.some(t => c1.includes(t)) && flowerTerms.some(t => c2.includes(t))) return true;

  const dairyTerms = ['dairy', 'milk'];
  if (dairyTerms.some(t => c1.includes(t)) && dairyTerms.some(t => c2.includes(t))) return true;

  return false;
}

function toEpochMillis(val) {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val._seconds === 'number') return val._seconds * 1000;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  return new Date(val).getTime();
}

function formatTimeMillis(millis) {
  const d = new Date(millis);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Conflict Detection Algorithm
 * Checks same date, category overlap, time overlap, and area proximity
 */
export async function detectScheduleConflict(proposed) {
  const {
    vendorId = 'v1',
    vendorCategory = 'Vegetables',
    date,
    area,
    expectedArrivalTime,
    expectedDepartureTime,
    scheduleId = null
  } = proposed;

  const newArrMillis = toEpochMillis(expectedArrivalTime);
  const newDepMillis = toEpochMillis(expectedDepartureTime);

  const proposedLat = area?.coordinates?.latitude || area?.coordinates?.lat || 13.0682;
  const proposedLng = area?.coordinates?.longitude || area?.coordinates?.lng || 74.9961;
  const proposedRadius = Number(area?.serviceRadiusKm || 2.0);
  const proposedAreaName = (area?.areaName || '').toLowerCase().trim();

  // 1. Fetch schedules on the same date from Firestore and fallback cache
  let allDaySchedules = [];
  try {
    const res = await getVendorSchedulesFromFirebase(null, { date });
    if (res.success && res.schedules) {
      allDaySchedules = res.schedules;
    }
  } catch (err) {
    console.warn('Conflict detection read note:', err.message);
  }

  if (allDaySchedules.length === 0) {
    const cached = getStoredFallbackSchedules();
    allDaySchedules = cached.filter(s => s.date === date);
  }

  // Filter out self and non-active
  const competingSchedules = allDaySchedules.filter(s => {
    if (s.id === scheduleId || s.documentId === scheduleId) return false;
    if (s.vendorId === vendorId) return false; // Vendor's own round
    if (s.status === 'completed' || s.status === 'cancelled') return false;
    return true;
  });

  const conflictsFound = [];

  // 2. Evaluate Conflict Rules
  for (const existing of competingSchedules) {
    const existArrMillis = toEpochMillis(existing.expectedArrivalDate || existing.expectedArrivalTime);
    const existDepMillis = toEpochMillis(existing.expectedDepartureDate || existing.expectedDepartureTime);

    // Rule 1: Category Match
    if (!isCategoryConflicting(vendorCategory, existing.vendorCategory)) continue;

    // Rule 2: Overlapping Time Slot
    // (NewArrival < ExistingDeparture) AND (NewDeparture > ExistingArrival)
    const timeOverlaps = newArrMillis < existDepMillis && newDepMillis > existArrMillis;
    if (!timeOverlaps) continue;

    // Rule 3: Area Overlap
    const existAreaName = (existing.area?.areaName || '').toLowerCase().trim();
    const nameMatches =
      proposedAreaName &&
      existAreaName &&
      (proposedAreaName.includes(existAreaName) || existAreaName.includes(proposedAreaName));

    const existLat = existing.area?.coordinates?.latitude || existing.area?.coordinates?.lat;
    const existLng = existing.area?.coordinates?.longitude || existing.area?.coordinates?.lng;
    const existRadius = Number(existing.area?.serviceRadiusKm || 2.0);

    let geoOverlaps = false;
    let distanceKm = 0;

    if (existLat && existLng) {
      distanceKm = calculateHaversineDistanceKm(proposedLat, proposedLng, existLat, existLng);
      geoOverlaps = distanceKm <= (proposedRadius + existRadius);
    }

    if (nameMatches || geoOverlaps) {
      const overlapStart = Math.max(newArrMillis, existArrMillis);
      const overlapEnd = Math.min(newDepMillis, existDepMillis);

      conflictsFound.push({
        conflictingScheduleId: existing.id || existing.documentId,
        competingVendorId: existing.vendorId,
        competingVendorName: existing.vendorName || 'Another Local Merchant',
        competingCategory: existing.vendorCategory || 'Similar Produce',
        areaName: existing.area?.areaName || area?.areaName,
        distanceKm: Number(distanceKm.toFixed(2)),
        overlappingTimeWindow: `${formatTimeMillis(overlapStart)} – ${formatTimeMillis(overlapEnd)}`,
        competingTimeSlot: `${formatTimeMillis(existArrMillis)} – ${formatTimeMillis(existDepMillis)}`,
        competingArrivalMillis: existArrMillis,
        competingDepartureMillis: existDepMillis
      });
    }
  }

  const hasConflict = conflictsFound.length > 0;

  // 3. Calculate Choice 1: "Suggest Different Time"
  const suggestedTimeSlots = [];
  if (hasConflict) {
    const candidateSlots = [
      { start: '07:30', end: '09:00', label: 'Early Morning Fresh Market (07:30 AM – 09:00 AM)' },
      { start: '11:30', end: '13:00', label: 'Lunchtime Market Round (11:30 AM – 01:00 PM)' },
      { start: '14:30', end: '16:00', label: 'Afternoon Round (02:30 PM – 04:00 PM)' },
      { start: '16:30', end: '18:00', label: 'Evening Neighborhood Round (04:30 PM – 06:00 PM)' },
      { start: '18:15', end: '19:45', label: 'Sunset Return Round (06:15 PM – 07:45 PM)' }
    ];

    for (const cand of candidateSlots) {
      const candArr = new Date(`${date}T${cand.start}:00`).getTime();
      const candDep = new Date(`${date}T${cand.end}:00`).getTime();

      let slotConflicted = false;
      for (const ex of competingSchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalDate || ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureDate || ex.expectedDepartureTime);

        const exName = (ex.area?.areaName || '').toLowerCase().trim();
        const areaOverlaps = proposedAreaName.includes(exName) || exName.includes(proposedAreaName);

        if (areaOverlaps && candArr < exDep && candDep > exArr) {
          slotConflicted = true;
          break;
        }
      }

      if (!slotConflicted) {
        suggestedTimeSlots.push({
          arrivalTime: cand.start,
          departureTime: cand.end,
          formatted: `${cand.start} – ${cand.end}`,
          label: cand.label
        });
      }
      if (suggestedTimeSlots.length >= 3) break;
    }
  }

  // 4. Calculate Choice 2: "Suggest Different Area"
  const recommendedAreas = [];
  if (hasConflict) {
    for (const candArea of PRESET_AREAS) {
      const candName = candArea.areaName.toLowerCase().trim();
      if (candName === proposedAreaName) continue;

      let areaBusy = false;
      for (const ex of competingSchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalDate || ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureDate || ex.expectedDepartureTime);

        if (!(newArrMillis < exDep && newDepMillis > exArr)) continue;

        const exAreaName = (ex.area?.areaName || '').toLowerCase().trim();
        if (exAreaName.includes(candName) || candName.includes(exAreaName)) {
          areaBusy = true;
          break;
        }
      }

      if (!areaBusy) {
        const distKm = calculateHaversineDistanceKm(proposedLat, proposedLng, candArea.lat, candArea.lng);
        recommendedAreas.push({
          areaName: candArea.areaName,
          coordinates: { latitude: candArea.lat, longitude: candArea.lng },
          serviceRadiusKm: candArea.defaultRadius || 2.0,
          distanceFromCurrentKm: Number(distKm.toFixed(1)),
          reason: `Zero competing ${vendorCategory} vendors during your time window`
        });
      }
      if (recommendedAreas.length >= 3) break;
    }
  }

  return {
    hasConflict,
    conflictsCount: conflictsFound.length,
    conflicts: conflictsFound,
    primaryConflict: conflictsFound[0] || null,
    suggestedTimeSlots,
    recommendedAreas
  };
}

/**
 * Fetch all planned schedules for a vendor
 */
export const fetchVendorSchedules = async (vendorId = 'v1', { status, date } = {}) => {
  try {
    const fbResult = await getVendorSchedulesFromFirebase(vendorId, { status, date });
    if (fbResult.success && fbResult.schedules && fbResult.schedules.length > 0) {
      saveStoredFallbackSchedules(fbResult.schedules);
      return fbResult;
    }

    const cached = getStoredFallbackSchedules();
    if (fbResult.success && fbResult.schedules.length === 0 && cached.length > 0) {
      Promise.all(cached.map(s => createScheduleInFirebase({ ...s, vendorId }))).catch(() => {});
      return { success: true, count: cached.length, schedules: cached };
    }

    return fbResult;
  } catch (error) {
    console.warn('Firebase fetch schedules note:', error.message);
    let items = getStoredFallbackSchedules();
    if (status && status !== 'all') {
      items = items.filter(s => s.status === status);
    }
    if (date) {
      items = items.filter(s => s.date === date);
    }
    return { success: true, count: items.length, schedules: items };
  }
};

/**
 * Fetch single schedule by ID
 */
export const fetchScheduleById = async (scheduleId) => {
  try {
    const fbResult = await getScheduleFromFirebase(scheduleId);
    if (fbResult.success && fbResult.schedule) {
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase fetchScheduleById note:', err.message);
  }

  const items = getStoredFallbackSchedules();
  const found = items.find(s => (s.id || s.documentId) === scheduleId);
  if (found) return { success: true, schedule: found };
  throw new Error('Schedule not found');
};

/**
 * Create a new planned visit schedule in Firebase Firestore
 */
export const createVendorScheduleApi = async (scheduleData) => {
  const newId = scheduleData.id || scheduleData.documentId || `sch_${Date.now()}`;
  const payload = {
    ...scheduleData,
    id: newId,
    documentId: newId,
    status: scheduleData.status || 'scheduled',
    hasConflict: scheduleData.hasConflict ?? false,
    conflictResolution: scheduleData.conflictResolution || 'none',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const fbResult = await createScheduleInFirebase(payload);
    if (fbResult.success) {
      const items = getStoredFallbackSchedules();
      const updated = [fbResult.schedule, ...items.filter(s => s.id !== newId)];
      saveStoredFallbackSchedules(updated);
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase createSchedule note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackSchedules();
  const updated = [payload, ...items];
  saveStoredFallbackSchedules(updated);
  return { success: true, schedule: payload };
};

/**
 * Create schedule with conflict resolution tracking and optional log
 */
export const createVendorScheduleWithConflictResolution = async (scheduleData, conflictInfo = null, resolution = 'none') => {
  const payload = {
    ...scheduleData,
    hasConflict: conflictInfo ? true : false,
    conflictResolution: resolution,
    conflictingVendorInfo: conflictInfo ? {
      competingVendorName: conflictInfo.competingVendorName,
      competingCategory: conflictInfo.competingCategory,
      overlappingTimeWindow: conflictInfo.overlappingTimeWindow,
      areaName: conflictInfo.areaName
    } : null
  };

  const result = await createVendorScheduleApi(payload);

  // If conflict was detected and bypassed/resolved, log to Firestore /conflicts collection
  if (conflictInfo) {
    try {
      await logConflictToFirebase({
        scheduleId1: payload.id || result.schedule?.id,
        scheduleId2: conflictInfo.conflictingScheduleId,
        vendorId1: payload.vendorId,
        vendorId2: conflictInfo.competingVendorId,
        area: payload.area?.areaName,
        date: payload.date,
        timeOverlap: conflictInfo.overlappingTimeWindow,
        category: payload.vendorCategory,
        resolutionChoice: resolution
      });
    } catch (err) {
      console.warn('Logging conflict note:', err.message);
    }
  }

  return result;
};

/**
 * Update an existing planned visit schedule in Firebase Firestore
 */
export const updateVendorScheduleApi = async (scheduleId, updates) => {
  try {
    const fbResult = await updateScheduleInFirebase(scheduleId, updates);
    if (fbResult.success) {
      const items = getStoredFallbackSchedules();
      const updatedList = items.map(s => {
        if ((s.id || s.documentId) === scheduleId) {
          return { ...s, ...updates, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveStoredFallbackSchedules(updatedList);
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase updateSchedule note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackSchedules();
  let updatedSchedule = null;
  const updatedList = items.map(s => {
    if ((s.id || s.documentId) === scheduleId) {
      updatedSchedule = { ...s, ...updates, updatedAt: new Date().toISOString() };
      return updatedSchedule;
    }
    return s;
  });
  saveStoredFallbackSchedules(updatedList);
  return { success: true, schedule: updatedSchedule };
};

/**
 * Update the execution status of a visit ("scheduled" | "in_transit" | "arrived" | "completed" | "cancelled")
 */
export const updateVendorScheduleStatusApi = async (scheduleId, newStatus) => {
  try {
    const fbResult = await updateScheduleStatusInFirebase(scheduleId, newStatus);
    if (fbResult.success) {
      const items = getStoredFallbackSchedules();
      const updatedList = items.map(s => {
        if ((s.id || s.documentId) === scheduleId) {
          return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveStoredFallbackSchedules(updatedList);
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase updateScheduleStatus note:', err.message);
  }

  // Local fallback
  const items = getStoredFallbackSchedules();
  const updatedList = items.map(s => {
    if ((s.id || s.documentId) === scheduleId) {
      return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
    }
    return s;
  });
  saveStoredFallbackSchedules(updatedList);
  return { success: true, status: newStatus };
};

/**
 * Cancel a planned visit schedule in Firebase Firestore
 */
export const cancelVendorScheduleApi = async (scheduleId) => {
  return updateVendorScheduleStatusApi(scheduleId, 'cancelled');
};

/**
 * Delete a planned schedule from Firebase Firestore
 */
export const deleteVendorScheduleApi = async (scheduleId) => {
  try {
    const fbResult = await deleteScheduleFromFirebase(scheduleId);
    if (fbResult.success) {
      const items = getStoredFallbackSchedules();
      const updated = items.filter(s => (s.id || s.documentId) !== scheduleId);
      saveStoredFallbackSchedules(updated);
      return fbResult;
    }
  } catch (err) {
    console.warn('Firebase deleteSchedule note:', err.message);
  }

  const items = getStoredFallbackSchedules();
  const updated = items.filter(s => (s.id || s.documentId) !== scheduleId);
  saveStoredFallbackSchedules(updated);
  return { success: true, id: scheduleId };
};
