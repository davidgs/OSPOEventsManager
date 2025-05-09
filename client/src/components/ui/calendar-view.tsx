import { FC, useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { Event } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  events: Event[];
}

const CalendarView: FC<CalendarViewProps> = ({ events }) => {
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
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Check if day is within event date range
      return day >= eventStart && day <= eventEnd;
    });
  };
  
  // Calendar days
  const calendarDays = getDaysForCalendar();
  
  // Count events in current month
  const eventsInMonth = events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return (
      (eventStart <= monthEnd && eventStart >= monthStart) || 
      (eventEnd <= monthEnd && eventEnd >= monthStart) ||
      (eventStart <= monthStart && eventEnd >= monthEnd)
    );
  });
  
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
                
                {dayEvents.length > 0 && (
                  <div className="mt-1 overflow-y-auto max-h-20">
                    {dayEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className="bg-blue-100 p-1 rounded text-xs text-blue-800 mb-1 truncate"
                        title={event.name}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
