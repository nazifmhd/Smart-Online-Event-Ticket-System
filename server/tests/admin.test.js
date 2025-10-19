const request = require('supertest');
const app = require('../index');
const { setupTestDB, cleanupTestDB, clearDatabase } = require('./setup');
const { 
  createTestUser, 
  createTestOrganizer, 
  createTestAdmin,
  createTestEvent,
  createTestPayment,
  createTestTicket,
  generateTestToken 
} = require('./helpers/testHelpers');

describe('Admin Routes', () => {
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

  describe('GET /api/admin/dashboard', () => {
    beforeEach(async () => {
      // Create test data for dashboard
      await createTestPayment({ status: 'completed' }, user._id, event._id);
      await createTestPayment({ status: 'completed' }, user._id, event._id);
    });

    it('should get dashboard data as admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.overview).toBeDefined();
      expect(response.body.overview.totalUsers).toBe(3); // user, organizer, admin
      expect(response.body.overview.totalEvents).toBe(1);
      expect(response.body.charts).toBeDefined();
      expect(response.body.recent).toBeDefined();
    });

    it('should get dashboard data with period filter', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard?period=7d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.overview.period).toBe('7d');
    });

    it('should not get dashboard data as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should not get dashboard data as organizer', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional test users
      await createTestUser({ email: 'user1@example.com', name: 'User One' });
      await createTestUser({ email: 'user2@example.com', name: 'User Two' });
    });

    it('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(5); // 3 original + 2 new
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(3); // Only users
      response.body.users.forEach(user => {
        expect(user.role).toBe('user');
      });
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=User One')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].name).toBe('User One');
    });

    it('should paginate users', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBe(2);
      expect(response.body.pagination.currentPage).toBe(1);
    });

    it('should not get users as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/admin/events', () => {
    beforeEach(async () => {
      // Create additional test events
      await createTestEvent({ title: 'Event 1', status: 'published' }, organizer._id);
      await createTestEvent({ title: 'Event 2', status: 'draft' }, organizer._id);
    });

    it('should get all events as admin', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.events.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter events by status', async () => {
      const response = await request(app)
        .get('/api/admin/events?status=published')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.events.length).toBe(2);
      response.body.events.forEach(event => {
        expect(event.status).toBe('published');
      });
    });

    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/api/admin/events?category=concert')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.events.length).toBe(3);
    });

    it('should not get events as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/admin/payments', () => {
    beforeEach(async () => {
      // Create test payments
      await createTestPayment({ status: 'completed' }, user._id, event._id);
      await createTestPayment({ status: 'failed' }, user._id, event._id);
    });

    it('should get all payments as admin', async () => {
      const response = await request(app)
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/admin/payments?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(1);
      expect(response.body.payments[0].status).toBe('completed');
    });

    it('should filter payments by method', async () => {
      const response = await request(app)
        .get('/api/admin/payments?method=credit_card')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.payments.length).toBe(2);
    });

    it('should not get payments as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    let targetUser;

    beforeEach(async () => {
      targetUser = await createTestUser({ email: 'target@example.com' });
    });

    it('should update user role as admin', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'organizer' })
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');
      expect(response.body.user.role).toBe('organizer');
    });

    it('should not update own role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${admin._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(400);

      expect(response.body.message).toBe('Cannot change your own role');
    });

    it('should validate role value', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not update role as regular user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'organizer' })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    let targetUser;

    beforeEach(async () => {
      targetUser = await createTestUser({ email: 'target@example.com' });
    });

    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should not delete own account', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe('Cannot delete your own account');
    });

    it('should not delete user with events', async () => {
      // Create an event for the target user (as organizer)
      const targetOrganizer = await createTestOrganizer({ email: 'organizer@example.com' });
      await createTestEvent({}, targetOrganizer._id);

      const response = await request(app)
        .delete(`/api/admin/users/${targetOrganizer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('Cannot delete user with existing events');
    });

    it('should not delete user as regular user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    beforeEach(async () => {
      // Create test payments with different dates
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await createTestPayment({ 
        status: 'completed',
        createdAt: pastDate 
      }, user._id, event._id);
      
      await createTestPayment({ 
        status: 'completed' 
      }, user._id, event._id);
    });

    it('should get revenue analytics as admin', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.revenueData).toBeDefined();
      expect(response.body.period).toBeDefined();
    });

    it('should get revenue analytics with date range', async () => {
      const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.startDate).toBe(startDate);
      expect(response.body.period.endDate).toBe(endDate);
    });

    it('should get revenue analytics with group by', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue?groupBy=month')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.groupBy).toBe('month');
    });

    it('should not get analytics as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });
});
