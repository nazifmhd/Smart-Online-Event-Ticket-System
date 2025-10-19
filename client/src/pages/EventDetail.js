import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventsAPI, ticketsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  DollarSign, 
  Ticket, 
  Share2, 
  Heart,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: eventData, isLoading, error } = useQuery(
    ['event', id],
    () => eventsAPI.getEvent(id),
    {
      select: (data) => data.data.event,
      enabled: !!id
    }
  );

  const bookTicketsMutation = useMutation(ticketsAPI.bookTickets, {
    onSuccess: (data) => {
      toast.success('Tickets booked successfully!');
      queryClient.invalidateQueries('my-tickets');
      navigate('/my-tickets');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book tickets');
    }
  });

  const handleBookTickets = () => {
    if (!isAuthenticated()) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    if (!selectedCategory) {
      toast.error('Please select a ticket category');
      return;
    }

    if (quantity < 1) {
      toast.error('Please select at least 1 ticket');
      return;
    }

    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (billingData) => {
    try {
      await bookTicketsMutation.mutateAsync({
        eventId: id,
        tickets: [{
          categoryName: selectedCategory,
          quantity: quantity
        }],
        billingAddress: billingData
      });
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

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

  const getTotalPrice = () => {
    if (!selectedCategory || !eventData) return 0;
    const category = eventData.pricing.categories.find(cat => cat.name === selectedCategory);
    return category ? category.price * quantity : 0;
  };

  const isEventActive = () => {
    if (!eventData) return false;
    return eventData.status === 'published' && new Date(eventData.date.startDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
            </div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-600 mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/events')}
          className="btn-primary"
        >
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </button>

      {/* Event Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {eventData.category}
            </span>
            {eventData.status === 'published' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Live
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">{eventData.title}</h1>
        
        <div className="flex items-center space-x-6 text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {formatDate(eventData.date.startDate)}
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            {formatTime(eventData.date.time.startTime)}
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {eventData.location.venue}
          </div>
        </div>
      </div>

      {/* Event Image */}
      <div className="aspect-w-16 aspect-h-9">
        {eventData.images?.[0] ? (
          <img
            src={eventData.images[0].url}
            alt={eventData.title}
            className="w-full h-96 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-96 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center rounded-lg">
            <Calendar className="w-24 h-24 text-white" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-gray-900">About This Event</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-700 leading-relaxed">{eventData.description}</p>
            </div>
          </div>

          {/* Event Features */}
          {eventData.features && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-gray-900">Event Features</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {eventData.features.hasSeating && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Assigned Seating</span>
                    </div>
                  )}
                  {eventData.features.hasParking && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Parking Available</span>
                    </div>
                  )}
                  {eventData.features.hasFood && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Food & Beverages</span>
                    </div>
                  )}
                  {eventData.features.isAccessible && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Wheelchair Accessible</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">{eventData.location.venue}</h4>
                <p className="text-gray-600">
                  {eventData.location.address.street && `${eventData.location.address.street}, `}
                  {eventData.location.address.city}
                  {eventData.location.address.state && `, ${eventData.location.address.state}`}
                  {eventData.location.address.zipCode && ` ${eventData.location.address.zipCode}`}
                </p>
                <p className="text-gray-500">{eventData.location.address.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="space-y-6">
          <div className="card sticky top-6">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Ticket className="w-5 h-5 mr-2" />
                Book Tickets
              </h3>
            </div>
            <div className="card-body space-y-6">
              {isEventActive() ? (
                <>
                  {/* Pricing Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Ticket Category
                    </label>
                    <div className="space-y-3">
                      {eventData.pricing.categories.map((category) => (
                        <div
                          key={category.name}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedCategory === category.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCategory(category.name)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{category.name}</h4>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                {category.availableTickets} tickets available
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                LKR {category.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selection */}
                  {selectedCategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="text-lg font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Total Price */}
                  {selectedCategory && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          LKR {getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBookTickets}
                    disabled={!selectedCategory || quantity < 1}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ticket className="w-5 h-5 mr-2" />
                    Book Tickets
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {eventData.status === 'cancelled' ? 'Event Cancelled' : 'Event Not Available'}
                  </h4>
                  <p className="text-gray-600">
                    {eventData.status === 'cancelled' 
                      ? 'This event has been cancelled.'
                      : 'This event is not available for booking at the moment.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Event Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Event Stats</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tickets</span>
                  <span className="font-medium">
                    {eventData.pricing.categories.reduce((sum, cat) => sum + cat.totalTickets, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-green-600">
                    {eventData.pricing.categories.reduce((sum, cat) => sum + cat.availableTickets, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sold</span>
                  <span className="font-medium text-blue-600">
                    {eventData.pricing.categories.reduce((sum, cat) => sum + (cat.totalTickets - cat.availableTickets), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          event={eventData}
          selectedCategory={selectedCategory}
          quantity={quantity}
          totalPrice={getTotalPrice()}
          onSubmit={handleBookingSubmit}
          onClose={() => setShowBookingForm(false)}
          isLoading={bookTicketsMutation.isLoading}
        />
      )}
    </div>
  );
};

// Booking Form Component
const BookingForm = ({ event, selectedCategory, quantity, totalPrice, onSubmit, onClose, isLoading }) => {
  const [billingData, setBillingData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(billingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Complete Your Booking</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={billingData.name}
                onChange={(e) => setBillingData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={billingData.email}
                onChange={(e) => setBillingData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={billingData.phone}
                onChange={(e) => setBillingData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Event:</span>
                  <span className="font-medium">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium">{selectedCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>LKR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
