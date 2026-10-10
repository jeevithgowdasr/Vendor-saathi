import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Vendor } from '../models/Vendor.js';
import { memoryStore } from '../store/memoryStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vendorsaathi_jwt_super_secure_secret_key_2026_production';

/**
 * Authentication Middleware:
 * Validates JWT Bearer token and attaches authenticated user payload to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format. Please provide a Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (tokenErr) {
      if (tokenErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid session token signature.'
      });
    }

    const userId = decoded.id || decoded.sub;
    const role = (decoded.role || 'customer').toLowerCase();

    let userEntity = null;

    // Check if live MongoDB is active
    if (mongoose.connection.readyState === 1) {
      if (role === 'vendor') {
        userEntity = await Vendor.findById(userId);
      } else if (role === 'customer') {
        userEntity = await Customer.findById(userId);
      }
    }

    // Fallback to in-memory store
    if (!userEntity) {
      userEntity = memoryStore.findById(userId);
    }

    if (!userEntity) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user account was not found.'
      });
    }

    // Check if account status is blocked
    if (userEntity.status === 'blocked') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        message: 'Your account has been deactivated or blocked. Please contact support.'
      });
    }

    // Attach user payload
    req.user = {
      id: userEntity._id ? userEntity._id.toString() : userEntity.id,
      _id: userEntity._id ? userEntity._id.toString() : userEntity.id,
      role: userEntity.role || role,
      email: userEntity.email || '',
      phone: userEntity.phone || '',
      fullName: userEntity.fullName || userEntity.name || '',
      name: userEntity.name || userEntity.fullName || '',
      businessName: userEntity.businessName || '',
      status: userEntity.status || 'active',
      profileImage: userEntity.profileImage || userEntity.avatar || ''
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication verification failure: ' + error.message
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard:
 * Ensures the authenticated user possesses one of the required roles.
 */
export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated. Please log in first.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();

    // Admins have universal clearance
    if (userRole === 'admin') {
      return next();
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}], but current role is [${req.user.role}].`
      });
    }

    next();
  };
};

// Convenient Role Middleware Aliases
export const isVendor = authorizeRoles('vendor');
export const isCustomer = authorizeRoles('customer');
export const isAdmin = authorizeRoles('admin');
export const isVendorOrAdmin = authorizeRoles('vendor', 'admin');

// Backward compatibility alias for existing code
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = { id: 'usr_guest', name: 'Bhavana Bai', role: 'customer' };
    return next();
  }
  return authenticate(req, res, next);
};

export default {
  authenticate,
  authorizeRoles,
  isVendor,
  isCustomer,
  isAdmin,
  authMiddleware
};
