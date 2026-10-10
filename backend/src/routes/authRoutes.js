import express from 'express';
import {
  registerCustomer,
  registerVendor,
  register,
  login,
  getProfile,
  updateProfile,
  updateOperatingAreas,
  updateCustomerLocation,
  sendOTP,
  verifyOTP
} from '../controllers/authController.js';
import { authenticate, isVendor, isCustomer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registration Routes
router.post('/register/customer', registerCustomer);
router.post('/register/vendor', registerVendor);
router.post('/register', register);

// Login Routes
router.post('/login', login);
router.post('/login/customer', login);
router.post('/login/vendor', login);

// Profile Management Routes (RBAC Protected)
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Specific sub-resource management routes
router.put('/profile/operating-areas', authenticate, isVendor, updateOperatingAreas);
router.put('/profile/location', authenticate, isCustomer, updateCustomerLocation);

// Mobile OTP Verification Routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

export default router;
