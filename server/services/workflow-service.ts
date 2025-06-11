import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  approvalWorkflows,
  workflowReviewers,
  workflowStakeholders,
  workflowComments,
  workflowHistory,
  type ApprovalWorkflow,
  type InsertApprovalWorkflow,
  type WorkflowReviewer,
  type InsertWorkflowReviewer,
  type WorkflowStakeholder,
  type InsertWorkflowStakeholder,
  type WorkflowComment,
  type InsertWorkflowComment,
  type WorkflowHistory,
  type InsertWorkflowHistory,
  type ApprovalStatus
} from "../../shared/schema.js";

export class WorkflowService {
  /**
   * Get all approval workflows from the database
   */
  static async getAllWorkflows(): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db.select().from(approvalWorkflows).orderBy(desc(approvalWorkflows.createdAt));
  }

  /**
   * Get workflows filtered by status
   */
  static async getWorkflowsByStatus(status: ApprovalStatus): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.status, status))
      .orderBy(desc(approvalWorkflows.createdAt));
  }

  /**
   * Get workflows filtered by item type
   */
  static async getWorkflowsByItemType(
    itemType: ApprovalWorkflow["itemType"]
  ): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.itemType, itemType))
      .orderBy(desc(approvalWorkflows.createdAt));
  }

  /**
   * Get workflows for a specific item
   */
  static async getWorkflowsByItem(itemType: ApprovalWorkflow["itemType"], itemId: number): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.itemType, itemType),
          eq(approvalWorkflows.itemId, itemId)
        )
      )
      .orderBy(desc(approvalWorkflows.createdAt));
  }

  /**
   * Get workflows created by a specific requester
   */
  static async getWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.requesterId, requesterId))
      .orderBy(desc(approvalWorkflows.createdAt));
  }

  /**
   * Get a specific workflow by ID
   */
  static async getWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database connection is not initialized.");
    const [workflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id));

    return workflow || undefined;
  }

  /**
   * Create a new workflow
   */
  static async createWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    if (!db) throw new Error("Database connection is not initialized.");
    const allowedPriorities = ["low", "medium", "high"] as const;
    const workflowWithDates = {
      ...workflow,
      itemType: workflow.itemType as ApprovalWorkflow["itemType"],
      priority: allowedPriorities.includes(workflow.priority as any)
        ? (workflow.priority as "low" | "medium" | "high")
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newWorkflow] = await db
      .insert(approvalWorkflows)
      .values(workflowWithDates)
      .returning();

    return newWorkflow;
  }

  /**
   * Update an existing workflow
   */
  static async updateWorkflow(id: number, workflowData: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined> {
    const dataWithUpdatedAt = {
      ...workflowData,
      updatedAt: new Date()
    };

    const [updatedWorkflow] = await db
      .update(approvalWorkflows)
      .set(dataWithUpdatedAt)
      .where(eq(approvalWorkflows.id, id))
      .returning();

    return updatedWorkflow || undefined;
  }

  /**
   * Update workflow status and record the change in history
   */
  static async updateWorkflowStatus(id: number, status: ApprovalStatus, userId: number): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database connection is not initialized.");
    // Update the workflow status
    const [updatedWorkflow] = await db
      .update(approvalWorkflows)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    if (!updatedWorkflow) return undefined;

    // Record the status change in workflow history
    await db.insert(workflowHistory).values({
      workflowId: id,
      userId,
      action: `Status changed to ${status}`
    });

    return updatedWorkflow;
  }

  /**
   * Delete a workflow
   */
   static async deleteWorkflow(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection is not initialized.");
    // First delete all related records
    await db.delete(workflowReviewers).where(eq(workflowReviewers.workflowId, id));
    await db.delete(workflowStakeholders).where(eq(workflowStakeholders.workflowId, id));
    await db.delete(workflowComments).where(eq(workflowComments.workflowId, id));
    await db.delete(workflowHistory).where(eq(workflowHistory.workflowId, id));

    // Then delete the workflow itself
    const result = await db.delete(approvalWorkflows).where(eq(approvalWorkflows.id, id));
    return result.count > 0;
  }

  // Reviewer methods
  static async getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.workflowId, workflowId));
  }

  static async getWorkflowReviewersByUser(userId: number): Promise<WorkflowReviewer[]> {
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.reviewerId, userId));
  }

  static async getWorkflowReviewer(id: number): Promise<WorkflowReviewer | undefined> {
    const [reviewer] = await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.id, id));

    return reviewer || undefined;
  }

  static async createWorkflowReviewer(reviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer> {
    const [newReviewer] = await db
      .insert(workflowReviewers)
      .values(reviewer)
      .returning();

    return newReviewer;
  }

  static async updateWorkflowReviewer(id: number, reviewerData: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined> {
    const [updatedReviewer] = await db
      .update(workflowReviewers)
      .set(reviewerData)
      .where(eq(workflowReviewers.id, id))
      .returning();

    return updatedReviewer || undefined;
  }

  static async updateWorkflowReviewerStatus(id: number, status: ApprovalStatus, comments?: string): Promise<WorkflowReviewer | undefined> {
    const [updatedReviewer] = await db
      .update(workflowReviewers)
      .set({
        status,
        reviewedAt: new Date(),
        comments: comments || null
      })
      .where(eq(workflowReviewers.id, id))
      .returning();

    return updatedReviewer || undefined;
  }

  static async deleteWorkflowReviewer(id: number): Promise<boolean> {
    const result = await db.delete(workflowReviewers).where(eq(workflowReviewers.id, id));
    return result.count > 0;
  }

  // Workflow comment methods
  static async getWorkflowComments(workflowId: number): Promise<WorkflowComment[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.workflowId, workflowId))
      .orderBy(desc(workflowComments.createdAt));
  }

  static async getWorkflowCommentsByUser(userId: number): Promise<WorkflowComment[]> {
    return await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.userId, userId))
      .orderBy(desc(workflowComments.createdAt));
  }

  static async getWorkflowComment(id: number): Promise<WorkflowComment | undefined> {
    const [comment] = await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.id, id));

    return comment || undefined;
  }

  static async createWorkflowComment(comment: InsertWorkflowComment): Promise<WorkflowComment> {
    const commentWithDate = {
      ...comment,
      createdAt: new Date()
    };

    const [newComment] = await db
      .insert(workflowComments)
      .values(commentWithDate)
      .returning();

    return newComment;
  }

  static async updateWorkflowComment(id: number, commentData: Partial<InsertWorkflowComment>): Promise<WorkflowComment | undefined> {
    const [updatedComment] = await db
      .update(workflowComments)
      .set(commentData)
      .where(eq(workflowComments.id, id))
      .returning();

    return updatedComment || undefined;
  }

  static async deleteWorkflowComment(id: number): Promise<boolean> {
    const result = await db.delete(workflowComments).where(eq(workflowComments.id, id));
    return result.count > 0;
  }

  // Workflow history methods
  static async getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]> {
    if (!db) throw new Error("Database connection is not initialized.");
    return await db
      .select()
      .from(workflowHistory)
      .where(eq(workflowHistory.workflowId, workflowId))
      .orderBy(desc(workflowHistory.createdAt));
  }

  static async createWorkflowHistory(history: InsertWorkflowHistory): Promise<WorkflowHistory> {
    if (!db) throw new Error("Database connection is not initialized.");
    const historyWithDate = {
      ...history,
      createdAt: new Date()
    };

    const [newHistory] = await db
      .insert(workflowHistory)
      .values(historyWithDate)
      .returning();

    return newHistory;
  }
}