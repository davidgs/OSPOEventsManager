import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CfpSubmission, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Edit, Trash2, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CfpSubmissionForm } from "@/components/forms/cfp-submission-form";

const CfpSubmissionsPage: FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  // Fetch CFP submissions
  const { data: cfpSubmissions = [], isLoading: isLoadingCfp } = useQuery({
    queryKey: ['/api/cfp-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/cfp-submissions');
      if (!response.ok) throw new Error('Failed to load CFP submissions');
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

  // Filter submissions
  const filteredSubmissions = cfpSubmissions.filter((submission: any) => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submitterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesEvent = eventFilter === "all" || submission.eventId.toString() === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Withdrawn</Badge>;
    }
  };

  const getEventName = (eventId: number) => {
    const event = events.find((e: Event) => e.id === eventId);
    return event ? event.name : `Event ${eventId}`;
  };

  if (isLoadingCfp) {
    return <div className="flex items-center justify-center min-h-screen">Loading CFP submissions...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CFP Submissions</h1>
        <CfpSubmissionForm onSuccess={() => {
          // Refresh the submissions list
        }} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubmissions.map((submission: any) => (
          <Card key={submission.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">{submission.title}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {getStatusBadge(submission.status)}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {submission.submitterName}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {getEventName(submission.eventId)}
              </div>

              {submission.submissionDate && (
                <div className="text-sm text-gray-500">
                  Submitted: {format(new Date(submission.submissionDate), "MMM d, yyyy")}
                </div>
              )}

              <p className="text-sm text-gray-700 line-clamp-3">
                {submission.abstract}
              </p>

              {submission.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {submission.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredSubmissions.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || eventFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first CFP submission"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CfpSubmissionsPage;