import express from 'express';
import {
  createVendorProduct,
  getVendorProducts,
  getVendorProductById,
  updateVendorProduct,
  toggleProductAvailability,
  deleteVendorProduct
} from '../controllers/vendorProductController.js';
import { authenticate, isVendor } from '../middleware/authMiddleware.js';

const router = express.Router();

// All vendor product routes require authentication and vendor role
router.use(authenticate);
router.use(isVendor);

router.post('/', createVendorProduct);
router.get('/', getVendorProducts);
router.get('/:id', getVendorProductById);
router.put('/:id', updateVendorProduct);
router.patch('/:id/toggle-availability', toggleProductAvailability);
router.delete('/:id', deleteVendorProduct);

export default router;
