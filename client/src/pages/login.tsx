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

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLocation, useRouter } from 'wouter';
import { Loader2 } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { authenticated: isAuthenticated, login } = useAuth();
  const isLoading = false; // Auth context doesn't expose isLoading
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const router = useRouter();

  // Handle authentication state
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Redirect to home page if already logged in
      toast({
        title: 'Welcome back!',
        description: 'You are now signed in',
      });
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Handle login using Keycloak
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);

      // Use the keycloak service from lib/keycloak.ts
      await login();

      // If login doesn't redirect, we'll fall through to this code
      setIsLoggingIn(false);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to sign in. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: 'There was a problem signing in with Keycloak.',
      });
      setIsLoggingIn(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Events</CardTitle>
            <CardDescription>Initializing authentication...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-[350px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground text-transparent bg-clip-text">
            Events
          </CardTitle>
          <CardDescription>
            Sign in to access your event management dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loginError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This application uses Keycloak for secure authentication.
            </p>
            <p className="text-sm text-muted-foreground">
              You'll be redirected to the authentication server to complete your login.
            </p>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            <p>• Secure authentication with Keycloak</p>
            <p>• Two-factor authentication with FreeOTP</p>
            <p>• Role-based access control</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in with Keycloak'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}