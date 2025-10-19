const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/process
// @desc    Process payment for tickets
// @access  Private
router.post('/process', authenticate, [
  body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  body('paymentMethod').isObject().withMessage('Payment method is required'),
  body('paymentMethod.type').isIn(['credit_card', 'debit_card', 'mobile_wallet', 'bank_transfer', 'cash_on_delivery']).withMessage('Invalid payment method type'),
  body('paymentMethod.provider').optional().isIn(['stripe', 'payhere', 'dialog', 'mobitel', 'hutch', 'cod']).withMessage('Invalid payment provider')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { paymentId, paymentMethod } = req.body;

    // Get payment record
    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('event', 'title date')
      .populate('tickets');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment is still pending
    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Payment has already been processed',
        status: payment.status
      });
    }

    // Check if payment has expired
    if (payment.expiresAt && new Date() > payment.expiresAt) {
      return res.status(400).json({ message: 'Payment has expired' });
    }

    // Update payment method
    payment.paymentMethod = paymentMethod;
    payment.status = 'processing';

    let gatewayResponse = {};

    try {
      // Process payment based on method
      if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
        if (paymentMethod.provider === 'stripe') {
          gatewayResponse = await processStripePayment(payment);
        } else {
          // For other card processors, implement accordingly
          gatewayResponse = await processGenericCardPayment(payment, paymentMethod);
        }
      } else if (paymentMethod.type === 'mobile_wallet') {
        gatewayResponse = await processMobileWalletPayment(payment, paymentMethod);
      } else if (paymentMethod.type === 'bank_transfer') {
        gatewayResponse = await processBankTransferPayment(payment, paymentMethod);
      } else if (paymentMethod.type === 'cash_on_delivery') {
        gatewayResponse = await processCODPayment(payment);
      }

      // Update payment with gateway response
      payment.gatewayResponse = gatewayResponse;

      if (gatewayResponse.status === 'succeeded') {
        // Mark payment as completed
        await payment.markAsCompleted(gatewayResponse);
        
        // Confirm all tickets
        await Ticket.updateMany(
          { payment: payment._id },
          { status: 'confirmed' }
        );

        res.json({
          message: 'Payment processed successfully',
          payment: {
            paymentId: payment.paymentId,
            status: payment.status,
            amount: payment.amount.total,
            currency: payment.amount.currency,
            transactionId: gatewayResponse.transactionId
          }
        });
      } else {
        // Mark payment as failed
        await payment.markAsFailed(gatewayResponse);
        
        res.status(400).json({
          message: 'Payment failed',
          error: gatewayResponse.message || 'Payment processing failed'
        });
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      
      await payment.markAsFailed({
        message: paymentError.message,
        status: 'failed'
      });
      
      res.status(500).json({
        message: 'Payment processing failed',
        error: paymentError.message
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error while processing payment' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('event', 'title date location')
      .populate('tickets');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment or is admin/organizer
    if (payment.user._id.toString() !== req.user._id.toString() && 
        !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error while fetching payment' });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find(filter)
      .populate('event', 'title date location images')
      .populate('tickets', 'ticketNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPayments: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Process refund for payment
// @access  Private
router.post('/:id/refund', authenticate, [
  body('amount').isFloat({ min: 0 }).withMessage('Refund amount must be non-negative'),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { amount, reason = 'Customer request' } = req.body;
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('event', 'title date');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment or is admin/organizer
    if (payment.user._id.toString() !== req.user._id.toString() && 
        !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment is refundable
    if (!payment.isRefundable()) {
      return res.status(400).json({ 
        message: 'Payment is not refundable',
        reason: payment.status === 'refunded' ? 'Already refunded' :
                payment.status === 'failed' ? 'Payment failed' :
                'Event has already started'
      });
    }

    // Process refund
    await payment.processRefund(amount, reason);

    // If full refund, cancel all tickets
    if (amount >= payment.amount.total) {
      await Ticket.updateMany(
        { payment: payment._id },
        { status: 'cancelled' }
      );
    }

    res.json({
      message: 'Refund processed successfully',
      refund: {
        amount,
        reason,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ 
      message: 'Server error while processing refund',
      error: error.message
    });
  }
});

// @route   GET /api/payments/event/:eventId
// @desc    Get payments for a specific event (Organizer/Admin only)
// @access  Private (Organizer/Admin)
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { event: eventId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find(filter)
      .populate('user', 'name email phone')
      .populate('tickets', 'ticketNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPayments: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get event payments error:', error);
    res.status(500).json({ message: 'Server error while fetching event payments' });
  }
});

// Helper functions for different payment methods
async function processStripePayment(payment) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payment.amount.total * 100), // Convert to cents
      currency: payment.amount.currency.toLowerCase(),
      metadata: {
        paymentId: payment.paymentId,
        userId: payment.user._id.toString(),
        eventId: payment.event._id.toString()
      }
    });

    return {
      transactionId: paymentIntent.id,
      gatewayTransactionId: paymentIntent.id,
      gatewayStatus: paymentIntent.status,
      gatewayMessage: paymentIntent.status,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed'
    };
  } catch (error) {
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
}

async function processMobileWalletPayment(payment, paymentMethod) {
  // Implement mobile wallet payment logic
  // This would integrate with local mobile wallet providers like Dialog, Mobitel, etc.
  
  // For now, simulate a successful payment
  return {
    transactionId: `MW_${Date.now()}`,
    gatewayTransactionId: `MW_${Date.now()}`,
    gatewayStatus: 'completed',
    gatewayMessage: 'Mobile wallet payment successful',
    status: 'succeeded'
  };
}

async function processBankTransferPayment(payment, paymentMethod) {
  // Implement bank transfer payment logic
  // This would integrate with local banks
  
  // For now, simulate a successful payment
  return {
    transactionId: `BT_${Date.now()}`,
    gatewayTransactionId: `BT_${Date.now()}`,
    gatewayStatus: 'completed',
    gatewayMessage: 'Bank transfer payment successful',
    status: 'succeeded'
  };
}

async function processCODPayment(payment) {
  // Cash on delivery - mark as pending for manual confirmation
  return {
    transactionId: `COD_${Date.now()}`,
    gatewayTransactionId: `COD_${Date.now()}`,
    gatewayStatus: 'pending',
    gatewayMessage: 'Cash on delivery - pending confirmation',
    status: 'pending'
  };
}

async function processGenericCardPayment(payment, paymentMethod) {
  // Implement generic card payment logic
  // This would integrate with other card processors
  
  // For now, simulate a successful payment
  return {
    transactionId: `CARD_${Date.now()}`,
    gatewayTransactionId: `CARD_${Date.now()}`,
    gatewayStatus: 'completed',
    gatewayMessage: 'Card payment successful',
    status: 'succeeded'
  };
}

module.exports = router;
