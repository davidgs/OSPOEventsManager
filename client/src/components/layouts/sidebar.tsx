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

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  Users,
  DollarSign,
  Settings,
  Menu,
  File,
  LogOut,
  UserCog,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  className?: string;
}

const createNavItems = (t: (key: string) => string) => [
  {
    title: t("navigation.events"),
    href: "/events",
    icon: Calendar,
  },
  {
    title: t("navigation.cfp_submissions"),
    href: "/cfp-submissions",
    icon: FileText,
  },
  {
    title: t("navigation.attendees"),
    href: "/attendees",
    icon: Users,
  },
  {
    title: t("navigation.sponsorships"),
    href: "/sponsorships",
    icon: DollarSign,
  },
  {
    title: t("navigation.assets"),
    href: "/assets",
    icon: File,
  },
  {
    title: t("navigation.stakeholders"),
    href: "/stakeholders",
    icon: UserCog,
  },
  {
    title: t("navigation.workflows"),
    href: "/approval-workflows",
    icon: ClipboardList,
  },
  {
    title: t("navigation.users"),
    href: "/users",
    icon: Users,
  },
  {
    title: t("navigation.settings"),
    href: "/settings",
    icon: Settings,
  },
];

const SidebarContent: FC = () => {
  const { t } = useTranslation(["navigation", "common"]);
  const [location] = useLocation();
  const userId = 2; // Using demo_user's ID
  const { logout, user } = useAuth();
  const navItems = createNavItems(t);

  // Query to fetch user data
  const { data: userData } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user initials for the avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect happens automatically via the ProtectedRoute component
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Determine display name (from Keycloak user or fallback to local user data)
  const displayName = user?.name || userData?.name || t("common.user");
  const displayJobTitle = userData?.job_title || t("common.communityMember", "Community Member");
  const userInitials = getInitials(displayName);

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
        <h1 className="text-xl font-semibold text-white">{t("common.appName")}</h1>
      </div>
      <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            );
          })}

          <Separator className="my-4 bg-gray-700" />

          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t("common.logout")}
          </Button>
        </nav>
      </div>
      <div className="flex items-center p-4 border-t border-gray-700">
        <Link href="/settings">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start p-0 hover:bg-transparent"
          >
            <Avatar className="h-10 w-10">
              {userData?.headshot ? (
                <AvatarImage src={userData.headshot} alt={displayName} />
              ) : (
                <AvatarImage
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User avatar"
                />
              )}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs font-medium text-gray-400">
                {displayJobTitle}
              </p>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({ className }) => {
  const { t } = useTranslation(["common"]);
  const isMobile = useMobile();
  const { user } = useAuth();

  const userId = 2; // Using demo_user's ID

  // Query to fetch user data for mobile view
  const { data: userData } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user initials for the avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
  };

  // Determine display name (from Keycloak user or fallback to local user data)
  const displayName = user?.name || userData?.name || t("common.user");
  const userInitials = getInitials(displayName);

  if (isMobile) {
    return (
      <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">{t("common.appName")}</h1>
        <Link href="/settings">
          <Avatar className="h-8 w-8 cursor-pointer">
            {userData?.headshot ? (
              <AvatarImage src={userData.headshot} alt={displayName} />
            ) : (
              <AvatarImage
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="User avatar"
              />
            )}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("hidden md:flex md:flex-shrink-0", className)}>
      <div className="flex flex-col w-64">
        <SidebarContent />
      </div>
    </div>
  );
};

export default Sidebar;
