import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { login } from '@/lib/keycloak';

export function LoginButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Direct login approach
      const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:9090';
      const redirectUri = encodeURIComponent(window.location.origin);
      const loginUrl = `${keycloakUrl}/realms/ospo-events/protocol/openid-connect/auth?client_id=ospo-events-app&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
      console.log('Login URL:', loginUrl);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "There was a problem connecting to the authentication server.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="default" 
      onClick={handleLogin} 
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? "Connecting..." : "Log In"}
    </Button>
  );
}