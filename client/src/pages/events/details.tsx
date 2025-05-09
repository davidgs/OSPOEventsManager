import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import { 
  Calendar, ChevronLeft, Edit, ExternalLink, MapPin, Clipboard, 
  Users, FileText, DollarSign, AlertTriangle, File, Link as LinkIcon,
  FileText as FileTextIcon, PresentationIcon, Download, Eye, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import EditEventModal from "@/components/ui/edit-event-modal";
import DeleteEventDialog from "@/components/ui/delete-event-dialog";
import { LinkAssetModal } from "@/components/modals/link-asset-modal";
import { z } from "zod";

const EventDetailsPage: FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = parseInt(id);
  
  // States for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLinkAssetModalOpen, setIsLinkAssetModalOpen] = useState(false);
  
  // Fetch event details
  const { 
    data: event, 
    isLoading: isLoadingEvent,
    isError: isErrorEvent
  } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    enabled: !isNaN(eventId),
  });
  
  // Fetch CFP submissions for this event
  const { 
    data: cfpSubmissions = [],
    isLoading: isLoadingCfp,
  } = useQuery({
    queryKey: ['/api/cfp-submissions', eventId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/cfp-submissions?eventId=${eventId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch CFP submissions');
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });
  
  // Fetch attendees for this event
  const { 
    data: attendees = [],
    isLoading: isLoadingAttendees,
  } = useQuery({
    queryKey: ['/api/attendees', eventId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/attendees?eventId=${eventId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch attendees');
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });
  
  // Fetch sponsorships for this event
  const { 
    data: sponsorships = [],
    isLoading: isLoadingSponsorships,
  } = useQuery({
    queryKey: ['/api/sponsorships', eventId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/sponsorships?eventId=${eventId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch sponsorships');
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });
  
  // Fetch assets related to this event (abstracts, trip reports, presentations)
  const {
    data: eventAssets = [],
    isLoading: isLoadingAssets,
  } = useQuery({
    queryKey: ['/api/assets', 'event', eventId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/assets?eventId=${eventId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch event assets');
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });
  
  // Edit event mutation
  const { mutate: updateEvent, isPending: isUpdatingEvent } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      setIsEditModalOpen(false);
      toast({
        title: "Event Updated",
        description: "The event has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });
  
  // Delete event mutation
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });
  
  // Handle editing an event
  const handleEditEvent = (id: number, eventData: z.infer<any>) => {
    updateEvent({ id, data: eventData });
  };
  
  // Handle deleting an event
  const handleDeleteEvent = () => {
    if (event) {
      deleteEvent(event.id);
    }
  };
  
  // Determine priority badge style
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Planning</Badge>;
    }
  };
  
  const getTypeBadge = (type: string) => {
    return <Badge variant="outline" className="bg-blue-100 text-blue-800">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };
  
  const getGoalBadge = (goal: string) => {
    switch (goal) {
      case "speaking":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Speaking</Badge>;
      case "sponsoring":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Sponsoring</Badge>;
      case "attending":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Attending</Badge>;
      case "exhibiting":
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Exhibiting</Badge>;
      default:
        return null;
    }
  };
  
  const isLoading = isLoadingEvent || isLoadingCfp || isLoadingAttendees || isLoadingSponsorships || isLoadingAssets;
  
  if (isNaN(eventId)) {
    return (
      <div className="py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Invalid Event ID</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>The event ID provided is not valid. Please check the URL and try again.</p>
                </div>
                <div className="mt-4">
                  <Link href="/events">
                    <Button size="sm" variant="outline">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Events
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isErrorEvent) {
    return (
      <div className="py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Event</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>There was an error loading the event details. Please try again later.</p>
                </div>
                <div className="mt-4">
                  <Link href="/events">
                    <Button size="sm" variant="outline">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Events
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading event details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Event Not Found</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The event you're looking for doesn't exist or has been removed.</p>
                </div>
                <div className="mt-4">
                  <Link href="/events">
                    <Button size="sm" variant="outline">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Events
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Back button and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <Link href="/events">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Event
            </Button>
            <Button size="sm" asChild>
              <a href={event.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Event Website
              </a>
            </Button>
          </div>
        </div>
        
        {/* Event header */}
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {getPriorityBadge(event.priority)}
                {getTypeBadge(event.type)}
                {getGoalBadge(event.goal)}
                <Badge variant="outline" className="bg-gray-100 text-gray-800">{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              
              <div className="flex items-center text-gray-500 mb-2">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center text-gray-500 mb-4">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span>{format(new Date(event.startDate), "MMMM d, yyyy")} - {format(new Date(event.endDate), "MMMM d, yyyy")}</span>
              </div>
              
              {event.cfpDeadline && (
                <div className={`flex items-center p-3 rounded-md mb-4 ${
                  new Date(event.cfpDeadline) > new Date() 
                    ? "bg-yellow-50 text-yellow-800" 
                    : "bg-gray-50 text-gray-600"
                }`}>
                  <Clipboard className="h-5 w-5 mr-2" />
                  <span>
                    CFP Deadline: <strong>{format(new Date(event.cfpDeadline), "MMMM d, yyyy")}</strong>
                    {new Date(event.cfpDeadline) > new Date() && (
                      <span className="ml-1">
                        ({Math.ceil((new Date(event.cfpDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {event.notes && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-line">{event.notes}</p>
                </div>
              )}
            </div>
            
            <div className="md:w-64 flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">ATTENDANCE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">{attendees.length} Attendees</span>
                    </div>
                    <Link href={`/attendees?eventId=${event.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">CFP SUBMISSIONS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">{cfpSubmissions.length} Submissions</span>
                    </div>
                    <Link href={`/cfp-submissions?eventId=${event.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">SPONSORSHIP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">{sponsorships.length} Sponsorships</span>
                    </div>
                    <Link href={`/sponsorships?eventId=${event.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Tabs content */}
        <Tabs defaultValue="attendees" className="mb-6">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="attendees" className="text-sm">
              <Users className="mr-2 h-4 w-4" />
              Attendees
            </TabsTrigger>
            <TabsTrigger value="cfp-submissions" className="text-sm">
              <FileText className="mr-2 h-4 w-4" />
              CFP Submissions
            </TabsTrigger>
            <TabsTrigger value="sponsorships" className="text-sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Sponsorships
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-sm">
              <File className="mr-2 h-4 w-4" />
              Assets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event Attendees</CardTitle>
                  <Link href={`/attendees?eventId=${event.id}`}>
                    <Button size="sm">
                      Manage Attendees
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Attendees Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding attendees for this event.</p>
                    <div className="mt-6">
                      <Link href={`/attendees?eventId=${event.id}`}>
                        <Button>Add Attendees</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendees.slice(0, 5).map((attendee) => (
                          <tr key={attendee.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{attendee.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{attendee.role || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{attendee.email || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {attendees.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right">
                        <Link href={`/attendees?eventId=${event.id}`}>
                          <Button variant="link" className="text-sm">View all {attendees.length} attendees</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cfp-submissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>CFP Submissions</CardTitle>
                  <Link href={`/cfp-submissions?eventId=${event.id}`}>
                    <Button size="sm">
                      Manage Submissions
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {cfpSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No CFP Submissions Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding CFP submissions for this event.</p>
                    <div className="mt-6">
                      <Link href={`/cfp-submissions?eventId=${event.id}`}>
                        <Button>Add Submission</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitter</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cfpSubmissions.slice(0, 5).map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{submission.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.submitterName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                submission.status === "accepted" ? "bg-green-100 text-green-800" :
                                submission.status === "rejected" ? "bg-red-100 text-red-800" :
                                submission.status === "submitted" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cfpSubmissions.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right">
                        <Link href={`/cfp-submissions?eventId=${event.id}`}>
                          <Button variant="link" className="text-sm">View all {cfpSubmissions.length} submissions</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sponsorships">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sponsorships</CardTitle>
                  <Link href={`/sponsorships?eventId=${event.id}`}>
                    <Button size="sm">
                      Manage Sponsorships
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sponsorships.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Sponsorships Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding sponsorships for this event.</p>
                    <div className="mt-6">
                      <Link href={`/sponsorships?eventId=${event.id}`}>
                        <Button>Add Sponsorship</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sponsorships.slice(0, 5).map((sponsorship) => (
                          <tr key={sponsorship.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sponsorship.level}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sponsorship.amount || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                sponsorship.status === "confirmed" ? "bg-green-100 text-green-800" :
                                sponsorship.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                sponsorship.status === "cancelled" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sponsorships.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right">
                        <Link href={`/sponsorships?eventId=${event.id}`}>
                          <Button variant="link" className="text-sm">View all {sponsorships.length} sponsorships</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event Assets</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsLinkAssetModalOpen(true)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Link Existing
                    </Button>
                    <Link href={`/assets?eventId=${event.id}`}>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Asset
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {eventAssets.length === 0 ? (
                  <div className="text-center py-8">
                    <File className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Assets Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding assets for this event.</p>
                    <div className="mt-6">
                      <Link href={`/assets?eventId=${event.id}`}>
                        <Button>Add Asset</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventAssets.map((asset) => (
                      <div key={asset.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="h-40 bg-gray-100 relative flex items-center justify-center p-4">
                          {asset.mimeType.startsWith('image/') ? (
                            <div className="w-full h-full">
                              <img
                                src={asset.filePath.startsWith('/') ? asset.filePath : `/${asset.filePath}`}
                                alt={asset.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              {asset.type === 'abstract' ? (
                                <FileTextIcon className="h-16 w-16 text-blue-500" />
                              ) : asset.type === 'presentation' ? (
                                <PresentationIcon className="h-16 w-16 text-purple-500" />
                              ) : asset.type === 'trip_report' ? (
                                <FileTextIcon className="h-16 w-16 text-green-500" />
                              ) : (
                                <File className="h-16 w-16 text-gray-500" />
                              )}
                              <span className="mt-2 text-sm text-gray-500 uppercase">
                                {asset.mimeType.split('/')[1]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="mb-1">
                            <span className="text-xs font-medium bg-gray-100 rounded-full px-2 py-1 capitalize">
                              {asset.type.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{asset.name}</h3>
                          <p className="text-xs text-gray-500 mb-3">By {asset.uploadedByName || 'Unknown'}</p>
                          <div className="flex justify-between">
                            <a 
                              href={asset.filePath.startsWith('/') ? asset.filePath : `/${asset.filePath}`}
                              download
                              className="text-xs flex items-center text-blue-600 hover:underline"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                            <Link href={`/assets/${asset.id}`} className="text-xs flex items-center text-blue-600 hover:underline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {eventAssets.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link href={`/assets?eventId=${event.id}`}>
                      <Button variant="outline">View All Assets</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modals */}
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditEvent}
        event={event}
        isSubmitting={isUpdatingEvent}
      />
      
      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteEvent}
        event={event}
        isDeleting={isDeletingEvent}
      />
      
      <LinkAssetModal
        isOpen={isLinkAssetModalOpen}
        onClose={() => setIsLinkAssetModalOpen(false)}
        eventId={eventId}
      />
    </div>
  );
};

export default EventDetailsPage;
