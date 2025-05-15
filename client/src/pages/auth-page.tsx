import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { LoginButton } from '@/components/auth/LoginButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { initialized, authenticated } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (initialized && authenticated) {
      setLocation('/');
    }
  }, [initialized, authenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-6xl w-full grid gap-8 lg:grid-cols-2">
        {/* Auth form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">OSPO Events</CardTitle>
            <CardDescription>
              Sign in to your account to access the event management system
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <LoginButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:9090';
                const redirectUri = encodeURIComponent(window.location.origin);
                const registrationUrl = `${keycloakUrl}/realms/ospo-events/protocol/openid-connect/auth?client_id=ospo-events-app&redirect_uri=${redirectUri}&response_type=code&scope=openid&kc_action=register`;
                console.log('Registration URL:', registrationUrl);
                window.location.href = registrationUrl;
              }}
              className="w-full"
            >
              Create an Account
            </Button>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-2 pt-0">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>

        {/* Hero content */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center space-y-6 p-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Streamline Your OSPO Event Management
          </h1>
          <p className="text-muted-foreground text-lg">
            Track conferences, manage CFP submissions, organize attendees, and handle sponsorships all in one place.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Centralize all event information
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Streamline approval workflows
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Manage attendees and stakeholders
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Track CFP submissions and sponsorships
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}