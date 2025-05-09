import { FC } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users, DollarSign, Settings, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";

interface SidebarProps {
  className?: string;
}

const navItems = [
  {
    title: "Events",
    href: "/events",
    icon: Calendar,
  },
  {
    title: "CFP Submissions",
    href: "/cfp-submissions",
    icon: FileText,
  },
  {
    title: "Attendees",
    href: "/attendees",
    icon: Users,
  },
  {
    title: "Sponsorships",
    href: "/sponsorships",
    icon: DollarSign,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const SidebarContent: FC = () => {
  const [location] = useLocation();
  const userId = 2; // Using demo_user's ID

  // Query to fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest<User>(`/api/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user initials for the avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
        <h1 className="text-xl font-semibold text-white">OSPO Events</h1>
      </div>
      <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || 
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
        </nav>
      </div>
      <div className="flex items-center p-4 border-t border-gray-700">
        <Link href="/settings">
          <Button variant="ghost" className="w-full flex items-center justify-start p-0 hover:bg-transparent">
            <Avatar className="h-10 w-10">
              {userData?.headshot ? (
                <AvatarImage src={userData.headshot} alt={userData.name || "User"} />
              ) : (
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
              )}
              <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-white">{userData?.name || "User"}</p>
              <p className="text-xs font-medium text-gray-400">{userData?.jobTitle || "Community Member"}</p>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({ className }) => {
  const isMobile = useMobile();

  const userId = 2; // Using demo_user's ID
  
  // Query to fetch user data for mobile view
  const { data: userData } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest<User>(`/api/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get user initials for the avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`;
  };

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
        <h1 className="text-lg font-semibold">OSPO Events</h1>
        <Link href="/settings">
          <Avatar className="h-8 w-8 cursor-pointer">
            {userData?.headshot ? (
              <AvatarImage src={userData.headshot} alt={userData.name || "User"} />
            ) : (
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
            )}
            <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
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
