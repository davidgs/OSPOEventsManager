import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      // Logout will redirect, so we don't need to handle success
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout} 
      disabled={isLoading}
      className="flex items-center gap-2"
      size="sm"
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}