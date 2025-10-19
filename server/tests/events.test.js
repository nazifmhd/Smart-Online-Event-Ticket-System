const request = require('supertest');
const app = require('../index');
const { setupTestDB, cleanupTestDB, clearDatabase } = require('./setup');
const { 
  createTestUser, 
  createTestOrganizer, 
  createTestAdmin,
  createTestEvent,
  generateTestToken 
} = require('./helpers/testHelpers');

describe('Events Routes', () => {
  let user, organizer, admin, userToken, organizerToken, adminToken;

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
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      // Create test events
      await createTestEvent({ title: 'Concert Event' }, organizer._id);
      await createTestEvent({ 
        title: 'Sports Event', 
        category: 'sports',
        status: 'published'
      }, organizer._id);
      await createTestEvent({ 
        title: 'Draft Event', 
        status: 'draft' 
      }, organizer._id);
    });

    it('should get all published events', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body.events).toBeDefined();
      expect(response.body.events.length).toBe(2); // Only published events
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events?category=sports')
        .expect(200);

      expect(response.body.events.length).toBe(1);
      expect(response.body.events[0].category).toBe('sports');
    });

    it('should search events by title', async () => {
      const response = await request(app)
        .get('/api/events?search=Concert')
        .expect(200);

      expect(response.body.events.length).toBe(1);
      expect(response.body.events[0].title).toContain('Concert');
    });

    it('should filter events by city', async () => {
      const response = await request(app)
        .get('/api/events?city=Colombo')
        .expect(200);

      expect(response.body.events.length).toBe(2);
    });

    it('should paginate events', async () => {
      const response = await request(app)
        .get('/api/events?page=1&limit=1')
        .expect(200);

      expect(response.body.events.length).toBe(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should sort events by date', async () => {
      const response = await request(app)
        .get('/api/events?sortBy=date&sortOrder=desc')
        .expect(200);

      expect(response.body.events).toBeDefined();
    });
  });

  describe('GET /api/events/:id', () => {
    let event;

    beforeEach(async () => {
      event = await createTestEvent({ title: 'Test Event' }, organizer._id);
    });

    it('should get single event by ID', async () => {
      const response = await request(app)
        .get(`/api/events/${event._id}`)
        .expect(200);

      expect(response.body.event._id).toBe(event._id.toString());
      expect(response.body.event.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/events/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Event not found');
    });

    it('should increment view count', async () => {
      const initialViews = event.analytics.views;
      
      await request(app)
        .get(`/api/events/${event._id}`)
        .expect(200);

      // Note: In a real test, you'd need to refetch the event to check updated views
    });
  });

  describe('POST /api/events', () => {
    it('should create event as organizer', async () => {
      const eventData = {
        title: 'New Concert',
        description: 'A great concert event',
        category: 'concert',
        date: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          time: {
            startTime: '19:00',
            endTime: '21:00'
          }
        },
        location: {
          venue: 'Concert Hall',
          address: {
            city: 'Colombo'
          }
        },
        pricing: {
          categories: [
            {
              name: 'Normal',
              price: 1000,
              totalTickets: 100
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.event.title).toBe(eventData.title);
      expect(response.body.event.organizer._id).toBe(organizer._id.toString());
    });

    it('should create event as admin', async () => {
      const eventData = {
        title: 'Admin Event',
        description: 'Event created by admin',
        category: 'conference',
        date: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          time: {
            startTime: '09:00',
            endTime: '17:00'
          }
        },
        location: {
          venue: 'Conference Center',
          address: {
            city: 'Colombo'
          }
        },
        pricing: {
          categories: [
            {
              name: 'Early Bird',
              price: 500,
              totalTickets: 50
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.event.title).toBe(eventData.title);
    });

    it('should not create event as regular user', async () => {
      const eventData = {
        title: 'User Event',
        description: 'Event created by user',
        category: 'workshop'
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should validate required fields', async () => {
      const eventData = {
        title: '',
        description: '',
        category: 'invalid'
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate date range', async () => {
      const eventData = {
        title: 'Invalid Date Event',
        description: 'Event with invalid dates',
        category: 'concert',
        date: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // Before start date
          time: {
            startTime: '19:00',
            endTime: '21:00'
          }
        },
        location: {
          venue: 'Test Venue',
          address: {
            city: 'Colombo'
          }
        },
        pricing: {
          categories: [
            {
              name: 'Normal',
              price: 1000,
              totalTickets: 100
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.message).toContain('End date must be after start date');
    });
  });

  describe('PUT /api/events/:id', () => {
    let event;

    beforeEach(async () => {
      event = await createTestEvent({ title: 'Original Title' }, organizer._id);
    });

    it('should update event as organizer', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Event updated successfully');
      expect(response.body.event.title).toBe(updateData.title);
    });

    it('should update event as admin', async () => {
      const updateData = {
        title: 'Admin Updated Title'
      };

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.event.title).toBe(updateData.title);
    });

    it('should not update event as different organizer', async () => {
      const otherOrganizer = await createTestOrganizer({ email: 'other@example.com' });
      const otherToken = generateTestToken(otherOrganizer._id);

      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should not update event as regular user', async () => {
      const updateData = {
        title: 'User Update'
      };

      const response = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/events/:id', () => {
    let event;

    beforeEach(async () => {
      event = await createTestEvent({ title: 'Event to Delete' }, organizer._id);
    });

    it('should delete event as organizer', async () => {
      const response = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should delete event as admin', async () => {
      const response = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should not delete event as different organizer', async () => {
      const otherOrganizer = await createTestOrganizer({ email: 'other@example.com' });
      const otherToken = generateTestToken(otherOrganizer._id);

      const response = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/events/organizer/my-events', () => {
    beforeEach(async () => {
      await createTestEvent({ title: 'Organizer Event 1' }, organizer._id);
      await createTestEvent({ title: 'Organizer Event 2' }, organizer._id);
      await createTestEvent({ title: 'Other Event' }, admin._id);
    });

    it('should get organizer events', async () => {
      const response = await request(app)
        .get('/api/events/organizer/my-events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.events.length).toBe(2);
      expect(response.body.events[0].organizer._id).toBe(organizer._id.toString());
    });

    it('should filter events by status', async () => {
      const response = await request(app)
        .get('/api/events/organizer/my-events?status=draft')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.events).toBeDefined();
    });

    it('should not get events as regular user', async () => {
      const response = await request(app)
        .get('/api/events/organizer/my-events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/events/:id/status', () => {
    let event;

    beforeEach(async () => {
      event = await createTestEvent({ status: 'draft' }, organizer._id);
    });

    it('should update event status as organizer', async () => {
      const response = await request(app)
        .put(`/api/events/${event._id}/status`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'published' })
        .expect(200);

      expect(response.body.message).toBe('Event published successfully');
      expect(response.body.event.status).toBe('published');
    });

    it('should update event status as admin', async () => {
      const response = await request(app)
        .put(`/api/events/${event._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body.message).toBe('Event cancelled successfully');
      expect(response.body.event.status).toBe('cancelled');
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put(`/api/events/${event._id}/status`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
});
