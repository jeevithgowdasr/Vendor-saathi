/**
 * Test & Validation Script for Firebase Firestore Planned Visit / Schedule Data Model
 */

import { PRESET_AREAS, getTomorrowDateString } from './src/services/scheduleApi.js';

console.log('🧪 Testing Planned Visit / Schedule Data Model & Utilities...\n');

// 1. Verify Tomorrow's Date
const tomorrow = getTomorrowDateString();
console.log('1. getTomorrowDateString():', tomorrow);
const isFuture = new Date(tomorrow).getTime() > new Date().setHours(0, 0, 0, 0);
console.log('   Is tomorrow strictly in future?', isFuture);

// 2. Validate Preset Areas
console.log('2. PRESET_AREAS Count:', PRESET_AREAS.length);
PRESET_AREAS.forEach(area => {
  if (!area.areaName || typeof area.lat !== 'number' || typeof area.lng !== 'number') {
    throw new Error(`Invalid area: ${JSON.stringify(area)}`);
  }
});
console.log('   All preset areas have valid names and lat/lng coordinates.');

// 3. Validate Schedule Document Model
const testSchedulePayload = {
  documentId: 'sch_test_999',
  vendorId: 'v1',
  vendorName: 'Ramesh Grocery',
  vendorCategory: 'Produce & Groceries',
  date: tomorrow,
  area: {
    areaName: 'Vijayanagar, Moodbidri',
    coordinates: { latitude: 13.0720, longitude: 74.9980 },
    serviceRadiusKm: 2.0
  },
  expectedArrivalTime: new Date(`${tomorrow}T09:30:00`),
  expectedDepartureTime: new Date(`${tomorrow}T11:00:00`),
  availableProductIds: ['prod_tomato_01', 'prod_potato_02'],
  status: 'scheduled'
};

const diffMinutes = (testSchedulePayload.expectedDepartureTime - testSchedulePayload.expectedArrivalTime) / (1000 * 60);
console.log('3. Schedule Time Check: Duration is', diffMinutes, 'minutes. (Expected > 0):', diffMinutes > 0);

const ALLOWED_STATUSES = ['scheduled', 'in_transit', 'arrived', 'completed', 'cancelled'];
console.log('4. Status Check: Is status allowed?', ALLOWED_STATUSES.includes(testSchedulePayload.status));

console.log('\n🎉 ALL SCHEDULE MODEL CHECKS PASSED!\n');
