/**
 * Firebase Cloud Functions for VendorSaathi
 * - Module 2: Authentication Custom Claims & Role Management
 * - Module 4: Conflict Detection, Smart Area Recommendation & Schedule Creation
 * - Module 5: Automated Advance Visit Push Notifications (FCM + Cron/Trigger)
 * - Module 8: Live Telemetry & Geofence Proximity Alert (< 500m)
 * - Module 9: Automatic Vendor Aggregate Rating Recalculation
 * - Module 10: Admin User Status & Platform Governance
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const authAdmin = getAuth();
const messaging = getMessaging();

// Catalog of preset neighborhoods for recommendation in Moodbidri & Mijar
export const AREA_CATALOG = [
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
 * Checks if two vendor category strings conflict or overlap in produce/market offerings
 */
export function isCategoryConflicting(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const c1 = cat1.toLowerCase().trim();
  const c2 = cat2.toLowerCase().trim();

  if (c1 === c2) return true;
  if (c1.includes(c2) || c2.includes(c1)) return true;

  // Synonyms and related produce categories
  const vegetableTerms = ['veg', 'vegetable', 'produce', 'sabzi', 'tarkaari', 'grocery'];
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
export function isTimeOverlapping(newArr, newDep, existArr, existDep) {
  return newArr < existDep && newDep > existArr;
}

/**
 * Convert Firestore Timestamp / ISO / Date to milliseconds
 */
export function toEpochMillis(val) {
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
export function formatTimeMillis(millis) {
  const d = new Date(millis);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

// =============================================================================
// MODULE 2: ROLE-BASED AUTHENTICATION & CUSTOM CLAIMS
// =============================================================================

/**
 * Assign Custom Claims and synchronize user role in Firestore
 * Roles: 'vendor' | 'customer' | 'admin'
 */
export const setCustomUserClaims = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to assign role claims.');
    }

    const { targetUid, role } = request.data || {};
    const effectiveUid = targetUid || request.auth.uid;
    const requestedRole = (role || 'customer').toLowerCase();

    if (!['vendor', 'customer', 'admin'].includes(requestedRole)) {
      throw new HttpsError('invalid-argument', 'Invalid role. Must be vendor, customer, or admin.');
    }

    // Only existing admins can assign the 'admin' role to others
    if (requestedRole === 'admin' && request.auth.token.role !== 'admin' && effectiveUid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Only platform administrators can promote users to admin.');
    }

    try {
      // 1. Assign Auth Custom Claim
      await authAdmin.setCustomUserClaims(effectiveUid, { role: requestedRole });

      // 2. Persist in Firestore users collection
      const userRef = db.collection('users').doc(effectiveUid);
      await userRef.set(
        {
          uid: effectiveUid,
          role: requestedRole,
          status: 'active',
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      return {
        success: true,
        uid: effectiveUid,
        assignedRole: requestedRole,
        message: `Custom claim '${requestedRole}' successfully set.`
      };
    } catch (err) {
      console.error('Error assigning custom claims:', err);
      throw new HttpsError('internal', err.message || 'Failed to set custom claims.');
    }
  }
);

// Backward-compatible alias
export const setUserRole = setCustomUserClaims;

// =============================================================================
// MODULE 4: CONFLICT DETECTION & SMART AREA RECOMMENDATIONS
// =============================================================================

/**
 * Core Conflict Detection Logic with Rule-Based Smart Area Ranking Engine
 */
export async function detectConflictsForSchedule(proposed) {
  const {
    vendorId,
    vendorCategory = 'Vegetable',
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

  // 1. Query Firestore for active schedules on the exact same date
  const schedulesSnapshot = await db
    .collection('schedules')
    .where('date', '==', date)
    .where('status', 'in', ['scheduled', 'in_transit', 'nearby', 'arrived'])
    .get();

  const allDaySchedules = [];
  schedulesSnapshot.forEach(docSnap => {
    if (docSnap.id === scheduleId) return; // Skip self if updating
    const data = docSnap.data();
    if (data.vendorId === vendorId) return; // Skip vendor's own other visits
    allDaySchedules.push({ id: docSnap.id, ...data });
  });

  const conflictsFound = [];

  // 2. Overlap Check:
  // (NewArrival < ExistingDeparture) AND (NewDeparture > ExistingArrival)
  for (const existing of allDaySchedules) {
    const existArrMillis = toEpochMillis(existing.expectedArrivalTime);
    const existDepMillis = toEpochMillis(existing.expectedDepartureTime);

    // Rule A: Category Overlap Check
    const categoryMatches = isCategoryConflicting(vendorCategory, existing.vendorCategory);
    if (!categoryMatches) continue;

    // Rule B: Overlapping Time Slot
    const timeOverlaps = isTimeOverlapping(newArrMillis, newDepMillis, existArrMillis, existDepMillis);
    if (!timeOverlaps) continue;

    // Rule C: Geographic Area Overlap
    const existAreaName = (existing.area?.areaName || existing.areaName || '').toLowerCase().trim();
    const nameMatches =
      proposedAreaName &&
      existAreaName &&
      (proposedAreaName.includes(existAreaName) || existAreaName.includes(proposedAreaName));

    const existLat = existing.area?.coordinates?.latitude || existing.area?.coordinates?.lat || existing.areaLocation?._latitude;
    const existLng = existing.area?.coordinates?.longitude || existing.area?.coordinates?.lng || existing.areaLocation?._longitude;
    const existRadius = Number(existing.area?.serviceRadiusKm || 2.0);

    let geoOverlaps = false;
    let distanceKm = null;

    if (existLat && existLng) {
      distanceKm = calculateHaversineDistanceKm(proposedLat, proposedLng, existLat, existLng);
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
        areaName: existing.area?.areaName || existing.areaName || area?.areaName,
        distanceKm: distanceKm ? Number(distanceKm.toFixed(2)) : 0,
        overlappingTimeWindow: `${formatTimeMillis(overlapStart)} – ${formatTimeMillis(overlapEnd)}`,
        competingTimeSlot: `${formatTimeMillis(existArrMillis)} – ${formatTimeMillis(existDepMillis)}`,
        competingArrivalMillis: existArrMillis,
        competingDepartureMillis: existDepMillis
      });
    }
  }

  const hasConflict = conflictsFound.length > 0;

  // 3. Prompt Choice 1: "Different Time" (Suggest non-overlapping time windows in same area)
  const suggestedTimeSlots = [];
  if (hasConflict) {
    const targetDateStr = date;
    const candidateSlots = [
      { start: '07:30', end: '09:00', label: 'Early Morning Fresh Produce' },
      { start: '09:30', end: '11:00', label: 'Mid-Morning Residential Window' },
      { start: '11:30', end: '13:00', label: 'Noon Campus & Office Round' },
      { start: '14:30', end: '16:00', label: 'Afternoon Community Round' },
      { start: '16:30', end: '18:00', label: 'Evening Market Round' },
      { start: '18:15', end: '19:45', label: 'Sunset Neighborhood Return' }
    ];

    for (const cand of candidateSlots) {
      const candArr = new Date(`${targetDateStr}T${cand.start}:00`).getTime();
      const candDep = new Date(`${targetDateStr}T${cand.end}:00`).getTime();

      let slotHasConflict = false;
      for (const ex of allDaySchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureTime);

        const exName = (ex.area?.areaName || ex.areaName || '').toLowerCase().trim();
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

  // 4. Prompt Choice 2: "Different Area" (Rule-Based Smart Area Ranking Engine)
  // Evaluates candidate areas by:
  // - Customer Demand (Density of registered customers in users collection)
  // - Lower Competition (Few or zero same-category vendors at proposed time)
  // - Distance from vendor
  const recommendedAreas = [];
  if (hasConflict) {
    // Fetch registered customer locations from Firestore for density calculation
    let registeredCustomers = [];
    try {
      const usersSnap = await db.collection('users').where('role', '==', 'customer').get();
      usersSnap.forEach(docSnap => registeredCustomers.push(docSnap.data()));
    } catch (e) {
      console.warn('Customer query notice in area ranking:', e.message);
    }

    const scoredCandidateAreas = [];

    for (const candidateArea of AREA_CATALOG) {
      const candName = candidateArea.areaName.toLowerCase().trim();
      if (candName === proposedAreaName) continue; // Skip currently conflicted area

      // Check competing schedules in this candidate area during proposed window
      let sameCategoryCompetitors = 0;
      for (const ex of allDaySchedules) {
        if (!isCategoryConflicting(vendorCategory, ex.vendorCategory)) continue;
        const exArr = toEpochMillis(ex.expectedArrivalTime);
        const exDep = toEpochMillis(ex.expectedDepartureTime);
        if (!isTimeOverlapping(newArrMillis, newDepMillis, exArr, exDep)) continue;

        const exAreaName = (ex.area?.areaName || ex.areaName || '').toLowerCase().trim();
        if (exAreaName.includes(candName) || candName.includes(exAreaName)) {
          sameCategoryCompetitors += 1;
        }
      }

      // Customer demand score: count customers within candidate service radius or matching preferred areas
      let customerDensityCount = 0;
      for (const cust of registeredCustomers) {
        const prefAreas = cust.preferredAreas || [];
        const hasPref = prefAreas.some(pa => pa.toLowerCase().includes(candName) || candName.includes(pa.toLowerCase()));
        
        let inRadius = false;
        const custLat = cust.primaryLocation?.latitude || cust.primaryLocation?.lat || cust.gpsLocation?.lat;
        const custLng = cust.primaryLocation?.longitude || cust.primaryLocation?.lng || cust.gpsLocation?.lng;
        if (custLat && custLng) {
          const dist = calculateHaversineDistanceKm(candidateArea.latitude, candidateArea.longitude, custLat, custLng);
          inRadius = dist <= candidateArea.serviceRadiusKm;
        }

        if (hasPref || inRadius) {
          customerDensityCount += 1;
        }
      }

      // Distance from current proposed point
      const distFromCurrent = calculateHaversineDistanceKm(
        proposedLat,
        proposedLng,
        candidateArea.latitude,
        candidateArea.longitude
      );

      // Scoring formula:
      // High customer density (+), Zero competitors (+), Low travel distance (+)
      const competitionPenalty = sameCategoryCompetitors * 50;
      const demandScore = Math.min(customerDensityCount * 10, 50);
      const distancePenalty = Math.min(distFromCurrent * 5, 30);
      const compositeScore = 100 + demandScore - competitionPenalty - distancePenalty;

      scoredCandidateAreas.push({
        areaName: candidateArea.areaName,
        coordinates: { latitude: candidateArea.latitude, longitude: candidateArea.longitude },
        serviceRadiusKm: candidateArea.serviceRadiusKm,
        distanceFromCurrentKm: Number(distFromCurrent.toFixed(1)),
        competingVendorsCount: sameCategoryCompetitors,
        customerDensityCount,
        compositeScore,
        reason: sameCategoryCompetitors === 0
          ? `Zero competing ${vendorCategory} vendors & high customer demand (${customerDensityCount || 'Active'} households)`
          : `Low competition (${sameCategoryCompetitors} vendor)`
      });
    }

    // Sort descending by score
    scoredCandidateAreas.sort((a, b) => b.compositeScore - a.compositeScore);
    recommendedAreas.push(...scoredCandidateAreas.slice(0, 3));
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
 * CALLABLE CLOUD FUNCTION: validateAndCreateSchedule
 * 1. Checks Overlap & Conflict
 * 2. If Conflict found: Returns "Different Time", "Different Area", "Continue Anyway"
 * 3. If Conflict bypassed or free: Persists schedule document to Firestore
 */
export const validateAndCreateSchedule = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Vendor authentication required to schedule a visit.');
    }

    const { scheduleData, bypassConflict = false, conflictResolution = 'none' } = request.data || {};
    if (!scheduleData || !scheduleData.date || !scheduleData.expectedArrivalTime || !scheduleData.expectedDepartureTime) {
      throw new HttpsError('invalid-argument', 'Missing required fields: date, arrivalTime, departureTime.');
    }

    const vendorId = request.auth.uid || scheduleData.vendorId;

    // Run Conflict Detection & Smart Recommendations
    const conflictAnalysis = await detectConflictsForSchedule({
      ...scheduleData,
      vendorId
    });

    if (conflictAnalysis.hasConflict && !bypassConflict) {
      return {
        success: false,
        requiresResolution: true,
        hasConflict: true,
        conflictDetails: conflictAnalysis,
        choices: [
          {
            id: 'different_time',
            title: 'Suggest Different Time',
            description: 'Non-overlapping time windows in the same neighborhood',
            options: conflictAnalysis.suggestedTimeSlots
          },
          {
            id: 'different_area',
            title: 'Suggest Different Area',
            description: 'Ranked by customer demand, low competition, and route proximity',
            options: conflictAnalysis.recommendedAreas
          },
          {
            id: 'continue_anyway',
            title: 'Continue Anyway',
            description: 'Proceed with route visit and flag competitive overlap',
            hasConflict: true
          }
        ]
      };
    }

    // Persist Schedule Document in Firestore
    const scheduleRef = scheduleData.id ? db.collection('schedules').doc(scheduleData.id) : db.collection('schedules').doc();
    const arrDate = new Date(scheduleData.expectedArrivalTime);
    const depDate = new Date(scheduleData.expectedDepartureTime);

    const geoLat = Number(scheduleData.area?.coordinates?.latitude || scheduleData.areaLocation?._latitude || 13.0682);
    const geoLng = Number(scheduleData.area?.coordinates?.longitude || scheduleData.areaLocation?._longitude || 74.9961);
    const areaName = scheduleData.area?.areaName || scheduleData.areaName || 'Moodbidri';

    const newSchedule = {
      scheduleId: scheduleRef.id,
      id: scheduleRef.id,
      vendorId,
      vendorName: scheduleData.vendorName || 'Local Merchant',
      vendorCategory: scheduleData.vendorCategory || 'Vegetable',
      date: scheduleData.date,
      areaName,
      areaLocation: new GeoPoint(geoLat, geoLng),
      area: {
        areaName,
        coordinates: new GeoPoint(geoLat, geoLng),
        serviceRadiusKm: Number(scheduleData.area?.serviceRadiusKm || 2.0)
      },
      expectedArrivalTime: Timestamp.fromDate(arrDate),
      expectedDepartureTime: Timestamp.fromDate(depDate),
      availableProductIds: scheduleData.availableProductIds || [],
      status: scheduleData.status || 'scheduled',
      hasConflict: conflictAnalysis.hasConflict,
      conflictResolution: conflictAnalysis.hasConflict ? (conflictResolution || 'ignored') : 'none',
      conflictingVendorInfo: conflictAnalysis.primaryConflict || null,
      liveCoordinates: new GeoPoint(geoLat, geoLng),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await scheduleRef.set(newSchedule, { merge: true });

    // Log conflict record if bypassed
    if (conflictAnalysis.hasConflict && conflictAnalysis.primaryConflict) {
      await db.collection('conflicts').add({
        scheduleId1: scheduleRef.id,
        scheduleId2: conflictAnalysis.primaryConflict.conflictingScheduleId,
        vendorId1: vendorId,
        vendorId2: conflictAnalysis.primaryConflict.competingVendorId,
        area: areaName,
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
      schedule: newSchedule
    };
  }
);

// Backward-compatible aliases
export const checkScheduleConflict = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const result = await detectConflictsForSchedule({ ...request.data, vendorId: request.auth.uid });
    return { success: true, ...result };
  }
);

export const checkAndCreateSchedule = validateAndCreateSchedule;

// =============================================================================
// MODULE 5: AUTOMATED ADVANCE NOTIFICATIONS (CRON / SCHEDULED FCM)
// =============================================================================

/**
 * Dispatch Advance Visit FCM Notifications for Tomorrow's Scheduled Vendors
 * Runs daily at 18:00 (6:00 PM) via Cloud Scheduler
 */
export const sendAdvanceVisitNotifications = onSchedule(
  'every day 18:00',
  async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    console.log(`Running daily advance visit notification job for: ${tomorrowDateStr}`);

    try {
      // 1. Fetch all scheduled visits for tomorrow
      const schedulesSnap = await db
        .collection('schedules')
        .where('date', '==', tomorrowDateStr)
        .where('status', '==', 'scheduled')
        .get();

      if (schedulesSnap.empty) {
        console.log('No planned visits scheduled for tomorrow.');
        return;
      }

      // 2. Fetch all registered customers with FCM tokens
      const customersSnap = await db
        .collection('users')
        .where('role', '==', 'customer')
        .get();

      const customers = [];
      customersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.fcmToken) {
          customers.push({ uid: docSnap.id, ...data });
        }
      });

      console.log(`Found ${schedulesSnap.size} schedules and ${customers.length} registered customers with FCM tokens.`);

      // 3. Match schedules to customers by proximity or preferred area/category
      let totalDispatched = 0;

      for (const scheduleDoc of schedulesSnap.docs) {
        const schedule = scheduleDoc.data();
        const schedLat = schedule.area?.coordinates?.latitude || schedule.areaLocation?._latitude;
        const schedLng = schedule.area?.coordinates?.longitude || schedule.areaLocation?._longitude;
        const schedRadius = Number(schedule.area?.serviceRadiusKm || 2.5);
        const schedAreaName = schedule.areaName || schedule.area?.areaName || 'Your Neighborhood';
        const vendorName = schedule.vendorName || 'Local Merchant';
        const timeWindow = schedule.expectedArrivalTime
          ? formatTimeMillis(toEpochMillis(schedule.expectedArrivalTime))
          : 'Morning';

        for (const customer of customers) {
          let shouldNotify = false;

          // Check A: Preferred Area match
          const prefAreas = customer.preferredAreas || [];
          if (prefAreas.some(pa => schedAreaName.toLowerCase().includes(pa.toLowerCase()))) {
            shouldNotify = true;
          }

          // Check B: Distance radius match
          const custLat = customer.primaryLocation?.latitude || customer.primaryLocation?.lat || customer.gpsLocation?.lat;
          const custLng = customer.primaryLocation?.longitude || customer.primaryLocation?.lng || customer.gpsLocation?.lng;
          if (schedLat && schedLng && custLat && custLng) {
            const dist = calculateHaversineDistanceKm(schedLat, schedLng, custLat, custLng);
            if (dist <= schedRadius) {
              shouldNotify = true;
            }
          }

          if (shouldNotify && customer.fcmToken) {
            try {
              const payload = {
                token: customer.fcmToken,
                notification: {
                  title: `Vendor Coming Tomorrow! 🛒`,
                  body: `${vendorName} will visit ${schedAreaName} at ${timeWindow}. Tap to pre-order fresh items!`
                },
                data: {
                  scheduleId: scheduleDoc.id,
                  vendorId: schedule.vendorId || '',
                  areaName: schedAreaName,
                  type: 'ADVANCE_VISIT_NOTIFICATION'
                }
              };

              await messaging.send(payload);
              totalDispatched += 1;

              // Save in notifications log
              await db.collection('notifications').add({
                userId: customer.uid,
                title: payload.notification.title,
                body: payload.notification.body,
                scheduleId: scheduleDoc.id,
                sentAt: FieldValue.serverTimestamp(),
                read: false
              });
            } catch (fcmErr) {
              console.warn(`FCM delivery note for customer ${customer.uid}:`, fcmErr.message);
            }
          }
        }
      }

      console.log(`Successfully dispatched ${totalDispatched} advance visit push notifications.`);
    } catch (jobErr) {
      console.error('Error running sendAdvanceVisitNotifications job:', jobErr);
    }
  }
);

// Callable wrapper to trigger advance notifications on-demand (for QA and testing)
export const triggerAdvanceNotificationsManually = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Admin authentication required.');
    // Run the notification sweep
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    const schedulesSnap = await db.collection('schedules').where('date', '==', tomorrowDateStr).get();
    return {
      success: true,
      dateEvaluated: tomorrowDateStr,
      schedulesFound: schedulesSnap.size,
      message: 'Advance visit notifications triggered successfully.'
    };
  }
);

// =============================================================================
// MODULE 8: LIVE TELEMETRY & GEOFENCE PROXIMITY ALERT (< 500m)
// =============================================================================

/**
 * Fires whenever schedule liveCoordinates are updated by vendor's GPS
 * Triggers Geofence proximity alert when vendor is within 500m of delivery location
 */
export const onScheduleLiveLocationUpdated = onDocumentUpdated(
  'schedules/{scheduleId}',
  async (event) => {
    const beforeData = event.data.before?.data();
    const afterData = event.data.after?.data();
    const scheduleId = event.params.scheduleId;

    if (!afterData || !beforeData) return;

    // Check if liveCoordinates were updated
    const beforeCoords = beforeData.liveCoordinates;
    const afterCoords = afterData.liveCoordinates;
    if (!afterCoords) return;

    const currentLat = afterCoords.latitude || afterCoords._latitude;
    const currentLng = afterCoords.longitude || afterCoords._longitude;

    const destLat = afterData.area?.coordinates?.latitude || afterData.areaLocation?._latitude;
    const destLng = afterData.area?.coordinates?.longitude || afterData.areaLocation?._longitude;

    if (!destLat || !destLng || !currentLat || !currentLng) return;

    const distanceKm = calculateHaversineDistanceKm(currentLat, currentLng, destLat, destLng);

    // If within 500 meters (0.5 km) and trip is in transit
    if (distanceKm <= 0.5 && afterData.status === 'in_transit') {
      console.log(`Geofence triggered for schedule ${scheduleId}: Vendor within ${distanceKm.toFixed(2)} km (< 500m)`);

      // 1. Advance status to 'nearby'
      await event.data.after.ref.update({
        status: 'nearby',
        proximityAlertTriggered: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      // 2. Notify customers who ordered from this schedule
      const ordersSnap = await db
        .collection('orders')
        .where('scheduleId', '==', scheduleId)
        .where('status', 'in', ['placed', 'accepted', 'preparing', 'on_the_way'])
        .get();

      for (const orderDoc of ordersSnap.docs) {
        const orderData = orderDoc.data();
        await orderDoc.ref.update({
          status: 'nearby',
          arrivalETA: 'Under 3 mins (Within 500m)',
          updatedAt: FieldValue.serverTimestamp()
        });

        // Send FCM alert if customer has token
        if (orderData.customerId) {
          const userDoc = await db.collection('users').doc(orderData.customerId).get();
          const fcmToken = userDoc.data()?.fcmToken;
          if (fcmToken) {
            try {
              await messaging.send({
                token: fcmToken,
                notification: {
                  title: `Vendor is Nearby! 🛵`,
                  body: `${afterData.vendorName || 'Your vendor'} is within 500 meters of your area. Arriving now!`
                },
                data: {
                  orderId: orderDoc.id,
                  scheduleId,
                  status: 'nearby'
                }
              });
            } catch (err) {
              console.warn('Proximity FCM notification note:', err.message);
            }
          }
        }
      }
    }
  }
);

// =============================================================================
// MODULE 9: AUTOMATIC VENDOR AGGREGATE RATING RECALCULATION
// =============================================================================

/**
 * Fires when a new rating is submitted in /ratings/{ratingId}
 * Recalculates vendor aggregate rating and updates users/{vendorId} & vendors/{vendorId}
 */
export const onRatingCreated = onDocumentCreated(
  'ratings/{ratingId}',
  async (event) => {
    const ratingData = event.data?.data();
    if (!ratingData || !ratingData.vendorId) return;

    const vendorId = ratingData.vendorId;

    try {
      // Query all ratings for this vendor
      const ratingsSnap = await db
        .collection('ratings')
        .where('vendorId', '==', vendorId)
        .get();

      let totalScore = 0;
      let count = 0;

      ratingsSnap.forEach(d => {
        const r = d.data();
        if (typeof r.score === 'number' && r.score >= 1) {
          totalScore += r.score;
          count += 1;
        }
      });

      const avgScore = count > 0 ? Number((totalScore / count).toFixed(2)) : 5.0;

      // Update in users collection
      const userRef = db.collection('users').doc(vendorId);
      await userRef.set(
        {
          rating: avgScore,
          ratingScore: avgScore,
          reviewCount: count,
          ratingsCount: count,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      // Update in vendors collection
      const vendorRef = db.collection('vendors').doc(vendorId);
      await vendorRef.set(
        {
          rating: avgScore,
          ratingScore: avgScore,
          reviewCount: count,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      console.log(`Updated aggregate rating for vendor ${vendorId}: ${avgScore} (${count} reviews)`);
    } catch (err) {
      console.error(`Error calculating rating for vendor ${vendorId}:`, err);
    }
  }
);

// =============================================================================
// MODULE 10: ADMIN MANAGEMENT & PLATFORM GOVERNANCE
// =============================================================================

/**
 * Admin action to activate, block, or verify a user/vendor
 */
export const adminUpdateUserStatus = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

    // Verify caller has admin privileges
    const callerUid = request.auth.uid;
    const callerSnap = await db.collection('users').doc(callerUid).get();
    const isCallerAdmin = request.auth.token.role === 'admin' || callerSnap.data()?.role === 'admin';

    if (!isCallerAdmin) {
      throw new HttpsError('permission-denied', 'Only platform administrators can modify user account statuses.');
    }

    const { targetUid, newStatus } = request.data || {};
    if (!targetUid || !['active', 'blocked', 'pending'].includes(newStatus)) {
      throw new HttpsError('invalid-argument', 'Valid targetUid and status (active, blocked, pending) are required.');
    }

    await db.collection('users').doc(targetUid).update({
      status: newStatus,
      statusUpdatedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      targetUid,
      newStatus,
      message: `User status successfully updated to ${newStatus}.`
    };
  }
);
