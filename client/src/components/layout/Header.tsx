import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { LoginButton } from '@/components/auth/LoginButton';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, BarChart2, Users, Bookmark, Settings } from 'lucide-react';

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export function Header() {
  const { initialized, authenticated, user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-xl">
              <Calendar className="h-6 w-6" />
              <span>OSPO Events</span>
            </a>
          </Link>
          
          {authenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/events">
                <a className="text-sm font-medium transition-colors hover:text-primary">
                  Events
                </a>
              </Link>
              <Link href="/cfp-submissions">
                <a className="text-sm font-medium transition-colors hover:text-primary">
                  CFP Submissions
                </a>
              </Link>
              <Link href="/attendees">
                <a className="text-sm font-medium transition-colors hover:text-primary">
                  Attendees
                </a>
              </Link>
              <Link href="/sponsorships">
                <a className="text-sm font-medium transition-colors hover:text-primary">
                  Sponsorships
                </a>
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {!initialized ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : authenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.name || 'User'} />
                    <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <a className="flex cursor-pointer items-center">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex cursor-pointer items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">
                    <a className="flex cursor-pointer items-center">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Saved</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
}