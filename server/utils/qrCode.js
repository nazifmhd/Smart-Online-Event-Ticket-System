const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate QR code data for a ticket
const generateQRData = (ticket) => {
  const qrData = {
    ticketId: ticket._id,
    ticketNumber: ticket.ticketNumber,
    eventId: ticket.event._id,
    userId: ticket.user._id,
    timestamp: Date.now(),
    signature: generateSignature(ticket)
  };

  return JSON.stringify(qrData);
};

// Generate signature for QR code verification
const generateSignature = (ticket) => {
  const data = `${ticket._id}-${ticket.ticketNumber}-${ticket.event._id}-${ticket.user._id}`;
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(data)
    .digest('hex');
};

// Generate QR code image
const generateQRCode = async (ticket) => {
  try {
    const qrData = generateQRData(ticket);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Generate QR code as buffer for file storage
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      data: qrData,
      image: qrCodeBuffer,
      dataURL: qrCodeDataURL
    };
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify QR code signature
const verifyQRCode = (qrData, ticket) => {
  try {
    const parsedData = JSON.parse(qrData);
    const expectedSignature = generateSignature(ticket);
    
    return parsedData.signature === expectedSignature;
  } catch (error) {
    console.error('QR code verification error:', error);
    return false;
  }
};

// Generate QR code for multiple tickets
const generateMultipleQRCodes = async (tickets) => {
  try {
    const qrCodes = [];
    
    for (const ticket of tickets) {
      const qrCode = await generateQRCode(ticket);
      qrCodes.push({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        qrCode: qrCode.dataURL,
        data: qrCode.data
      });
    }
    
    return qrCodes;
  } catch (error) {
    console.error('Multiple QR code generation error:', error);
    throw new Error('Failed to generate QR codes');
  }
};

// Generate QR code with custom styling
const generateStyledQRCode = async (ticket, options = {}) => {
  try {
    const qrData = generateQRData(ticket);
    
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, qrOptions);
    
    return {
      data: qrData,
      image: qrCodeDataURL
    };
  } catch (error) {
    console.error('Styled QR code generation error:', error);
    throw new Error('Failed to generate styled QR code');
  }
};

// Generate QR code for event check-in
const generateEventQRCode = async (event) => {
  try {
    const eventQRData = {
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date.startDate,
      type: 'event_checkin',
      timestamp: Date.now()
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(eventQRData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      data: JSON.stringify(eventQRData),
      image: qrCodeDataURL
    };
  } catch (error) {
    console.error('Event QR code generation error:', error);
    throw new Error('Failed to generate event QR code');
  }
};

// Generate QR code for organizer dashboard
const generateOrganizerQRCode = async (organizer) => {
  try {
    const organizerQRData = {
      organizerId: organizer._id,
      organizerName: organizer.name,
      type: 'organizer_access',
      timestamp: Date.now()
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(organizerQRData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      data: JSON.stringify(organizerQRData),
      image: qrCodeDataURL
    };
  } catch (error) {
    console.error('Organizer QR code generation error:', error);
    throw new Error('Failed to generate organizer QR code');
  }
};

// Generate QR code with logo
const generateQRCodeWithLogo = async (ticket, logoPath) => {
  try {
    const qrData = generateQRData(ticket);
    
    // Generate QR code with logo
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Higher error correction for logo overlay
    });

    return {
      data: qrData,
      image: qrCodeDataURL
    };
  } catch (error) {
    console.error('QR code with logo generation error:', error);
    throw new Error('Failed to generate QR code with logo');
  }
};

// Generate QR code for ticket validation
const generateValidationQRCode = async (ticket, validationCode) => {
  try {
    const validationData = {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      validationCode: validationCode,
      timestamp: Date.now(),
      type: 'ticket_validation'
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(validationData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      data: JSON.stringify(validationData),
      image: qrCodeDataURL
    };
  } catch (error) {
    console.error('Validation QR code generation error:', error);
    throw new Error('Failed to generate validation QR code');
  }
};

module.exports = {
  generateQRData,
  generateQRCode,
  generateMultipleQRCodes,
  generateStyledQRCode,
  generateEventQRCode,
  generateOrganizerQRCode,
  generateQRCodeWithLogo,
  generateValidationQRCode,
  verifyQRCode,
  generateSignature
};
