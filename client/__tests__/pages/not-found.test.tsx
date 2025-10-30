import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/pages/not-found';
import React from 'react';

// Mock wouter Link
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('NotFound', () => {
  it('should render 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render Page Not Found message', () => {
    render(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should render explanation text', () => {
    render(<NotFound />);
    expect(
      screen.getByText(/The page you are looking for doesn't exist or has been moved/)
    ).toBeInTheDocument();
  });

  it('should render Go Home button', () => {
    render(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toBeInTheDocument();
  });

  it('should have Go Home button linking to root', () => {
    render(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have proper semantic structure', () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('h1')).toHaveTextContent('404');
    expect(container.querySelector('h2')).toHaveTextContent('Page Not Found');
  });
});

