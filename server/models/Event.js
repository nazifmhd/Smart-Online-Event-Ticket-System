const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['concert', 'sports', 'conference', 'workshop', 'exhibition', 'festival', 'other']
  },
  eventType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'paid'
  },
  date: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    time: {
      startTime: String,
      endTime: String
    }
  },
  location: {
    venue: {
      type: String,
      required: [true, 'Venue is required']
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      zipCode: String,
      country: { type: String, default: 'Sri Lanka' }
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricing: {
    categories: [{
      name: {
        type: String,
        required: true,
        enum: ['VIP', 'Normal', 'Student', 'Early Bird', 'Group']
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      totalTickets: {
        type: Number,
        required: true,
        min: [1, 'Total tickets must be at least 1']
      },
      availableTickets: {
        type: Number,
        required: true
      },
      description: String
    }]
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  features: {
    hasSeating: { type: Boolean, default: false },
    seatingPlan: String, // Base64 encoded seating plan image
    hasParking: { type: Boolean, default: false },
    hasFood: { type: Boolean, default: false },
    isAccessible: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  tags: [String],
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    website: String
  },
  terms: {
    refundPolicy: String,
    ageRestriction: String,
    dressCode: String,
    otherTerms: String
  },
  analytics: {
    views: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ 'date.startDate': 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'location.city': 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  return this.date.endDate - this.date.startDate;
});

// Method to check if event is active
eventSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'published' && this.date.startDate > now;
};

// Method to check if event is sold out
eventSchema.methods.isSoldOut = function() {
  return this.pricing.categories.every(category => category.availableTickets === 0);
};

// Method to get total revenue
eventSchema.methods.getTotalRevenue = function() {
  return this.analytics.revenue;
};

module.exports = mongoose.model('Event', eventSchema);
