/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { FC } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { GoalBadge } from "@/components/ui/goal-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Calendar,
  FileText,
  Users,
  Edit,
  Trash2,
  MapPin,
  Mic,
  User,
  Check,
  X,
  Clock,
  BookOpen,
  FileArchive,
  FileText as FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Event as SchemaEvent } from "@shared/schema";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventCardProps {
  event: SchemaEvent;
  cfpCount: number;
  attendeeCount: number;
  speakers: Array<{
    id: number;
    name: string;
    submissions: Array<{ title: string; status: string }>;
  }>;
  attendees: Array<{ id: number; name: string }>;
  tripReports?: Array<{ id: number; name: string; uploadedByName: string }>;
  onEdit: (event: SchemaEvent) => void;
  onDelete: (event: SchemaEvent) => void;
}

const EventCard: FC<EventCardProps> = ({
  event,
  cfpCount,
  attendeeCount,
  speakers,
  attendees,
  tripReports = [],
  onEdit,
  onDelete,
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

  // Check if this event has a CFP deadline that's coming soon (within the next 7 days)
  const hasCfpDeadlineSoon = () => {
    if (!event.cfp_deadline) return false;

    const deadline = new Date(event.cfp_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= 7;
  };

  // Calculate days left for CFP deadline
  const getDaysLeftForCfp = () => {
    if (!event.cfp_deadline) return 0;

    const deadline = new Date(event.cfp_deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <Card
      className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${getBorderColor(
        event.priority
      )} bg-white dark:bg-gray-800`}
    >
      <CardContent className="p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={event.priority} />
            <TypeBadge type={event.type} />
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(event)}
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(event)}
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg leading-6 font-medium text-foreground mb-1 break-words">
          {event.name}
        </h3>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
          <span className="truncate">
            {format(new Date(event.start_date), "MMM d, yyyy")} -{" "}
            {format(new Date(event.end_date), "MMM d, yyyy")}
          </span>
        </div>

        {hasCfpDeadlineSoon() && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-2 rounded mb-2 sm:mb-3">
            <div className="flex text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="break-words">
                CFP Deadline:{" "}
                <strong>
                  {format(new Date(event.cfp_deadline!), "MMM d, yyyy")} (
                  {getDaysLeftForCfp()} days left)
                </strong>
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-2 sm:pt-3">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">
                    {cfpCount} {cfpCount === 1 ? "CFP" : "CFPs"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Call for Proposals</h4>
                  {speakers && speakers.length > 0 ? (
                    <div className="space-y-3">
                      {speakers.map((speaker, i) => (
                        <div key={i} className="border-b pb-2 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {speaker.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {speaker.submissions.length}{" "}
                              {speaker.submissions.length === 1
                                ? "submission"
                                : "submissions"}
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {speaker.submissions.map((submission, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-sm"
                              >
                                {submission.status === "accepted" ? (
                                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                ) : submission.status === "rejected" ? (
                                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-gray-900 dark:text-gray-100 break-words leading-tight">
                                    {submission.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {submission.status}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No CFP submissions found.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">
                    {attendeeCount}{" "}
                    {attendeeCount === 1 ? "Attendee" : "Attendees"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Event Attendees</h4>
                  {attendees && attendees.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {attendees.map((attendee, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">
                            {attendee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm truncate">
                            {attendee.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No attendees found.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {tripReports && tripReports.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm font-medium">
                      {tripReports.length}{" "}
                      {tripReports.length === 1
                        ? "Trip Report"
                        : "Trip Reports"}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Trip Reports</h4>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {tripReports.map((report, i) => (
                        <div key={i} className="border-b pb-2 last:border-0">
                          <div className="flex items-start gap-2 p-1">
                            <FileArchive className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium break-words leading-tight">
                                {report.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {report.uploadedByName}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <div className="mb-1">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Conference Goals
              </h4>
            </div>
            <div className="flex items-center flex-wrap gap-1">
              {(typeof event.goal === "string"
                ? JSON.parse(event.goal)
                : event.goal || []
              ).map((goal: string, index: number) => (
                <GoalBadge key={index} goal={goal} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              {(event as any).createdByAvatar ? (
                <img
                  src={(event as any).createdByAvatar}
                  alt={(event as any).createdByName || "Unknown User"}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {((event as any).createdByName || "Unknown User")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {(event as any).createdByName || "Unknown User"}
            </span>
          </div>
        </div>
        <Link href={`/events/${event.id}`}>
          <Button
            variant="link"
            className="text-sm sm:text-base font-medium text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto flex-shrink-0"
          >
            View details →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
