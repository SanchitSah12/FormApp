const express = require('express');
const Stripe = require('stripe');
const Response = require('../models/Response');
const Template = require('../models/Template');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for Stripe
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { templateId, amount, currency = 'usd', responseId } = req.body;

    // Validate template and payment settings
    const template = await Template.findById(templateId);
    if (!template || !template.paymentSettings?.enabled) {
      return res.status(400).json({ error: 'Payment not enabled for this template' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        templateId,
        responseId: responseId || '',
        userId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Create payment intent for public forms
router.post('/create-payment-intent-public', async (req, res) => {
  try {
    const { shareToken, amount, currency = 'usd', responseId } = req.body;

    // Find template by share token
    const template = await Template.findOne({
      'sharingConfig.shareToken': shareToken,
      'sharingConfig.isPublic': true,
      isActive: true
    });

    if (!template || !template.paymentSettings?.enabled) {
      return res.status(400).json({ error: 'Payment not enabled for this form' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        templateId: template._id.toString(),
        responseId: responseId || '',
        shareToken,
        isPublic: 'true'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Public payment intent creation failed:', error);
    res.status(500).json({ error: 'Payment intent creation failed' });
  }
});

// Confirm payment and update response
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, responseId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Update response with payment information
    if (responseId) {
      const response = await Response.findById(responseId);
      if (response) {
        response.paymentInfo = {
          paymentIntentId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          paidAt: new Date(),
          receiptUrl: paymentIntent.charges.data[0]?.receipt_url
        };
        await response.save();
      }
    }

    res.json({
      success: true,
      paymentInfo: {
        paymentIntentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        receiptUrl: paymentIntent.charges.data[0]?.receipt_url
      }
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

// PayPal order creation
router.post('/create-paypal-order', async (req, res) => {
  try {
    const { templateId, amount, currency = 'USD' } = req.body;

    // Validate template
    const template = await Template.findById(templateId);
    if (!template || !template.paymentSettings?.enabled) {
      return res.status(400).json({ error: 'Payment not enabled for this template' });
    }

    // Create PayPal order (simplified - you'd use PayPal SDK)
    const order = {
      id: `paypal_${Date.now()}`,
      amount,
      currency,
      templateId,
      userId: req.user._id.toString(),
      status: 'created'
    };

    res.json({ orderId: order.id });
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    res.status(500).json({ error: 'PayPal order creation failed' });
  }
});

// Stripe webhook handler
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update response with payment confirmation
      if (paymentIntent.metadata.responseId) {
        const response = await Response.findById(paymentIntent.metadata.responseId);
        if (response) {
          response.paymentInfo = {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'succeeded',
            paidAt: new Date()
          };
          await response.save();
        }
      }
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Generate receipt/invoice
router.get('/receipt/:responseId', authenticateToken, async (req, res) => {
  try {
    const { responseId } = req.params;
    
    const response = await Response.findById(responseId)
      .populate('templateId', 'name description')
      .populate('userId', 'firstName lastName email');

    if (!response || !response.paymentInfo) {
      return res.status(404).json({ error: 'Payment receipt not found' });
    }

    // Generate PDF receipt (simplified)
    const receipt = {
      receiptId: response._id,
      templateName: response.templateId.name,
      customerName: response.userId ? `${response.userId.firstName} ${response.userId.lastName}` : 'Guest',
      customerEmail: response.userId?.email || response.submitterInfo?.email,
      amount: response.paymentInfo.amount,
      currency: response.paymentInfo.currency,
      paidAt: response.paymentInfo.paidAt,
      paymentMethod: 'Card',
      status: response.paymentInfo.status
    };

    res.json({ receipt });
  } catch (error) {
    console.error('Receipt generation failed:', error);
    res.status(500).json({ error: 'Receipt generation failed' });
  }
});

module.exports = router;