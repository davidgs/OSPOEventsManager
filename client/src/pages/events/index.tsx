import { FC, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  List,
  MapPin,
  Upload,
  Plus,
  Search,
} from "lucide-react";
import EventsList from "@/components/ui/events-list";
import CalendarView from "@/components/ui/calendar-view";
import AddEventModal from "@/components/ui/add-event-modal-fixed";
import EditEventModal from "@/components/ui/edit-event-modal";
import DeleteEventDialog from "@/components/ui/delete-event-dialog";
import { CSVImportModal } from "@/components/ui/csv-import-modal";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import { z } from "zod";

enum ViewMode {
  List = "list",
  Calendar = "calendar",
  Map = "map",
}

const EventsPageContent: FC = () => {
  const { toast } = useToast();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.List);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events
  const {
    data: events = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
  } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events");
      if (!response.ok) {
        throw new Error("Failed to load events");
      }
      return response.json();
    },
  });

  // Fetch CFP counts
  const { data: cfpSubmissions = [], isLoading: isLoadingCfp } = useQuery({
    queryKey: ["/api/cfp-submissions"],
  });

  // Fetch attendee counts
  const { data: attendees = [], isLoading: isLoadingAttendees } = useQuery({
    queryKey: ["/api/attendees"],
  });

  // Fetch trip reports (assets of type trip_report)
  const { data: tripReports = [], isLoading: isLoadingTripReports } = useQuery({
    queryKey: ["/api/assets"],
  });

  // Calculate counts and organize data for each event
  const cfpCounts = (cfpSubmissions as any[]).reduce(
    (acc: Record<number, number>, cfp: any) => {
      acc[cfp.eventId] = (acc[cfp.eventId] || 0) + 1;
      return acc;
    },
    {}
  );

  const attendeeCounts = (attendees as any[]).reduce(
    (acc: Record<number, number>, attendee: any) => {
      acc[attendee.eventId] = (acc[attendee.eventId] || 0) + 1;
      return acc;
    },
    {}
  );

  // Organize speakers and their submissions by event
  const eventSpeakers = (cfpSubmissions as any[]).reduce(
    (
      acc: Record<
        number,
        Array<{
          id: number;
          name: string;
          submissions: Array<{ title: string; status: string }>;
        }>
      >,
      cfp: any
    ) => {
      if (!acc[cfp.eventId]) {
        acc[cfp.eventId] = [];
      }

      // Find if this speaker already exists in our array
      const existingIndex = acc[cfp.eventId].findIndex(
        (speaker) =>
          speaker.id === cfp.submitterId && speaker.name === cfp.submitterName
      );

      // If speaker already exists, add this submission to their submissions array
      if (existingIndex !== -1) {
        acc[cfp.eventId][existingIndex].submissions.push({
          title: cfp.title,
          status: cfp.status,
        });
      } else {
        // Add a new speaker with their first submission
        acc[cfp.eventId].push({
          id: cfp.submitterId || 0,
          name: cfp.submitterName,
          submissions: [
            {
              title: cfp.title,
              status: cfp.status,
            },
          ],
        });
      }

      return acc;
    },
    {}
  );

  // Debug our data structures
  console.log("CFP Submissions:", cfpSubmissions);
  console.log("Event Speakers:", eventSpeakers);

  // Organize attendees by event
  const eventAttendees = (attendees as any[]).reduce(
    (
      acc: Record<number, Array<{ id: number; name: string }>>,
      attendee: any
    ) => {
      if (!acc[attendee.eventId]) {
        acc[attendee.eventId] = [];
      }

      // Add the attendee if they don't already exist in the array
      const existingIndex = acc[attendee.eventId].findIndex(
        (a) =>
          a.id === (attendee.userId || attendee.id) && a.name === attendee.name
      );

      if (existingIndex === -1) {
        acc[attendee.eventId].push({
          id: attendee.userId || attendee.id || 0,
          name: attendee.name,
        });
      }

      return acc;
    },
    {}
  );

  // Organize trip reports by event
  const eventTripReports = (tripReports as any[])
    .filter(
      (asset: any) => asset.type === "trip_report" && asset.eventId !== null
    )
    .reduce(
      (
        acc: Record<
          number,
          Array<{ id: number; name: string; uploadedByName: string }>
        >,
        asset: any
      ) => {
        const eventId = asset.eventId!;
        if (!acc[eventId]) {
          acc[eventId] = [];
        }

        acc[eventId].push({
          id: asset.id,
          name: asset.name,
          uploadedByName: asset.uploadedByName || "Unknown",
        });

        return acc;
      },
      {}
    );

  // Debug data
  console.log("Attendees:", attendees);
  console.log("Event Attendees:", eventAttendees);
  console.log("Trip Reports:", tripReports);
  console.log("Event Trip Reports:", eventTripReports);

  // Add event mutation
  const { mutate: addEvent, isPending: isAddingEvent } = useMutation({
    mutationFn: async (newEvent: any) => {
      // For debugging
      console.log("About to add event with data:", newEvent);
      return await apiRequest("POST", "/api/events", newEvent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsAddModalOpen(false);
      toast({
        title: "Event Added",
        description: "The event has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add event",
        variant: "destructive",
      });
    },
  });

  // Edit event mutation
  const { mutate: updateEvent, isPending: isUpdatingEvent } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // For debugging
      console.log("About to update event with data:", data);
      return await apiRequest("PUT", `/api/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new event
  const handleAddEvent = (eventData: z.infer<any>) => {
    addEvent(eventData);
  };

  // Handle editing an event
  const handleEditEvent = (id: number, eventData: z.infer<any>) => {
    // Debug the event data being submitted
    console.log(
      "Event data to be submitted:",
      JSON.stringify(eventData, null, 2)
    );
    updateEvent({ id, data: eventData });
  };

  // Handle deleting an event
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
    }
  };

  // Event handlers for modals
  const openAddModal = () => setIsAddModalOpen(true);
  const openImportModal = () => setIsImportModalOpen(true);

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  // Handle import completion
  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    toast({
      title: "Import Complete",
      description: "Events have been imported successfully.",
    });
  };

  // Filter events based on user selections
  const filteredEvents = (events as Event[]).filter((event: Event) => {
    let matches = true;

    // Filter by event type
    if (eventTypeFilter !== "all" && event.type !== eventTypeFilter) {
      matches = false;
    }

    // Filter by priority
    if (priorityFilter !== "all" && event.priority !== priorityFilter) {
      matches = false;
    }

    // Filter by search term
    if (
      searchTerm &&
      !event.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !event.location.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });

  // Loading state
  const isLoading =
    isLoadingEvents ||
    isLoadingCfp ||
    isLoadingAttendees ||
    isLoadingTripReports;

  return (
    <div className="py-4 sm:py-6">
      <div className="px-3 sm:px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Dashboard header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-6 gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold leading-7 text-foreground sm:truncate">
              Events Dashboard
            </h2>
          </div>
          <div className="flex mt-2 sm:mt-0 sm:ml-4 space-x-2 sm:space-x-3">
            <Button
              variant="outline"
              onClick={openImportModal}
              className="text-xs sm:text-sm px-2 py-1 h-8 sm:h-auto"
            >
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Import</span>
            </Button>
            <Button
              onClick={openAddModal}
              className="text-xs sm:text-sm px-2 py-1 h-8 sm:h-auto"
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">New Event</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* View toggle and filters */}
        <div className="mb-4 sm:mb-6 bg-card shadow rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex space-x-1 sm:space-x-3">
              <Button
                variant={viewMode === ViewMode.List ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.List)}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium h-8 sm:h-auto"
              >
                <List className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                <span className="hidden xs:inline">List</span>
              </Button>
              <Button
                variant={viewMode === ViewMode.Calendar ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.Calendar)}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium h-8 sm:h-auto"
              >
                <CalendarIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                <span className="hidden xs:inline">Calendar</span>
              </Button>
              <Button
                variant={viewMode === ViewMode.Map ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.Map)}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium h-8 sm:h-auto"
              >
                <MapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                <span className="hidden xs:inline">Map</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              <Select
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
              >
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto min-w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto min-w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative col-span-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : isErrorEvents ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-500">
                Failed to load events. Please try again.
              </p>
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["/api/events"] })
                }
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === ViewMode.List && (
              <EventsList
                events={filteredEvents}
                cfpCounts={cfpCounts}
                attendeeCounts={attendeeCounts}
                eventSpeakers={eventSpeakers}
                eventAttendees={eventAttendees}
                eventTripReports={eventTripReports}
                onAddEvent={openAddModal}
                onEditEvent={openEditModal}
                onDeleteEvent={openDeleteDialog}
              />
            )}

            {viewMode === ViewMode.Calendar && (
              <CalendarView
                events={filteredEvents}
                cfpCounts={cfpCounts}
                attendeeCounts={attendeeCounts}
                tripReportCounts={eventTripReports}
                eventSpeakers={eventSpeakers}
                eventAttendees={eventAttendees}
              />
            )}

            {viewMode === ViewMode.Map && (
              <div className="bg-card shadow rounded-lg p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Map View Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  We're working on an interactive map to visualize your events
                  geographically.
                </p>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {filteredEvents.length > 0 && viewMode === ViewMode.List && (
          <div className="flex items-center justify-between mt-4 sm:mt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Previous
              </Button>
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-foreground">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">
                    {Math.min(filteredEvents.length, 12)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredEvents.length}</span>{" "}
                  events
                </p>
              </div>
              {filteredEvents.length > 12 && (
                <div>
                  {/* Pagination controls would go here when we implement pagination */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEvent}
        isSubmitting={isAddingEvent}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditEvent}
        event={selectedEvent}
        isSubmitting={isUpdatingEvent}
      />

      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteEvent}
        event={selectedEvent}
        isDeleting={isDeletingEvent}
      />

      <CSVImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

const EventsPage: FC = () => {
  console.log("EventsPage mounting");

  return (
    <ProtectedRoute>
      <EventsPageContent />
    </ProtectedRoute>
  );
};

export default EventsPage;
