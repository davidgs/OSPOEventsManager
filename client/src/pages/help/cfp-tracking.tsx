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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function CfpTrackingHelp() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          CFP Tracking
        </h1>
        <p className="text-muted-foreground text-lg">
          Master the art of Call for Papers submissions and track your speaking
          opportunities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Creating CFP Submissions
            </CardTitle>
            <CardDescription>
              Submit proposals to conferences and events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Submission Process:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Add CFP Submission" on the CFP page</li>
                <li>Select the target event from your events list</li>
                <li>Enter your talk title and abstract</li>
                <li>Set submission and notification deadlines</li>
                <li>Upload supporting materials (slides, bio, etc.)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Talk Categories:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Keynote:</strong> Opening/closing presentations
                </li>
                <li>
                  <strong>Technical:</strong> Deep-dive technical content
                </li>
                <li>
                  <strong>Panel:</strong> Multi-speaker discussions
                </li>
                <li>
                  <strong>Lightning:</strong> Short 5-10 minute talks
                </li>
                <li>
                  <strong>Workshop:</strong> Hands-on learning sessions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Deadline Management
            </CardTitle>
            <CardDescription>
              Never miss important CFP deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Key Dates to Track:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>CFP opening date</li>
                <li>Early bird submission deadline</li>
                <li>Final submission deadline</li>
                <li>Speaker notification date</li>
                <li>Speaker confirmation deadline</li>
                <li>Final presentation due date</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Deadline Alerts:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Set reminders 2 weeks before deadline</li>
                <li>Get notified 1 week before deadline</li>
                <li>Final reminder 24 hours before</li>
                <li>Track extensions and changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status Tracking
            </CardTitle>
            <CardDescription>Monitor your submission progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Submission Statuses:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Draft:</strong> Work in progress
                </li>
                <li>
                  <strong>Submitted:</strong> Sent to organizers
                </li>
                <li>
                  <strong>Under Review:</strong> Being evaluated
                </li>
                <li>
                  <strong>Accepted:</strong> Approved for presentation
                </li>
                <li>
                  <strong>Rejected:</strong> Not selected
                </li>
                <li>
                  <strong>Waitlisted:</strong> Backup option
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Response Tracking:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Record feedback from organizers</li>
                <li>Note reasons for rejection</li>
                <li>Track acceptance rates by event</li>
                <li>Monitor speaking history</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Best Practices
            </CardTitle>
            <CardDescription>
              Tips for successful CFP submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Writing Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Write compelling, specific titles</li>
                <li>Create clear, concise abstracts</li>
                <li>Include learning outcomes</li>
                <li>Tailor content to audience level</li>
                <li>Proofread for grammar and clarity</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Submission Strategy:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Submit early when possible</li>
                <li>Research past accepted talks</li>
                <li>Build relationships with organizers</li>
                <li>Have backup topics ready</li>
                <li>Track submission themes and trends</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button asChild>
          <Link href="/cfp-submissions">
            <FileText className="h-4 w-4 mr-2" />
            Go to CFP Submissions
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
