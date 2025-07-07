import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  BarChart2,
  Users,
  Bookmark,
  Settings,
  Menu,
  X,
  FileText,
  UserCheck,
  Building2,
  FolderOpen,
  UsersIcon,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Navigation items for authenticated users
const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/cfp-submissions", label: "CFP Submissions", icon: FileText },
  { href: "/attendees", label: "Attendees", icon: UserCheck },
  { href: "/sponsorships", label: "Sponsorships", icon: Building2 },
  { href: "/assets", label: "Assets", icon: FolderOpen },
  { href: "/stakeholders", label: "Stakeholders", icon: UsersIcon },
  { href: "/approval-workflows", label: "Workflows", icon: Workflow },
];

export function Header() {
  const { initialized, authenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debug auth state
  console.log("Header auth state:", {
    initialized,
    authenticated,
    user: user ? { name: user.name, email: user.email } : null,
    timestamp: new Date().toISOString(),
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg sm:text-xl"
          >
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden xs:inline">OSPO Events</span>
            <span className="xs:hidden">OSPO</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {authenticated && (
          <nav className="hidden lg:flex items-center gap-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle - hidden on very small screens */}
          <div className="hidden xs:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu button - only shown when authenticated and on small screens */}
          {authenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* User authentication */}
          {!initialized ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : authenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.name || "User"} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard"
                    className="flex cursor-pointer items-center"
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex cursor-pointer items-center"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex cursor-pointer items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                {/* Theme toggle in mobile user menu */}
                <DropdownMenuItem className="xs:hidden" asChild>
                  <div className="flex cursor-pointer items-center px-2 py-1.5">
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="mr-auto">Theme</span>
                    <ThemeToggle />
                  </div>
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

      {/* Mobile Navigation Menu */}
      {authenticated && isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4">
            <div className="grid gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
