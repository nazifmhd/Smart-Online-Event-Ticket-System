import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../../components/Layout';

// Mock the AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Layout Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: () => false
    });
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows login and register links when not authenticated', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows user name when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'John Doe', role: 'user' },
      isAuthenticated: () => true,
      hasRole: () => false,
      hasAnyRole: () => false
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });

  it('shows organizer navigation when user is organizer', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Organizer', role: 'organizer' },
      isAuthenticated: () => true,
      hasRole: (role) => role === 'organizer',
      hasAnyRole: (roles) => roles.includes('organizer')
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
  });

  it('shows admin navigation when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Admin', role: 'admin' },
      isAuthenticated: () => true,
      hasRole: (role) => role === 'admin',
      hasAnyRole: (roles) => roles.includes('admin')
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
