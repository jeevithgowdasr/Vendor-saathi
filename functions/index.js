/**
 * Firebase Cloud Functions for VendorSaathi
 * Conflict Detection and Resolution Engine for Vendor Planned Visits
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, GeoPoint } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Known catalog of preset neighborhoods for recommendation in Moodbidri & Mijar
const AREA_CATALOG = [
  { areaName: 'Vijayanagar, Moodbidri', latitude: 13.0720, longitude: 74.9980, serviceRadiusKm: 2.0 },
  { areaName: 'Alva’s Campus Gate, Moodbidri', latitude: 13.0690, longitude: 74.9940, serviceRadiusKm: 1.5 },
  { areaName: 'Mijar Central Market, Mijar', latitude: 13.0682, longitude: 74.9961, serviceRadiusKm: 2.5 },
  { areaName: 'Moodbidri Bus Stand & Market', latitude: 13.0645, longitude: 74.9912, serviceRadiusKm: 2.0 },
  { areaName: 'Kallamundkur Village Center', latitude: 13.0850, longitude: 75.0120, serviceRadiusKm: 3.0 },
  { areaName: 'Vidyagiri Residential Layout', latitude: 13.0705, longitude: 74.9890, serviceRadiusKm: 1.5 },
  { areaName: 'Swarna Temple Road, Moodbidri', latitude: 13.0620, longitude: 74.9880, serviceRadiusKm: 2.0 }
];

/**
 * Calculate Great-Circle Distance (in Kilometers) between 2 coordinates using Haversine formula
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
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
 * Checks if two category strings conflict or overlap in produce/market offerings
 */
function isCategoryConflicting(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const c1 = cat1.toLowerCase().trim();
  const c2 = cat2.toLowerCase().trim();

  if (c1 === c2) return true;
  if (c1.includes(c2) || c2.includes(c1)) return true;

  // Synonyms and related produce categories
  const vegetableTerms = ['veg', 'vegetable', 'produce', 'sabzi', 'tarkaari'];
  const isC1Veg = vegetableTerms.some(t => c1.includes(t));
  const isC2Veg = vegetableTerms.some(t => c2.includes(t));
  if (isC1Veg && isC2Veg) return true;

  const fruitTerms = ['fruit', 'fruits', 'banana', 'mango', 'haalu'];
  const isC1Fruit = fruitTerms.some(t => c1.includes(t));
  const isC2Fruit = fruitTerms.some(t => c2.includes(t));
  if (isC1Fruit && isC2Fruit) return true;

  const flowerTerms = ['flower', 'flowers', 'pooja', 'rose'];
  const isC1Flower = flowerTerms.some(t => c1.includes(t));
  const isC2Flower = flowerTerms.some(t => c2.includes(t));
  if (isC1Flower && isC2Flower) return true;

  return false;
}

/**
 * Check if two time intervals overlap:
 * (NewArrival < ExistingDeparture) AND (NewDeparture > ExistingArrival)
 */
function isTimeOverlapping(newArr, newDep, existArr, existDep) {
  return newArr < existDep && newDep > existArr;
}

/**
 * Convert Firestore Timestamp / ISO / Date to milliseconds
 */
function toEpochMillis(val) {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val._seconds === 'number') return val._seconds * 1000;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  return new Date(val).getTime();
}

/**
 * Format milliseconds into HH:MM AM/PM string
 */
function formatTimeMillis(millis) {
  const d = new Date(millis);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Core Conflict Detection Logic (Reusable across Callable & Trigger)
 */
async function detectConflictsForSchedule(proposed) {
  const {
    vendorId,
    vendorCategory = 'Vegetables',
    date,
    area,
    expectedArrivalTime,
    expectedDepartureTime,
    scheduleId = null
  } = proposed;

  const newArrMillis = toEpochMillis(expectedArrivalTime);
  const newDepMillis = toEpochMillis(expectedDepartureTime);
  const proposedDurationMinutes = Math.round((newDepMillis - newArrMillis) / 60000);

  const proposedLat = area?.coordinates?.latitude || area?.coordinates?.lat || 13.0682;
  const proposedLng = area?.coordinates?.longitude || area?.coordinates?.lng || 74.9961;
  const proposedRadius = Number(area?.serviceRadiusKm || 2.0);
  const proposedAreaName = (area?.areaName || '').toLowerCase().trim();

  // 1. Query Firestore for active schedules on the exact same date
  const schedulesSnapshot = await db
    .collection('schedules')
    .where('date', '==', date)
    .where('status', 'in', ['scheduled', 'in_transit', 'arrived'])
    .get();

  const allDaySchedules = [];
  schedulesSnapshot.forEach(docSnap => {
    if (docSnap.id === scheduleId) return; // Skip self if updating
    const data = docSnap.data();
    if (data.vendorId === vendorId) return; // Skip vendor's own other schedules
    allDaySchedules.push({ id: docSnap.id, ...data });
  });

  const conflictsFound = [];

  // 2. Evaluate Conflict Rules for each competing schedule
  for (const existing of allDaySchedules) {
    const existArrMillis = toEpochMillis(existing.expectedArrivalTime);
    const existDepMillis = toEpochMillis(existing.expectedDepartureTime);

    // Rule A: Category Match
    const categoryMatches = isCategoryConflicting(vendorCategory, existing.vendorCategory);
    if (!categoryMatches) continue;

    // Rule B: Overlapping Time Slot
    const timeOverlaps = isTimeOverlapping(newArrMillis, newDepMillis, existArrMillis, existDepMillis);
    if (!timeOverlaps) continue;

    // Rule C: Overlapping Area (Name substring match OR Geographic radius overlap)
    const existAreaName = (existing.area?.areaName || '').toLowerCase().trim();
    const nameMatches =
      proposedAreaName &&
      existAreaName &&
      (proposedAreaName.includes(existAreaName) || existAreaName.includes(proposedAreaName));

    const existLat = existing.area?.coordinates?.latitude || existing.area?.coordinates?.lat;
    const existLng = existing.area?.coordinates?.longitude || existing.area?.coordinates?.lng;
    const existRadius = Number(existing.area?.serviceRadiusKm || 2.0);

    let geoOverlaps = false;
    let distanceKm = null;

    if (existLat && existLng) {
      distanceKm = calculateHaversineDistanceKm(proposedLat, proposedLng, existLat, existLng);
      // Radii overlap if centers are within the sum of service radii
      geoOverlaps = distanceKm <= (proposedRadius + existRadius);
    }

    if (nameMatches || geoOverlaps) {
      const overlapStart = Math.max(newArrMillis, existArrMillis);
      const overlapEnd = Math.min(newDepMillis, existDepMillis);

      conflictsFound.push({
        conflictingScheduleId: existing.id,
        competingVendorId: existing.vendorId,
        competingVendorName: existing.vendorName || 'Another Local Merchant',
        competingCategory: existing.vendorCategory || 'Similar Produce',
        areaName: existing.area?.areaName || area?.areaName,
        distanceKm: distanceKm ? Number(distanceKm.toFixed(2)) : 0,
        overlappingTimeWindow: `${formatTimeMillis(overlapStart)} – ${formatTimeMillis(overlapEnd)}`,
        competingTimeSlot: `${formatTimeMillis(existArrMillis)} – ${formatTimeMillis(existDepMillis)}`,
        competingArrivalMillis: existArrMillis,
        competingDepartureMillis: existDepMillis
      });
    }
  }

  const hasConflict = conflictsFound.length > 0;

  // 3. Choice 1: "Suggest Different Time"
  // Calculate adjacent open time windows in the same area on that day
  const suggestedTimeSlots = [];
  if (hasConflict) {
    const targetDateStr = date;
    const baseHour = 7; // Morning start 7:00 AM
    const endHour = 20; // Evening end 8:00 PM

    // Candidate intervals throughout the operational day
    const candidateSlots = [
      { start: '07:30', end: '09:00', label: 'Early Morning Fresh Market' },
      { start: '09:30', end: '11:00', label: 'Mid-Morning Residential Round' },
      { start: '11:30', end: '13:00', label: 'Lunchtime Campus & Office Round' },
      { start: '14:30', end: '16:00', label: 'Afternoon Community Round' },
      { start: '16:30', end: '18:00', label: 'Evening Market Round' },
      { start: '18:15', end: '19:45', label: 'Sunset Return Round' }
    ];

    for (const cand of candidateSlots) {
      const candArr = new Date(`${targetDateStr}T${cand.start}:00`).getTime();
      const candDep = new Date(`${targetDateStr}T${cand.end}:00`).getTime();

      // Check if this candidate slot conflicts with ANY existing same-category schedule in this area
      let slotHasConflict = false;
      for (const ex of allDaySchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureTime);

        const exName = (ex.area?.areaName || '').toLowerCase().trim();
        const areaOverlaps = proposedAreaName.includes(exName) || exName.includes(proposedAreaName);

        if (areaOverlaps && isTimeOverlapping(candArr, candDep, exArr, exDep)) {
          slotHasConflict = true;
          break;
        }
      }

      if (!slotHasConflict) {
        suggestedTimeSlots.push({
          arrivalTime: cand.start,
          departureTime: cand.end,
          formatted: `${cand.start} – ${cand.end}`,
          label: cand.label,
          arrivalIso: new Date(candArr).toISOString(),
          departureIso: new Date(candDep).toISOString()
        });
      }
      if (suggestedTimeSlots.length >= 3) break;
    }
  }

  // 4. Choice 2: "Suggest Different Area"
  // Find alternative nearby neighborhoods free of competing category vendors at proposed time
  const recommendedAreas = [];
  if (hasConflict) {
    for (const candidateArea of AREA_CATALOG) {
      const candName = candidateArea.areaName.toLowerCase().trim();
      if (candName === proposedAreaName) continue; // Skip the currently selected area

      // Check if any existing schedule is operating in this candidate area at proposed time
      let areaIsBusy = false;
      for (const ex of allDaySchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureTime);

        if (!isTimeOverlapping(newArrMillis, newDepMillis, exArr, exDep)) continue;

        const exAreaName = (ex.area?.areaName || '').toLowerCase().trim();
        const exLat = ex.area?.coordinates?.latitude || ex.area?.coordinates?.lat;
        const exLng = ex.area?.coordinates?.longitude || ex.area?.coordinates?.lng;

        if (exAreaName.includes(candName) || candName.includes(exAreaName)) {
          areaIsBusy = true;
          break;
        }

        if (exLat && exLng) {
          const dist = calculateHaversineDistanceKm(candidateArea.latitude, candidateArea.longitude, exLat, exLng);
          if (dist <= candidateArea.serviceRadiusKm) {
            areaIsBusy = true;
            break;
          }
        }
      }

      if (!areaIsBusy) {
        const distFromCurrent = calculateHaversineDistanceKm(
          proposedLat,
          proposedLng,
          candidateArea.latitude,
          candidateArea.longitude
        );

        recommendedAreas.push({
          areaName: candidateArea.areaName,
          coordinates: { latitude: candidateArea.latitude, longitude: candidateArea.longitude },
          serviceRadiusKm: candidateArea.serviceRadiusKm,
          distanceFromCurrentKm: Number(distFromCurrent.toFixed(1)),
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

// =============================================================================
// CALLABLE FUNCTION 1: checkScheduleConflict
// Triggered on frontend form submission to inspect potential conflicts
// =============================================================================
export const checkScheduleConflict = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to check schedule conflicts.');
    }

    const scheduleData = request.data;
    if (!scheduleData || !scheduleData.date || !scheduleData.expectedArrivalTime || !scheduleData.expectedDepartureTime) {
      throw new HttpsError('invalid-argument', 'Missing required schedule fields: date, arrivalTime, departureTime.');
    }

    try {
      const conflictResult = await detectConflictsForSchedule({
        ...scheduleData,
        vendorId: request.auth.uid || scheduleData.vendorId
      });
      return { success: true, ...conflictResult };
    } catch (error) {
      console.error('Error in checkScheduleConflict:', error);
      throw new HttpsError('internal', error.message || 'Failed to detect conflicts.');
    }
  }
);

// =============================================================================
// CALLABLE FUNCTION 2: checkAndCreateSchedule
// Atomically checks conflicts and creates schedule with resolution tracking
// =============================================================================
export const checkAndCreateSchedule = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const { scheduleData, bypassConflict = false, conflictResolution = 'none' } = request.data;
    const vendorId = request.auth.uid;

    const conflictAnalysis = await detectConflictsForSchedule({
      ...scheduleData,
      vendorId
    });

    if (conflictAnalysis.hasConflict && !bypassConflict) {
      // Return conflict warning payload for user decision
      return {
        success: false,
        requiresResolution: true,
        conflictDetails: conflictAnalysis
      };
    }

    // Persist schedule document to Firestore
    const scheduleRef = db.collection('schedules').doc();
    const arrDate = new Date(scheduleData.expectedArrivalTime);
    const depDate = new Date(scheduleData.expectedDepartureTime);

    const newSchedule = {
      id: scheduleRef.id,
      documentId: scheduleRef.id,
      vendorId,
      vendorName: scheduleData.vendorName || 'Local Merchant',
      vendorCategory: scheduleData.vendorCategory || 'Produce',
      date: scheduleData.date,
      area: {
        areaName: scheduleData.area?.areaName || 'Moodbidri',
        coordinates: new GeoPoint(
          Number(scheduleData.area?.coordinates?.latitude || 13.0682),
          Number(scheduleData.area?.coordinates?.longitude || 74.9961)
        ),
        serviceRadiusKm: Number(scheduleData.area?.serviceRadiusKm || 2.0)
      },
      expectedArrivalTime: Timestamp.fromDate(arrDate),
      expectedDepartureTime: Timestamp.fromDate(depDate),
      availableProductIds: scheduleData.availableProductIds || [],
      status: 'scheduled',
      hasConflict: conflictAnalysis.hasConflict,
      conflictResolution: conflictAnalysis.hasConflict ? (conflictResolution || 'ignored') : 'none',
      conflictingVendorInfo: conflictAnalysis.primaryConflict || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await scheduleRef.set(newSchedule);

    // If conflict bypassed, log to /conflicts collection for analytics
    if (conflictAnalysis.hasConflict && conflictAnalysis.primaryConflict) {
      await db.collection('conflicts').add({
        scheduleId1: scheduleRef.id,
        scheduleId2: conflictAnalysis.primaryConflict.conflictingScheduleId,
        vendorId1: vendorId,
        vendorId2: conflictAnalysis.primaryConflict.competingVendorId,
        area: scheduleData.area?.areaName,
        date: scheduleData.date,
        timeOverlap: conflictAnalysis.primaryConflict.overlappingTimeWindow,
        category: scheduleData.vendorCategory,
        resolutionChoice: conflictResolution || 'ignored',
        resolvedAt: FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      scheduleId: scheduleRef.id,
      hasConflict: conflictAnalysis.hasConflict,
      conflictResolution: newSchedule.conflictResolution,
      schedule: newSchedule
    };
  }
);

// =============================================================================
// BACKGROUND TRIGGER: onScheduleCreated
// Runs whenever a schedule document is created directly via client SDK
// =============================================================================
export const onScheduleCreated = onDocumentCreated('schedules/{scheduleId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const scheduleData = snapshot.data();
  const scheduleId = event.params.scheduleId;

  // If already flagged or completed, avoid re-evaluating
  if (scheduleData.hasConflict !== undefined && scheduleData.conflictResolution) {
    return;
  }

  try {
    const analysis = await detectConflictsForSchedule({
      ...scheduleData,
      scheduleId
    });

    if (analysis.hasConflict) {
      await snapshot.ref.update({
        hasConflict: true,
        conflictResolution: 'ignored',
        conflictingVendorInfo: analysis.primaryConflict,
        updatedAt: FieldValue.serverTimestamp()
      });

      if (analysis.primaryConflict) {
        await db.collection('conflicts').add({
          scheduleId1: scheduleId,
          scheduleId2: analysis.primaryConflict.conflictingScheduleId,
          vendorId1: scheduleData.vendorId,
          vendorId2: analysis.primaryConflict.competingVendorId,
          area: scheduleData.area?.areaName,
          date: scheduleData.date,
          timeOverlap: analysis.primaryConflict.overlappingTimeWindow,
          category: scheduleData.vendorCategory,
          resolutionChoice: 'detected_post_create',
          resolvedAt: FieldValue.serverTimestamp()
        });
      }
    } else {
      await snapshot.ref.update({
        hasConflict: false,
        conflictResolution: 'none',
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  } catch (err) {
    console.error(`Error in onScheduleCreated for schedule ${scheduleId}:`, err);
  }
});
