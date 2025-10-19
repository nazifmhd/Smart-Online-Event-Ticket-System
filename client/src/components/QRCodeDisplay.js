import React, { useState, useEffect } from 'react';
import { QrCode, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react';

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
      // In a real implementation, this would call the API to generate QR code
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQrCodeData({
        data: ticket.qrCode?.data || `ticket:${ticket.ticketNumber}`,
        image: ticket.qrCode?.image || null
      });
    } catch (err) {
      setError('Failed to generate QR code');
    } finally {
      setIsLoading(false);
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
              onClick={downloadQRCode}
              disabled={!qrCodeData?.image}
              className="flex-1 btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
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
