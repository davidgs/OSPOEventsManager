import { FC } from "react";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { GoalBadge } from "@/components/ui/goal-badge";
import { Edit, Trash2, Users, FileText, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface EventsCompactListProps {
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
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

const EventsCompactList: FC<EventsCompactListProps> = ({
  events,
  cfpCounts,
  attendeeCounts,
  eventSpeakers,
  eventAttendees,
  eventTripReports = {},
  onEditEvent,
  onDeleteEvent,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.toDateString() === end.toDateString()) {
        return format(start, "MMM dd, yyyy");
      } else {
        return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
      }
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  return (
    <div className="bg-card shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Event
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dates
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Goal
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Participants
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CFP
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reports
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div
                      className="text-sm font-medium text-foreground max-w-[200px] truncate"
                      title={event.name || ""}
                    >
                      {event.name || "Untitled Event"}
                    </div>
                    {event.description && (
                      <div
                        className="text-xs text-muted-foreground max-w-[200px] truncate"
                        title={event.description}
                      >
                        {event.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <TypeBadge type={event.type} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {event.end_date
                      ? formatDateRange(event.start_date, event.end_date)
                      : formatDate(event.start_date)}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div
                    className="flex items-center text-xs text-muted-foreground max-w-[150px] truncate"
                    title={event.location || ""}
                  >
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    {event.location || "—"}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <StatusBadge status={event.status} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <PriorityBadge priority={event.priority} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {event.goal && <GoalBadge goal={event.goal} />}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {attendeeCounts[event.id] || 0}
                    </div>
                    {(eventSpeakers[event.id]?.length || 0) > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {eventSpeakers[event.id]?.length} speakers
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    {cfpCounts[event.id] || 0}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    {eventTripReports[event.id]?.length || 0}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditEvent(event)}
                      className="h-7 w-7 p-0 hover:bg-muted"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEvent(event)}
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No events found matching your criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCompactList;
// Force rebuild Wed Sep  3 14:31:48 EDT 2025
