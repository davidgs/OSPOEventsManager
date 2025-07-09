import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { Users, UserPlus, Filter, Badge, Mail, FileText } from "lucide-react";

export default function AttendeeManagementHelp() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Attendee Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Efficiently manage event participants, speakers, and their roles
          across all your events.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adding Attendees
            </CardTitle>
            <CardDescription>
              Register participants for your events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Registration Process:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Add Attendee" on the Attendees page</li>
                <li>Enter attendee contact information</li>
                <li>Select the event they're attending</li>
                <li>Assign their role (Attendee, Speaker, etc.)</li>
                <li>Add any special notes or requirements</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Import Options:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Bulk import from CSV files</li>
                <li>Integration with registration platforms</li>
                <li>Copy attendees from previous events</li>
                <li>Import from email lists</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-5 w-5" />
              Attendee Roles
            </CardTitle>
            <CardDescription>
              Define and manage participant roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Standard Roles:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Attendee:</strong> Regular event participant
                </li>
                <li>
                  <strong>Speaker:</strong> Presenting at the event
                </li>
                <li>
                  <strong>Sponsor:</strong> Company sponsor representative
                </li>
                <li>
                  <strong>Organizer:</strong> Event planning team member
                </li>
                <li>
                  <strong>Volunteer:</strong> Helping with event operations
                </li>
                <li>
                  <strong>VIP:</strong> Special guests or keynotes
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Role Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Different access levels and permissions</li>
                <li>Customized communication templates</li>
                <li>Role-specific badges and materials</li>
                <li>Targeted networking opportunities</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtering & Search
            </CardTitle>
            <CardDescription>
              Find and organize attendees efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Search Options:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Search by name, email, or company</li>
                <li>Filter by event or date range</li>
                <li>Filter by attendee role</li>
                <li>Filter by registration status</li>
                <li>Filter by special requirements</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Advanced Filtering:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Multiple event participation</li>
                <li>Geographic location</li>
                <li>Industry or job title</li>
                <li>Dietary restrictions</li>
                <li>Accessibility needs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Communication
            </CardTitle>
            <CardDescription>
              Stay connected with event participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Email Templates:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Registration confirmation emails</li>
                <li>Event reminder notifications</li>
                <li>Speaker briefing materials</li>
                <li>Post-event follow-up messages</li>
                <li>Certificate of attendance</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Communication Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Bulk email sending</li>
                <li>Personalized messages</li>
                <li>Event updates and announcements</li>
                <li>Check-in confirmations</li>
                <li>Survey and feedback collection</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button asChild>
          <Link href="/attendees">
            <Users className="h-4 w-4 mr-2" />
            Go to Attendees
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
