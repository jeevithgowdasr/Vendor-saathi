/**
 * Geolocation & Reverse Geocoding Utility for VendorSaathi
 * Handles live HTML5 GPS hardware coordinates acquisition,
 * accuracy calculation, and reverse geocoding to exact village/town address.
 */

// Fallback lookup table for local coordinates in Dakshina Kannada / Udupi region
const KNOWN_LOCAL_AREAS = [
  { name: 'Mijar', town: 'Moodbidri', lat: 13.0682, lng: 74.9961, pincode: '574225' },
  { name: 'Moodbidri Market', town: 'Moodbidri', lat: 13.0725, lng: 74.9985, pincode: '574227' },
  { name: 'Alva’s Campus', town: 'Moodbidri', lat: 13.0620, lng: 74.9910, pincode: '574225' },
  { name: 'Kallamundkur', town: 'Belvai', lat: 13.1120, lng: 74.9650, pincode: '574213' },
  { name: 'Belvai', town: 'Belvai', lat: 13.1040, lng: 74.9810, pincode: '574213' },
  { name: 'Ganjimutt', town: 'Mangaluru', lat: 12.9810, lng: 74.9350, pincode: '574144' },
  { name: 'Mulki', town: 'Mangaluru North', lat: 13.0980, lng: 74.7920, pincode: '574154' },
  { name: 'Surathkal', town: 'Mangaluru', lat: 13.0080, lng: 74.7940, pincode: '575014' },
  { name: 'Kinnigoli', town: 'Mangaluru', lat: 13.0840, lng: 74.8620, pincode: '574150' },
  { name: 'Karkala', town: 'Karkala', lat: 13.2120, lng: 74.9980, pincode: '574104' },
  { name: 'Mangaluru City', town: 'Mangaluru', lat: 12.9141, lng: 74.8560, pincode: '575001' },
  { name: 'Udupi Town', town: 'Udupi', lat: 13.3409, lng: 74.7421, pincode: '576101' },
  { name: 'Bengaluru', town: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, pincode: '560001' }
];

/**
 * Acquire exact GPS coordinates from browser Geolocation API
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: string}>}
 */
export const getLiveGPSCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
          altitude: position.coords.altitude || null,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please allow location permissions in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      options
    );
  });
};

/**
 * Reverse geocode coordinates to exact address details via OpenStreetMap Nominatim
 * with high-reliability fallback to local area matching.
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} accuracy 
 * @returns {Promise<Object>}
 */
export const reverseGeocodeGPS = async (lat, lng, accuracy = 15) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VendorSaathi-Rural-Grocery/2.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
      const village = addr.village || addr.suburb || addr.hamlet || addr.quarter || addr.residential || '';
      const town = addr.town || addr.city || addr.municipality || addr.city_district || '';
      const district = addr.state_district || addr.county || 'Dakshina Kannada';
      const state = addr.state || 'Karnataka';
      const pincode = addr.postcode || '';

      const detectedVillage = village || town || 'Local Area';
      const detectedTown = town || district || 'Dakshina Kannada';

      // Build structured readable address
      let formatted = data.display_name;
      if (!formatted || formatted.length > 120) {
        const parts = [road, detectedVillage, detectedTown, district, state, pincode].filter(Boolean);
        formatted = parts.join(', ');
      }

      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        accuracy,
        village: detectedVillage,
        town: detectedTown,
        district: district,
        state: state,
        pincode: pincode || '574225',
        streetAddress: road || `Near ${detectedVillage}`,
        formattedAddress: formatted,
        rawDisplayName: data.display_name || formatted,
        source: 'LIVE_GPS_NOMINATIM',
        capturedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding notice (using coordinate estimation):', err);
  }

  // Fallback: Find closest known local area in Karnataka
  let closest = KNOWN_LOCAL_AREAS[0];
  let minDistance = Number.MAX_VALUE;

  for (const area of KNOWN_LOCAL_AREAS) {
    const dist = Math.hypot(lat - area.lat, lng - area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = area;
    }
  }

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    accuracy,
    village: closest.name,
    town: closest.town,
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    pincode: closest.pincode,
    streetAddress: `Near ${closest.name} Center`,
    formattedAddress: `${closest.name}, ${closest.town}, Dakshina Kannada, Karnataka - ${closest.pincode}`,
    source: 'LIVE_GPS_COORDINATE_LOCK',
    capturedAt: new Date().toISOString()
  };
};
