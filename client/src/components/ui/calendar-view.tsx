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
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, differenceInDays, isSameDay } from "date-fns";
import { Event } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CalendarViewProps {
  events: Event[];
  cfpCounts?: Record<number, number>;
  attendeeCounts?: Record<number, number>;
  tripReportCounts?: Record<number, Record<string, any>[]>;
  eventSpeakers?: Record<number, Array<{id: number, name: string, submissions: Array<{title: string, status: string}>}>>;
  eventAttendees?: Record<number, Array<{id: number, name: string}>>;
}

const CalendarView: FC<CalendarViewProps> = ({ 
  events,
  cfpCounts = {},
  attendeeCounts = {},
  tripReportCounts = {},
  eventSpeakers = {},
  eventAttendees = {}
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      
      // Check if day is within event date range
      return day >= eventStart && day <= eventEnd;
    });
  };
  
  // Get CFP deadlines occurring on a specific day
  const getCfpDeadlinesForDay = (day: Date) => {
    return events.filter(event => {
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
      return "bg-red-100 text-red-800"; // Less than a week: red
    } else if (daysUntil <= 14) {
      return "bg-yellow-100 text-yellow-800"; // Less than two weeks: yellow
    } else {
      return "bg-green-100 text-green-800"; // More than two weeks: green
    }
  };
  
  // Helper function to get border color based on priority
  const getBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-green-500";
      default:
        return "border-gray-300";
    }
  };
  
  // Calendar days
  const calendarDays = getDaysForCalendar();
  
  // Count events in current month
  const eventsInMonth = events.filter(event => {
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
      <div className={`border-l-4 ${getBorderColor(event.priority)} bg-white rounded p-3`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-900">{event.name}</h3>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
          <span>{event.location}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
          <span>
            {format(new Date(event.start_date), "MMM d, yyyy")} - {format(new Date(event.end_date), "MMM d, yyyy")}
          </span>
        </div>
        
        {event.cfp_deadline && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Clock className="h-3 w-3 text-gray-400 mr-1" />
            <span>
              CFP Deadline: {format(new Date(event.cfp_deadline), "MMM d, yyyy")}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-4 mt-2 mb-2 text-xs">
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3 text-gray-400" />
            <span>{cfpCount} CFPs</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span>{attendeeCount} Attendees</span>
          </div>
          
          {tripReports.length > 0 && (
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3 text-gray-400" />
              <span>{tripReports.length} Reports</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {(typeof event.goal === 'string' ? JSON.parse(event.goal) : event.goal).map((goal: string, index: number) => {
            if (goal === "speaking") {
              return (
                <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                  <Mic className="h-2 w-2 mr-1" />
                  Speaking
                </Badge>
              );
            } else if (goal === "attending") {
              return (
                <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                  <User className="h-2 w-2 mr-1" />
                  Attending
                </Badge>
              );
            } else {
              return (
                <Badge key={index} variant="outline" className={
                  goal === "sponsoring" ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs" : 
                  "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 text-xs"
                }>
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                </Badge>
              );
            }
          })}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
          <p className="text-sm text-gray-500">{eventsInMonth.length} events this month</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px border-b border-gray-200">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day);
            const cfpDeadlines = getCfpDeadlinesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            
            return (
              <div 
                key={dayIdx} 
                className={cn(
                  "min-h-[6rem] px-2 py-2",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentMonth && "bg-white",
                  isTodayDate && "bg-blue-50"
                )}
              >
                <span className={cn(
                  "text-sm",
                  isTodayDate && "font-bold text-blue-600"
                )}>
                  {format(day, 'd')}
                </span>
                
                <div className="mt-1 overflow-y-auto max-h-24 space-y-1">
                  {/* Show CFP deadlines */}
                  {cfpDeadlines.length > 0 && cfpDeadlines.map((event) => (
                    <Popover key={`cfp-${event.id}`}>
                      <PopoverTrigger asChild>
                        <div 
                          className={cn(
                            "p-1 rounded text-xs mb-1 cursor-pointer",
                            getCfpDeadlineColor(event.cfp_deadline!)
                          )}
                          title={`CFP Deadline: ${event.name}`}
                        >
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="truncate">CFP: {event.name}</span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        {renderEventCard(event)}
                      </PopoverContent>
                    </Popover>
                  ))}
                  
                  {/* Show events */}
                  {dayEvents.length > 0 && dayEvents.map((event) => (
                    <Popover key={`event-${event.id}`}>
                      <PopoverTrigger asChild>
                        <div 
                          className="bg-blue-100 p-1 rounded text-xs text-blue-800 mb-1 truncate cursor-pointer"
                          title={event.name}
                        >
                          {event.name}
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
