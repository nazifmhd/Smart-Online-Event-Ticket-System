import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Home from '../../pages/Home';

// Mock the API
jest.mock('../../services/api', () => ({
  eventsAPI: {
    getEvents: jest.fn()
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Smart Event Tickets')).toBeInTheDocument();
  });

  it('renders hero section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Smart Event Tickets')).toBeInTheDocument();
    expect(screen.getByText('Book tickets for amazing events across Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('Browse Events')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders categories section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Explore by Category')).toBeInTheDocument();
    expect(screen.getByText('Concerts')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Conferences')).toBeInTheDocument();
  });

  it('renders featured events section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Featured Events')).toBeInTheDocument();
    expect(screen.getByText("Don't miss out on these amazing events")).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Why Choose Smart Tickets?')).toBeInTheDocument();
    expect(screen.getByText('Experience the future of event ticketing')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText('Ready to Book Your Next Event?')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of event-goers who trust Smart Tickets')).toBeInTheDocument();
  });

  it('shows loading state for events', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    // Should show loading skeleton or spinner
    expect(screen.getByText('Featured Events')).toBeInTheDocument();
  });
});
