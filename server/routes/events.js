const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const { authenticate, authorize, authorizeEventOrganizer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all published events with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['concert', 'sports', 'conference', 'workshop', 'exhibition', 'festival', 'other']),
  query('city').optional().trim(),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('priceMin').optional().isFloat({ min: 0 }).withMessage('Minimum price must be non-negative'),
  query('priceMax').optional().isFloat({ min: 0 }).withMessage('Maximum price must be non-negative'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      city,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      search,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { status: 'published' };

    if (category) filter.category = category;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (dateFrom || dateTo) {
      filter['date.startDate'] = {};
      if (dateFrom) filter['date.startDate'].$gte = new Date(dateFrom);
      if (dateTo) filter['date.startDate'].$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'date') {
      sort['date.startDate'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sort['pricing.categories.price'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'popularity') {
      sort['analytics.views'] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Event.countDocuments(filter);

    // Filter by price range if specified
    let filteredEvents = events;
    if (priceMin !== undefined || priceMax !== undefined) {
      filteredEvents = events.filter(event => {
        const prices = event.pricing.categories.map(cat => cat.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (priceMin !== undefined && minPrice < parseFloat(priceMin)) return false;
        if (priceMax !== undefined && maxPrice > parseFloat(priceMax)) return false;
        return true;
      });
    }

    res.json({
      events: filteredEvents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment view count
    await Event.findByIdAndUpdate(req.params.id, { $inc: { 'analytics.views': 1 } });

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Organizer/Admin)
router.post('/', authenticate, authorize('organizer', 'admin'), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').isIn(['concert', 'sports', 'conference', 'workshop', 'exhibition', 'festival', 'other']).withMessage('Invalid category'),
  body('date.startDate').isISO8601().withMessage('Invalid start date format'),
  body('date.endDate').isISO8601().withMessage('Invalid end date format'),
  body('location.venue').trim().notEmpty().withMessage('Venue is required'),
  body('location.address.city').trim().notEmpty().withMessage('City is required'),
  body('pricing.categories').isArray({ min: 1 }).withMessage('At least one pricing category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    // Validate date range
    if (new Date(eventData.date.startDate) >= new Date(eventData.date.endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate pricing categories
    for (const category of eventData.pricing.categories) {
      if (!category.name || !category.price || !category.totalTickets) {
        return res.status(400).json({ message: 'Each pricing category must have name, price, and total tickets' });
      }
      category.availableTickets = category.totalTickets;
    }

    const event = new Event(eventData);
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Event Organizer/Admin)
router.put('/:id', authenticate, authorizeEventOrganizer, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').optional().isIn(['concert', 'sports', 'conference', 'workshop', 'exhibition', 'festival', 'other']).withMessage('Invalid category'),
  body('date.startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('date.endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const eventId = req.params.id;
    const updateData = req.body;

    // Validate date range if dates are being updated
    if (updateData.date) {
      const startDate = new Date(updateData.date.startDate || req.event.date.startDate);
      const endDate = new Date(updateData.date.endDate || req.event.date.endDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error while updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Event Organizer/Admin)
router.delete('/:id', authenticate, authorizeEventOrganizer, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event has any tickets sold
    const Ticket = require('../models/Ticket');
    const ticketCount = await Ticket.countDocuments({ event: eventId, status: { $in: ['confirmed', 'used'] } });
    
    if (ticketCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete event with sold tickets. Consider cancelling instead.' 
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

// @route   GET /api/events/organizer/my-events
// @desc    Get events created by current organizer
// @access  Private (Organizer/Admin)
router.get('/organizer/my-events', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { organizer: req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error while fetching organizer events' });
  }
});

// @route   PUT /api/events/:id/status
// @desc    Update event status
// @access  Private (Event Organizer/Admin)
router.put('/:id/status', authenticate, authorizeEventOrganizer, [
  body('status').isIn(['draft', 'published', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { status } = req.body;
    const eventId = req.params.id;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    ).populate('organizer', 'name email');

    res.json({
      message: `Event ${status} successfully`,
      event
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error while updating event status' });
  }
});

module.exports = router;
