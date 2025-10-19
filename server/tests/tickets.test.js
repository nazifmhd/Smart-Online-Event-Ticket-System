const request = require('supertest');
const app = require('../index');
const { setupTestDB, cleanupTestDB, clearDatabase } = require('./setup');
const { 
  createTestUser, 
  createTestOrganizer, 
  createTestAdmin,
  createTestEvent,
  createTestTicket,
  createTestPayment,
  generateTestToken 
} = require('./helpers/testHelpers');

describe('Tickets Routes', () => {
  let user, organizer, admin, event, userToken, organizerToken, adminToken;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    user = await createTestUser();
    organizer = await createTestOrganizer();
    admin = await createTestAdmin();
    
    userToken = generateTestToken(user._id);
    organizerToken = generateTestToken(organizer._id);
    adminToken = generateTestToken(admin._id);

    event = await createTestEvent({ title: 'Test Event' }, organizer._id);
  });

  describe('POST /api/tickets/book', () => {
    it('should book tickets successfully', async () => {
      const bookingData = {
        eventId: event._id,
        tickets: [
          {
            categoryName: 'Normal',
            quantity: 2
          }
        ],
        billingAddress: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0712345678'
        }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.message).toBe('Tickets booked successfully');
      expect(response.body.tickets.length).toBe(2);
      expect(response.body.totalAmount).toBe(2000); // 2 * 1000
    });

    it('should book multiple ticket categories', async () => {
      const bookingData = {
        eventId: event._id,
        tickets: [
          {
            categoryName: 'Normal',
            quantity: 1
          },
          {
            categoryName: 'VIP',
            quantity: 1
          }
        ],
        billingAddress: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0712345678'
        }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.tickets.length).toBe(2);
      expect(response.body.totalAmount).toBe(3500); // 1000 + 2500
    });

    it('should not book tickets for non-existent event', async () => {
      const fakeEventId = '507f1f77bcf86cd799439011';
      const bookingData = {
        eventId: fakeEventId,
        tickets: [{ categoryName: 'Normal', quantity: 1 }],
        billingAddress: { name: 'John Doe', email: 'john@example.com', phone: '0712345678' }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(404);

      expect(response.body.message).toBe('Event not found');
    });

    it('should not book tickets for unpublished event', async () => {
      const draftEvent = await createTestEvent({ status: 'draft' }, organizer._id);
      const bookingData = {
        eventId: draftEvent._id,
        tickets: [{ categoryName: 'Normal', quantity: 1 }],
        billingAddress: { name: 'John Doe', email: 'john@example.com', phone: '0712345678' }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe('Event is not available for booking');
    });

    it('should not book tickets for past event', async () => {
      const pastEvent = await createTestEvent({
        date: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          endDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          time: { startTime: '19:00', endTime: '21:00' }
        }
      }, organizer._id);

      const bookingData = {
        eventId: pastEvent._id,
        tickets: [{ categoryName: 'Normal', quantity: 1 }],
        billingAddress: { name: 'John Doe', email: 'john@example.com', phone: '0712345678' }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe('Event has already started or ended');
    });

    it('should not book more tickets than available', async () => {
      const bookingData = {
        eventId: event._id,
        tickets: [{ categoryName: 'Normal', quantity: 101 }], // More than available
        billingAddress: { name: 'John Doe', email: 'john@example.com', phone: '0712345678' }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toContain('Only 100 tickets available');
    });

    it('should validate required fields', async () => {
      const bookingData = {
        eventId: '',
        tickets: [],
        billingAddress: {}
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const bookingData = {
        eventId: event._id,
        tickets: [{ categoryName: 'Normal', quantity: 1 }],
        billingAddress: { name: 'John Doe', email: 'john@example.com', phone: '0712345678' }
      };

      const response = await request(app)
        .post('/api/tickets/book')
        .send(bookingData)
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/tickets/my-tickets', () => {
    let ticket, payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
      ticket = await createTestTicket({}, user._id, event._id, payment._id);
    });

    it('should get user tickets', async () => {
      const response = await request(app)
        .get('/api/tickets/my-tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.tickets.length).toBe(1);
      expect(response.body.tickets[0]._id).toBe(ticket._id.toString());
    });

    it('should filter tickets by status', async () => {
      const response = await request(app)
        .get('/api/tickets/my-tickets?status=confirmed')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.tickets.length).toBe(1);
    });

    it('should paginate tickets', async () => {
      const response = await request(app)
        .get('/api/tickets/my-tickets?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tickets/my-tickets')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/tickets/:id', () => {
    let ticket, payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
      ticket = await createTestTicket({}, user._id, event._id, payment._id);
    });

    it('should get ticket details as owner', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.ticket._id).toBe(ticket._id.toString());
    });

    it('should get ticket details as organizer', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.ticket._id).toBe(ticket._id.toString());
    });

    it('should get ticket details as admin', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.ticket._id).toBe(ticket._id.toString());
    });

    it('should return 404 for non-existent ticket', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tickets/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe('Ticket not found');
    });
  });

  describe('POST /api/tickets/:id/verify', () => {
    let ticket, payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
      ticket = await createTestTicket({}, user._id, event._id, payment._id);
    });

    it('should verify ticket as organizer', async () => {
      const qrData = JSON.stringify({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: event._id,
        userId: user._id,
        timestamp: Date.now(),
        signature: 'valid-signature'
      });

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/verify`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ qrData, usedBy: 'Gate Staff' })
        .expect(200);

      expect(response.body.message).toBe('Ticket verified successfully');
    });

    it('should verify ticket as admin', async () => {
      const qrData = JSON.stringify({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: event._id,
        userId: user._id,
        timestamp: Date.now(),
        signature: 'valid-signature'
      });

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrData })
        .expect(200);

      expect(response.body.message).toBe('Ticket verified successfully');
    });

    it('should not verify ticket as regular user', async () => {
      const qrData = JSON.stringify({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: event._id,
        userId: user._id,
        timestamp: Date.now(),
        signature: 'valid-signature'
      });

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/verify`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ qrData })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should not verify invalid QR code', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/verify`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ qrData: 'invalid-qr-data' })
        .expect(400);

      expect(response.body.message).toBe('Invalid QR code');
    });

    it('should not verify already used ticket', async () => {
      ticket.status = 'used';
      ticket.usedAt = new Date();
      await ticket.save();

      const qrData = JSON.stringify({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        eventId: event._id,
        userId: user._id,
        timestamp: Date.now(),
        signature: 'valid-signature'
      });

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/verify`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ qrData })
        .expect(400);

      expect(response.body.message).toBe('Ticket has already been used');
    });
  });

  describe('POST /api/tickets/:id/cancel', () => {
    let ticket, payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
      ticket = await createTestTicket({}, user._id, event._id, payment._id);
    });

    it('should cancel ticket as owner', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Ticket cancelled successfully');
    });

    it('should not cancel ticket as different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherToken = generateTestToken(otherUser._id);

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    it('should not cancel used ticket', async () => {
      ticket.status = 'used';
      await ticket.save();

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toBe('Cannot cancel used ticket');
    });

    it('should not cancel already cancelled ticket', async () => {
      ticket.status = 'cancelled';
      await ticket.save();

      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toBe('Ticket is already cancelled');
    });
  });

  describe('GET /api/tickets/event/:eventId', () => {
    let ticket, payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
      ticket = await createTestTicket({}, user._id, event._id, payment._id);
    });

    it('should get event tickets as organizer', async () => {
      const response = await request(app)
        .get(`/api/tickets/event/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.tickets.length).toBe(1);
      expect(response.body.tickets[0].event._id).toBe(event._id.toString());
    });

    it('should get event tickets as admin', async () => {
      const response = await request(app)
        .get(`/api/tickets/event/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets.length).toBe(1);
    });

    it('should filter tickets by status', async () => {
      const response = await request(app)
        .get(`/api/tickets/event/${event._id}?status=confirmed`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.tickets.length).toBe(1);
    });

    it('should not get event tickets as regular user', async () => {
      const response = await request(app)
        .get(`/api/tickets/event/${event._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });
});
