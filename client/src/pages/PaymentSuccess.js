import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, QrCode, Calendar, MapPin, Clock } from 'lucide-react';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const paymentData = location.state?.paymentData || {};
  const tickets = paymentData.tickets || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">
          Your tickets have been confirmed. You'll receive a confirmation email shortly.
        </p>
      </div>

      {/* Payment Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">{paymentData.transactionId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{paymentData.paymentMethod?.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-green-600">
                    LKR {paymentData.amount?.total?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Event Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{formatDate(paymentData.event?.date?.startDate)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{formatTime(paymentData.event?.date?.time?.startTime)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{paymentData.event?.location?.venue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets */}
      {tickets.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Your Tickets</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div key={ticket._id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Ticket #{ticket.ticketNumber}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {ticket.pricingCategory?.name} - LKR {ticket.pricingCategory?.price?.toLocaleString()}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmed
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button className="btn-secondary flex items-center text-sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR Code
                    </button>
                    <button className="btn-secondary flex items-center text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">What's Next?</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Check Your Email</h4>
                <p className="text-sm text-gray-600">
                  We've sent you a confirmation email with your ticket details and QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Save Your Tickets</h4>
                <p className="text-sm text-gray-600">
                  Download your tickets or save the QR codes to your phone for easy access at the event.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Arrive at the Event</h4>
                <p className="text-sm text-gray-600">
                  Show your QR code at the entrance for quick and easy entry to the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/my-tickets')}
          className="flex-1 btn-primary flex items-center justify-center"
        >
          <QrCode className="w-4 h-4 mr-2" />
          View My Tickets
        </button>
        <button
          onClick={() => navigate('/events')}
          className="flex-1 btn-secondary"
        >
          Browse More Events
        </button>
      </div>

      {/* Support Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600 mb-3">
          If you have any questions about your tickets or the event, please contact us.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Email:</span>
            <span className="text-gray-600 ml-2">support@smarteventtickets.com</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Phone:</span>
            <span className="text-gray-600 ml-2">+94 11 234 5678</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
