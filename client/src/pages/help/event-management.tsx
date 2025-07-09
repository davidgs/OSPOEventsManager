import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Plus, Filter, Eye, Edit, Trash2 } from "lucide-react";

export default function EventManagementHelp() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Event Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Learn how to effectively manage your OSPO events, conferences,
          meetups, and workshops.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Creating Events
            </CardTitle>
            <CardDescription>
              Add new events to your OSPO calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How to Add Events:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Add Event" button on the Events page</li>
                <li>Fill in event details: name, dates, location, website</li>
                <li>Set event type (Conference, Meetup, Workshop, etc.)</li>
                <li>Define your goals (Attending, Sponsoring, Speaking)</li>
                <li>Add CFP deadlines and important notes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Event Types:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Conference:</strong> Large-scale industry events
                </li>
                <li>
                  <strong>Meetup:</strong> Local community gatherings
                </li>
                <li>
                  <strong>Workshop:</strong> Hands-on learning sessions
                </li>
                <li>
                  <strong>Webinar:</strong> Online presentations
                </li>
                <li>
                  <strong>Hackathon:</strong> Coding competitions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtering & Organization
            </CardTitle>
            <CardDescription>
              Find and organize events efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Filter Options:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Filter by event type (Conference, Meetup, etc.)</li>
                <li>Filter by status (Upcoming, Past, Cancelled)</li>
                <li>Filter by your goals (Attending, Sponsoring)</li>
                <li>Search by event name or location</li>
                <li>Filter by date range</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Priority Levels:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>High:</strong> Must-attend events
                </li>
                <li>
                  <strong>Medium:</strong> Important but flexible
                </li>
                <li>
                  <strong>Low:</strong> Optional or exploratory
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Event Details & Tracking
            </CardTitle>
            <CardDescription>
              Monitor event progress and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Key Information Tracked:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Event dates and location</li>
                <li>Registration deadlines</li>
                <li>CFP submission deadlines</li>
                <li>Sponsorship opportunities</li>
                <li>Budget allocations</li>
                <li>Team assignments</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Status Tracking:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Planning phase progress</li>
                <li>Registration status</li>
                <li>CFP submission status</li>
                <li>Sponsorship negotiations</li>
                <li>Post-event follow-up</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Best Practices
            </CardTitle>
            <CardDescription>
              Tips for effective event management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Planning Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Add events as soon as they're announced</li>
                <li>Set reminders for important deadlines</li>
                <li>Keep detailed notes about each event</li>
                <li>Track competitor activities</li>
                <li>Document lessons learned</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Team Coordination:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Assign clear roles and responsibilities</li>
                <li>Use comments for team communication</li>
                <li>Share event details with stakeholders</li>
                <li>Track budget approvals</li>
                <li>Maintain post-event reports</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button asChild>
          <Link href="/events">
            <Calendar className="h-4 w-4 mr-2" />
            Go to Events
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
