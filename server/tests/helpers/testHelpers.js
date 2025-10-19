const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Event = require('../../models/Event');
const Ticket = require('../../models/Ticket');
const Payment = require('../../models/Payment');

// Generate test JWT token
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

// Create test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Create test organizer
const createTestOrganizer = async (organizerData = {}) => {
  const defaultOrganizer = {
    name: 'Test Organizer',
    email: 'organizer@example.com',
    password: 'password123',
    role: 'organizer',
    isVerified: true
  };

  const organizer = new User({ ...defaultOrganizer, ...organizerData });
  await organizer.save();
  return organizer;
};

// Create test admin
const createTestAdmin = async (adminData = {}) => {
  const defaultAdmin = {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    isVerified: true
  };

  const admin = new User({ ...defaultAdmin, ...adminData });
  await admin.save();
  return admin;
};

// Create test event
const createTestEvent = async (eventData = {}, organizerId) => {
  const defaultEvent = {
    title: 'Test Event',
    description: 'This is a test event',
    category: 'concert',
    eventType: 'paid',
    date: {
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      time: {
        startTime: '19:00',
        endTime: '21:00'
      }
    },
    location: {
      venue: 'Test Venue',
      address: {
        street: '123 Test Street',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '10000',
        country: 'Sri Lanka'
      }
    },
    organizer: organizerId,
    pricing: {
      categories: [
        {
          name: 'Normal',
          price: 1000,
          totalTickets: 100,
          availableTickets: 100,
          description: 'General admission'
        },
        {
          name: 'VIP',
          price: 2500,
          totalTickets: 20,
          availableTickets: 20,
          description: 'VIP access'
        }
      ]
    },
    status: 'published'
  };

  const event = new Event({ ...defaultEvent, ...eventData });
  await event.save();
  return event;
};

// Create test ticket
const createTestTicket = async (ticketData = {}, userId, eventId, paymentId) => {
  const defaultTicket = {
    user: userId,
    event: eventId,
    payment: paymentId,
    pricingCategory: {
      name: 'Normal',
      price: 1000
    },
    qrCode: {
      data: 'test-qr-data',
      image: 'data:image/png;base64,test-image'
    },
    status: 'confirmed'
  };

  const ticket = new Ticket({ ...defaultTicket, ...ticketData });
  await ticket.save();
  return ticket;
};

// Create test payment
const createTestPayment = async (paymentData = {}, userId, eventId) => {
  const defaultPayment = {
    user: userId,
    event: eventId,
    amount: {
      total: 1000,
      subtotal: 1000,
      currency: 'LKR'
    },
    paymentMethod: {
      type: 'credit_card',
      provider: 'stripe'
    },
    status: 'completed',
    billingAddress: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '0712345678'
    }
  };

  const payment = new Payment({ ...defaultPayment, ...paymentData });
  await payment.save();
  return payment;
};

// Mock email functions
const mockEmailFunctions = () => {
  const originalSendVerificationEmail = require('../../utils/email').sendVerificationEmail;
  const originalSendPasswordResetEmail = require('../../utils/email').sendPasswordResetEmail;
  const originalSendTicketConfirmationEmail = require('../../utils/email').sendTicketConfirmationEmail;

  const mockSendVerificationEmail = jest.fn().mockResolvedValue({ success: true });
  const mockSendPasswordResetEmail = jest.fn().mockResolvedValue({ success: true });
  const mockSendTicketConfirmationEmail = jest.fn().mockResolvedValue({ success: true });

  jest.doMock('../../utils/email', () => ({
    sendVerificationEmail: mockSendVerificationEmail,
    sendPasswordResetEmail: mockSendPasswordResetEmail,
    sendTicketConfirmationEmail: mockSendTicketConfirmationEmail
  }));

  return {
    mockSendVerificationEmail,
    mockSendPasswordResetEmail,
    mockSendTicketConfirmationEmail,
    originalSendVerificationEmail,
    originalSendPasswordResetEmail,
    originalSendTicketConfirmationEmail
  };
};

// Test data factories
const testDataFactory = {
  user: createTestUser,
  organizer: createTestOrganizer,
  admin: createTestAdmin,
  event: createTestEvent,
  ticket: createTestTicket,
  payment: createTestPayment
};

module.exports = {
  generateTestToken,
  createTestUser,
  createTestOrganizer,
  createTestAdmin,
  createTestEvent,
  createTestTicket,
  createTestPayment,
  mockEmailFunctions,
  testDataFactory
};
