/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["common"]);
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
            <CardTitle className="text-2xl">{t("common.appName")}</CardTitle>
            <CardDescription>
              {t("common.verifyingAuth", "Verifying authentication...")}
            </CardDescription>
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
