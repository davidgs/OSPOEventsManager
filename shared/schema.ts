import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Event priority types
export const eventPriorities = ["high", "medium", "low"] as const;
export const eventPrioritySchema = z.enum(eventPriorities);
export type EventPriority = z.infer<typeof eventPrioritySchema>;

// Event types
export const eventTypes = ["conference", "meetup", "webinar", "workshop", "hackathon"] as const;
export const eventTypeSchema = z.enum(eventTypes);
export type EventType = z.infer<typeof eventTypeSchema>;

// Event goals
export const eventGoals = ["speaking", "sponsoring", "attending", "exhibiting"] as const;
export const eventGoalSchema = z.enum(eventGoals);
export type EventGoal = z.infer<typeof eventGoalSchema>;

// Event statuses
export const eventStatuses = ["planning", "confirmed", "completed", "cancelled"] as const;
export const eventStatusSchema = z.enum(eventStatuses);
export type EventStatus = z.infer<typeof eventStatusSchema>;

// CFP statuses
export const cfpStatuses = ["draft", "submitted", "accepted", "rejected", "withdrawn"] as const;
export const cfpStatusSchema = z.enum(cfpStatuses);
export type CFPStatus = z.infer<typeof cfpStatusSchema>;

// Users table (for reference)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  link: text("link").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  location: text("location").notNull(),
  priority: text("priority").notNull().$type<EventPriority>(),
  type: text("type").notNull().$type<EventType>(),
  goal: text("goal").notNull().$type<EventGoal>(),
  cfpDeadline: date("cfp_deadline"),
  status: text("status").notNull().default("planning").$type<EventStatus>(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  status: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// CFP Submissions table
export const cfpSubmissions = pgTable("cfp_submissions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  submitterId: integer("submitter_id").references(() => users.id),
  submitterName: text("submitter_name").notNull(),
  status: text("status").notNull().default("draft").$type<CFPStatus>(),
  submissionDate: date("submission_date"),
  notes: text("notes"),
});

export const insertCfpSubmissionSchema = createInsertSchema(cfpSubmissions).omit({
  id: true,
});

export type InsertCfpSubmission = z.infer<typeof insertCfpSubmissionSchema>;
export type CfpSubmission = typeof cfpSubmissions.$inferSelect;

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role"),
  userId: integer("user_id").references(() => users.id),
  notes: text("notes"),
});

export const insertAttendeeSchema = createInsertSchema(attendees).omit({
  id: true,
});

export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type Attendee = typeof attendees.$inferSelect;

// Sponsorships table
export const sponsorships = pgTable("sponsorships", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  level: text("level").notNull(),
  amount: text("amount"),
  status: text("status").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({
  id: true,
});

export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;
export type Sponsorship = typeof sponsorships.$inferSelect;
