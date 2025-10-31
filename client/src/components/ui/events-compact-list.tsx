import React, { FC, useState } from "react";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { GoalBadge } from "@/components/ui/goal-badge";
import {
  Edit,
  Trash2,
  Users,
  FileText,
  MapPin,
  Calendar,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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
  onEventClick?: (event: Event) => void;
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
  onEventClick,
}) => {
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name || "";
        bValue = b.name || "";
        break;
      case "type":
        aValue = a.type || "";
        bValue = b.type || "";
        break;
      case "start_date":
        aValue = new Date(a.start_date);
        bValue = new Date(b.start_date);
        break;
      case "location":
        aValue = a.location || "";
        bValue = b.location || "";
        break;
      case "status":
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      case "priority":
        aValue = a.priority || "";
        bValue = b.priority || "";
        break;
      case "goal":
        aValue = a.goal || "";
        bValue = b.goal || "";
        break;
      case "attendees":
        aValue = attendeeCounts[a.id] || 0;
        bValue = attendeeCounts[b.id] || 0;
        break;
      case "cfp":
        aValue = cfpCounts[a.id] || 0;
        bValue = cfpCounts[b.id] || 0;
        break;
      case "reports":
        aValue = eventTripReports[a.id]?.length || 0;
        bValue = eventTripReports[b.id]?.length || 0;
        break;
      default:
        aValue = a.name || "";
        bValue = b.name || "";
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleRowClick = (event: Event, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onEventClick?.(event);
  };
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
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Event
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Type
                  {getSortIcon("type")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("start_date")}
              >
                <div className="flex items-center">
                  Dates
                  {getSortIcon("start_date")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("location")}
              >
                <div className="flex items-center">
                  Location
                  {getSortIcon("location")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon("status")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center">
                  Priority
                  {getSortIcon("priority")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("goal")}
              >
                <div className="flex items-center">
                  Goal
                  {getSortIcon("goal")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("attendees")}
              >
                <div className="flex items-center">
                  Participants
                  {getSortIcon("attendees")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("cfp")}
              >
                <div className="flex items-center">
                  CFP
                  {getSortIcon("cfp")}
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("reports")}
              >
                <div className="flex items-center">
                  Reports
                  {getSortIcon("reports")}
                </div>
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {sortedEvents.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={(e) => handleRowClick(event, e)}
                title="Click to view event details"
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div
                      className="text-sm font-medium text-foreground max-w-[200px] truncate"
                      title={event.name || ""}
                    >
                      {event.name || "Untitled Event"}
                    </div>
                    {/* Description field removed - not in event schema */}
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
                  <div className="flex flex-wrap gap-1">
                    {(typeof event.goal === "string"
                      ? JSON.parse(event.goal)
                      : event.goal || []
                    ).map((goal: string, index: number) => (
                      <GoalBadge key={index} goal={goal} />
                    ))}
                  </div>
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
                      className="h-7 w-7 p-0 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit event"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteEvent(event)}
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete event"
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
