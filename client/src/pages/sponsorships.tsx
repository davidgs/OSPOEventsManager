import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sponsorship, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Search, Edit, Trash2, Calendar, Building, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SponsorshipsPage: FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  // Fetch sponsorships
  const { data: sponsorships = [], isLoading: isLoadingSponsorships } = useQuery({
    queryKey: ['/api/sponsorships'],
    queryFn: async () => {
      const response = await fetch('/api/sponsorships');
      if (!response.ok) throw new Error('Failed to load sponsorships');
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

  // Filter sponsorships
  const filteredSponsorships = sponsorships.filter((sponsorship: any) => {
    const matchesSearch = (sponsorship.contactName && sponsorship.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (sponsorship.contactEmail && sponsorship.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEvent = eventFilter === "all" || sponsorship.eventId.toString() === eventFilter;
    const matchesStatus = statusFilter === "all" || sponsorship.status === statusFilter;
    const matchesLevel = levelFilter === "all" || sponsorship.level === levelFilter;
    
    return matchesSearch && matchesEvent && matchesStatus && matchesLevel;
  });

  const getEventName = (eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    return event ? event.name : `Event ${eventId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      declined: "bg-red-100 text-red-800",
      negotiating: "bg-blue-100 text-blue-800"
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelColors: Record<string, string> = {
      platinum: "bg-gray-800 text-white",
      gold: "bg-yellow-500 text-white",
      silver: "bg-gray-400 text-white",
      bronze: "bg-amber-600 text-white",
      startup: "bg-purple-100 text-purple-800"
    };
    
    return (
      <Badge className={levelColors[level] || "bg-gray-100 text-gray-800"}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  // Get unique values for filters
  const uniqueStatuses = Array.from(new Set(sponsorships.map((s: any) => s.status).filter(Boolean)));
  const uniqueLevels = Array.from(new Set(sponsorships.map((s: any) => s.level).filter(Boolean)));

  if (isLoadingSponsorships) {
    return <div className="flex items-center justify-center min-h-screen">Loading sponsorships...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sponsorships</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Sponsorship
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sponsors..."
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map((status: string) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {uniqueLevels.map((level: string) => (
              <SelectItem key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sponsorships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSponsorships.map((sponsorship: any) => (
          <Card key={sponsorship.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Building className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {sponsorship.contactName || 'Sponsor'}
                    </CardTitle>
                    <div className="flex gap-2 mt-1">
                      {getLevelBadge(sponsorship.level)}
                      {getStatusBadge(sponsorship.status)}
                    </div>
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
                {getEventName(sponsorship.eventId)}
              </div>
              
              {sponsorship.contactEmail && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${sponsorship.contactEmail}`} className="hover:text-blue-600">
                    {sponsorship.contactEmail}
                  </a>
                </div>
              )}

              {sponsorship.amount && (
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {sponsorship.amount}
                </div>
              )}

              {sponsorship.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {sponsorship.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredSponsorships.length === 0 && (
          <div className="col-span-full text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sponsorships found</h3>
            <p className="text-gray-500">
              {searchTerm || eventFilter !== "all" || statusFilter !== "all" || levelFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first sponsorship"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorshipsPage;