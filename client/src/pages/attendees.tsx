import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Attendee, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, Edit, Trash2, Calendar, Mail, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AttendanceForm } from "@/components/forms/attendance-form";

const AttendeesPage: FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch attendees
  const { data: attendees = [], isLoading: isLoadingAttendees } = useQuery({
    queryKey: ['/api/attendees'],
    queryFn: async () => {
      const response = await fetch('/api/attendees');
      if (!response.ok) throw new Error('Failed to load attendees');
      return response.json();
    },
  });

  // Fetch events for filtering
  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to load events');
      return response.json();
    },
  });

  // Filter attendees
  const filteredAttendees = attendees.filter((attendee: any) => {
    const matchesSearch = attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (attendee.email && attendee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEvent = eventFilter === "all" || attendee.eventId.toString() === eventFilter;
    const matchesRole = roleFilter === "all" || attendee.role === roleFilter;
    
    return matchesSearch && matchesEvent && matchesRole;
  });

  const getEventName = (eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    return event ? event.name : `Event ${eventId}`;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    
    const roleColors: Record<string, string> = {
      speaker: "bg-purple-100 text-purple-800",
      attendee: "bg-blue-100 text-blue-800",
      sponsor: "bg-green-100 text-green-800",
      organizer: "bg-orange-100 text-orange-800",
      volunteer: "bg-cyan-100 text-cyan-800"
    };
    
    return (
      <Badge className={roleColors[role] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(attendees.map((a: any) => a.role).filter(Boolean)));

  if (isLoadingAttendees) {
    return <div className="flex items-center justify-center min-h-screen">Loading attendees...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendees</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Attendee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event: Event) => (
              <SelectItem key={event.id} value={event.id.toString()}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map((role: string) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAttendees.map((attendee: any) => (
          <Card key={attendee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{attendee.name}</CardTitle>
                    {attendee.role && getRoleBadge(attendee.role)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {getEventName(attendee.eventId)}
              </div>
              
              {attendee.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${attendee.email}`} className="hover:text-blue-600">
                    {attendee.email}
                  </a>
                </div>
              )}

              {attendee.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {attendee.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAttendees.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendees found</h3>
            <p className="text-gray-500">
              {searchTerm || eventFilter !== "all" || roleFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first attendee"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeesPage;