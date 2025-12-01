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

import { db } from "../server/db";
import { users, events, cfpSubmissions, attendees, sponsorships } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Check if data already exists - don't clear if it does
    const existingUsers = await db.select().from(users).limit(1);
    const userCount = existingUsers.length;

    if (userCount > 0) {
      console.log(`Found ${userCount} existing users, skipping seed operation to preserve data`);
      return;
    }

    console.log("No existing data found, proceeding with database seeding...");

    // Create demo user for Keycloak integration - note the required keycloakId field
    console.log("Creating demo user...");
    const [user] = await db.insert(users)
      .values({
        username: "demo_user",
        keycloakId: "user-1", // Required for Keycloak reference
        name: "Alex Johnson",
        email: "alex@example.com",
        bio: "Senior Developer Advocate with expertise in Kubernetes and cloud-native technologies.",
        role: "developer_advocate",
        jobTitle: "Senior Developer Advocate"
      })
      .returning();

    console.log(`Created user with ID: ${user.id}`);

    // Create sample events
    console.log("Creating sample events...");
    const [event1] = await db.insert(events)
      .values({
        name: "KubeCon + CloudNativeCon Europe 2023",
        link: "https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/",
        startDate: "2023-04-17",
        endDate: "2023-04-21",
        location: "Amsterdam, Netherlands",
        priority: "high",
        type: "conference",
        goal: "speaking",
        status: "planning",
        cfpDeadline: "2023-01-15",
        notes: "Major cloud native conference in Europe",
        createdById: user.id
      })
      .returning();

    const [event2] = await db.insert(events)
      .values({
        name: "Open Source Summit North America",
        link: "https://events.linuxfoundation.org/open-source-summit-north-america/",
        startDate: "2023-05-10",
        endDate: "2023-05-12",
        location: "Vancouver, Canada",
        priority: "medium",
        type: "conference",
        goal: "sponsoring",
        status: "planning",
        cfpDeadline: "2023-02-05",
        notes: "Flagship conference for open source",
        createdById: user.id
      })
      .returning();

    const [event3] = await db.insert(events)
      .values({
        name: "DevOps Days Seattle",
        link: "https://devopsdays.org/seattle",
        startDate: "2023-06-05",
        endDate: "2023-06-06",
        location: "Seattle, USA",
        priority: "low",
        type: "conference",
        goal: "attending",
        status: "planning",
        cfpDeadline: "2023-03-01",
        notes: "Local DevOps community event",
        createdById: user.id
      })
      .returning();

    const [event4] = await db.insert(events)
      .values({
        name: "DockerCon 2023",
        link: "https://www.docker.com/dockercon/",
        startDate: "2023-08-23",
        endDate: "2023-08-24",
        location: "Virtual",
        priority: "medium",
        type: "conference",
        goal: "speaking",
        status: "planning",
        cfpDeadline: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        notes: "Annual Docker conference",
        createdById: user.id
      })
      .returning();

    const [event5] = await db.insert(events)
      .values({
        name: "JSConf EU",
        link: "https://jsconf.eu/",
        startDate: "2023-09-15",
        endDate: "2023-09-16",
        location: "Berlin, Germany",
        priority: "low",
        type: "conference",
        goal: "attending",
        status: "planning",
        notes: "JavaScript focused conference",
        createdById: user.id
      })
      .returning();

    console.log("Created events with IDs:", event1.id, event2.id, event3.id, event4.id, event5.id);

    // Add CFP submissions
    console.log("Creating CFP submissions...");
    await db.insert(cfpSubmissions)
      .values([
        {
          eventId: event1.id,
          title: "Scaling Kubernetes in Production",
          abstract: "Learn how to scale Kubernetes clusters to support enterprise workloads",
          submitterName: "Alex Johnson",
          submitterId: user.id,
          status: "submitted",
          submissionDate: "2023-01-10",
          notes: "Submitted before deadline"
        },
        {
          eventId: event1.id,
          title: "Observability Best Practices",
          abstract: "How to implement effective observability for cloud native applications",
          submitterName: "Alex Johnson",
          submitterId: user.id,
          status: "accepted",
          submissionDate: "2023-01-12",
          notes: "Accepted for main track"
        },
        {
          eventId: event1.id,
          title: "GitOps Workflows with Flux",
          abstract: "Implementing GitOps practices using Flux and Kubernetes",
          submitterName: "Alex Johnson",
          submitterId: user.id,
          status: "submitted",
          submissionDate: "2023-01-14",
          notes: "Waiting for review"
        },
        {
          eventId: event2.id,
          title: "Open Source Program Office Best Practices",
          abstract: "How to establish and run an effective OSPO",
          submitterName: "Alex Johnson",
          submitterId: user.id,
          status: "submitted",
          submissionDate: "2023-02-01",
          notes: "Submitted for management track"
        },
        {
          eventId: event2.id,
          title: "Contributing to Open Source Projects",
          abstract: "A guide for developers on how to start contributing to open source",
          submitterName: "Alex Johnson",
          submitterId: user.id,
          status: "rejected",
          submissionDate: "2023-02-02",
          notes: "Rejected due to similar accepted talks"
        }
      ]);

    // Add Attendees
    console.log("Creating attendees...");
    await db.insert(attendees)
      .values([
        {
          eventId: event1.id,
          name: "Alex Johnson",
          email: "alex@example.com",
          role: "Developer",
          notes: "Speaking at the event",
          userId: user.id
        },
        {
          eventId: event1.id,
          name: "Sam Smith",
          email: "sam@example.com",
          role: "Product Manager",
          notes: "Attending workshops"
        },
        {
          eventId: event1.id,
          name: "Robin Patel",
          email: "robin@example.com",
          role: "Developer",
          notes: "Interested in service mesh talks"
        },
        {
          eventId: event2.id,
          name: "Alex Johnson",
          email: "alex@example.com",
          role: "Developer",
          notes: "Giving a lightning talk",
          userId: user.id
        },
        {
          eventId: event2.id,
          name: "Jordan Lee",
          email: "jordan@example.com",
          role: "CTO",
          notes: "Interested in formation discussions"
        }
      ]);

    // Add Sponsorships
    console.log("Creating sponsorships...");
    await db.insert(sponsorships)
      .values([
        {
          eventId: event1.id,
          level: "Gold",
          amount: "$50,000",
          status: "confirmed",
          contactName: "Pat Johnson",
          contactEmail: "pat@example.com",
          notes: "Booth size 20x20, 4 conference passes included"
        },
        {
          eventId: event2.id,
          level: "Gold",
          amount: "$50,000",
          status: "pending",
          contactName: "Pat Johnson",
          contactEmail: "pat@example.com",
          notes: "Awaiting final approval"
        },
        {
          eventId: event3.id,
          level: "Silver",
          amount: "$25,000",
          status: "confirmed",
          contactName: "Taylor Smith",
          contactEmail: "taylor@example.com",
          notes: "Booth size 10x10, 2 conference passes included"
        }
      ]);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    // Close the pool connection
    if (db) {
      try {
        // Access the underlying pool - works with both drizzle-orm/node-postgres and drizzle-orm/neon-serverless
        // @ts-ignore - Access the underlying pool
        if (db.driver?.pool) {
          await db.driver.pool.end();
        } else if (db[Symbol.for('driver')]?.session) {
          await db[Symbol.for('driver')].session.end();
        }
        console.log("Database connection closed");
      } catch (err) {
        console.log("Note: Could not explicitly close connection, but data was seeded successfully");
      }
    }
  }
}

seedDatabase();