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

import { FC } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Users,
  BookOpen,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Event } from "@shared/schema";

const EventDetailsPage: FC = () => {
  const [match, params] = useRoute("/events/:id");
  const eventId = params?.id;

  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useQuery({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to load event");
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  const { data: cfpSubmissions = [] } = useQuery({
    queryKey: ["/api/cfp-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/cfp-submissions");
      if (!response.ok) {
        throw new Error("Failed to load CFP submissions");
      }
      return response.json();
    },
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ["/api/attendees"],
    queryFn: async () => {
      const response = await fetch("/api/attendees");
      if (!response.ok) {
        throw new Error("Failed to load attendees");
      }
      return response.json();
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["/api/assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets");
      if (!response.ok) {
        throw new Error("Failed to load assets");
      }
      return response.json();
    },
  });

  if (!match || !eventId) {
    return <div>Event not found</div>;
  }

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading event details...
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Failed to load event details
      </div>
    );
  }

  // Filter data for this specific event
  const eventCfpSubmissions = cfpSubmissions.filter(
    (cfp: any) => cfp.eventId === parseInt(eventId)
  );
  const eventAttendees = attendees.filter(
    (attendee: any) => attendee.eventId === parseInt(eventId)
  );
  const eventAssets = assets.filter(
    (asset: any) => asset.eventId === parseInt(eventId)
  );
  const tripReports = eventAssets.filter(
    (asset: any) => asset.type === "trip_report"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
      </div>

      {/* Event Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Event Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{event.name}</CardTitle>
                <div className="flex gap-2">
                  <PriorityBadge priority={event.priority} />
                  <TypeBadge type={event.type} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {format(new Date(event.startDate), "MMMM d, yyyy")} -{" "}
                  {format(new Date(event.endDate), "MMMM d, yyyy")}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{event.location}</span>
              </div>

              {event.link && (
                <div>
                  <strong>Website:</strong>{" "}
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {event.link}
                  </a>
                </div>
              )}

              {event.cfpDeadline && (
                <div>
                  <strong>CFP Deadline:</strong>{" "}
                  {format(new Date(event.cfpDeadline), "MMMM d, yyyy")}
                </div>
              )}

              {event.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="mt-1 text-gray-700">{event.notes}</p>
                </div>
              )}

              <div>
                <strong>Goals:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(event.goal || []).map((goal: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-purple-100 text-purple-800"
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CFP Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                CFP Submissions ({eventCfpSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventCfpSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {eventCfpSubmissions.map((cfp: any) => (
                    <div key={cfp.id} className="border-b pb-2 last:border-0">
                      <h4 className="font-medium text-sm">{cfp.title}</h4>
                      <p className="text-xs text-gray-500">
                        by {cfp.submitterName}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          cfp.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : cfp.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {cfp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No CFP submissions found.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Attendees ({eventAttendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventAttendees.length > 0 ? (
                <div className="space-y-2">
                  {eventAttendees.map((attendee: any) => (
                    <div key={attendee.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                        {attendee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendees found.</p>
              )}
            </CardContent>
          </Card>

          {/* Trip Reports */}
          {tripReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Trip Reports ({tripReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tripReports.map((report: any) => (
                    <div
                      key={report.id}
                      className="border-b pb-2 last:border-0"
                    >
                      <h4 className="font-medium text-sm">{report.name}</h4>
                      <p className="text-xs text-gray-500">
                        by {report.uploadedByName}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
