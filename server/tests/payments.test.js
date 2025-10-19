const request = require('supertest');
const app = require('../index');
const { setupTestDB, cleanupTestDB, clearDatabase } = require('./setup');
const { 
  createTestUser, 
  createTestOrganizer, 
  createTestAdmin,
  createTestEvent,
  createTestPayment,
  generateTestToken 
} = require('./helpers/testHelpers');

describe('Payments Routes', () => {
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

  describe('POST /api/payments/process', () => {
    let payment;

    beforeEach(async () => {
      payment = await createTestPayment({ status: 'pending' }, user._id, event._id);
    });

    it('should process payment with credit card', async () => {
      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'credit_card',
          provider: 'stripe',
          details: {
            cardLast4: '4242',
            cardBrand: 'visa'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.message).toBe('Payment processed successfully');
      expect(response.body.payment.status).toBe('completed');
    });

    it('should process payment with mobile wallet', async () => {
      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'mobile_wallet',
          provider: 'dialog',
          details: {
            walletType: 'dialog'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.message).toBe('Payment processed successfully');
    });

    it('should process cash on delivery payment', async () => {
      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'cash_on_delivery',
          provider: 'cod'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.message).toBe('Payment processed successfully');
    });

    it('should not process payment for non-existent payment', async () => {
      const fakePaymentId = '507f1f77bcf86cd799439011';
      const paymentData = {
        paymentId: fakePaymentId,
        paymentMethod: {
          type: 'credit_card',
          provider: 'stripe'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(404);

      expect(response.body.message).toBe('Payment not found');
    });

    it('should not process payment for different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherUserToken = generateTestToken(otherUser._id);

      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'credit_card',
          provider: 'stripe'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    it('should not process already processed payment', async () => {
      payment.status = 'completed';
      await payment.save();

      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'credit_card',
          provider: 'stripe'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.message).toBe('Payment has already been processed');
    });

    it('should validate required fields', async () => {
      const paymentData = {
        paymentId: '',
        paymentMethod: {}
      };

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const paymentData = {
        paymentId: payment._id,
        paymentMethod: {
          type: 'credit_card',
          provider: 'stripe'
        }
      };

      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/payments/:id', () => {
    let payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
    });

    it('should get payment details as owner', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payment._id).toBe(payment._id.toString());
    });

    it('should get payment details as organizer', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.payment._id).toBe(payment._id.toString());
    });

    it('should get payment details as admin', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.payment._id).toBe(payment._id.toString());
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toBe('Payment not found');
    });

    it('should not get payment as different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherUserToken = generateTestToken(otherUser._id);

      const response = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/payments/my-payments', () => {
    beforeEach(async () => {
      await createTestPayment({}, user._id, event._id);
      await createTestPayment({ status: 'failed' }, user._id, event._id);
    });

    it('should get user payments', async () => {
      const response = await request(app)
        .get('/api/payments/my-payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(2);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/payments/my-payments?status=completed')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(1);
    });

    it('should paginate payments', async () => {
      const response = await request(app)
        .get('/api/payments/my-payments?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/payments/my-payments')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    let payment;

    beforeEach(async () => {
      payment = await createTestPayment({ status: 'completed' }, user._id, event._id);
    });

    it('should process refund as owner', async () => {
      const refundData = {
        amount: 500,
        reason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.message).toBe('Refund processed successfully');
    });

    it('should process refund as admin', async () => {
      const refundData = {
        amount: 1000,
        reason: 'Admin decision'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.message).toBe('Refund processed successfully');
    });

    it('should not process refund for different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherUserToken = generateTestToken(otherUser._id);

      const refundData = {
        amount: 500,
        reason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(refundData)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    it('should not refund more than available amount', async () => {
      const refundData = {
        amount: 2000, // More than payment amount
        reason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.error).toContain('Refund amount exceeds available amount');
    });

    it('should not refund failed payment', async () => {
      payment.status = 'failed';
      await payment.save();

      const refundData = {
        amount: 500,
        reason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.message).toContain('Payment is not refundable');
    });

    it('should validate refund amount', async () => {
      const refundData = {
        amount: -100, // Negative amount
        reason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/payments/event/:eventId', () => {
    let payment;

    beforeEach(async () => {
      payment = await createTestPayment({}, user._id, event._id);
    });

    it('should get event payments as organizer', async () => {
      const response = await request(app)
        .get(`/api/payments/event/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(1);
      expect(response.body.payments[0].event._id).toBe(event._id.toString());
    });

    it('should get event payments as admin', async () => {
      const response = await request(app)
        .get(`/api/payments/event/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(1);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get(`/api/payments/event/${event._id}?status=completed`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(1);
    });

    it('should not get event payments as regular user', async () => {
      const response = await request(app)
        .get(`/api/payments/event/${event._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });
});
