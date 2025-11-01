import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Plus,
  Ticket,
  BarChart3,
  QrCode
} from 'lucide-react';

export const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home, public: true },
    { name: 'Events', href: '/events', icon: Calendar, public: true },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: User, roles: ['user', 'organizer', 'admin'] },
    { name: 'My Tickets', href: '/my-tickets', icon: Ticket, roles: ['user', 'organizer', 'admin'] },
  ];

  const organizerNavigation = [
    { name: 'Create Event', href: '/create-event', icon: Plus, roles: ['organizer', 'admin'] },
    { name: 'My Events', href: '/my-events', icon: Calendar, roles: ['organizer', 'admin'] },
    { name: 'QR Scanner', href: '/scanner', icon: QrCode, roles: ['organizer', 'admin'] },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: BarChart3, roles: ['admin'] },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
          isActive(item.href)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gradient">Smart Tickets</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {/* Public Navigation */}
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}

        {/* User Navigation */}
        {isAuthenticated() && (
          <>
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </h3>
            </div>
            {userNavigation
              .filter(item => item.roles.includes(user?.role))
              .map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
          </>
        )}

        {/* Organizer Navigation */}
        {isAuthenticated() && hasRole('organizer') && (
          <>
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Organizer
              </h3>
            </div>
            {organizerNavigation
              .filter(item => item.roles.includes(user?.role))
              .map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
          </>
        )}

        {/* Admin Navigation */}
        {isAuthenticated() && hasRole('admin') && (
          <>
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            </div>
            {adminNavigation
              .filter(item => item.roles.includes(user?.role))
              .map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
          </>
        )}
      </nav>

      {/* User Profile */}
      {isAuthenticated() && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="flex-1 flex items-center max-w-lg">
              <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search events..."
                  type="text"
                />
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {!isAuthenticated() ? (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
