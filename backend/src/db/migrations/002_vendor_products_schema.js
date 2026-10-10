/**
 * Database Migration 002: Vendor Product Management Schema
 * Defines product collections, indexes (vendor_id, category, is_available),
 * compound search indexes, and initial product catalog fixtures for vendors.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../../models/Product.js';
import { Vendor } from '../../models/Vendor.js';

dotenv.config();

export const up = async () => {
  console.log('🔄 [Migration 002] Applying Vendor Products Schema migration...');

  const db = mongoose.connection.db;
  if (!db) {
    console.log('⚠️ [Migration 002] Mongoose is not connected to a live MongoDB instance.');
    return { success: false, reason: 'NO_DB_CONNECTION' };
  }

  // 1. Ensure indexes for Product collection
  console.log('📌 Creating Product collection indexes...');
  await Product.collection.createIndex(
    { vendor_id: 1 }, 
    { name: 'idx_product_vendor_id' }
  );
  await Product.collection.createIndex(
    { vendor_id: 1, category: 1 }, 
    { name: 'idx_product_vendor_category' }
  );
  await Product.collection.createIndex(
    { vendor_id: 1, is_available: 1 }, 
    { name: 'idx_product_vendor_availability' }
  );
  await Product.collection.createIndex(
    { name: 'text', category: 'text', description: 'text' }, 
    { name: 'idx_product_text_search' }
  );

  // 2. Seed Initial Products for Ramesh Grocery (v1) if empty
  const rameshVendor = await Vendor.findOne({
    $or: [{ email: 'ramesh.kirana@gmail.com' }, { phone: '+91 98451 23456' }]
  });

  const vendorId = rameshVendor ? (rameshVendor._id ? rameshVendor._id.toString() : rameshVendor.id) : 'v1';

  const existingProductsCount = await Product.countDocuments({ vendor_id: vendorId });
  if (existingProductsCount === 0) {
    console.log(`🌱 Seeding initial products for vendor ${vendorId}...`);
    await Product.insertMany([
      {
        vendor_id: vendorId,
        vendorId: vendorId,
        vendorName: 'Ramesh Grocery',
        name: 'Fresh Farm Red Tomatoes',
        shortName: 'Tomato',
        category: 'Vegetable',
        price: 25,
        unit: 'kg',
        available_quantity: 18,
        availableStock: 18,
        is_available: true,
        stockStatus: 'in-stock',
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
        description: 'Fresh and juicy farm tomatoes sourced directly from local Moodbidri farms.'
      },
      {
        vendor_id: vendorId,
        vendorId: vendorId,
        vendorName: 'Ramesh Grocery',
        name: 'Fresh Local Potatoes',
        shortName: 'Potato',
        category: 'Vegetable',
        price: 30,
        unit: 'kg',
        available_quantity: 12,
        availableStock: 12,
        is_available: true,
        stockStatus: 'in-stock',
        image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
        description: 'Clean medium-sized local potatoes.'
      },
      {
        vendor_id: vendorId,
        vendorId: vendorId,
        vendorName: 'Ramesh Grocery',
        name: 'Pooja Red Roses',
        shortName: 'Rose',
        category: 'Flower',
        price: 60,
        unit: 'bunch',
        available_quantity: 15,
        availableStock: 15,
        is_available: true,
        stockStatus: 'in-stock',
        image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
        description: 'Fresh scented roses for temple pooja and home decoration.'
      },
      {
        vendor_id: vendorId,
        vendorId: vendorId,
        vendorName: 'Ramesh Grocery',
        name: 'Fresh Dairy Milk',
        shortName: 'Milk',
        category: 'Dairy',
        price: 28,
        unit: 'litre',
        available_quantity: 25,
        availableStock: 25,
        is_available: true,
        stockStatus: 'in-stock',
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
        description: 'Pure pasture cow milk packaged fresh every morning.'
      },
      {
        vendor_id: vendorId,
        vendorId: vendorId,
        vendorName: 'Ramesh Grocery',
        name: 'Crispy Banana Chips',
        shortName: 'Snacks',
        category: 'Snacks',
        price: 50,
        unit: 'packet',
        available_quantity: 0,
        availableStock: 0,
        is_available: false,
        stockStatus: 'out-of-stock',
        image_url: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80',
        description: 'Authentic South Canara coconut oil fried banana chips.'
      }
    ]);
    console.log('✅ Seeded 5 initial vendor products.');
  }

  console.log('🎉 [Migration 002] Migration completed successfully.');
  return { success: true };
};

export const down = async () => {
  console.log('🔄 [Migration 002] Rolling back Product indexes...');
  try {
    await Product.collection.dropIndex('idx_product_vendor_id');
    await Product.collection.dropIndex('idx_product_vendor_category');
    await Product.collection.dropIndex('idx_product_vendor_availability');
    console.log('✅ Rolled back indexes.');
  } catch (err) {
    console.warn('⚠️ Rollback warning:', err.message);
  }
};
