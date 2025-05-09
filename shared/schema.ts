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
export const eventGoalsArraySchema = z.array(eventGoalSchema).min(1, "Select at least one goal");
export type EventGoal = z.infer<typeof eventGoalSchema>;
export type EventGoals = z.infer<typeof eventGoalsArraySchema>;

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
  name: text("name"),
  email: text("email"),
  bio: text("bio"),
  role: text("role"),
  jobTitle: text("job_title"),
  headshot: text("headshot"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
  bio: z.string().max(500).optional(),
  role: z.string().min(1, {
    message: "Please select a role.",
  }).optional(),
  jobTitle: z.string().optional(),
  headshot: z.string().optional(),
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
  goals: text("goals").notNull().$type<string>(), // Storing as JSON string of goals array
  cfpDeadline: date("cfp_deadline"),
  status: text("status").notNull().default("planning").$type<EventStatus>(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
});

// Create the base insert schema from drizzle
const baseInsertEventSchema = createInsertSchema(events).omit({
  id: true,
  status: true,
});

// Override the schema to explicitly define how we want date fields handled
export const insertEventSchema = z.object({
  name: baseInsertEventSchema.shape.name,
  link: baseInsertEventSchema.shape.link,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  location: baseInsertEventSchema.shape.location,
  priority: baseInsertEventSchema.shape.priority,
  type: baseInsertEventSchema.shape.type,
  goals: eventGoalsArraySchema, // Updated to use array schema
  cfpDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional(),
  notes: baseInsertEventSchema.shape.notes,
  createdById: baseInsertEventSchema.shape.createdById,
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

// Asset types
export const assetTypes = ["abstract", "bio", "headshot", "trip_report", "presentation", "other"] as const;
export const assetTypeSchema = z.enum(assetTypes);
export type AssetType = z.infer<typeof assetTypeSchema>;

// Assets table for managing various file uploads
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AssetType>(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  eventId: integer("event_id").references(() => events.id),
  cfpSubmissionId: integer("cfp_submission_id").references(() => cfpSubmissions.id),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  uploadedAt: true,
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
