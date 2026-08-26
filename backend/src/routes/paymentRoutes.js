import express from 'express';
import { createPaymentIntent, verifyPayment, createCheckoutSession } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/verify-payment', verifyPayment);
router.post('/create-checkout-session', createCheckoutSession);

export default router;
