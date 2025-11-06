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
  Award,
  DollarSign,
  Handshake,
  TrendingUp,
  FileText,
  Target,
} from "lucide-react";

export default function SponsorshipManagementHelp() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Award className="h-8 w-8" />
          Sponsorship Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Track sponsorship opportunities, manage budgets, and maximize your
          event partnerships.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Sponsorship Opportunities
            </CardTitle>
            <CardDescription>
              Identify and track sponsorship options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sponsorship Types:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Title Sponsor:</strong> Main event sponsor
                </li>
                <li>
                  <strong>Track Sponsor:</strong> Specific session or track
                </li>
                <li>
                  <strong>Booth Sponsor:</strong> Exhibition space
                </li>
                <li>
                  <strong>Swag Sponsor:</strong> Branded giveaways
                </li>
                <li>
                  <strong>Networking Sponsor:</strong> Social events
                </li>
                <li>
                  <strong>Travel Sponsor:</strong> Speaker travel support
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Benefits Tracking:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Logo placement and visibility</li>
                <li>Speaking opportunities</li>
                <li>Attendee list access</li>
                <li>Booth space and location</li>
                <li>Digital marketing inclusion</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Management
            </CardTitle>
            <CardDescription>
              Track costs and financial commitments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Budget Categories:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Event registration fees</li>
                <li>Booth space and setup</li>
                <li>Travel and accommodation</li>
                <li>Marketing materials</li>
                <li>Swag and giveaways</li>
                <li>Staff time and resources</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Financial Tracking:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Budget allocation per event</li>
                <li>Actual spend vs. budget</li>
                <li>ROI calculation and tracking</li>
                <li>Multi-year budget planning</li>
                <li>Approval workflow integration</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Setting & Metrics
            </CardTitle>
            <CardDescription>
              Define objectives and measure success
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sponsorship Goals:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Brand awareness and visibility</li>
                <li>Lead generation targets</li>
                <li>Customer acquisition goals</li>
                <li>Partnership development</li>
                <li>Market research opportunities</li>
                <li>Recruitment and hiring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Success Metrics:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Booth traffic and engagement</li>
                <li>Lead quality and quantity</li>
                <li>Brand mention tracking</li>
                <li>Social media engagement</li>
                <li>Follow-up meeting conversion</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ROI Analysis
            </CardTitle>
            <CardDescription>
              Measure and optimize sponsorship returns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">ROI Calculation:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Revenue generated from leads</li>
                <li>Cost per lead acquisition</li>
                <li>Customer lifetime value</li>
                <li>Brand value and exposure</li>
                <li>Market intelligence gained</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Optimization Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Compare similar events and costs</li>
                <li>Track multi-touch attribution</li>
                <li>Monitor competitive analysis</li>
                <li>Adjust strategy based on results</li>
                <li>Build long-term relationships</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button asChild>
          <Link href="/sponsorships">
            <Award className="h-4 w-4 mr-2" />
            Go to Sponsorships
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
