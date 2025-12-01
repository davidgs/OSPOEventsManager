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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["common", "pages"]);

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
                  {t("pages.home.title")}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  {t("pages.home.subtitle")}
                </p>
              </div>
              {!authenticated ? (
                <div className="space-x-4">
                  <Button asChild size="lg">
                    <Link href="/auth">{t("pages.home.signIn")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Button asChild size="lg">
                    <Link href="/events">{t("pages.home.viewEvents")}</Link>
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
                    {t("pages.home.features.eventManagement.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.home.features.eventManagement.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {t("pages.home.features.eventManagement.details")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/docs/user/managing-events">{t("common.learnMore")}</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t("pages.home.features.cfpTracking.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.home.features.cfpTracking.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {t("pages.home.features.cfpTracking.details")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/docs/user/cfp-submissions">{t("common.learnMore")}</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t("pages.home.features.attendeeManagement.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.home.features.attendeeManagement.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {t("pages.home.features.attendeeManagement.details")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/docs/user/attendee-management">{t("common.learnMore")}</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t("pages.home.features.sponsorshipManagement.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.home.features.sponsorshipManagement.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {t("pages.home.features.sponsorshipManagement.details")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/docs/user/sponsorship-management">{t("common.learnMore")}</Link>
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
            {t("pages.home.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
