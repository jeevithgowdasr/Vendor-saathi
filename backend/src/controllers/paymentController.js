import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

const stripe = new Stripe(stripeSecretKey);

/**
 * @desc Create a real Stripe PaymentIntent
 * @route POST /api/payments/create-payment-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'inr', customerName, customerEmail, orderId, itemsSummary, vendorName, paymentMethodType = 'upi', vpa } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Stripe expects amounts in smallest unit (e.g., paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Create real Stripe PaymentIntent supporting UPI
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      description: `VendorSaathi Order UPI Payment: ${itemsSummary || 'Fresh Farm Produce'} from ${vendorName || 'Local Kirana'}`,
      payment_method_types: paymentMethodType === 'upi' ? ['upi'] : ['card', 'upi'],
      receipt_email: customerEmail || 'customer@vendorsaathi.com',
      metadata: {
        orderId: orderId || `VS_${Date.now()}`,
        customerName: customerName || 'Bhavana Bai',
        vendorName: vendorName || 'Ramesh Grocery',
        paymentType: 'UPI',
        vpa: vpa || 'vendorsaathi@okhdfcbank',
        platform: 'VendorSaathi Production Web Store'
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      publishableKey: stripePublishableKey
    });
  } catch (error) {
    console.error('Stripe createPaymentIntent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Stripe PaymentIntent'
    });
  }
};

/**
 * @desc Verify / Confirm status of a Stripe PaymentIntent
 * @route POST /api/payments/verify-payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'PaymentIntent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      charges: paymentIntent.charges?.data || []
    });
  } catch (error) {
    console.error('Stripe verifyPayment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve Stripe PaymentIntent'
    });
  }
};

/**
 * @desc Create Stripe Checkout Session
 * @route POST /api/payments/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, successUrl, cancelUrl, customerEmail, orderId } = req.body;

    const lineItems = (items || []).map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : []
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail || 'customer@vendorsaathi.com',
      success_url: successUrl || `http://localhost:5174/?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: cancelUrl || 'http://localhost:5174/',
      metadata: {
        orderId: orderId || `VS_${Date.now()}`
      }
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url
    });
  } catch (error) {
    console.error('Stripe createCheckoutSession error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Stripe Checkout Session'
    });
  }
};
