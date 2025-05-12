import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRoles?: string[];
};

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  // Check for user roles if required
  const hasRequiredRoles = requiredRoles.length === 0 || 
    (user?.roles && requiredRoles.some(role => user.roles.includes(role)));

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (requiredRoles.length > 0 && !hasRequiredRoles) {
        // If specific roles are required but user doesn't have them
        navigate('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, navigate, requiredRoles, hasRequiredRoles]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">OSPO Events</CardTitle>
            <CardDescription>Verifying authentication...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unauthorized placeholder if authenticated but missing required roles
  if (isAuthenticated && requiredRoles.length > 0 && !hasRequiredRoles) {
    return null; // This will be redirected by the useEffect
  }

  // If we're not loading and the user is authenticated (with required roles if specified), render children
  return isAuthenticated ? <>{children}</> : null;
}