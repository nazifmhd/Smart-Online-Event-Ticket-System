# Smart Event Ticket System - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation & Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Smart-Online-Event-Ticket-System
   npm run install-all
   ```

2. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   nano server/.env
   ```

3. **Start Development**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run server  # Backend on http://localhost:5000
   npm run client  # Frontend on http://localhost:3000
   ```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# Backend tests only
npm run test:server

# Frontend tests only
npm run test:client

# Coverage reports
npm run test:coverage
```

### Test Structure
```
tests/
├── setup.js              # Test database setup
├── helpers/
│   └── testHelpers.js    # Test utilities and factories
├── auth.test.js          # Authentication tests
├── events.test.js        # Events API tests
├── tickets.test.js       # Tickets API tests
├── payments.test.js      # Payments API tests
└── admin.test.js         # Admin API tests
```

## 🏗️ Project Structure

### Backend (Node.js/Express)
```
server/
├── models/           # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── tests/           # Test files
├── index.js         # Server entry point
└── package.json     # Dependencies
```

### Frontend (React)
```
client/
├── public/          # Static files
├── src/
│   ├── components/  # Reusable components
│   ├── contexts/    # React contexts
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── __tests__/   # Test files
│   └── App.js       # Main app component
└── package.json     # Dependencies
```

## 🔧 Development Workflow

### 1. Feature Development
1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes
3. Write tests for new functionality
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add your feature"`

### 2. API Development
- Add new routes in `server/routes/`
- Create/update models in `server/models/`
- Add middleware in `server/middleware/`
- Write tests in `server/tests/`

### 3. Frontend Development
- Add components in `client/src/components/`
- Create pages in `client/src/pages/`
- Update services in `client/src/services/`
- Write tests in `client/src/__tests__/`

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|organizer|admin),
  phone: String,
  address: Object,
  isVerified: Boolean,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

### Events Collection
```javascript
{
  title: String,
  description: String,
  category: String,
  date: {
    startDate: Date,
    endDate: Date,
    time: Object
  },
  location: Object,
  organizer: ObjectId,
  pricing: {
    categories: Array
  },
  status: String,
  analytics: Object
}
```

### Tickets Collection
```javascript
{
  ticketNumber: String (unique),
  user: ObjectId,
  event: ObjectId,
  pricingCategory: Object,
  qrCode: {
    data: String,
    image: String
  },
  status: String,
  payment: ObjectId
}
```

### Payments Collection
```javascript
{
  paymentId: String (unique),
  user: ObjectId,
  event: ObjectId,
  amount: Object,
  paymentMethod: Object,
  status: String,
  gatewayResponse: Object
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: "user_id",
  iat: "issued_at",
  exp: "expires_at"
}
```

### Role-Based Access Control
- **User**: Can book tickets, view own tickets
- **Organizer**: Can create/manage events, scan tickets
- **Admin**: Full system access, user management

### Protected Routes
```javascript
// User routes
app.use('/api/tickets', authenticate, ticketsRoutes);

// Organizer routes
app.use('/api/events', authenticate, authorize('organizer', 'admin'), eventsRoutes);

// Admin routes
app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
```

## 🧪 Testing Guidelines

### Backend Testing
- Use MongoDB Memory Server for isolated tests
- Test all API endpoints with various scenarios
- Mock external services (email, payment gateways)
- Test authentication and authorization
- Test data validation and error handling

### Frontend Testing
- Test component rendering and user interactions
- Mock API calls and external dependencies
- Test form validation and error states
- Test routing and navigation
- Test responsive design

### Test Coverage Goals
- Backend: >80% code coverage
- Frontend: >70% code coverage
- Critical paths: 100% coverage

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

### Events
- `GET /api/events` - List events (public)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizer/admin)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Tickets
- `POST /api/tickets/book` - Book tickets
- `GET /api/tickets/my-tickets` - User's tickets
- `GET /api/tickets/:id` - Ticket details
- `POST /api/tickets/:id/verify` - Verify ticket (organizer/admin)
- `POST /api/tickets/:id/cancel` - Cancel ticket

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:id` - Payment details
- `GET /api/payments/my-payments` - User's payments
- `POST /api/payments/:id/refund` - Process refund

### Admin
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/users` - User management
- `GET /api/admin/events` - Event management
- `GET /api/admin/payments` - Payment management

## 🔧 Environment Variables

### Required Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/smart-event-tickets

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Client URL
CLIENT_URL=http://localhost:3000

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 🐛 Debugging

### Backend Debugging
```bash
# Enable debug logging
DEBUG=app:* npm run server

# Check database connection
npm run server
# Look for "MongoDB connected successfully"
```

### Frontend Debugging
```bash
# React Developer Tools
# Install browser extension for React debugging

# Console debugging
# Use browser dev tools console
```

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify MONGODB_URI in .env

2. **JWT Token Invalid**
   - Check JWT_SECRET in .env
   - Verify token expiration

3. **Email Sending Failed**
   - Check email credentials in .env
   - Verify SMTP settings

4. **Payment Processing Failed**
   - Check payment gateway credentials
   - Verify webhook endpoints

## 📝 Code Style Guidelines

### Backend (Node.js)
- Use async/await for asynchronous operations
- Validate all inputs with express-validator
- Use proper error handling and status codes
- Follow RESTful API conventions
- Use meaningful variable and function names

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (optional)
- Implement proper error boundaries
- Use consistent naming conventions

### General
- Write meaningful commit messages
- Keep functions small and focused
- Add comments for complex logic
- Use consistent indentation (2 spaces)
- Follow ESLint rules

## 🚀 Deployment Preparation

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Configure production email service
- Set up production payment gateways
- Enable HTTPS

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📞 Support

For development questions or issues:
- Check the documentation
- Review existing issues
- Create a new issue with detailed description
- Contact the development team

---

**Happy Coding! 🎉**
