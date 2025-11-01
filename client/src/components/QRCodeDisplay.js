import React, { useState, useEffect } from 'react';
import { QrCode, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { ticketsAPI } from '../services/api';

const QRCodeDisplay = ({ 
  ticket, 
  isOpen, 
  onClose, 
  showDetails = true,
  size = 'large' 
}) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && ticket) {
      generateQRCode();
    }
  }, [isOpen, ticket]);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if QR code image is already available from the ticket
      if (ticket.qrCode?.image) {
        setQrCodeData({
          data: ticket.qrCode.data || `ticket:${ticket.ticketNumber}`,
          image: ticket.qrCode.image
        });
        setIsLoading(false);
        return;
      }

      // If QR code data exists but no image, fetch from API
      if (ticket.qrCode?.data && ticket._id) {
        // Try to fetch QR code from API if ticket ID is available
        try {
          const response = await ticketsAPI.getQRCode(ticket._id);
          setQrCodeData({
            data: response.data.data || ticket.qrCode.data,
            image: response.data.image || null
          });
        } catch (fetchError) {
          console.error('Failed to fetch QR code:', fetchError);
          // Fallback: use the data that exists
          setQrCodeData({
            data: ticket.qrCode.data || `ticket:${ticket.ticketNumber}`,
            image: null
          });
        }
      } else if (ticket.qrCode?.data) {
        // Has data but no image and no ID - just use data
        setQrCodeData({
          data: ticket.qrCode.data,
          image: null
        });
      } else {
        // No QR code data at all
        setQrCodeData({
          data: `ticket:${ticket.ticketNumber}`,
          image: null
        });
      }
    } catch (err) {
      console.error('QR code generation error:', err);
      setError('Failed to load QR code');
      setQrCodeData({
        data: `ticket:${ticket.ticketNumber}`,
        image: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTicket = async () => {
    try {
      // Create a canvas to generate the ticket PDF/image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 1200;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, canvas.width, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('EVENT TICKET', canvas.width / 2, 60);

      // Event Title
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      const eventTitle = ticket.event?.title || 'Event';
      ctx.fillText(eventTitle.length > 40 ? eventTitle.substring(0, 40) + '...' : eventTitle, canvas.width / 2, 180);

      // Ticket Details
      ctx.fillStyle = '#4b5563';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      let y = 250;

      // Ticket Number
      ctx.fillText(`Ticket #: ${ticket.ticketNumber}`, 40, y);
      y += 40;

      // Category
      ctx.fillText(`Category: ${ticket.pricingCategory?.name || 'General'}`, 40, y);
      y += 40;

      // Price
      ctx.fillText(`Price: LKR ${ticket.pricingCategory?.price?.toLocaleString() || '0'}`, 40, y);
      y += 60;

      // Date
      if (ticket.event?.date?.startDate) {
        const date = new Date(ticket.event.date.startDate);
        ctx.fillText(`Date: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, y);
        y += 40;
      }

      // Time
      if (ticket.event?.date?.time?.startTime) {
        ctx.fillText(`Time: ${ticket.event.date.time.startTime}`, 40, y);
        y += 40;
      }

      // Venue
      if (ticket.event?.location?.venue) {
        ctx.fillText(`Venue: ${ticket.event.location.venue}`, 40, y);
        y += 60;
      }

      // QR Code Image
      if (qrCodeData?.image) {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.onload = () => {
          const qrSize = 300;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = y + 50;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Footer
          ctx.fillStyle = '#9ca3af';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Present this ticket at the event entrance', canvas.width / 2, qrY + qrSize + 40);

          // Download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ticket-${ticket.ticketNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          });
        };
        qrImg.src = qrCodeData.image;
      } else {
        // No QR code, just download text ticket
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code not available', canvas.width / 2, y + 100);
        ctx.fillText('Present this ticket at the event entrance', canvas.width / 2, y + 140);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ticket-${ticket.ticketNumber}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: just download QR code if available
      if (qrCodeData?.image) {
        const link = document.createElement('a');
        link.href = qrCodeData.image;
        link.download = `ticket-${ticket.ticketNumber}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const downloadQRCode = () => {
    if (qrCodeData?.image) {
      const link = document.createElement('a');
      link.href = qrCodeData.image;
      link.download = `ticket-${ticket.ticketNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeData?.image) {
      try {
        const response = await fetch(qrCodeData.image);
        const blob = await response.blob();
        const file = new File([blob], `ticket-${ticket.ticketNumber}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `Ticket for ${ticket.event?.title}`,
          text: `My ticket for ${ticket.event?.title}`,
          files: [file]
        });
      } catch (err) {
        console.error('Share failed:', err);
        // Fallback to copy link
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData?.data || '');
      // Show success message
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-32 h-32';
      case 'medium':
        return 'w-48 h-48';
      case 'large':
        return 'w-64 h-64';
      default:
        return 'w-64 h-64';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Your QR Code
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* QR Code Display */}
          <div className="text-center mb-6">
            {isLoading ? (
              <div className={`${getSizeClasses()} bg-gray-100 rounded-lg flex items-center justify-center mx-auto`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className={`${getSizeClasses()} bg-red-100 rounded-lg flex items-center justify-center mx-auto`}>
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            ) : qrCodeData?.image ? (
              <div className="inline-block">
                <img
                  src={qrCodeData.image}
                  alt="QR Code"
                  className={`${getSizeClasses()} rounded-lg border-2 border-gray-200`}
                />
              </div>
            ) : (
              <div className={`${getSizeClasses()} bg-gray-100 rounded-lg flex items-center justify-center mx-auto`}>
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* QR Code Data */}
          {qrCodeData?.data && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">QR Code Data</h4>
              <p className="text-sm text-gray-600 break-all">
                {qrCodeData.data}
              </p>
            </div>
          )}

          {/* Ticket Details */}
          {showDetails && ticket && (
            <div className="space-y-4 mb-6">
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Ticket Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Number:</span>
                    <span className="font-medium">{ticket.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium">{ticket.event?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{ticket.pricingCategory?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">LKR {ticket.pricingCategory?.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : ticket.status === 'used'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">How to use your QR Code</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Show this QR code at the event entrance</li>
              <li>• Make sure your phone screen is bright</li>
              <li>• Hold your phone steady for scanning</li>
              <li>• Keep this QR code safe until the event</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={downloadTicket}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </button>
            {qrCodeData?.image && (
              <button
                onClick={downloadQRCode}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                QR Only
              </button>
            )}
            <button
              onClick={shareQRCode}
              disabled={!qrCodeData?.image}
              className="flex-1 btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full btn-primary mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
