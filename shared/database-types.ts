import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import * as schema from "./database-schema.js";

/**
 * STRONGLY TYPED DATABASE TYPES
 * All types derived directly from database schema to ensure consistency
 */

// =============================================================================
// ENUM TYPES AND CONSTANTS
// =============================================================================

// Event priorities
export const eventPriorities = ["essential", "high", "medium", "low", "nice to have"] as const;
export const eventPrioritySchema = z.enum(eventPriorities);
export type EventPriority = z.infer<typeof eventPrioritySchema>;

// Event types
export const eventTypes = ["conference", "meetup", "webinar", "workshop", "hackathon"] as const;
export const eventTypeSchema = z.enum(eventTypes);
export type EventType = z.infer<typeof eventTypeSchema>;

// Event goals
export const eventGoals = ["speaking", "sponsoring", "attending", "exhibiting","networking"] as const;
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

// Asset types
export const assetTypes = ["abstract", "bio", "headshot", "trip_report", "presentation", "other"] as const;
export const assetTypeSchema = z.enum(assetTypes);
export type AssetType = z.infer<typeof assetTypeSchema>;

// Stakeholder roles
export const stakeholderRoles = ["executive", "manager", "legal", "finance", "marketing", "technical"] as const;
export const stakeholderRoleSchema = z.enum(stakeholderRoles);
export type StakeholderRole = z.infer<typeof stakeholderRoleSchema>;

// Approval statuses
export const approvalStatuses = ["pending", "approved", "rejected", "on_hold"] as const;
export const approvalStatusSchema = z.enum(approvalStatuses);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;

// Approval item types
export const approvalItemTypes = ["event", "cfp_submission", "sponsorship", "asset"] as const;
export const approvalItemTypeSchema = z.enum(approvalItemTypes);
export type ApprovalItemType = z.infer<typeof approvalItemTypeSchema>;

// =============================================================================
// DATABASE RECORD TYPES (Select types - what comes from the database)
// =============================================================================

export type User = typeof schema.users.$inferSelect;
export type Event = typeof schema.events.$inferSelect;
export type CFPSubmission = typeof schema.cfpSubmissions.$inferSelect;
export type Attendee = typeof schema.attendees.$inferSelect;
export type Sponsorship = typeof schema.sponsorships.$inferSelect;
export type Asset = typeof schema.assets.$inferSelect;
export type Stakeholder = typeof schema.stakeholders.$inferSelect;
export type ApprovalWorkflow = typeof schema.approvalWorkflows.$inferSelect;
export type WorkflowReviewer = typeof schema.workflowReviewers.$inferSelect;
export type WorkflowStakeholder = typeof schema.workflowStakeholders.$inferSelect;
export type WorkflowComment = typeof schema.workflowComments.$inferSelect;
export type WorkflowHistory = typeof schema.workflowHistory.$inferSelect;
export type EditHistory = typeof schema.editHistory.$inferSelect;

// =============================================================================
// INSERT TYPES (What goes into the database)
// =============================================================================

export type InsertUser = typeof schema.users.$inferInsert;
export type InsertEvent = typeof schema.events.$inferInsert;
export type InsertCFPSubmission = typeof schema.cfpSubmissions.$inferInsert;
export type InsertAttendee = typeof schema.attendees.$inferInsert;
export type InsertSponsorship = typeof schema.sponsorships.$inferInsert;
export type InsertAsset = typeof schema.assets.$inferInsert;
export type InsertStakeholder = typeof schema.stakeholders.$inferInsert;
export type InsertApprovalWorkflow = typeof schema.approvalWorkflows.$inferInsert;
export type InsertWorkflowReviewer = typeof schema.workflowReviewers.$inferInsert;
export type InsertWorkflowStakeholder = typeof schema.workflowStakeholders.$inferInsert;
export type InsertWorkflowComment = typeof schema.workflowComments.$inferInsert;
export type InsertWorkflowHistory = typeof schema.workflowHistory.$inferInsert;
export type InsertEditHistory = typeof schema.editHistory.$inferInsert;

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

// Insert schemas (for API validation)
export const insertUserSchema = createInsertSchema(schema.users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEventSchema = createInsertSchema(schema.events).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCFPSubmissionSchema = createInsertSchema(schema.cfpSubmissions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAttendeeSchema = createInsertSchema(schema.attendees).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSponsorshipSchema = createInsertSchema(schema.sponsorships).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAssetSchema = createInsertSchema(schema.assets).omit({
  id: true,
  uploaded_at: true,
});

export const insertStakeholderSchema = createInsertSchema(schema.stakeholders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertApprovalWorkflowSchema = createInsertSchema(schema.approvalWorkflows).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkflowReviewerSchema = createInsertSchema(schema.workflowReviewers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkflowStakeholderSchema = createInsertSchema(schema.workflowStakeholders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkflowCommentSchema = createInsertSchema(schema.workflowComments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertWorkflowHistorySchema = createInsertSchema(schema.workflowHistory).omit({
  id: true,
});

export const insertEditHistorySchema = createInsertSchema(schema.editHistory).omit({
  id: true,
  created_at: true,
});

// =============================================================================
// UPDATE SCHEMAS
// =============================================================================

export const updateUserProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  bio: z.string().optional(),
  job_title: z.string().optional(),
  headshot: z.string().optional(),
  role: z.string().optional(),
  preferences: z.string().optional(),
});

export const updateEventSchema = insertEventSchema.partial();
export const updateCFPSubmissionSchema = insertCFPSubmissionSchema.partial();
export const updateAttendeeSchema = insertAttendeeSchema.partial();
export const updateSponsorshipSchema = insertSponsorshipSchema.partial();
export const updateAssetSchema = insertAssetSchema.partial();
export const updateStakeholderSchema = insertStakeholderSchema.partial();
export const updateApprovalWorkflowSchema = insertApprovalWorkflowSchema.partial();

// =============================================================================
// RESPONSE TYPES (for API responses)
// =============================================================================

export type UserResponse = Omit<User, "preferences"> & {
  preferences?: any;
};

export type EventResponse = Event & {
  goal: EventGoal[];
};

export type CFPSubmissionResponse = CFPSubmission;
export type AttendeeResponse = Attendee;
export type SponsorshipResponse = Sponsorship;
export type AssetResponse = Asset;
export type StakeholderResponse = Stakeholder;
export type ApprovalWorkflowResponse = ApprovalWorkflow;
export type WorkflowReviewerResponse = WorkflowReviewer;
export type WorkflowStakeholderResponse = WorkflowStakeholder;
export type WorkflowCommentResponse = WorkflowComment;
export type WorkflowHistoryResponse = WorkflowHistory;
export type EditHistoryResponse = EditHistory;

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DatabaseError = {
  message: string;
  code?: string;
  details?: any;
};

export type DatabaseResult<T> = {
  success: boolean;
  data?: T;
  error?: DatabaseError;
};

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

// All types are already exported above individually
// This section is kept for documentation purposes only