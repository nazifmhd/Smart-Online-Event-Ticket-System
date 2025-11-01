import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Download, 
  QrCode, 
  Eye, 
  X,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const MyTickets = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading, error } = useQuery(
    ['my-tickets', filters, currentPage],
    () => ticketsAPI.getMyTickets({ ...filters, page: currentPage, limit: 12 }),
    {
      select: (data) => data.data
    }
  );

  const cancelTicketMutation = useMutation(ticketsAPI.cancelTicket, {
    onSuccess: () => {
      toast.success('Ticket cancelled successfully');
      queryClient.invalidateQueries('my-tickets');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel ticket');
    }
  });

  const handleCancelTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) {
      cancelTicketMutation.mutate(ticketId);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: CheckCircle },
      used: { color: 'bg-blue-100 text-blue-800', label: 'Used', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const isTicketExpired = (eventDate) => {
    return new Date(eventDate) < new Date();
  };

  const canCancelTicket = (ticket) => {
    return ticket.status === 'confirmed' && !isTicketExpired(ticket.event.date.startDate);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Tickets</h2>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
        <p className="text-gray-600">
          View and manage your booked tickets
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="used">Used</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>

              <button
                onClick={() => setFilters({ status: '', search: '' })}
                className="btn-secondary flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : ticketsData?.tickets?.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ticketsData.tickets.map((ticket) => (
              <div key={ticket._id} className="card hover:shadow-lg transition-shadow duration-300">
                {/* Event Image */}
                <div className="aspect-w-16 aspect-h-9">
                  {ticket.event.images?.[0] ? (
                    <img
                      src={ticket.event.images[0].url}
                      alt={ticket.event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center rounded-t-lg">
                      <Ticket className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {ticket.event.category}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {ticket.event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(ticket.event.date.startDate)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {ticket.event.location.venue}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(ticket.event.date.time.startTime)}
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Ticket #{ticket.ticketNumber}</span>
                      <span className="font-medium text-gray-900">
                        {ticket.pricingCategory.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-green-600">
                        LKR {ticket.pricingCategory.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/tickets/${ticket._id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canCancelTicket(ticket) && (
                        <button
                          onClick={() => handleCancelTicket(ticket._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancel Ticket"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        View QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {ticketsData.pagination && ticketsData.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!ticketsData.pagination.hasPrev}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {ticketsData.pagination.currentPage} of {ticketsData.pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!ticketsData.pagination.hasNext}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Found</h2>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.status 
              ? 'No tickets match your current filters. Try adjusting your search criteria.'
              : "You haven't booked any tickets yet. Start exploring events!"
            }
          </p>
          <Link
            to="/events"
            className="btn-primary"
          >
            Browse Events
          </Link>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <QRCodeDisplay
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          showDetails={true}
          size="large"
        />
      )}
    </div>
  );
};

export default MyTickets;
