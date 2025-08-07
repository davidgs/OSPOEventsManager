import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import {
  Calendar,
  ChevronLeft,
  Edit,
  ExternalLink,
  MapPin,
  Clipboard,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  File,
  Link as LinkIcon,
  FileText as FileTextIcon,
  PresentationIcon,
  Download,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { GoalBadge } from "@/components/ui/goal-badge";
import { StatusBadge } from "@/components/ui/status-badge";
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
    isError: isErrorEvent,
  } = useQuery({
    queryKey: [`/api/events/${eventId}`],
    enabled: !isNaN(eventId),
  });

  // Fetch CFP submissions for this event
  const { data: cfpSubmissions = [], isLoading: isLoadingCfp } = useQuery({
    queryKey: ["/api/cfp-submissions", eventId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest(
        "GET",
        `/api/cfp-submissions?eventId=${eventId}`
      );
      if (!res.ok) throw new Error("Failed to fetch CFP submissions");
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });

  // Fetch attendees for this event
  const { data: attendees = [], isLoading: isLoadingAttendees } = useQuery({
    queryKey: ["/api/attendees", eventId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", `/api/attendees?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch attendees");
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });

  // Fetch sponsorships for this event
  const { data: sponsorships = [], isLoading: isLoadingSponsorships } =
    useQuery({
      queryKey: ["/api/sponsorships", eventId],
      queryFn: async ({ queryKey }) => {
        const res = await apiRequest(
          "GET",
          `/api/sponsorships?eventId=${eventId}`
        );
        if (!res.ok) throw new Error("Failed to fetch sponsorships");
        return await res.json();
      },
      enabled: !isNaN(eventId),
    });

  // Fetch assets related to this event (abstracts, trip reports, presentations)
  const { data: eventAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["/api/assets", "event", eventId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest("GET", `/api/assets?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch event assets");
      return await res.json();
    },
    enabled: !isNaN(eventId),
  });

  // Edit event mutation
  const { mutate: updateEvent, isPending: isUpdatingEvent } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/events/${id}`, data);
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
      await apiRequest("DELETE", `/api/events/${id}`);
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

  const isLoading =
    isLoadingEvent ||
    isLoadingCfp ||
    isLoadingAttendees ||
    isLoadingSponsorships ||
    isLoadingAssets;

  if (isNaN(eventId)) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-destructive">
                  Invalid Event ID
                </h3>
                <div className="mt-2 text-muted-foreground">
                  <p>
                    The event ID provided is not valid. Please check the URL and
                    try again.
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/events">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
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
      <div className="min-h-screen bg-background py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-destructive">
                  Error Loading Event
                </h3>
                <div className="mt-2 text-muted-foreground">
                  <p>
                    There was an error loading the event details. Please try
                    again later.
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/events">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
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
      <div className="min-h-screen bg-background py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto"></div>
              <p className="mt-6 text-lg text-muted-foreground">
                Loading event details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Event Not Found
                </h3>
                <div className="mt-2 text-yellow-700 dark:text-yellow-300">
                  <p>
                    The event you're looking for doesn't exist or has been
                    removed.
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/events">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
                    >
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
    <div className="min-h-screen bg-background py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Back button and actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <Link href="/events">
              <Button variant="outline" size="sm" className="hover:bg-accent">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="hover:bg-accent"
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
            <Button
              size="sm"
              asChild
              className="bg-primary hover:bg-primary/90"
            >
              <a href={event.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Event Website
              </a>
            </Button>
          </div>
        </div>

        {/* Event header */}
        <div className="mb-8 bg-card border-border shadow-lg rounded-xl p-8">
          <div className="flex flex-col xl:flex-row xl:items-start gap-8">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={event.priority} />
                  <TypeBadge type={event.type} />
                  {Array.isArray(event.goal)
                    ? event.goal.map((goal: string, index: number) => (
                        <GoalBadge key={index} goal={goal} />
                      ))
                    : JSON.parse(event.goal || "[]").map(
                        (goal: string, index: number) => (
                          <GoalBadge key={index} goal={goal} />
                        )
                      )}
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-medium"
                  >
                    {event.status.charAt(0).toUpperCase() +
                      event.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Event title */}
              <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
                {event.name}
              </h1>

              {/* Event details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-lg">{event.location}</span>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-lg">
                    {event.start_date && event.end_date ? (
                      <>
                        {format(new Date(event.start_date), "MMMM d, yyyy")} -{" "}
                        {format(new Date(event.end_date), "MMMM d, yyyy")}
                      </>
                    ) : (
                      "Date TBD"
                    )}
                  </span>
                </div>
              </div>

              {/* CFP Deadline */}
              {event.cfp_deadline && (
                <div
                  className={`flex items-center p-4 rounded-lg mb-6 border-l-4 ${
                    new Date(event.cfp_deadline) > new Date()
                      ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 border-yellow-400"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Clipboard className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      CFP Deadline:{" "}
                      {format(new Date(event.cfp_deadline), "MMMM d, yyyy")}
                    </p>
                    {new Date(event.cfp_deadline) > new Date() && (
                      <p className="text-sm opacity-75 mt-1">
                        {Math.ceil(
                          (new Date(event.cfp_deadline).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days remaining
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {event.notes && (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Notes
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {event.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Stats cards */}
            <div className="xl:w-80 flex flex-col gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {attendees.length}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Attendees
                        </p>
                      </div>
                    </div>
                    <Link href={`/attendees?eventId=${event.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                    CFP Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {cfpSubmissions.length}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Submissions
                        </p>
                      </div>
                    </div>
                    <Link href={`/cfp-submissions?eventId=${event.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/30"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                    Sponsorship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {sponsorships.length}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Sponsorships
                        </p>
                      </div>
                    </div>
                    <Link href={`/sponsorships?eventId=${event.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30"
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="attendees" className="mb-8">
          <TabsList className="grid grid-cols-4 mb-8 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="attendees"
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Attendees
            </TabsTrigger>
            <TabsTrigger
              value="cfp-submissions"
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              CFP Submissions
            </TabsTrigger>
            <TabsTrigger
              value="sponsorships"
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Sponsorships
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <File className="mr-2 h-4 w-4" />
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendees">
            <Card className="border-border shadow-md">
              <CardHeader className="border-b border-border bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Event Attendees
                  </CardTitle>
                  <Link href={`/attendees?eventId=${event.id}`}>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Manage Attendees
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {attendees.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      No Attendees Yet
                    </h3>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                      Get started by adding attendees for this event to track
                      participation and engagement.
                    </p>
                    <div className="mt-8">
                      <Link href={`/attendees?eventId=${event.id}`}>
                        <Button className="bg-primary hover:bg-primary/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Attendees
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {attendees
                            .slice(0, 10)
                            .map((attendee: any, index: number) => (
                              <tr
                                key={attendee.id}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-medium text-primary">
                                        {attendee.name
                                          ? attendee.name
                                              .charAt(0)
                                              .toUpperCase()
                                          : "A"}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-foreground">
                                        {attendee.name || "Anonymous Attendee"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                    variant="secondary"
                                    className="bg-muted text-muted-foreground"
                                  >
                                    {attendee.role || "Attendee"}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                  {attendee.email || "No email provided"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {attendees.length > 10 && (
                      <div className="px-6 py-4 bg-muted/20 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center">
                          Showing 10 of {attendees.length} attendees.{" "}
                          <Link
                            href={`/attendees?eventId=${event.id}`}
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            View all attendees
                          </Link>
                        </p>
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
                    <Button size="sm">Manage Submissions</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {cfpSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No CFP Submissions Yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding CFP submissions for this event.
                    </p>
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
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Title
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Submitter
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cfpSubmissions.slice(0, 5).map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {submission.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {submission.submitterName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  submission.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : submission.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : submission.status === "submitted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {submission.status.charAt(0).toUpperCase() +
                                  submission.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cfpSubmissions.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right">
                        <Link href={`/cfp-submissions?eventId=${event.id}`}>
                          <Button variant="link" className="text-sm">
                            View all {cfpSubmissions.length} submissions
                          </Button>
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
                    <Button size="sm">Manage Sponsorships</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sponsorships.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Sponsorships Yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding sponsorships for this event.
                    </p>
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
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Level
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sponsorships.slice(0, 5).map((sponsorship) => (
                          <tr key={sponsorship.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sponsorship.level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sponsorship.amount || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  sponsorship.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : sponsorship.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : sponsorship.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {sponsorship.status.charAt(0).toUpperCase() +
                                  sponsorship.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sponsorships.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right">
                        <Link href={`/sponsorships?eventId=${event.id}`}>
                          <Button variant="link" className="text-sm">
                            View all {sponsorships.length} sponsorships
                          </Button>
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Assets Yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding assets for this event.
                    </p>
                    <div className="mt-6">
                      <Link href={`/assets?eventId=${event.id}`}>
                        <Button>Add Asset</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                      >
                        <div className="h-40 bg-gray-100 relative flex items-center justify-center p-4">
                          {asset.mimeType.startsWith("image/") ? (
                            <div className="w-full h-full">
                              <img
                                src={
                                  asset.filePath.startsWith("/")
                                    ? asset.filePath
                                    : `/${asset.filePath}`
                                }
                                alt={asset.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              {asset.type === "abstract" ? (
                                <FileTextIcon className="h-16 w-16 text-blue-500" />
                              ) : asset.type === "presentation" ? (
                                <PresentationIcon className="h-16 w-16 text-purple-500" />
                              ) : asset.type === "trip_report" ? (
                                <FileTextIcon className="h-16 w-16 text-green-500" />
                              ) : (
                                <File className="h-16 w-16 text-gray-500" />
                              )}
                              <span className="mt-2 text-sm text-gray-500 uppercase">
                                {asset.mimeType.split("/")[1]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="mb-1">
                            <span className="text-xs font-medium bg-gray-100 rounded-full px-2 py-1 capitalize">
                              {asset.type.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                            {asset.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            By {asset.uploadedByName || "Unknown"}
                          </p>
                          <div className="flex justify-between">
                            <a
                              href={
                                asset.filePath.startsWith("/")
                                  ? asset.filePath
                                  : `/${asset.filePath}`
                              }
                              download
                              className="text-xs flex items-center text-blue-600 hover:underline"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                            <Link
                              href={`/assets/${asset.id}`}
                              className="text-xs flex items-center text-blue-600 hover:underline"
                            >
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
