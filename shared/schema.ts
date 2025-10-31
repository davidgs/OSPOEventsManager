/**
 * LEGACY SCHEMA FILE - BACKWARD COMPATIBILITY
 *
 * This file re-exports from the new structured database files:
 * - database-schema.ts: All table definitions
 * - database-types.ts: All types and validation schemas
 *
 * New code should import directly from those files for better clarity.
 */

// Re-export all table definitions from database-schema.ts
export * from './database-schema.js';

// Re-export all types and schemas from database-types.ts
export * from './database-types.js';

// Legacy exports for backward compatibility
import { relations } from "drizzle-orm";
import * as schema from './database-schema.js';
import * as types from './database-types.js';

// Define table relations
export const usersRelations = relations(schema.users, ({ many }) => ({
  events: many(schema.events),
  cfpSubmissions: many(schema.cfpSubmissions),
  attendees: many(schema.attendees),
  assets: many(schema.assets),
  stakeholders: many(schema.stakeholders),
  approvalWorkflows: many(schema.approvalWorkflows),
  workflowReviewers: many(schema.workflowReviewers),
  workflowComments: many(schema.workflowComments),
  workflowHistory: many(schema.workflowHistory),
}));

export const eventsRelations = relations(schema.events, ({ one, many }) => ({
  createdBy: one(schema.users, {
    fields: [schema.events.created_by_id],
    references: [schema.users.id],
  }),
  cfpSubmissions: many(schema.cfpSubmissions),
  attendees: many(schema.attendees),
  sponsorships: many(schema.sponsorships),
  assets: many(schema.assets),
}));

export const cfpSubmissionsRelations = relations(schema.cfpSubmissions, ({ one, many }) => ({
  event: one(schema.events, {
    fields: [schema.cfpSubmissions.event_id],
    references: [schema.events.id],
  }),
  submitter: one(schema.users, {
    fields: [schema.cfpSubmissions.submitter_id],
    references: [schema.users.id],
  }),
  assets: many(schema.assets),
}));

export const attendeesRelations = relations(schema.attendees, ({ one }) => ({
  event: one(schema.events, {
    fields: [schema.attendees.event_id],
    references: [schema.events.id],
  }),
  user: one(schema.users, {
    fields: [schema.attendees.user_id],
    references: [schema.users.id],
  }),
}));

export const sponsorshipsRelations = relations(schema.sponsorships, ({ one }) => ({
  event: one(schema.events, {
    fields: [schema.sponsorships.event_id],
    references: [schema.events.id],
  }),
}));

export const assetsRelations = relations(schema.assets, ({ one }) => ({
  uploadedBy: one(schema.users, {
    fields: [schema.assets.uploaded_by],
    references: [schema.users.id],
  }),
  event: one(schema.events, {
    fields: [schema.assets.event_id],
    references: [schema.events.id],
  }),
  cfpSubmission: one(schema.cfpSubmissions, {
    fields: [schema.assets.cfp_submission_id],
    references: [schema.cfpSubmissions.id],
  }),
}));

export const stakeholdersRelations = relations(schema.stakeholders, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.stakeholders.user_id],
    references: [schema.users.id],
  }),
}));

export const approvalWorkflowsRelations = relations(schema.approvalWorkflows, ({ one, many }) => ({
  requester: one(schema.users, {
    fields: [schema.approvalWorkflows.requester_id],
    references: [schema.users.id],
  }),
  reviewers: many(schema.workflowReviewers),
  stakeholders: many(schema.workflowStakeholders),
  comments: many(schema.workflowComments),
  history: many(schema.workflowHistory),
}));

export const workflowReviewersRelations = relations(schema.workflowReviewers, ({ one }) => ({
  workflow: one(schema.approvalWorkflows, {
    fields: [schema.workflowReviewers.workflow_id],
    references: [schema.approvalWorkflows.id],
  }),
  reviewer: one(schema.users, {
    fields: [schema.workflowReviewers.reviewer_id],
    references: [schema.users.id],
  }),
}));

export const workflowStakeholdersRelations = relations(schema.workflowStakeholders, ({ one }) => ({
  workflow: one(schema.approvalWorkflows, {
    fields: [schema.workflowStakeholders.workflow_id],
    references: [schema.approvalWorkflows.id],
  }),
  stakeholder: one(schema.stakeholders, {
    fields: [schema.workflowStakeholders.stakeholder_id],
    references: [schema.stakeholders.id],
  }),
}));

export const workflowCommentsRelations = relations(schema.workflowComments, ({ one }) => ({
  workflow: one(schema.approvalWorkflows, {
    fields: [schema.workflowComments.workflow_id],
    references: [schema.approvalWorkflows.id],
  }),
  commenter: one(schema.users, {
    fields: [schema.workflowComments.commenter_id],
    references: [schema.users.id],
  }),
}));

export const workflowHistoryRelations = relations(schema.workflowHistory, ({ one }) => ({
  workflow: one(schema.approvalWorkflows, {
    fields: [schema.workflowHistory.workflow_id],
    references: [schema.approvalWorkflows.id],
  }),
  performedBy: one(schema.users, {
    fields: [schema.workflowHistory.performed_by],
    references: [schema.users.id],
  }),
}));

// Re-export types for backward compatibility
export type {
  // Base types
  User,
  Event,
  CFPSubmission,
  Attendee,
  Sponsorship,
  Asset,
  Stakeholder,
  ApprovalWorkflow,
  WorkflowReviewer,
  WorkflowStakeholder,
  WorkflowComment,
  WorkflowHistory,

  // Insert types
  InsertUser,
  InsertEvent,
  InsertCFPSubmission,
  InsertAttendee,
  InsertSponsorship,
  InsertAsset,
  InsertStakeholder,
  InsertApprovalWorkflow,
  InsertWorkflowReviewer,
  InsertWorkflowStakeholder,
  InsertWorkflowComment,
  InsertWorkflowHistory,

  // Response types
  UserResponse,
  EventResponse,
  CFPSubmissionResponse,
  AttendeeResponse,
  SponsorshipResponse,
  AssetResponse,
  StakeholderResponse,
  ApprovalWorkflowResponse,
  WorkflowReviewerResponse,
  WorkflowStakeholderResponse,
  WorkflowCommentResponse,
  WorkflowHistoryResponse,

  // Enum types
  EventPriority,
  EventType,
  EventGoal,
  EventGoals,
  EventStatus,
  CFPStatus,
  AssetType,
  StakeholderRole,
  ApprovalStatus,
  ApprovalItemType,

  // Utility types
  PaginationParams,
  PaginatedResponse,
  DatabaseError,
  DatabaseResult,
} from './database-types.js';

// Re-export validation schemas
export {
  // Constants
  eventPriorities,
  eventTypes,
  eventGoals,
  eventStatuses,
  cfpStatuses,
  assetTypes,
  stakeholderRoles,
  approvalStatuses,
  approvalItemTypes,

  // Validation schemas
  eventPrioritySchema,
  eventTypeSchema,
  eventGoalSchema,
  eventGoalsArraySchema,
  eventStatusSchema,
  cfpStatusSchema,
  assetTypeSchema,
  stakeholderRoleSchema,
  approvalStatusSchema,
  approvalItemTypeSchema,

  // Insert schemas
  insertUserSchema,
  insertEventSchema,
  insertCFPSubmissionSchema,
  insertAttendeeSchema,
  insertSponsorshipSchema,
  insertAssetSchema,
  insertStakeholderSchema,
  insertApprovalWorkflowSchema,
  insertWorkflowReviewerSchema,
  insertWorkflowStakeholderSchema,
  insertWorkflowCommentSchema,
  insertWorkflowHistorySchema,

  // Update schemas
  updateUserProfileSchema,
  updateEventSchema,
  updateCFPSubmissionSchema,
  updateAttendeeSchema,
  updateSponsorshipSchema,
  updateAssetSchema,
  updateStakeholderSchema,
  updateApprovalWorkflowSchema,
} from './database-types.js';

// Keep legacy names for backward compatibility
import {
  insertCFPSubmissionSchema,
  updateCFPSubmissionSchema,
  updateUserProfileSchema,
} from './database-types.js';

export {
  insertCFPSubmissionSchema as insertCfpSubmissionSchema,
  updateCFPSubmissionSchema as updateCfpSubmissionSchema,
  updateUserProfileSchema as updateUserPreferencesSchema,
};