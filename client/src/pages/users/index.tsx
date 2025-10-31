import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { User } from "@shared/database-types";
import {
  Search,
  Users,
  Mail,
  UserCheck,
  UserX,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Using the User type from the database schema

const UsersPage: FC = () => {
  const { authenticated, initialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch users from database - only when authenticated
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      console.log("[USERS PAGE] Making API request to /api/users");
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: initialized && authenticated, // Only fetch when authenticated
  });

  // Debug logging
  console.log("[USERS PAGE] Auth state:", { initialized, authenticated });
  console.log("[USERS PAGE] Query state:", {
    isLoading,
    error,
    usersCount: users.length,
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    // Since we don't have enabled/disabled or emailVerified in the database,
    // we'll filter based on role and other available fields
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.last_login) ||
      (statusFilter === "inactive" && !user.last_login) ||
      (statusFilter === "has_role" && user.role) ||
      (statusFilter === "no_role" && !user.role);

    const matchesRole =
      roleFilter === "all" ||
      (user.role && user.role.toLowerCase() === roleFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
      case "administrator":
        return "destructive";
      case "community manager":
        return "default";
      case "reviewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.role) {
      return <Badge variant="secondary">No Role</Badge>;
    }
    if (user.last_login) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Initializing authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not authenticated
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-muted-foreground">
              Please log in to view users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
            <p className="text-muted-foreground">
              Failed to load users from Keycloak. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage registered users from the database
          </p>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active (Has Login)</SelectItem>
                <SelectItem value="inactive">Inactive (No Login)</SelectItem>
                <SelectItem value="has_role">Has Role</SelectItem>
                <SelectItem value="no_role">No Role</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="community manager">
                  Community Manager
                </SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      {getStatusBadge(user)}
                      <Badge variant={getRoleBadgeVariant(user.role || "")}>
                        {user.role || "No role"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span>@{user.username}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created:{" "}
                          {user.created_at
                            ? format(new Date(user.created_at), "MMM dd, yyyy")
                            : "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Last login:{" "}
                          {user.last_login
                            ? format(new Date(user.last_login), "MMM dd, yyyy")
                            : "Never"}
                        </span>
                      </div>
                    </div>

                    {user.job_title && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Job Title:
                        </p>
                        <p className="text-sm">{user.job_title}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {user.role ? (
                      <UserCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <UserX className="h-5 w-5 text-red-600" />
                    )}
                    {user.last_login ? (
                      <Shield className="h-5 w-5 text-green-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersPage;
