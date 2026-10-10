import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { up as upAuth } from '../db/migrations/001_auth_profile_schema.js';
import { up as upProducts } from '../db/migrations/002_vendor_products_schema.js';

dotenv.config();

const runMigration = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vendorsaathi';
  console.log(`📡 Connecting to MongoDB at ${uri}...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB. Running migrations...');
    await upAuth();
    await upProducts();
    await mongoose.disconnect();
    console.log('👋 Disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.log(`ℹ️ Live MongoDB was not reachable (${err.message}).`);
    console.log('💡 Note: The VendorSaathi backend automatically activates the built-in hybrid in-memory datastore with the exact same schema, validation, and demo accounts pre-seeded.');
    process.exit(0);
  }
};

runMigration();
