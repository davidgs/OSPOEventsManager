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
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ProtectedRoute } from "@/components/protected-route";

const DashboardPageContent: FC = () => {
  // Fetch all data for dashboard
  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events");
      if (!response.ok) throw new Error("Failed to load events");
      return response.json();
    },
  });

  const { data: cfpSubmissions = [] } = useQuery({
    queryKey: ["/api/cfp-submissions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cfp-submissions");
      if (!response.ok) throw new Error("Failed to load CFP submissions");
      return response.json();
    },
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ["/api/attendees"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/attendees");
      if (!response.ok) throw new Error("Failed to load attendees");
      return response.json();
    },
  });

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["/api/sponsorships"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/sponsorships");
      if (!response.ok) throw new Error("Failed to load sponsorships");
      return response.json();
    },
  });

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(
      (e: any) => new Date(e.start_date) > new Date()
    ).length,
    totalCfpSubmissions: cfpSubmissions.length,
    acceptedSubmissions: cfpSubmissions.filter(
      (s: any) => s.status === "accepted"
    ).length,
    totalAttendees: attendees.length,
    confirmedSponsorships: sponsorships.filter(
      (s: any) => s.status === "confirmed"
    ).length,
  };

  // Get upcoming events (next 30 days)
  const upcomingEvents = events
    .filter((e: any) => {
      const eventDate = new Date(e.start_date);
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    .slice(0, 5);

  // Get recent CFP submissions
  const recentSubmissions = cfpSubmissions
    .filter((s: any) => s.submissionDate)
    .sort(
      (a: any, b: any) =>
        new Date(b.submissionDate).getTime() -
        new Date(a.submissionDate).getTime()
    )
    .slice(0, 5);

  // Get CFP deadlines approaching (next 14 days)
  const approachingDeadlines = events
    .filter((e: any) => {
      if (!e.cfp_deadline) return false;
      const deadline = new Date(e.cfp_deadline);
      const now = new Date();
      const fourteenDaysFromNow = new Date(
        now.getTime() + 14 * 24 * 60 * 60 * 1000
      );
      return deadline >= now && deadline <= fourteenDaysFromNow;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.cfp_deadline).getTime() - new Date(b.cfp_deadline).getTime()
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <div className="flex gap-2">
          <Link href="/events">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingEvents} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CFP Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCfpSubmissions}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.acceptedSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sponsorships</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.confirmedSponsorships}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmed partnerships
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800/70 transition-colors shadow-sm"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {event.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.location}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(new Date(event.start_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <PriorityBadge priority={event.priority} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No upcoming events
              </p>
            )}
          </CardContent>
        </Card>

        {/* CFP Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              CFP Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approachingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {approachingDeadlines.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800/70 transition-colors shadow-sm"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {event.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Deadline:{" "}
                        {format(new Date(event.cfp_deadline), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No approaching deadlines
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent CFP Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800/70 transition-colors shadow-sm"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {submission.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {submission.submitterName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(
                          new Date(submission.submissionDate),
                          "MMM d, yyyy"
                        )}
                      </p>
                    </div>
                    <Badge
                      className={
                        submission.status === "accepted"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                          : submission.status === "rejected"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
                          : submission.status === "submitted"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent submissions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/events">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Events
                </Button>
              </Link>
              <Link href="/cfp-submissions">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Review CFP Submissions
                </Button>
              </Link>
              <Link href="/attendees">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Attendees
                </Button>
              </Link>
              <Link href="/sponsorships">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Track Sponsorships
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
};

export default DashboardPage;
