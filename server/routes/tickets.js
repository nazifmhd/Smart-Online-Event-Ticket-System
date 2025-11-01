const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/tickets/book
// @desc    Book tickets for an event
// @access  Private
router.post('/book', authenticate, [
  body('eventId').isMongoId().withMessage('Valid event ID is required'),
  body('tickets').isArray({ min: 1 }).withMessage('At least one ticket is required'),
  body('tickets.*.categoryName').notEmpty().withMessage('Category name is required'),
  body('tickets.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  body('billingAddress').isObject().withMessage('Billing address is required'),
  body('billingAddress.name').notEmpty().withMessage('Billing name is required'),
  body('billingAddress.email').isEmail().withMessage('Valid billing email is required'),
  body('billingAddress.phone').notEmpty().withMessage('Billing phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { eventId, tickets, billingAddress } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available for booking' });
    }

    // Check if event is in the future
    if (new Date(event.date.startDate) <= new Date()) {
      return res.status(400).json({ message: 'Event has already started or ended' });
    }

    // Validate ticket availability and calculate total
    let totalAmount = 0;
    const ticketRequests = [];

    for (const ticketRequest of tickets) {
      const category = event.pricing.categories.find(
        cat => cat.name === ticketRequest.categoryName
      );

      if (!category) {
        return res.status(400).json({ 
          message: `Pricing category '${ticketRequest.categoryName}' not found` 
        });
      }

      if (category.availableTickets < ticketRequest.quantity) {
        return res.status(400).json({ 
          message: `Only ${category.availableTickets} tickets available for ${ticketRequest.categoryName}` 
        });
      }

      const categoryTotal = category.price * ticketRequest.quantity;
      totalAmount += categoryTotal;

      ticketRequests.push({
        category,
        quantity: ticketRequest.quantity,
        amount: categoryTotal
      });
    }

    // Get payment method from request or use default
    const paymentMethodType = req.body.paymentMethod || 'cash_on_delivery';
    const validPaymentMethods = ['credit_card', 'debit_card', 'mobile_wallet', 'bank_transfer', 'cash_on_delivery'];
    const finalPaymentMethod = validPaymentMethods.includes(paymentMethodType) ? paymentMethodType : 'cash_on_delivery';

    // Generate payment ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const paymentId = `PAY-${timestamp}-${random}`.toUpperCase();

    // Create payment record
    // For cash_on_delivery, mark as completed (payment will be collected later)
    // For other methods, keep as pending until processed
    const paymentStatus = finalPaymentMethod === 'cash_on_delivery' ? 'completed' : 'pending';
    
    const payment = new Payment({
      user: req.user._id,
      event: eventId,
      paymentId: paymentId,
      amount: {
        total: totalAmount,
        subtotal: totalAmount,
        currency: 'LKR'
      },
      paymentMethod: {
        type: finalPaymentMethod,
        details: req.body.paymentDetails || {}
      },
      billingAddress,
      status: paymentStatus
    });

    await payment.save();

    // Create tickets
    const createdTickets = [];
    
    for (const ticketRequest of ticketRequests) {
      for (let i = 0; i < ticketRequest.quantity; i++) {
        // Generate unique ticket number
        const ticketTimestamp = Date.now().toString(36);
        const ticketRandom = Math.random().toString(36).substr(2, 5);
        const ticketIndex = i.toString().padStart(2, '0');
        const ticketNumber = `TKT-${ticketTimestamp}-${ticketRandom}-${ticketIndex}`.toUpperCase();

        const ticket = new Ticket({
          user: req.user._id,
          event: eventId,
          payment: payment._id,
          ticketNumber: ticketNumber,
          pricingCategory: {
            name: ticketRequest.category.name,
            price: ticketRequest.category.price
          },
          status: paymentStatus === 'completed' ? 'confirmed' : 'pending'
        });

        // Generate QR code data
        const qrData = ticket.generateQRData();
        ticket.qrCode.data = qrData;

        // Generate QR code image
        try {
          const qrImage = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          ticket.qrCode.image = qrImage;
        } catch (qrError) {
          console.error('QR code generation error:', qrError);
          return res.status(500).json({ message: 'Error generating QR code' });
        }

        await ticket.save();
        createdTickets.push(ticket);
      }
    }

    // Update event ticket availability
    for (const ticketRequest of ticketRequests) {
      const category = event.pricing.categories.find(
        cat => cat.name === ticketRequest.category.name
      );
      category.availableTickets -= ticketRequest.quantity;
    }

    await event.save();

    // Populate ticket details
    const populatedTickets = await Ticket.find({ _id: { $in: createdTickets.map(t => t._id) } })
      .populate('event', 'title date location')
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Tickets booked successfully',
      paymentId: payment.paymentId,
      tickets: populatedTickets,
      totalAmount
    });
  } catch (error) {
    console.error('Book tickets error:', error);
    res.status(500).json({ message: 'Server error while booking tickets' });
  }
});

// @route   GET /api/tickets/my-tickets
// @desc    Get user's tickets
// @access  Private
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tickets = await Ticket.find(filter)
      .populate('event', 'title date location images')
      .populate('payment', 'status amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTickets: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ message: 'Server error while fetching tickets' });
  }
});

// @route   GET /api/tickets/:id/qr-code
// @desc    Get ticket QR code
// @access  Private
router.get('/:id/qr-code', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin/organizer
    if (ticket.user.toString() !== req.user._id.toString() && 
        !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If QR code image doesn't exist, generate it
    if (!ticket.qrCode.image && ticket.qrCode.data) {
      try {
        const qrImage = await QRCode.toDataURL(ticket.qrCode.data, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        ticket.qrCode.image = qrImage;
        await ticket.save();
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
      }
    }

    res.json({
      data: ticket.qrCode.data,
      image: ticket.qrCode.image
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Server error while fetching QR code' });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('event', 'title date location images')
      .populate('user', 'name email')
      .populate('payment', 'status amount');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket or is admin/organizer
    if (ticket.user._id.toString() !== req.user._id.toString() && 
        !['admin', 'organizer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error while fetching ticket' });
  }
});

// @route   POST /api/tickets/:id/verify
// @desc    Verify ticket QR code
// @access  Private (Organizer/Admin)
router.post('/:id/verify', authenticate, authorize('organizer', 'admin'), [
  body('qrData').notEmpty().withMessage('QR data is required'),
  body('usedBy').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { qrData, usedBy } = req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId)
      .populate('event', 'title date')
      .populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify QR code
    const isValid = ticket.verifyQRCode(qrData);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid QR code' });
    }

    // Check if ticket is already used
    if (ticket.status === 'used') {
      return res.status(400).json({ 
        message: 'Ticket has already been used',
        usedAt: ticket.usedAt,
        usedBy: ticket.usedBy
      });
    }

    // Check if ticket is confirmed
    if (ticket.status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Ticket is not confirmed',
        status: ticket.status
      });
    }

    // Mark ticket as used
    await ticket.markAsUsed(usedBy);

    res.json({
      message: 'Ticket verified successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        event: ticket.event.title,
        user: ticket.user.name,
        usedAt: ticket.usedAt,
        usedBy: ticket.usedBy
      }
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({ message: 'Server error while verifying ticket' });
  }
});

// @route   POST /api/tickets/:id/cancel
// @desc    Cancel ticket
// @access  Private
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId)
      .populate('event', 'date')
      .populate('payment', 'status');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if ticket can be cancelled
    if (ticket.status === 'used') {
      return res.status(400).json({ message: 'Cannot cancel used ticket' });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ message: 'Ticket is already cancelled' });
    }

    // Check if event has started
    if (new Date(ticket.event.date.startDate) <= new Date()) {
      return res.status(400).json({ message: 'Cannot cancel ticket for event that has started' });
    }

    // Cancel ticket
    await ticket.cancel();

    // Update event ticket availability
    const event = await Event.findById(ticket.event._id);
    const category = event.pricing.categories.find(
      cat => cat.name === ticket.pricingCategory.name
    );
    if (category) {
      category.availableTickets += 1;
      await event.save();
    }

    res.json({ message: 'Ticket cancelled successfully' });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ message: 'Server error while cancelling ticket' });
  }
});

// @route   GET /api/tickets/event/:eventId
// @desc    Get tickets for a specific event (Organizer/Admin only)
// @access  Private (Organizer/Admin)
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { event: eventId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tickets = await Ticket.find(filter)
      .populate('user', 'name email phone')
      .populate('payment', 'status amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTickets: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({ message: 'Server error while fetching event tickets' });
  }
});

module.exports = router;
