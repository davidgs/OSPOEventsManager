import { pgTable, serial, text, timestamp, date, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Event priorities
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

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  keycloak_id: text("keycloak_id"),
  username: text("username").notNull(),
  password: text("password"),
  name: text("name"),
  email: text("email"),
  bio: text("bio"),
  role: text("role"),
  job_title: text("job_title"),
  headshot: text("headshot"),
  preferences: jsonb("preferences"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  link: text("link").notNull(),
  description: text("description"),
  website: text("website"),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  location: text("location").notNull(),
  priority: text("priority").notNull().$type<EventPriority>(),
  type: text("type").notNull().$type<EventType>(),
  status: text("status").notNull().$type<EventStatus>().default("planning"),
  goal: text("goal").array().notNull().$type<EventGoals>(),
  cfp_deadline: date("cfp_deadline"),
  notes: text("notes"),
  created_by_id: integer("created_by_id").references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// CFP submissions table
export const cfpSubmissions = pgTable("cfp_submissions", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  submitter_name: text("submitter_name").notNull(),
  status: text("status").notNull().$type<CFPStatus>().default("draft"),
  notes: text("notes"),
  submitter_id: integer("submitter_id").references(() => users.id),
  submission_date: text("submission_date"),
});

export const insertCfpSubmissionSchema = createInsertSchema(cfpSubmissions).omit({
  id: true,
});

export type InsertCfpSubmission = z.infer<typeof insertCfpSubmissionSchema>;
export type CfpSubmission = typeof cfpSubmissions.$inferSelect;

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  user_id: integer("user_id").references(() => users.id),
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
  event_id: integer("event_id").notNull().references(() => events.id),
  sponsor_name: text("sponsor_name").notNull(),
  tier: text("tier").notNull(),
  amount: text("amount"),
  contact_email: text("contact_email"),
  contact_name: text("contact_name"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;
export type Sponsorship = typeof sponsorships.$inferSelect;

// Asset types
export const assetTypes = ["abstract", "bio", "headshot", "trip_report", "presentation", "other"] as const;
export const assetTypeSchema = z.enum(assetTypes);
export type AssetType = z.infer<typeof assetTypeSchema>;

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<AssetType>(),
  file_path: text("file_path").notNull(),
  file_size: integer("file_size").notNull(),
  mime_type: text("mime_type").notNull(),
  uploaded_by: integer("uploaded_by").notNull().references(() => users.id),
  event_id: integer("event_id").references(() => events.id),
  cfp_submission_id: integer("cfp_submission_id").references(() => cfpSubmissions.id),
  uploaded_at: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  uploaded_at: true,
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
  user_id: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  department: text("department"),
  organization: text("organization").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;
export type Stakeholder = typeof stakeholders.$inferSelect;

// Approval statuses
export const approvalStatuses = ["pending", "approved", "rejected", "changes_requested"] as const;
export const approvalStatusSchema = z.enum(approvalStatuses);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

// Approval item types
export const approvalItemTypes = ["event_attendance", "event_cfp_submission", "event_speaking", "event_sponsorship", "event_budget_request"] as const;
export const approvalItemTypeSchema = z.enum(approvalItemTypes);
export type ApprovalItemType = z.infer<typeof approvalItemTypeSchema>;

// Approval workflows table
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  item_type: text("item_type").notNull().$type<ApprovalItemType>(),
  item_id: integer("item_id"),
  requester_id: integer("requester_id").references(() => users.id),
  reviewer_ids: integer("reviewer_ids").array(),
  stakeholder_ids: integer("stakeholder_ids").array(),
  current_status: text("current_status").notNull().$type<ApprovalStatus>().default("pending"),
  due_date: date("due_date"),
  priority: text("priority").notNull().$type<EventPriority>().default("medium"),
  description: text("description"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;

// Workflow reviewers table
export const workflowReviewers = pgTable("workflow_reviewers", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().$type<ApprovalStatus>().default("pending"),
  review_date: timestamp("review_date"),
  comments: text("comments"),
});

export const insertWorkflowReviewerSchema = createInsertSchema(workflowReviewers).omit({
  id: true,
});

export type InsertWorkflowReviewer = z.infer<typeof insertWorkflowReviewerSchema>;
export type WorkflowReviewer = typeof workflowReviewers.$inferSelect;

// Workflow stakeholders table
export const workflowStakeholders = pgTable("workflow_stakeholders", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  stakeholder_id: integer("stakeholder_id").notNull().references(() => stakeholders.id),
  notified: timestamp("notified"),
});

export const insertWorkflowStakeholderSchema = createInsertSchema(workflowStakeholders).omit({
  id: true,
});

export type InsertWorkflowStakeholder = z.infer<typeof insertWorkflowStakeholderSchema>;
export type WorkflowStakeholder = typeof workflowStakeholders.$inferSelect;

// Workflow comments table
export const workflowComments = pgTable("workflow_comments", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  is_internal: integer("is_internal").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkflowCommentSchema = createInsertSchema(workflowComments).omit({
  id: true,
  created_at: true,
});

export type InsertWorkflowComment = z.infer<typeof insertWorkflowCommentSchema>;
export type WorkflowComment = typeof workflowComments.$inferSelect;

// Workflow history table
export const workflowHistory = pgTable("workflow_history", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull().references(() => approvalWorkflows.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  old_status: text("old_status").$type<ApprovalStatus>(),
  new_status: text("new_status").$type<ApprovalStatus>(),
  comment: text("comment"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkflowHistorySchema = createInsertSchema(workflowHistory).omit({
  id: true,
  created_at: true,
});

export type InsertWorkflowHistory = z.infer<typeof insertWorkflowHistorySchema>;
export type WorkflowHistory = typeof workflowHistory.$inferSelect;

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Relations
export const stakeholdersRelations = relations(stakeholders, ({ one }) => ({
  user: one(users, { fields: [stakeholders.user_id], references: [users.id] }),
}));

export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one, many }) => ({
  requester: one(users, { fields: [approvalWorkflows.requester_id], references: [users.id] }),
  reviewers: many(workflowReviewers),
  stakeholders: many(workflowStakeholders),
  comments: many(workflowComments),
  history: many(workflowHistory),
}));

export const workflowReviewersRelations = relations(workflowReviewers, ({ one }) => ({
  workflow: one(approvalWorkflows, { fields: [workflowReviewers.workflow_id], references: [approvalWorkflows.id] }),
  user: one(users, { fields: [workflowReviewers.user_id], references: [users.id] }),
}));

export const workflowStakeholdersRelations = relations(workflowStakeholders, ({ one }) => ({
  workflow: one(approvalWorkflows, { fields: [workflowStakeholders.workflow_id], references: [approvalWorkflows.id] }),
  stakeholder: one(stakeholders, { fields: [workflowStakeholders.stakeholder_id], references: [stakeholders.id] }),
}));

export const workflowCommentsRelations = relations(workflowComments, ({ one, many }) => {
  return {
    workflow: one(approvalWorkflows, { fields: [workflowComments.workflow_id], references: [approvalWorkflows.id] }),
    user: one(users, { fields: [workflowComments.user_id], references: [users.id] }),
  };
});

export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  workflow: one(approvalWorkflows, { fields: [workflowHistory.workflow_id], references: [approvalWorkflows.id] }),
  user: one(users, { fields: [workflowHistory.user_id], references: [users.id] }),
}));