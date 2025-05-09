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
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  List, 
  MapPin, 
  Upload, 
  Plus, 
  Search 
} from "lucide-react";
import EventsList from "@/components/ui/events-list";
import CalendarView from "@/components/ui/calendar-view";
import AddEventModal from "@/components/ui/add-event-modal";
import EditEventModal from "@/components/ui/edit-event-modal";
import DeleteEventDialog from "@/components/ui/delete-event-dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

enum ViewMode {
  List = "list",
  Calendar = "calendar",
  Map = "map",
}

const EventsPage: FC = () => {
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Fetch events
  const { 
    data: events = [], 
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
  } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Fetch CFP counts
  const { 
    data: cfpSubmissions = [],
    isLoading: isLoadingCfp,
  } = useQuery({
    queryKey: ['/api/cfp-submissions'],
  });
  
  // Fetch attendee counts
  const { 
    data: attendees = [],
    isLoading: isLoadingAttendees,
  } = useQuery({
    queryKey: ['/api/attendees'],
  });
  
  // Fetch trip reports (assets of type trip_report)
  const {
    data: tripReports = [],
    isLoading: isLoadingTripReports,
  } = useQuery({
    queryKey: ['/api/assets'],
  });

  // Calculate counts and organize data for each event
  const cfpCounts = cfpSubmissions.reduce((acc: Record<number, number>, cfp: any) => {
    acc[cfp.eventId] = (acc[cfp.eventId] || 0) + 1;
    return acc;
  }, {});
  
  const attendeeCounts = attendees.reduce((acc: Record<number, number>, attendee: any) => {
    acc[attendee.eventId] = (acc[attendee.eventId] || 0) + 1;
    return acc;
  }, {});
  
  // Organize speakers and their submissions by event
  const eventSpeakers = cfpSubmissions.reduce((acc: Record<number, Array<{
    id: number, 
    name: string, 
    submissions: Array<{title: string, status: string}>
  }>>, cfp: any) => {
    if (!acc[cfp.eventId]) {
      acc[cfp.eventId] = [];
    }
    
    // Find if this speaker already exists in our array
    const existingIndex = acc[cfp.eventId].findIndex((speaker) => 
      speaker.id === cfp.submitterId && speaker.name === cfp.submitterName
    );
    
    // If speaker already exists, add this submission to their submissions array
    if (existingIndex !== -1) {
      acc[cfp.eventId][existingIndex].submissions.push({
        title: cfp.title,
        status: cfp.status
      });
    } else {
      // Add a new speaker with their first submission
      acc[cfp.eventId].push({
        id: cfp.submitterId || 0,
        name: cfp.submitterName,
        submissions: [{
          title: cfp.title,
          status: cfp.status
        }]
      });
    }
    
    return acc;
  }, {});
  
  // Debug our data structures
  console.log('CFP Submissions:', cfpSubmissions);
  console.log('Event Speakers:', eventSpeakers);
  
  // Organize attendees by event
  const eventAttendees = attendees.reduce((acc: Record<number, Array<{id: number, name: string}>>, attendee: any) => {
    if (!acc[attendee.eventId]) {
      acc[attendee.eventId] = [];
    }
    
    // Add the attendee if they don't already exist in the array
    const existingIndex = acc[attendee.eventId].findIndex((a) => 
      a.id === (attendee.userId || attendee.id) && a.name === attendee.name
    );
    
    if (existingIndex === -1) {
      acc[attendee.eventId].push({
        id: attendee.userId || attendee.id || 0,
        name: attendee.name
      });
    }
    
    return acc;
  }, {});
  
  // Organize trip reports by event
  const eventTripReports = tripReports
    .filter((asset: any) => asset.type === 'trip_report' && asset.eventId !== null)
    .reduce((acc: Record<number, Array<{id: number, name: string, uploadedByName: string}>>, asset: any) => {
      const eventId = asset.eventId!;
      if (!acc[eventId]) {
        acc[eventId] = [];
      }
      
      acc[eventId].push({
        id: asset.id,
        name: asset.name,
        uploadedByName: asset.uploadedByName || 'Unknown'
      });
      
      return acc;
    }, {});
  
  // Debug data
  console.log('Attendees:', attendees);
  console.log('Event Attendees:', eventAttendees);
  console.log('Trip Reports:', tripReports);
  console.log('Event Trip Reports:', eventTripReports);
  
  // Add event mutation
  const { mutate: addEvent, isPending: isAddingEvent } = useMutation({
    mutationFn: async (newEvent: any) => {
      // For debugging
      console.log('About to add event with data:', newEvent);
      return await apiRequest('POST', '/api/events', newEvent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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
      console.log('About to update event with data:', data);
      return await apiRequest('PUT', `/api/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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
    console.log('Event data to be submitted:', JSON.stringify(eventData, null, 2));
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
  
  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };
  
  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter events based on user selections
  const filteredEvents = events.filter((event: Event) => {
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
    if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      matches = false;
    }
    
    return matches;
  });
  
  // Loading state
  const isLoading = isLoadingEvents || isLoadingCfp || isLoadingAttendees || isLoadingTripReports;
  
  return (
    <div className="py-6">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
        {/* Dashboard header */}
        <div className="md:flex md:items-center md:justify-between pb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">Events Dashboard</h2>
          </div>
          <div className="flex mt-4 md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline" className="text-sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={openAddModal} className="text-sm">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>
        
        {/* View toggle and filters */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-3">
              <Button
                variant={viewMode === ViewMode.List ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.List)}
                className="px-3 py-2 text-sm font-medium"
              >
                <List className="mr-1 h-4 w-4" /> List
              </Button>
              <Button
                variant={viewMode === ViewMode.Calendar ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.Calendar)}
                className="px-3 py-2 text-sm font-medium"
              >
                <CalendarIcon className="mr-1 h-4 w-4" /> Calendar
              </Button>
              <Button
                variant={viewMode === ViewMode.Map ? "secondary" : "ghost"}
                onClick={() => setViewMode(ViewMode.Map)}
                className="px-3 py-2 text-sm font-medium"
              >
                <MapPin className="mr-1 h-4 w-4" /> Map
              </Button>
            </div>
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <Select
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
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
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : isErrorEvents ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-500">Failed to load events. Please try again.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/events'] })} className="mt-4">
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
              <CalendarView events={filteredEvents} />
            )}
            
            {viewMode === ViewMode.Map && (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Coming Soon</h3>
                <p className="text-gray-500">
                  We're working on an interactive map to visualize your events geographically.
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Pagination */}
        {filteredEvents.length > 0 && viewMode === ViewMode.List && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(filteredEvents.length, 12)}</span> of <span className="font-medium">{filteredEvents.length}</span> events
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
    </div>
  );
};

export default EventsPage;
