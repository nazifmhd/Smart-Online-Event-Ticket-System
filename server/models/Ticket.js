const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
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
  pricingCategory: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  seatInfo: {
    section: String,
    row: String,
    seatNumber: String,
    isAssigned: { type: Boolean, default: false }
  },
  qrCode: {
    data: {
      type: String,
      required: true,
      unique: true
    },
    image: String, // Base64 encoded QR code image
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'used', 'refunded'],
    default: 'pending'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  usedBy: {
    type: String, // Name of the person who used the ticket
    default: null
  },
  transferHistory: [{
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  metadata: {
    bookingSource: {
      type: String,
      default: 'web',
      enum: ['web', 'mobile', 'api']
    },
    userAgent: String,
    ipAddress: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for better performance (ticketNumber already has unique index)
ticketSchema.index({ user: 1, event: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ event: 1, status: 1 });

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.ticketNumber = `TKT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Method to generate QR code data
ticketSchema.methods.generateQRData = function() {
  const qrData = {
    ticketId: this._id,
    ticketNumber: this.ticketNumber,
    eventId: this.event,
    userId: this.user,
    timestamp: Date.now(),
    signature: this.generateSignature()
  };
  return JSON.stringify(qrData);
};

// Method to generate signature for QR code
ticketSchema.methods.generateSignature = function() {
  const crypto = require('crypto');
  const secret = process.env.JWT_SECRET || 'default-secret';
  const data = `${this._id}${this.ticketNumber}${this.user}${this.event}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Method to verify QR code
ticketSchema.methods.verifyQRCode = function(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    const expectedSignature = this.generateSignature();
    return parsed.signature === expectedSignature && 
           parsed.ticketId === this._id.toString() &&
           parsed.ticketNumber === this.ticketNumber;
  } catch (error) {
    return false;
  }
};

// Method to mark ticket as used
ticketSchema.methods.markAsUsed = function(usedBy = null) {
  this.status = 'used';
  this.usedAt = new Date();
  if (usedBy) {
    this.usedBy = usedBy;
  }
  return this.save();
};

// Method to cancel ticket
ticketSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Virtual for ticket validity
ticketSchema.virtual('isValid').get(function() {
  return this.status === 'confirmed' && !this.usedAt;
});

// Virtual for ticket age
ticketSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

module.exports = mongoose.model('Ticket', ticketSchema);
