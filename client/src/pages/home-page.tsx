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

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, FileText, Award } from "lucide-react";

export default function HomePage() {
  const { authenticated, user, initialized } = useAuth();

  // Debug logging to understand authentication state mismatch
  console.log("HomePage auth state:", {
    authenticated,
    initialized,
    user: user ? { id: user.id, username: user.username } : null,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  OSPO Event Management System
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Track and manage your open source program office events,
                  submissions, and collaborations.
                </p>
              </div>
              {!authenticated ? (
                <div className="space-x-4">
                  <Button asChild size="lg">
                    <Link href="/auth">Sign In</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Button asChild size="lg">
                    <Link href="/events">View Events</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Management
                  </CardTitle>
                  <CardDescription>
                    Track conferences, meetups, and workshops
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Manage all your events in one place with powerful filtering
                    and calendar views.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    CFP Tracking
                  </CardTitle>
                  <CardDescription>
                    Submit and manage call for papers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Keep track of all your CFP submissions, their statuses, and
                    deadlines in one central location.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Attendee Management
                  </CardTitle>
                  <CardDescription>Manage event participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Track attendees, speakers, and their roles in various events
                    to facilitate better collaboration.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Sponsorship Management
                  </CardTitle>
                  <CardDescription>
                    Track sponsorships and budgets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Manage event sponsorships, track budget allocations, and
                    monitor sponsorship benefits.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} OSPO Events. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
