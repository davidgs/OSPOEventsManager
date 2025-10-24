import { pgTable, serial, text, timestamp, date, integer, jsonb, index } from "drizzle-orm/pg-core";

/**
 * CENTRALIZED DATABASE SCHEMA
 * All table definitions in one place to ensure consistency
 */

// Users table - Keycloak authentication only
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name"),
  email: text("email"),
  bio: text("bio"),
  role: text("role"),
  job_title: text("job_title"),
  headshot: text("headshot"),
  keycloak_id: text("keycloak_id"),
  preferences: text("preferences"),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  link: text("link").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  location: text("location").notNull(),
  priority: text("priority").notNull(),
  type: text("type").notNull(),
  goal: text("goal").array(),
  cfp_deadline: date("cfp_deadline"),
  cfp_link: text("cfp_link"),
  status: text("status").notNull().default("planning"),
  notes: text("notes"),
  created_by_id: integer("created_by_id"),
  updated_by_id: integer("updated_by_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// CFP submissions table
export const cfpSubmissions = pgTable("cfp_submissions", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  submitter_name: text("submitter_name").notNull(),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  submitter_id: integer("submitter_id"),
  submission_date: text("submission_date"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Attendees table
export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  user_id: integer("user_id"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Sponsorships table
export const sponsorships = pgTable("sponsorships", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
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

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  file_path: text("file_path").notNull(),
  file_size: integer("file_size").notNull(),
  mime_type: text("mime_type").notNull(),
  uploaded_by: integer("uploaded_by").notNull(),
  event_id: integer("event_id"),
  cfp_submission_id: integer("cfp_submission_id"),
  created_by_id: integer("created_by_id"),
  updated_by_id: integer("updated_by_id"),
  uploaded_at: timestamp("uploaded_at").notNull().defaultNow(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Edit history table
export const editHistory = pgTable("edit_history", {
  id: serial("id").primaryKey(),
  entity_type: text("entity_type").notNull(),
  entity_id: integer("entity_id").notNull(),
  edited_by_id: integer("edited_by_id").notNull(),
  edited_at: timestamp("edited_at").notNull().defaultNow(),
  change_description: text("change_description"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Stakeholders table
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

// Approval workflows table
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  item_type: text("item_type").notNull(),
  item_id: integer("item_id").notNull(),
  priority: text("priority"),
  status: text("status").notNull().default("pending"),
  due_date: date("due_date"),
  estimated_costs: text("estimated_costs"),
  requester_id: integer("requester_id").references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default("{}"),
});

// Workflow reviewers table
export const workflowReviewers = pgTable("workflow_reviewers", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull(),
  reviewer_id: integer("reviewer_id").notNull(),
  status: text("status").notNull().default("pending"),
  reviewed_at: timestamp("reviewed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow stakeholders table
export const workflowStakeholders = pgTable("workflow_stakeholders", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull(),
  stakeholder_id: integer("stakeholder_id").notNull(),
  role: text("role").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow comments table
export const workflowComments = pgTable("workflow_comments", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull(),
  commenter_id: integer("commenter_id").notNull(),
  comment: text("comment").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow history table
export const workflowHistory = pgTable("workflow_history", {
  id: serial("id").primaryKey(),
  workflow_id: integer("workflow_id").notNull(),
  action: text("action").notNull(),
  performed_by: integer("performed_by").notNull(),
  details: text("details"),
  performed_at: timestamp("performed_at").notNull().defaultNow(),
});

// Export all tables for use in database operations
export const allTables = {
  users,
  events,
  cfpSubmissions,
  attendees,
  sponsorships,
  assets,
  stakeholders,
  approvalWorkflows,
  workflowReviewers,
  workflowStakeholders,
  workflowComments,
  workflowHistory,
};