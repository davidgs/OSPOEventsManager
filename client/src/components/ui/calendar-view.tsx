import { FC, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Edit,
  Trash2,
  MapPin,
  Clock,
  BookOpen,
  User,
  Mic,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  differenceInDays,
  isSameDay,
} from "date-fns";
import { Event } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocation } from "wouter";

interface CalendarViewProps {
  events: Event[];
  cfpCounts?: Record<number, number>;
  attendeeCounts?: Record<number, number>;
  tripReportCounts?: Record<number, Record<string, any>[]>;
  eventSpeakers?: Record<
    number,
    Array<{
      id: number;
      name: string;
      submissions: Array<{ title: string; status: string }>;
    }>
  >;
  eventAttendees?: Record<number, Array<{ id: number; name: string }>>;
  onEditEvent?: (event: Event) => void;
}

const CalendarView: FC<CalendarViewProps> = ({
  events,
  cfpCounts = {},
  attendeeCounts = {},
  tripReportCounts = {},
  eventSpeakers = {},
  eventAttendees = {},
  onEditEvent,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [, setLocation] = useLocation();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get all days for current month view including padding days from prev/next months
  const getDaysForCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDay = getDay(monthStart);
    const endDay = 6 - getDay(monthEnd);

    // Calculate the start and end dates including days from previous and next months
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - startDay);

    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + endDay);

    // Get all days in the range
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // Check if event occurs on a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      // Check if day is within event date range
      return day >= eventStart && day <= eventEnd;
    });
  };

  // Get CFP deadlines occurring on a specific day
  const getCfpDeadlinesForDay = (day: Date) => {
    return events.filter((event) => {
      if (!event.cfp_deadline) return false;
      const cfpDeadline = new Date(event.cfp_deadline);
      return isSameDay(day, cfpDeadline);
    });
  };

  // Helper function to get CFP deadline color based on proximity
  const getCfpDeadlineColor = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = differenceInDays(deadlineDate, now);

    if (daysUntil <= 7) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"; // Less than a week: red
    } else if (daysUntil <= 14) {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"; // Less than two weeks: yellow
    } else {
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"; // More than two weeks: green
    }
  };

  // Helper function to get border color based on priority
  const getBorderColor = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || "";
    switch (priorityLower) {
      case "essential":
        return "border-purple-600 dark:border-purple-400 border-2";
      case "high":
        return "border-red-500 dark:border-red-400";
      case "medium":
        return "border-yellow-500 dark:border-yellow-400";
      case "low":
        return "border-green-500 dark:border-green-400";
      case "nice to have":
        return "border-blue-500 dark:border-blue-400";
      default:
        return "border-border";
    }
  };

  // Calendar days
  const calendarDays = getDaysForCalendar();

  // Count events in current month
  const eventsInMonth = events.filter((event) => {
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return (
      (eventStart <= monthEnd && eventStart >= monthStart) ||
      (eventEnd <= monthEnd && eventEnd >= monthStart) ||
      (eventStart <= monthStart && eventEnd >= monthEnd)
    );
  });

  // Render mini event card for popover
  const renderEventCard = (event: Event) => {
    const cfpCount = cfpCounts[event.id] || 0;
    const attendeeCount = attendeeCounts[event.id] || 0;
    const tripReports = tripReportCounts[event.id] || [];
    const speakers = eventSpeakers[event.id] || [];
    const attendees = eventAttendees[event.id] || [];

    return (
      <div
        className={`border-l-4 ${getBorderColor(
          event.priority
        )} bg-card rounded p-3`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-foreground">
            {event.name}
          </h3>
        </div>

        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
          <span>{event.location}</span>
        </div>

        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
          <span>
            {format(new Date(event.start_date), "MMM d, yyyy")} -{" "}
            {format(new Date(event.end_date), "MMM d, yyyy")}
          </span>
        </div>

        {event.cfp_deadline && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Clock className="h-3 w-3 text-muted-foreground mr-1" />
            <span>
              CFP Deadline:{" "}
              {format(new Date(event.cfp_deadline), "MMM d, yyyy")}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-4 mt-2 mb-2 text-xs">
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{cfpCount} CFPs</span>
          </div>

          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {attendeeCount} Attendees
            </span>
          </div>

          {tripReports.length > 0 && (
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {tripReports.length} Reports
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {(typeof event.goal === "string"
            ? JSON.parse(event.goal)
            : event.goal
          ).map((goal: string, index: number) => {
            if (goal === "speaking") {
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-xs"
                >
                  <Mic className="h-2 w-2 mr-1" />
                  Speaking
                </Badge>
              );
            } else if (goal === "attending") {
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-xs"
                >
                  <User className="h-2 w-2 mr-1" />
                  Attending
                </Badge>
              );
            } else {
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className={
                    goal === "sponsoring"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30 text-xs"
                      : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-xs"
                  }
                >
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                </Badge>
              );
            }
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/events/${event.id}`)}
            className="flex-1"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Details
          </Button>
          {onEditEvent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditEvent(event)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit Event
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border shadow rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {eventsInMonth.length} events this month
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="text-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="text-sm">
            Today
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px border-b border-border">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center py-2 text-sm font-medium text-muted-foreground bg-muted/30"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {calendarDays.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day);
            const cfpDeadlines = getCfpDeadlinesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <div
                key={dayIdx}
                className={cn(
                  "min-h-[6rem] px-2 py-2 bg-card",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                  isCurrentMonth && "bg-card",
                  isTodayDate && "bg-accent/20 ring-1 ring-accent"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate && "text-accent-foreground font-bold",
                    !isCurrentMonth && "text-muted-foreground",
                    isCurrentMonth && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>

                <div className="mt-1 overflow-y-auto max-h-24 space-y-1">
                  {/* Show CFP deadlines */}
                  {cfpDeadlines.length > 0 &&
                    cfpDeadlines.map((event) => (
                      <Popover key={`cfp-${event.id}`}>
                        <PopoverTrigger asChild>
                          <div
                            className={cn(
                              "p-1 rounded text-xs mb-1 cursor-pointer border",
                              getCfpDeadlineColor(event.cfp_deadline!)
                            )}
                            title={`CFP Deadline: ${event.name}`}
                          >
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="truncate">
                                CFP: {event.name}
                              </span>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          {renderEventCard(event)}
                        </PopoverContent>
                      </Popover>
                    ))}

                  {/* Show events */}
                  {dayEvents.length > 0 &&
                    dayEvents.map((event) => (
                      <Popover key={`event-${event.id}`}>
                        <PopoverTrigger asChild>
                          <div
                            className="bg-primary/10 hover:bg-primary/15 border border-primary/20 p-2 rounded text-xs mb-1 cursor-pointer space-y-1 transition-colors"
                            title={event.name}
                          >
                            <div className="truncate font-medium text-foreground">
                              {event.name}
                            </div>
                            <div className="flex justify-center">
                              <PriorityBadge
                                priority={event.priority}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          {renderEventCard(event)}
                        </PopoverContent>
                      </Popover>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
