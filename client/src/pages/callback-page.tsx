import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

export default function CallbackPage() {
  const [, setLocation] = useLocation();
  const { initialized, authenticated } = useAuth();

  useEffect(() => {
    // Wait for auth initialization to complete
    if (initialized) {
      if (authenticated) {
        // Redirect to home page on successful authentication
        setLocation('/');
      } else {
        // If not authenticated after callback, redirect to auth page
        setLocation('/auth');
      }
    }
  }, [initialized, authenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Processing authentication...</p>
      </div>
    </div>
  );
}