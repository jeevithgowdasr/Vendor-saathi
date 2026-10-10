/**
 * Database Migration 001: Authentication & Profile Management Schema
 * Defines collections, schema indexes, constraints, and initial seed fixtures.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Customer } from '../../models/Customer.js';
import { Vendor } from '../../models/Vendor.js';

dotenv.config();

export const up = async () => {
  console.log('🔄 [Migration 001] Applying Auth & Profile Schema migration...');

  const db = mongoose.connection.db;
  if (!db) {
    console.log('⚠️ [Migration 001] Mongoose is not connected to a live MongoDB instance.');
    return { success: false, reason: 'NO_DB_CONNECTION' };
  }

  // 1. Ensure indexes for Customer collection
  console.log('📌 Creating Customer collection indexes...');
  await Customer.collection.createIndex(
    { email: 1 }, 
    { unique: true, sparse: true, name: 'idx_customer_email_unique' }
  );
  await Customer.collection.createIndex(
    { phone: 1 }, 
    { unique: true, sparse: true, name: 'idx_customer_phone_unique' }
  );
  await Customer.collection.createIndex(
    { status: 1 }, 
    { name: 'idx_customer_status' }
  );
  await Customer.collection.createIndex(
    { 'primaryLocation.town': 1, 'primaryLocation.district': 1 }, 
    { name: 'idx_customer_town_district' }
  );

  // 2. Ensure indexes for Vendor collection
  console.log('📌 Creating Vendor collection indexes...');
  await Vendor.collection.createIndex(
    { email: 1 }, 
    { unique: true, sparse: true, name: 'idx_vendor_email_unique' }
  );
  await Vendor.collection.createIndex(
    { phone: 1 }, 
    { unique: true, sparse: true, name: 'idx_vendor_phone_unique' }
  );
  await Vendor.collection.createIndex(
    { vendorCategory: 1 }, 
    { name: 'idx_vendor_category' }
  );
  await Vendor.collection.createIndex(
    { operatingAreas: 1 }, 
    { name: 'idx_vendor_operating_areas' }
  );
  await Vendor.collection.createIndex(
    { status: 1 }, 
    { name: 'idx_vendor_status' }
  );

  // 3. Seed Default Demonstration Accounts if not present
  console.log('🌱 Seeding verified test accounts for VendorSaathi...');
  const defaultSalt = await bcrypt.genSalt(10);
  const demoPasswordHash = await bcrypt.hash('password123', defaultSalt);

  // Seed Customer: Bhavana Bai
  const existingCustomer = await Customer.findOne({
    $or: [{ email: 'bhavana.bai@gmail.com' }, { phone: '+91 98765 43210' }]
  });

  if (!existingCustomer) {
    await Customer.create({
      fullName: 'Bhavana Bai',
      email: 'bhavana.bai@gmail.com',
      phone: '+91 98765 43210',
      passwordHash: demoPasswordHash,
      primaryLocation: {
        address: 'Bhavana Bai, Near Alva’s College Campus, Mijar, Moodbidri - 574225',
        coordinates: { lat: 13.0682, lng: 74.9961 },
        village: 'Mijar',
        town: 'Moodbidri',
        district: 'Dakshina Kannada',
        pincode: '574225'
      },
      preferredAreas: ['Mijar', 'Moodbidri', 'Alva’s Campus'],
      preferredCategories: ['Vegetables', 'Fruits', 'Dairy', 'Snacks'],
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      role: 'customer'
    });
    console.log('✅ Seeded demo customer: bhavana.bai@gmail.com (Password: password123)');
  }

  // Seed Vendor: Ramesh Grocery
  const existingVendor = await Vendor.findOne({
    $or: [{ email: 'ramesh.kirana@gmail.com' }, { phone: '+91 98451 23456' }]
  });

  if (!existingVendor) {
    await Vendor.create({
      fullName: 'Ramesh Gowda',
      businessName: 'Ramesh Grocery',
      email: 'ramesh.kirana@gmail.com',
      phone: '+91 98451 23456',
      passwordHash: demoPasswordHash,
      vendorCategory: 'Vegetable',
      categories: ['Vegetables', 'Fruits', 'Spices', 'Daily Essentials'],
      operatingAreas: ['Mijar', 'Moodbidri', 'Kallamundkur', 'Alva’s Campus'],
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      vehicleDetails: {
        vehicleType: 'Three-Wheeler / Auto',
        registrationNumber: 'KA-19-MB-4521'
      },
      status: 'active',
      role: 'vendor',
      locationName: 'Mijar Cross, Moodbidri',
      address: 'Near Alva’s Campus Entrance, Mijar, Moodbidri - 574225',
      coordinates: { lat: 13.0682, lng: 74.9961 },
      distanceKm: 1.8,
      rating: 4.8,
      reviewCount: 120,
      deliveryTime: '20–30 min delivery',
      isOpen: true,
      verified: true
    });
    console.log('✅ Seeded demo vendor: ramesh.kirana@gmail.com (Password: password123)');
  }

  console.log('🎉 [Migration 001] Migration completed successfully.');
  return { success: true };
};

export const down = async () => {
  console.log('🔄 [Migration 001] Rolling back migration indexes...');
  try {
    await Customer.collection.dropIndex('idx_customer_email_unique');
    await Customer.collection.dropIndex('idx_customer_phone_unique');
    await Vendor.collection.dropIndex('idx_vendor_email_unique');
    await Vendor.collection.dropIndex('idx_vendor_phone_unique');
    console.log('✅ Rolled back indexes.');
  } catch (err) {
    console.warn('⚠️ Rollback warning:', err.message);
  }
};
