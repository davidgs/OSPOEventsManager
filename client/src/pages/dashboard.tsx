import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

const DashboardPage: FC = () => {
  // Fetch all data for dashboard
  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to load events');
      return response.json();
    },
  });

  const { data: cfpSubmissions = [] } = useQuery({
    queryKey: ['/api/cfp-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/cfp-submissions');
      if (!response.ok) throw new Error('Failed to load CFP submissions');
      return response.json();
    },
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ['/api/attendees'],
    queryFn: async () => {
      const response = await fetch('/api/attendees');
      if (!response.ok) throw new Error('Failed to load attendees');
      return response.json();
    },
  });

  const { data: sponsorships = [] } = useQuery({
    queryKey: ['/api/sponsorships'],
    queryFn: async () => {
      const response = await fetch('/api/sponsorships');
      if (!response.ok) throw new Error('Failed to load sponsorships');
      return response.json();
    },
  });

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter((e: any) => new Date(e.startDate) > new Date()).length,
    totalCfpSubmissions: cfpSubmissions.length,
    acceptedSubmissions: cfpSubmissions.filter((s: any) => s.status === 'accepted').length,
    totalAttendees: attendees.length,
    confirmedSponsorships: sponsorships.filter((s: any) => s.status === 'confirmed').length,
  };

  // Get upcoming events (next 30 days)
  const upcomingEvents = events
    .filter((e: any) => {
      const eventDate = new Date(e.startDate);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    })
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  // Get recent CFP submissions
  const recentSubmissions = cfpSubmissions
    .filter((s: any) => s.submissionDate)
    .sort((a: any, b: any) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 5);

  // Get CFP deadlines approaching (next 14 days)
  const approachingDeadlines = events
    .filter((e: any) => {
      if (!e.cfpDeadline) return false;
      const deadline = new Date(e.cfpDeadline);
      const now = new Date();
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      return deadline >= now && deadline <= fourteenDaysFromNow;
    })
    .sort((a: any, b: any) => new Date(a.cfpDeadline).getTime() - new Date(b.cfpDeadline).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
            <CardTitle className="text-sm font-medium">CFP Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCfpSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.acceptedSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sponsorships</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedSponsorships}</div>
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
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.startDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={
                      event.priority === 'high' ? 'bg-red-100 text-red-800' :
                      event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {event.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
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
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-sm text-gray-600">
                        Deadline: {format(new Date(event.cfpDeadline), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No approaching deadlines</p>
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
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{submission.title}</h4>
                      <p className="text-sm text-gray-600">by {submission.submitterName}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(submission.submissionDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={
                      submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {submission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent submissions</p>
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

export default DashboardPage;