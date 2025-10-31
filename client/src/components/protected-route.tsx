import React, { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRoles?: string[];
};

export function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  console.log("[PROTECTED_ROUTE] Component render started");
  const { authenticated, initialized, user } = useAuth();
  const [, setLocation] = useLocation();

  // Enhanced debug logging for ProtectedRoute state
  console.log("[PROTECTED_ROUTE] Current state:", {
    authenticated,
    initialized,
    user: user ? { id: user.id, username: user.username } : null,
    requiredRoles,
    timestamp: new Date().toISOString(),
  });

  // Check for user roles if required
  const hasRequiredRoles =
    requiredRoles.length === 0 ||
    (user?.roles && requiredRoles.some((role) => user.roles.includes(role)));

  console.log("ProtectedRoute role check:", {
    hasRequiredRoles,
    userRoles: user?.roles,
  });

  useEffect(() => {
    console.log("ProtectedRoute useEffect triggered:", {
      authenticated,
      initialized,
    });

    // Only redirect after loading is complete
    if (initialized) {
      if (!authenticated) {
        console.log(
          "ProtectedRoute: User not authenticated, redirecting to login"
        );
        setLocation("/login");
      } else if (requiredRoles.length > 0 && !hasRequiredRoles) {
        console.log(
          "ProtectedRoute: User missing required roles, redirecting to unauthorized"
        );
        setLocation("/unauthorized");
      } else {
        console.log(
          "ProtectedRoute: User authenticated and authorized, allowing access"
        );
      }
    } else {
      console.log("ProtectedRoute: Still initializing, showing loading state");
    }
  }, [
    authenticated,
    initialized,
    setLocation,
    requiredRoles,
    hasRequiredRoles,
  ]);

  // Show loading state while checking authentication
  if (!initialized) {
    console.log(
      "[PROTECTED_ROUTE] Rendering loading state - initialized:",
      initialized
    );
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
  if (authenticated && requiredRoles.length > 0 && !hasRequiredRoles) {
    console.log("ProtectedRoute: User missing required roles, rendering null");
    return null; // This will be redirected by the useEffect
  }

  // If we're not loading and the user is authenticated (with required roles if specified), render children
  const shouldRenderChildren = authenticated;
  console.log("[PROTECTED_ROUTE] Final render decision:", {
    shouldRenderChildren,
    authenticated,
    initialized,
    willRenderChildren: shouldRenderChildren,
  });

  if (shouldRenderChildren) {
    console.log("[PROTECTED_ROUTE] Rendering children");
    return <>{children}</>;
  } else {
    console.log(
      "[PROTECTED_ROUTE] Not rendering children - user not authenticated"
    );
    return null;
  }
}
