import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Vendor } from '../models/Vendor.js';
import { memoryStore } from '../store/memoryStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vendorsaathi_jwt_super_secure_secret_key_2026_production';
const JWT_EXPIRES_IN = '24h';

// Helper to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Simple input validators
const validateEmailFormat = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhoneFormat = (phone) => {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
};

/**
 * Register Customer Endpoint
 * POST /api/auth/register/customer
 */
export const registerCustomer = async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      phone,
      password,
      primaryLocation,
      preferredAreas,
      preferredCategories,
      profileImage
    } = req.body;

    const effectiveName = fullName || name;
    if (!effectiveName || effectiveName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        field: 'fullName',
        message: 'Full Name is required (minimum 2 characters).'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        field: 'identifier',
        message: 'Either email address or mobile phone number is required.'
      });
    }

    if (email && !validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please provide a valid email address.'
      });
    }

    if (phone && !validatePhoneFormat(phone)) {
      return res.status(400).json({
        success: false,
        field: 'phone',
        message: 'Mobile number must contain at least 10 digits.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        field: 'password',
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedLocation = {
      address: primaryLocation?.address || 'Mijar, Moodbidri, Karnataka - 574225',
      coordinates: {
        lat: Number(primaryLocation?.coordinates?.lat || primaryLocation?.lat || 13.0682),
        lng: Number(primaryLocation?.coordinates?.lng || primaryLocation?.lng || 74.9961)
      },
      village: primaryLocation?.village || 'Mijar',
      town: primaryLocation?.town || 'Moodbidri',
      district: primaryLocation?.district || 'Dakshina Kannada',
      pincode: primaryLocation?.pincode || '574225'
    };

    let newCustomer = null;

    // Check if live MongoDB is active
    if (mongoose.connection.readyState === 1) {
      // Check existing customer
      const existingQuery = [];
      if (email) existingQuery.push({ email: email.toLowerCase().trim() });
      if (phone) existingQuery.push({ phone: phone.trim() });

      const existing = await Customer.findOne({ $or: existingQuery });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email or phone number already exists.'
        });
      }

      newCustomer = await Customer.create({
        fullName: effectiveName.trim(),
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        passwordHash,
        primaryLocation: formattedLocation,
        preferredAreas: Array.isArray(preferredAreas) ? preferredAreas : ['Mijar', 'Moodbidri'],
        preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : ['Vegetables', 'Fruits', 'Dairy'],
        profileImage: profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        status: 'active',
        role: 'customer'
      });
    } else {
      // In-Memory store handling
      const existingCustomer = memoryStore.customers.find(c =>
        (email && c.email?.toLowerCase() === email.toLowerCase().trim()) ||
        (phone && c.phone && c.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10)))
      );

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email or phone number already exists.'
        });
      }

      const id = 'cust_' + Date.now();
      newCustomer = {
        id,
        _id: id,
        fullName: effectiveName.trim(),
        name: effectiveName.trim(),
        email: email ? email.toLowerCase().trim() : '',
        phone: phone ? phone.trim() : '',
        passwordHash,
        primaryLocation: formattedLocation,
        preferredAreas: Array.isArray(preferredAreas) ? preferredAreas : ['Mijar', 'Moodbidri'],
        preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : ['Vegetables', 'Fruits', 'Dairy'],
        profileImage: profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        status: 'active',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      memoryStore.customers.push(newCustomer);
    }

    // Generate JWT
    const tokenPayload = {
      id: newCustomer._id ? newCustomer._id.toString() : newCustomer.id,
      sub: newCustomer._id ? newCustomer._id.toString() : newCustomer.id,
      role: 'customer',
      email: newCustomer.email,
      phone: newCustomer.phone,
      name: newCustomer.fullName || newCustomer.name
    };

    const token = generateToken(tokenPayload);

    // Sanitize user output
    const userResponse = newCustomer.toJSON ? newCustomer.toJSON() : { ...newCustomer };
    delete userResponse.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      token,
      user: userResponse
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Customer registration failed: ' + error.message
    });
  }
};

/**
 * Register Vendor Endpoint
 * POST /api/auth/register/vendor
 */
export const registerVendor = async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      phone,
      password,
      businessName,
      vendorCategory,
      categories,
      operatingAreas,
      profileImage,
      vehicleDetails,
      status
    } = req.body;

    const effectiveName = fullName || name;
    if (!effectiveName || effectiveName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        field: 'fullName',
        message: 'Full Name is required (minimum 2 characters).'
      });
    }

    if (!businessName || businessName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        field: 'businessName',
        message: 'Business / Shop Name is required.'
      });
    }

    if (!vendorCategory) {
      return res.status(400).json({
        success: false,
        field: 'vendorCategory',
        message: 'Vendor category is required (e.g., Vegetable, Fruit, Flower, Ice-cream, Dairy, Snacks).'
      });
    }

    const areasList = Array.isArray(operatingAreas)
      ? operatingAreas
      : (typeof operatingAreas === 'string' && operatingAreas.trim() ? operatingAreas.split(',').map(s => s.trim()) : []);

    if (areasList.length === 0) {
      return res.status(400).json({
        success: false,
        field: 'operatingAreas',
        message: 'Please specify at least one operating area (supported locality).'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        field: 'identifier',
        message: 'Either email address or mobile phone number is required.'
      });
    }

    if (email && !validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please provide a valid email address.'
      });
    }

    if (phone && !validatePhoneFormat(phone)) {
      return res.status(400).json({
        success: false,
        field: 'phone',
        message: 'Mobile number must contain at least 10 digits.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        field: 'password',
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedVehicle = {
      vehicleType: vehicleDetails?.vehicleType || 'None',
      registrationNumber: vehicleDetails?.registrationNumber || ''
    };

    let newVendor = null;

    // Check if live MongoDB is active
    if (mongoose.connection.readyState === 1) {
      const existingQuery = [];
      if (email) existingQuery.push({ email: email.toLowerCase().trim() });
      if (phone) existingQuery.push({ phone: phone.trim() });

      const existing = await Vendor.findOne({ $or: existingQuery });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A vendor account with this email or phone number already exists.'
        });
      }

      newVendor = await Vendor.create({
        fullName: effectiveName.trim(),
        name: businessName.trim(),
        businessName: businessName.trim(),
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        passwordHash,
        vendorCategory: vendorCategory.trim(),
        categories: Array.isArray(categories) && categories.length > 0 ? categories : [vendorCategory.trim()],
        operatingAreas: areasList,
        profileImage: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        avatar: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        vehicleDetails: formattedVehicle,
        status: status || 'active', // 'pending_approval' or 'active'
        role: 'vendor'
      });
    } else {
      // In-Memory fallback
      const existingVendor = memoryStore.vendors.find(v =>
        (email && v.email?.toLowerCase() === email.toLowerCase().trim()) ||
        (phone && v.phone && v.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10)))
      );

      if (existingVendor) {
        return res.status(409).json({
          success: false,
          message: 'A vendor account with this email or phone number already exists.'
        });
      }

      const id = 'v_' + Date.now();
      newVendor = {
        id,
        _id: id,
        fullName: effectiveName.trim(),
        name: businessName.trim(),
        businessName: businessName.trim(),
        email: email ? email.toLowerCase().trim() : '',
        phone: phone ? phone.trim() : '',
        passwordHash,
        vendorCategory: vendorCategory.trim(),
        categories: Array.isArray(categories) && categories.length > 0 ? categories : [vendorCategory.trim()],
        operatingAreas: areasList,
        profileImage: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        avatar: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        vehicleDetails: formattedVehicle,
        status: status || 'active',
        role: 'vendor',
        locationName: areasList[0] || 'Moodbidri',
        address: `${businessName.trim()}, ${areasList[0] || 'Moodbidri'} - 574225`,
        rating: 4.8,
        reviewCount: 0,
        deliveryTime: '20–30 min delivery',
        isOpen: true,
        verified: true,
        createdAt: new Date().toISOString()
      };
      memoryStore.vendors.push(newVendor);
    }

    // Generate JWT
    const tokenPayload = {
      id: newVendor._id ? newVendor._id.toString() : newVendor.id,
      sub: newVendor._id ? newVendor._id.toString() : newVendor.id,
      role: 'vendor',
      email: newVendor.email,
      phone: newVendor.phone,
      name: newVendor.businessName || newVendor.fullName
    };

    const token = generateToken(tokenPayload);

    const userResponse = newVendor.toJSON ? newVendor.toJSON() : { ...newVendor };
    delete userResponse.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Vendor registered successfully.',
      token,
      user: userResponse
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Vendor registration failed: ' + error.message
    });
  }
};

/**
 * Universal Registration Endpoint
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  const role = (req.body.role || 'customer').toLowerCase();
  if (role === 'vendor') {
    return registerVendor(req, res);
  }
  return registerCustomer(req, res);
};

/**
 * Unified Login Endpoint
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { identifier, email, phone, password, role } = req.body;
    const searchIdentifier = (identifier || email || phone || '').trim();

    if (!searchIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number or email address is required.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    const cleanDigits = searchIdentifier.replace(/\D/g, '');
    const isEmail = searchIdentifier.includes('@');

    let matchedUser = null;
    let userRole = role ? role.toLowerCase() : null;

    // 1. Live MongoDB Query
    if (mongoose.connection.readyState === 1) {
      const orConditions = [];
      if (isEmail) {
        orConditions.push({ email: searchIdentifier.toLowerCase() });
      } else if (cleanDigits.length >= 10) {
        orConditions.push({ phone: { $regex: cleanDigits.slice(-10) } });
      } else {
        orConditions.push({ phone: searchIdentifier });
      }

      if (userRole === 'vendor') {
        matchedUser = await Vendor.findOne({ $or: orConditions });
      } else if (userRole === 'customer') {
        matchedUser = await Customer.findOne({ $or: orConditions });
      } else {
        // Try Vendor first if not specified, then Customer
        matchedUser = await Vendor.findOne({ $or: orConditions });
        if (!matchedUser) {
          matchedUser = await Customer.findOne({ $or: orConditions });
        }
      }
    }

    // 2. Fallback to in-memory store
    if (!matchedUser) {
      if (userRole === 'vendor') {
        matchedUser = memoryStore.findVendorByIdentifier(searchIdentifier);
      } else if (userRole === 'customer') {
        matchedUser = memoryStore.findCustomerByIdentifier(searchIdentifier);
      } else if (userRole === 'admin') {
        matchedUser = memoryStore.findAdminByIdentifier(searchIdentifier);
      } else {
        // Search all
        matchedUser =
          memoryStore.findVendorByIdentifier(searchIdentifier) ||
          memoryStore.findCustomerByIdentifier(searchIdentifier) ||
          memoryStore.findAdminByIdentifier(searchIdentifier);
      }
    }

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: 'Account not found with provided phone/email identifier.'
      });
    }

    // Verify Password using bcrypt
    let isMatch = false;
    if (matchedUser.comparePassword) {
      isMatch = await matchedUser.comparePassword(password);
    } else if (matchedUser.passwordHash) {
      isMatch = await bcrypt.compare(password, matchedUser.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Check Account Status
    if (matchedUser.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or blocked. Please contact support.'
      });
    }

    const resolvedRole = matchedUser.role || (matchedUser.businessName ? 'vendor' : 'customer');
    const userId = matchedUser._id ? matchedUser._id.toString() : matchedUser.id;

    // Issue JWT Token
    const token = generateToken({
      id: userId,
      sub: userId,
      role: resolvedRole,
      email: matchedUser.email || '',
      phone: matchedUser.phone || '',
      name: matchedUser.businessName || matchedUser.fullName || matchedUser.name
    });

    const userObj = matchedUser.toJSON ? matchedUser.toJSON() : { ...matchedUser };
    delete userObj.passwordHash;

    return res.status(200).json({
      success: true,
      message: `Signed in successfully as ${resolvedRole}.`,
      token,
      user: {
        ...userObj,
        role: resolvedRole,
        id: userId,
        _id: userId
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failure: ' + error.message
    });
  }
};

/**
 * Get Authenticated Profile
 * GET /api/auth/profile or GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || 'customer').toLowerCase();

    let userEntity = null;

    if (mongoose.connection.readyState === 1) {
      if (role === 'vendor') {
        userEntity = await Vendor.findById(userId);
      } else if (role === 'customer') {
        userEntity = await Customer.findById(userId);
      }
    }

    if (!userEntity) {
      userEntity = memoryStore.findById(userId);
    }

    if (!userEntity) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const userObj = userEntity.toJSON ? userEntity.toJSON() : { ...userEntity };
    delete userObj.passwordHash;

    return res.status(200).json({
      success: true,
      user: userObj
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile: ' + error.message
    });
  }
};

/**
 * Update Profile Details
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || 'customer').toLowerCase();
    const updates = req.body;

    let updatedEntity = null;

    if (mongoose.connection.readyState === 1) {
      if (role === 'vendor') {
        const allowedUpdates = {
          fullName: updates.fullName || updates.name,
          name: updates.businessName || updates.name,
          businessName: updates.businessName,
          email: updates.email,
          phone: updates.phone,
          vendorCategory: updates.vendorCategory,
          categories: updates.categories,
          operatingAreas: updates.operatingAreas,
          profileImage: updates.profileImage || updates.avatar,
          avatar: updates.profileImage || updates.avatar,
          vehicleDetails: updates.vehicleDetails,
          locationName: updates.locationName,
          address: updates.address,
          coordinates: updates.coordinates,
          deliveryTime: updates.deliveryTime
        };

        // Filter undefined fields
        Object.keys(allowedUpdates).forEach(k => allowedUpdates[k] === undefined && delete allowedUpdates[k]);

        updatedEntity = await Vendor.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true });
      } else {
        const allowedUpdates = {
          fullName: updates.fullName || updates.name,
          email: updates.email,
          phone: updates.phone,
          primaryLocation: updates.primaryLocation,
          preferredAreas: updates.preferredAreas,
          preferredCategories: updates.preferredCategories,
          profileImage: updates.profileImage
        };

        Object.keys(allowedUpdates).forEach(k => allowedUpdates[k] === undefined && delete allowedUpdates[k]);

        updatedEntity = await Customer.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true });
      }
    }

    // In-memory update
    if (!updatedEntity) {
      if (role === 'vendor') {
        const vendor = memoryStore.vendors.find(v => v.id === userId || v._id === userId);
        if (vendor) {
          if (updates.fullName) vendor.fullName = updates.fullName;
          if (updates.businessName) {
            vendor.businessName = updates.businessName;
            vendor.name = updates.businessName;
          }
          if (updates.email) vendor.email = updates.email;
          if (updates.phone) vendor.phone = updates.phone;
          if (updates.vendorCategory) vendor.vendorCategory = updates.vendorCategory;
          if (updates.categories) vendor.categories = updates.categories;
          if (updates.operatingAreas) vendor.operatingAreas = updates.operatingAreas;
          if (updates.profileImage) {
            vendor.profileImage = updates.profileImage;
            vendor.avatar = updates.profileImage;
          }
          if (updates.vehicleDetails) vendor.vehicleDetails = updates.vehicleDetails;
          if (updates.address) vendor.address = updates.address;
          if (updates.locationName) vendor.locationName = updates.locationName;
          if (updates.coordinates) vendor.coordinates = updates.coordinates;
          vendor.updatedAt = new Date().toISOString();
          updatedEntity = vendor;
        }
      } else {
        const customer = memoryStore.customers.find(c => c.id === userId || c._id === userId);
        if (customer) {
          if (updates.fullName) {
            customer.fullName = updates.fullName;
            customer.name = updates.fullName;
          }
          if (updates.email) customer.email = updates.email;
          if (updates.phone) customer.phone = updates.phone;
          if (updates.primaryLocation) customer.primaryLocation = { ...customer.primaryLocation, ...updates.primaryLocation };
          if (updates.preferredAreas) customer.preferredAreas = updates.preferredAreas;
          if (updates.preferredCategories) customer.preferredCategories = updates.preferredCategories;
          if (updates.profileImage) customer.profileImage = updates.profileImage;
          customer.updatedAt = new Date().toISOString();
          updatedEntity = customer;
        }
      }
    }

    if (!updatedEntity) {
      return res.status(404).json({
        success: false,
        message: 'Account not found to update.'
      });
    }

    const userObj = updatedEntity.toJSON ? updatedEntity.toJSON() : { ...updatedEntity };
    delete userObj.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userObj
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile: ' + error.message
    });
  }
};

/**
 * Dedicated Vendor Operating Areas Update
 * PUT /api/auth/profile/operating-areas
 */
export const updateOperatingAreas = async (req, res) => {
  try {
    const { operatingAreas } = req.body;
    if (!Array.isArray(operatingAreas) || operatingAreas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operating areas must be a non-empty array of localities.'
      });
    }

    const userId = req.user.id;
    let vendor = null;

    if (mongoose.connection.readyState === 1) {
      vendor = await Vendor.findByIdAndUpdate(userId, { $set: { operatingAreas } }, { new: true });
    }

    if (!vendor) {
      vendor = memoryStore.vendors.find(v => v.id === userId || v._id === userId);
      if (vendor) {
        vendor.operatingAreas = operatingAreas;
        vendor.updatedAt = new Date().toISOString();
      }
    }

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Operating areas updated successfully.',
      operatingAreas: vendor.operatingAreas
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dedicated Customer Saved Location Update
 * PUT /api/auth/profile/location
 */
export const updateCustomerLocation = async (req, res) => {
  try {
    const { primaryLocation, coordinates, address } = req.body;
    const userId = req.user.id;

    const newLocation = primaryLocation || {
      address: address || 'Mijar, Moodbidri',
      coordinates: coordinates || { lat: 13.0682, lng: 74.9961 }
    };

    let customer = null;

    if (mongoose.connection.readyState === 1) {
      customer = await Customer.findByIdAndUpdate(userId, { $set: { primaryLocation: newLocation } }, { new: true });
    }

    if (!customer) {
      customer = memoryStore.customers.find(c => c.id === userId || c._id === userId);
      if (customer) {
        customer.primaryLocation = newLocation;
        customer.updatedAt = new Date().toISOString();
      }
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully.',
      primaryLocation: customer.primaryLocation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Legacy OTP Endpoints (Preserved for compatibility)
 */
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile phone number is required' });
    }
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${phone.replace(/\D/g, '').slice(-10)}`,
      otp: '123456'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name, role = 'customer' } = req.body;
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Use demo code 123456' });
    }

    const cleanDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '9876543210';
    const userId = 'usr_otp_' + Date.now();

    const user = {
      id: userId,
      _id: userId,
      name: name || (role === 'vendor' ? 'Ramesh Gowda' : 'Bhavana Bai'),
      fullName: name || (role === 'vendor' ? 'Ramesh Gowda' : 'Bhavana Bai'),
      phone: `+91 ${cleanDigits}`,
      email: role === 'vendor' ? 'ramesh.kirana@gmail.com' : 'bhavana.bai@gmail.com',
      role,
      status: 'active'
    };

    const token = generateToken({
      id: userId,
      sub: userId,
      role,
      phone: user.phone,
      email: user.email,
      name: user.name
    });

    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
