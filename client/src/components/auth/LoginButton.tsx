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
      await login();
      // Login will redirect, so we don't need to handle success
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "There was a problem connecting to the authentication server.",
        variant: "destructive",
      });
    } finally {
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