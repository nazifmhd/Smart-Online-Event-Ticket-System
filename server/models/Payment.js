const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  amount: {
    total: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'LKR',
      enum: ['LKR', 'USD', 'EUR']
    }
  },
  paymentMethod: {
    type: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'mobile_wallet', 'bank_transfer', 'cash_on_delivery']
    },
    provider: {
      type: String,
      enum: ['stripe', 'payhere', 'dialog', 'mobitel', 'hutch', 'cod']
    },
    details: {
      cardLast4: String,
      cardBrand: String,
      walletType: String,
      bankName: String,
      accountNumber: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  gatewayResponse: {
    transactionId: String,
    gatewayTransactionId: String,
    gatewayStatus: String,
    gatewayMessage: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: String,
    processedAt: {
      type: Date,
      default: Date.now
    },
    gatewayRefundId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  billingAddress: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'Sri Lanka' }
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    campaign: String,
    source: String
  },
  processedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
// paymentId already has unique index from schema definition
paymentSchema.index({ user: 1 });
paymentSchema.index({ event: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'gatewayResponse.transactionId': 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware to generate payment ID
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.paymentId = `PAY-${timestamp}-${random}`.toUpperCase();
  }
  
  // Set expiration time (24 hours from creation)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method to calculate total refunded amount
paymentSchema.methods.getTotalRefunded = function() {
  return this.refunds.reduce((total, refund) => {
    return total + (refund.status === 'completed' ? refund.amount : 0);
  }, 0);
};

// Method to check if payment is refundable
paymentSchema.methods.isRefundable = function() {
  const now = new Date();
  const eventDate = this.event.date?.startDate;
  
  // Can't refund if already refunded
  if (this.status === 'refunded') return false;
  
  // Can't refund if payment failed
  if (this.status === 'failed') return false;
  
  // Can't refund if event has already started
  if (eventDate && eventDate < now) return false;
  
  return this.status === 'completed';
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount, reason = 'Customer request') {
  if (!this.isRefundable()) {
    throw new Error('Payment is not refundable');
  }
  
  const totalRefunded = this.getTotalRefunded();
  const availableAmount = this.amount.total - totalRefunded;
  
  if (amount > availableAmount) {
    throw new Error('Refund amount exceeds available amount');
  }
  
  const refund = {
    amount,
    reason,
    status: 'pending'
  };
  
  this.refunds.push(refund);
  
  // Update payment status
  if (amount === availableAmount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function(gatewayResponse = {}) {
  this.status = 'completed';
  this.processedAt = new Date();
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayResponse };
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function(gatewayResponse = {}) {
  this.status = 'failed';
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayResponse };
  return this.save();
};

// Virtual for payment age
paymentSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for remaining refundable amount
paymentSchema.virtual('refundableAmount').get(function() {
  if (!this.isRefundable()) return 0;
  return this.amount.total - this.getTotalRefunded();
});

module.exports = mongoose.model('Payment', paymentSchema);
