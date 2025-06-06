import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey, json, PgTableWithColumns } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Users table (now acts as a reference to Keycloak users)
// Only storing minimal application-specific data that's not in Keycloak
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  keycloakId: text("keycloak_id").notNull().unique(), // Reference to Keycloak's user ID
  username: text("username").notNull().unique(),      // Cached from Keycloak for easier queries
  name: text("name"),                                 // User's full name
  email: text("email"),                               // User's email
  bio: text("bio"),                                   // User's biography
  jobTitle: text("job_title"),                        // User's job title
  headshot: text("headshot"),                         // Path to headshot file
  role: text("role"),                                 // User's role in the organization
  preferences: text("preferences"),                    // App-specific preferences (JSON)
  lastLogin: timestamp("last_login"),                  // Track last login time
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema for creating a reference to a Keycloak user in our database
export const insertUserSchema = createInsertSchema(users).pick({
  keycloakId: true,
  username: true,
}).extend({
  name: z.string().optional(),
  email: z.string().optional(),
  bio: z.string().optional(),
  jobTitle: z.string().optional(),
  headshot: z.string().optional(),
  role: z.string().optional(),
  preferences: z.string().optional(),
});

// Schema for updating user preferences and profile information
export const updateUserPreferencesSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  bio: z.string().optional(),
  jobTitle: z.string().optional(),
  headshot: z.string().optional(),
  role: z.string().optional(),
  preferences: z.string().optional(),
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
  goal: text("goal").array(), // Changed from 'goals' to match database schema
  cfpDeadline: date("cfp_deadline"),
  status: text("status").notNull().default("planning").$type<EventStatus>(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Create the base insert schema from drizzle
const baseInsertEventSchema = createInsertSchema(events).omit({
  id: true,
  status: true,
});

// Override the schema to explicitly define how we want date fields handled
export const insertEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  link: z.string().url("Must be a valid URL"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  location: z.string().min(1, "Location is required"),
  priority: z.enum(eventPriorities),
  type: z.enum(eventTypes),
  goal: eventGoalsArraySchema,
  cfpDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional(),
  notes: z.string().optional(),
  createdById: z.number().optional(),
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
  uploadedByName: text("uploaded_by_name"), // Store the name for easier display
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

// Stakeholder roles
export const stakeholderRoles = ["executive", "manager", "legal", "finance", "marketing", "technical"] as const;
export const stakeholderRoleSchema = z.enum(stakeholderRoles);
export type StakeholderRole = z.infer<typeof stakeholderRoleSchema>;

// Stakeholder table
export const stakeholders = pgTable("stakeholders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().$type<StakeholderRole>(),
  department: text("department"),
  organization: text("organization").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;
export type Stakeholder = typeof stakeholders.$inferSelect;

// Define stakeholder relationships
export const stakeholdersRelations = relations(stakeholders, ({ one }) => ({
  user: one(users, {
    fields: [stakeholders.userId],
    references: [users.id],
  }),
}));

// Approval workflow statuses
export const approvalStatuses = ["pending", "approved", "rejected", "changes_requested"] as const;
export const approvalStatusSchema = z.enum(approvalStatuses);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

// Approval workflow request types
export const approvalItemTypes = ["event_attendance", "event_cfp_submission", "event_speaking", "event_sponsorship", "event_budget_request"] as const;
export const approvalItemTypeSchema = z.enum(approvalItemTypes);
export type ApprovalItemType = z.infer<typeof approvalItemTypeSchema>;

// Approval workflow table
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull().$type<ApprovalItemType>(),
  itemId: integer("item_id").notNull(), // References various entities based on itemType
  status: text("status").notNull().default("pending").$type<ApprovalStatus>(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  dueDate: date("due_date"),
  priority: text("priority").notNull().default("medium").$type<EventPriority>(), // Reusing event priority enum
  estimatedCosts: text("estimated_costs"), // Add field for estimated costs
  metadata: json("metadata"), // Additional workflow data in JSON format
});

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reviewerIds: z.array(z.number()).min(1, "At least one reviewer is required"),
  stakeholderIds: z.array(z.number()).optional(),
});

export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;

// Approval workflow reviewers join table
export const workflowReviewers = pgTable("workflow_reviewers", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  isRequired: boolean("is_required").notNull().default(true),
  status: text("status").notNull().default("pending").$type<ApprovalStatus>(),
  reviewedAt: timestamp("reviewed_at"),
  comments: text("comments"),
});

export const insertWorkflowReviewerSchema = createInsertSchema(workflowReviewers).omit({
  id: true,
  status: true,
  reviewedAt: true,
});

export type InsertWorkflowReviewer = z.infer<typeof insertWorkflowReviewerSchema>;
export type WorkflowReviewer = typeof workflowReviewers.$inferSelect;

// Approval workflow stakeholders join table
export const workflowStakeholders = pgTable("workflow_stakeholders", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id),
  notificationType: text("notification_type").notNull().default("email"),
  notifiedAt: timestamp("notified_at"),
});

export const insertWorkflowStakeholderSchema = createInsertSchema(workflowStakeholders).omit({
  id: true,
  notifiedAt: true,
});

export type InsertWorkflowStakeholder = z.infer<typeof insertWorkflowStakeholderSchema>;
export type WorkflowStakeholder = typeof workflowStakeholders.$inferSelect;

// Comments table for approval workflows
export const workflowComments = pgTable("workflow_comments", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isPrivate: boolean("is_private").notNull().default(false),
  parentId: integer("parent_id").references(() => undefined as unknown as number), // Temporary workaround for circular reference
});

export const insertWorkflowCommentSchema = createInsertSchema(workflowComments).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowComment = z.infer<typeof insertWorkflowCommentSchema>;
export type WorkflowComment = typeof workflowComments.$inferSelect;

// Workflow history for tracking changes
export const workflowHistory = pgTable("workflow_history", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  previousStatus: text("previous_status").$type<ApprovalStatus>(),
  newStatus: text("new_status").$type<ApprovalStatus>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkflowHistorySchema = createInsertSchema(workflowHistory).omit({
  id: true,
  timestamp: true,
});

export type InsertWorkflowHistory = z.infer<typeof insertWorkflowHistorySchema>;
export type WorkflowHistory = typeof workflowHistory.$inferSelect;

// Define relations for approval workflows
export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one, many }) => ({
  requester: one(users, {
    fields: [approvalWorkflows.requesterId],
    references: [users.id],
  }),
  reviewers: many(workflowReviewers),
  stakeholders: many(workflowStakeholders),
  comments: many(workflowComments),
  history: many(workflowHistory),
}));

// Define relations for workflow reviewers
export const workflowReviewersRelations = relations(workflowReviewers, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [workflowReviewers.workflowId],
    references: [approvalWorkflows.id],
  }),
  reviewer: one(users, {
    fields: [workflowReviewers.reviewerId],
    references: [users.id],
  }),
}));

// Define relations for workflow stakeholders
export const workflowStakeholdersRelations = relations(workflowStakeholders, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [workflowStakeholders.workflowId],
    references: [approvalWorkflows.id],
  }),
  stakeholder: one(stakeholders, {
    fields: [workflowStakeholders.stakeholderId],
    references: [stakeholders.id],
  }),
}));

// Define relations for workflow comments
export const workflowCommentsRelations = relations(workflowComments, ({ one, many }) => {
  return {
    workflow: one(approvalWorkflows, {
      fields: [workflowComments.workflowId],
      references: [approvalWorkflows.id],
    }),
    user: one(users, {
      fields: [workflowComments.userId],
      references: [users.id],
    }),
    parentComment: one(workflowComments, {
      fields: [workflowComments.parentId],
      references: [workflowComments.id],
    }),
    replies: many(workflowComments)
  };
});

// Define relations for workflow history
export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [workflowHistory.workflowId],
    references: [approvalWorkflows.id],
  }),
  user: one(users, {
    fields: [workflowHistory.userId],
    references: [users.id],
  }),
}));
