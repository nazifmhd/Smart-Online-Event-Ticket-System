import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  logout: () => api.post('/auth/logout'),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  updateEventStatus: (id, status) => api.put(`/events/${id}/status`, { status }),
  getMyEvents: (params) => api.get('/events/organizer/my-events', { params }),
};

// Tickets API
export const ticketsAPI = {
  bookTickets: (bookingData) => api.post('/tickets/book', bookingData),
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  getQRCode: (id) => api.get(`/tickets/${id}/qr-code`),
  verifyTicket: (id, qrData, usedBy) => api.post(`/tickets/${id}/verify`, { qrData, usedBy }),
  cancelTicket: (id) => api.post(`/tickets/${id}/cancel`),
  getEventTickets: (eventId, params) => api.get(`/tickets/event/${eventId}`, { params }),
};

// Payments API
export const paymentsAPI = {
  processPayment: (paymentData) => api.post('/payments/process', paymentData),
  getPayment: (id) => api.get(`/payments/${id}`),
  getMyPayments: (params) => api.get('/payments/my-payments', { params }),
  processRefund: (id, refundData) => api.post(`/payments/${id}/refund`, refundData),
  getEventPayments: (eventId, params) => api.get(`/payments/event/${eventId}`, { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: (params) => api.get('/admin/dashboard', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getEvents: (params) => api.get('/admin/events', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
};

// Utility functions
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null
    };
  }
};

export default api;
