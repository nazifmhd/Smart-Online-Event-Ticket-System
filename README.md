# Smart Online Event Ticket Booking System

A comprehensive web-based platform for automated event ticket booking with secure QR code verification, designed specifically for Sri Lanka's local context.

## 🎯 Project Overview

This system automates event ticket booking, enabling users to browse, book, and verify tickets digitally with secure QR codes. It provides a complete solution for event organizers and attendees with features like online booking, digital receipts, QR-coded e-tickets, and comprehensive analytics.

## ✨ Key Features

### For Users
- **Easy Registration & Login** - Simple user registration with role-based access
- **Event Discovery** - Browse events with advanced filtering and search
- **Online Booking** - Secure ticket booking with multiple payment options
- **Digital Tickets** - QR-coded e-tickets for quick entry
- **Ticket Management** - View, download, and manage your tickets

### For Organizers
- **Event Management** - Create, edit, and manage events with detailed information
- **Ticket Sales Tracking** - Monitor ticket sales and revenue in real-time
- **QR Verification** - Scan and verify tickets at the gate
- **Analytics Dashboard** - Comprehensive reporting and analytics

### For Administrators
- **User Management** - Manage users and their roles
- **Platform Analytics** - System-wide analytics and reporting
- **Payment Monitoring** - Track all payments and transactions
- **Content Moderation** - Manage events and user content

## 🏗️ System Architecture

### Backend (Node.js/Express)
- **Authentication** - JWT-based authentication with role-based access control
- **Database** - MongoDB with Mongoose ODM
- **API Endpoints** - RESTful API for all operations
- **Payment Integration** - Stripe and local payment gateway support
- **QR Code Generation** - Secure QR code generation for tickets
- **Email Services** - Automated email notifications

### Frontend (React)
- **Modern UI** - Built with React 18 and Tailwind CSS
- **Responsive Design** - Mobile-first responsive design
- **State Management** - React Query for server state management
- **Routing** - React Router for client-side routing
- **Authentication** - Context-based authentication system

### Database Schema
- **Users** - User accounts with role-based permissions
- **Events** - Event information with pricing and availability
- **Tickets** - Individual tickets with QR codes
- **Payments** - Payment records and transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Online-Event-Ticket-System
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   ```

4. **Start the development servers**

   **Option A: Using npm script (recommended)**
   ```bash
   npm run dev
   ```

   **Option B: Using the startup script**
   ```bash
   node start-simple.js
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smart-event-tickets

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Client URL
CLIENT_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Server
PORT=5000
NODE_ENV=development
```

## 📁 Project Structure

```
Smart-Online-Event-Ticket-System/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── index.js          # Server entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Organizer/Admin)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PUT /api/events/:id/status` - Update event status

### Tickets
- `POST /api/tickets/book` - Book tickets
- `GET /api/tickets/my-tickets` - Get user's tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets/:id/verify` - Verify ticket (Organizer/Admin)
- `POST /api/tickets/:id/cancel` - Cancel ticket

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/my-payments` - Get user's payments
- `POST /api/payments/:id/refund` - Process refund

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/events` - Get all events
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/users/:id/role` - Update user role

## 🎨 User Interface

### Design System
- **Colors**: Blue primary theme with purple accents
- **Typography**: Inter font family
- **Components**: Tailwind CSS utility classes
- **Icons**: Lucide React icon library
- **Animations**: CSS transitions and transforms

### Key Pages
- **Home** - Landing page with featured events
- **Events** - Event listing with search and filters
- **Event Detail** - Individual event information
- **Login/Register** - Authentication pages
- **Dashboard** - User dashboard
- **My Tickets** - User's ticket management
- **Create Event** - Event creation (Organizers)
- **Admin Dashboard** - Administrative interface

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Input Validation** - Comprehensive input validation
- **Rate Limiting** - API rate limiting for security
- **CORS Protection** - Cross-origin resource sharing protection
- **Helmet Security** - Security headers middleware
- **QR Code Security** - Tamper-proof QR codes with signatures

## 💳 Payment Integration

### Supported Payment Methods
- **Credit/Debit Cards** - Stripe integration
- **Mobile Wallets** - Dialog, Mobitel, Hutch
- **Bank Transfers** - Local bank integration
- **Cash on Delivery** - COD option

### Payment Flow
1. User selects tickets and proceeds to checkout
2. Payment method selection
3. Secure payment processing
4. Ticket generation with QR codes
5. Email confirmation with tickets

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop** - Full-featured experience
- **Tablet** - Optimized layout
- **Mobile** - Touch-friendly interface

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set up production email service
- Configure production payment gateways
- Set up SSL certificates

## 🔮 Future Enhancements

- **Mobile App** - React Native mobile application
- **AI Recommendations** - AI-driven event recommendations
- **Social Integration** - Social media integration for event promotion
- **Blockchain Integration** - Blockchain-based ticket authentication
- **Real-time Notifications** - WebSocket-based real-time updates
- **Advanced Analytics** - Machine learning-powered analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- React and Node.js communities
- Tailwind CSS for the design system
- MongoDB for the database
- All contributors and testers

---

**Smart Online Event Ticket Booking System** - Revolutionizing event ticketing in Sri Lanka! 🎫✨