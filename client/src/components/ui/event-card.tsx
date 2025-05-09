import { FC } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  FileText, 
  Users, 
  Edit, 
  Trash2, 
  MapPin,
  Mic,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Event } from "@shared/schema";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EventCardProps {
  event: Event;
  cfpCount: number;
  attendeeCount: number;
  speakers: Array<{id: number, name: string, status: string}>;
  attendees: Array<{id: number, name: string}>;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const EventCard: FC<EventCardProps> = ({ 
  event, 
  cfpCount, 
  attendeeCount, 
  speakers,
  attendees,
  onEdit, 
  onDelete 
}) => {
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

  // Helper function to get badge style based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Planning</Badge>;
    }
  };

  // Helper function to get badge style based on type
  const getTypeBadge = (type: string) => {
    return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  // Helper function to get badge style based on goal
  const getGoalBadge = (goal: string) => {
    switch (goal) {
      case "speaking":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Speaking</Badge>;
      case "sponsoring":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Sponsoring</Badge>;
      case "attending":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Attending</Badge>;
      case "exhibiting":
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Exhibiting</Badge>;
      default:
        return null;
    }
  };

  // Check if this event has a CFP deadline that's coming soon (within the next 7 days)
  const hasCfpDeadlineSoon = () => {
    if (!event.cfpDeadline) return false;
    
    const deadline = new Date(event.cfpDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 7;
  };

  // Calculate days left for CFP deadline
  const getDaysLeftForCfp = () => {
    if (!event.cfpDeadline) return 0;
    
    const deadline = new Date(event.cfpDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <Card className={`overflow-hidden shadow rounded-lg border-l-4 ${getBorderColor(event.priority)}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          {getPriorityBadge(event.priority)}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(event)}
              className="h-8 w-8 text-gray-400 hover:text-gray-500"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(event)} 
              className="h-8 w-8 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">{event.name}</h3>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          <span>{event.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          <span>
            {format(new Date(event.startDate), "MMM d, yyyy")} - {format(new Date(event.endDate), "MMM d, yyyy")}
          </span>
        </div>
        
        {hasCfpDeadlineSoon() && (
          <div className="bg-yellow-50 p-2 rounded mb-3">
            <div className="flex text-sm text-yellow-800">
              <Calendar className="h-4 w-4 text-yellow-600 mr-2" />
              <span>CFP Deadline: <strong>{format(new Date(event.cfpDeadline!), "MMM d, yyyy")} ({getDaysLeftForCfp()} days left)</strong></span>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{cfpCount} {cfpCount === 1 ? "CFP" : "CFPs"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{attendeeCount} {attendeeCount === 1 ? "Attendee" : "Attendees"}</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center flex-wrap gap-1">
              {getTypeBadge(event.type)}
              
              {event.goal === "speaking" && speakers && speakers.length > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <Mic className="h-3 w-3 mr-1" />
                          {speakers.filter(s => s.status === "accepted").length > 0 ? "Speaking" : "CFP Submitted"}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs font-medium mb-1">
                        {speakers.filter(s => s.status === "accepted").length > 0 ? 
                          "Speaking:" : 
                          "CFP Submissions:"}
                      </p>
                      <ul className="text-xs">
                        {speakers.map((speaker, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${speaker.status === 'accepted' ? 'bg-green-500' : speaker.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                            {speaker.name} ({speaker.status})
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : event.goal === "speaking" ? (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  <Mic className="h-3 w-3 mr-1" />
                  Speaking
                </Badge>
              ) : null}
              
              {event.goal === "attending" && attendees && attendees.length > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <User className="h-3 w-3 mr-1" />
                          Attending ({attendees.length})
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs font-medium mb-1">Attendees:</p>
                      <ul className="text-xs">
                        {attendees.map((attendee, i) => (
                          <li key={i}>{attendee.name}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : event.goal === "attending" ? (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  <User className="h-3 w-3 mr-1" />
                  Attending
                </Badge>
              ) : null}
              
              {event.goal !== "speaking" && event.goal !== "attending" && getGoalBadge(event.goal)}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-5 py-3 flex justify-end">
        <Link href={`/events/${event.id}`}>
          <Button variant="link" className="font-medium text-primary hover:text-blue-700">
            View details →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
