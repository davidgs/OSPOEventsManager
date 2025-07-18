import { FC } from "react";
import EventCard from "@/components/ui/event-card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Event } from "@shared/schema";

interface EventsListProps {
  events: Event[];
  cfpCounts: Record<number, number>;
  attendeeCounts: Record<number, number>;
  eventSpeakers: Record<
    number,
    Array<{
      id: number;
      name: string;
      submissions: Array<{ title: string; status: string }>;
    }>
  >;
  eventAttendees: Record<number, Array<{ id: number; name: string }>>;
  eventTripReports?: Record<
    number,
    Array<{ id: number; name: string; uploadedByName: string }>
  >;
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

const EventsList: FC<EventsListProps> = ({
  events,
  cfpCounts,
  attendeeCounts,
  eventSpeakers,
  eventAttendees,
  eventTripReports = {},
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 px-2 sm:px-0">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          cfpCount={cfpCounts[event.id] || 0}
          attendeeCount={attendeeCounts[event.id] || 0}
          speakers={eventSpeakers[event.id] || []}
          attendees={eventAttendees[event.id] || []}
          tripReports={eventTripReports[event.id] || []}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
        />
      ))}

      {/* Add event card */}
      <Button
        onClick={onAddEvent}
        variant="outline"
        className="h-full min-h-[250px] sm:min-h-[300px] relative block w-full rounded-lg border-2 border-dashed border-border p-4 sm:p-12 text-center hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className="flex flex-col items-center justify-center">
          <PlusCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
          <span className="block text-sm font-medium text-muted-foreground">
            Add new event
          </span>
        </div>
      </Button>
    </div>
  );
};

export default EventsList;
