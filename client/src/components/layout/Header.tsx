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

import React, { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  MessageCircle,
  Info,
  BookOpen,
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
  // { href: "/users", label: "Users", icon: UsersIcon },
];

export function Header() {
  const { initialized, authenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch version information
  const { data: versionInfo } = useQuery({
    queryKey: ["/api/version"],
    queryFn: async () => {
      const response = await fetch("/api/version");
      if (!response.ok) throw new Error("Failed to fetch version");
      return response.json();
    },
  });

  // Fetch user profile data to get headshot
  const { data: userProfile } = useQuery({
    queryKey: [`/api/users/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await apiRequest("GET", `/api/users/${user.id}`);
        if (res.ok) {
          return res.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!user?.id && authenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  // Function to open feedback email
  const openFeedbackEmail = () => {
    const subject = encodeURIComponent("OSPO Events Manager Feedback");
    const body = encodeURIComponent(
      `Hi David,\n\nI have feedback about the OSPO Events Manager application:\n\n[Please share your feedback here]\n\n---\nVersion: ${
        versionInfo?.version || "Unknown"
      }\nEnvironment: ${versionInfo?.environment || "Unknown"}\nURL: ${
        window.location.href
      }\nUser: ${
        user?.email || "Anonymous"
      }\nTimestamp: ${new Date().toISOString()}`
    );
    const mailtoUrl = `mailto:davidgs@redhat.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, "_blank");
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
          {/* Version badge - hidden on mobile */}
          {versionInfo && (
            <span className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              v{versionInfo.version}
            </span>
          )}
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
          {/* Feedback button */}
          {/* Documentation button - always visible */}
          <Link href="/docs">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2"
              title="View Documentation"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Docs</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={openFeedbackEmail}
            className="hidden sm:flex items-center gap-2"
            title="Send feedback to David Simmons"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden md:inline">Feedback</span>
          </Button>

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
                    <AvatarImage
                      src={userProfile?.headshot || ""}
                      alt={user?.name || "User"}
                    />
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
                {/* Feedback in user menu for mobile */}
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={openFeedbackEmail}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Send Feedback</span>
                </DropdownMenuItem>
                {/* Theme toggle in mobile user menu */}
                <DropdownMenuItem className="xs:hidden" asChild>
                  <div className="flex cursor-pointer items-center px-2 py-1.5">
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="mr-auto">Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                {/* Version info in user menu */}
                {versionInfo && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled
                      className="text-xs text-muted-foreground"
                    >
                      <Info className="mr-2 h-3 w-3" />
                      <div className="flex flex-col">
                        <span>Version {versionInfo.version}</span>
                        <span className="text-xs">
                          {versionInfo.environment}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
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
              {/* Mobile-only feedback link */}
              <button
                onClick={() => {
                  openFeedbackEmail();
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground text-left"
              >
                <MessageCircle className="h-4 w-4" />
                Send Feedback
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
