import { 
  users, events, cfpSubmissions, attendees, sponsorships, assets, stakeholders,
  approvalWorkflows, workflowReviewers, workflowStakeholders, workflowComments, workflowHistory,
  type User, type Event, type CfpSubmission, type Attendee, type Sponsorship, type Asset, 
  type Stakeholder, type ApprovalWorkflow, type WorkflowReviewer, type WorkflowStakeholder,
  type WorkflowComment, type WorkflowHistory,
  type InsertUser, type InsertEvent, type InsertCfpSubmission, type InsertAttendee,
  type InsertSponsorship, type InsertAsset, type InsertStakeholder, type InsertApprovalWorkflow,
  type InsertWorkflowReviewer, type InsertWorkflowStakeholder, type InsertWorkflowComment,
  type InsertWorkflowHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByKeycloakId(keycloakId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // CFP submission operations
  getCfpSubmissions(): Promise<CfpSubmission[]>;
  getCfpSubmissionsByEvent(eventId: number): Promise<CfpSubmission[]>;
  getCfpSubmission(id: number): Promise<CfpSubmission | undefined>;
  createCfpSubmission(submission: InsertCfpSubmission): Promise<CfpSubmission>;
  updateCfpSubmission(id: number, submission: Partial<InsertCfpSubmission>): Promise<CfpSubmission | undefined>;
  deleteCfpSubmission(id: number): Promise<boolean>;

  // Attendee operations
  getAttendees(): Promise<Attendee[]>;
  getAttendeesByEvent(eventId: number): Promise<Attendee[]>;
  getAttendee(id: number): Promise<Attendee | undefined>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: number): Promise<boolean>;

  // Sponsorship operations
  getSponsorships(): Promise<Sponsorship[]>;
  getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]>;
  getSponsorship(id: number): Promise<Sponsorship | undefined>;
  createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship>;
  updateSponsorship(id: number, sponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined>;
  deleteSponsorship(id: number): Promise<boolean>;

  // Asset operations
  getAssets(): Promise<Asset[]>;
  getAssetsByEvent(eventId: number): Promise<Asset[]>;
  getAssetsByUser(userId: number): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;

  // Stakeholder operations
  getStakeholders(): Promise<Stakeholder[]>;
  getStakeholdersByRole(role: string): Promise<Stakeholder[]>;
  getStakeholder(id: number): Promise<Stakeholder | undefined>;
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: number, stakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: number): Promise<boolean>;

  // Approval workflow operations
  getApprovalWorkflows(): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined>;
  createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow>;
  updateApprovalWorkflow(id: number, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined>;
  deleteApprovalWorkflow(id: number): Promise<boolean>;

  // Workflow reviewer operations
  getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]>;
  createWorkflowReviewer(reviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer>;
  updateWorkflowReviewer(id: number, reviewer: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined>;
  deleteWorkflowReviewer(id: number): Promise<boolean>;

  // Workflow stakeholder operations
  getWorkflowStakeholders(workflowId: number): Promise<WorkflowStakeholder[]>;
  createWorkflowStakeholder(stakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder>;
  deleteWorkflowStakeholder(id: number): Promise<boolean>;

  // Workflow comment operations
  getWorkflowComments(workflowId: number): Promise<WorkflowComment[]>;
  createWorkflowComment(comment: InsertWorkflowComment): Promise<WorkflowComment>;

  // Workflow history operations
  getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]>;
  createWorkflowHistory(history: InsertWorkflowHistory): Promise<WorkflowHistory>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByKeycloakId(keycloakId: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db.select().from(users).where(eq(users.keycloakId, keycloakId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        lastLogin: null,
        createdAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    if (!db) throw new Error("Database not initialized");
    
    const [result] = await db
      .insert(events)
      .values({
        ...event,
        status: "planning",
        goal: Array.isArray(event.goal) ? JSON.stringify(event.goal) : event.goal,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        website: null,
      })
      .returning();

    if (!result) {
      throw new Error("Failed to create event");
    }

    return result;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    if (!db) throw new Error("Database not initialized");
    
    const updateData = { ...updateEvent };
    if (updateEvent.goal) {
      updateData.goal = Array.isArray(updateEvent.goal) 
        ? JSON.stringify(updateEvent.goal) 
        : updateEvent.goal;
    }
    
    const [event] = await db
      .update(events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    return event;
  }

  async deleteEvent(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();
    return !!deletedEvent;
  }

  // CFP submission operations
  async getCfpSubmissions(): Promise<CfpSubmission[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(cfpSubmissions).orderBy(desc(cfpSubmissions.submissionDate));
  }

  async getCfpSubmissionsByEvent(eventId: number): Promise<CfpSubmission[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(cfpSubmissions)
      .where(eq(cfpSubmissions.eventId, eventId))
      .orderBy(desc(cfpSubmissions.submissionDate));
  }

  async getCfpSubmission(id: number): Promise<CfpSubmission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [submission] = await db.select().from(cfpSubmissions).where(eq(cfpSubmissions.id, id));
    return submission;
  }

  async createCfpSubmission(submission: InsertCfpSubmission): Promise<CfpSubmission> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(cfpSubmissions)
      .values({
        ...submission,
        status: submission.status || "draft",
        submissionDate: submission.submissionDate || new Date().toISOString(),
      })
      .returning();
    return result;
  }

  async updateCfpSubmission(id: number, submission: Partial<InsertCfpSubmission>): Promise<CfpSubmission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(cfpSubmissions)
      .set(submission)
      .where(eq(cfpSubmissions.id, id))
      .returning();
    return result;
  }

  async deleteCfpSubmission(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(cfpSubmissions)
      .where(eq(cfpSubmissions.id, id))
      .returning();
    return !!deleted;
  }

  // Attendee operations
  async getAttendees(): Promise<Attendee[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(attendees);
  }

  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(attendees)
      .where(eq(attendees.eventId, eventId));
  }

  async getAttendee(id: number): Promise<Attendee | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [attendee] = await db.select().from(attendees).where(eq(attendees.id, id));
    return attendee;
  }

  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(attendees)
      .values({
        ...attendee,
        email: attendee.email || null,
        role: attendee.role || null,
        notes: attendee.notes || null,
        userId: attendee.userId || null,
      })
      .returning();
    return result;
  }

  async updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(attendees)
      .set(attendee)
      .where(eq(attendees.id, id))
      .returning();
    return result;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(attendees)
      .where(eq(attendees.id, id))
      .returning();
    return !!deleted;
  }

  // Sponsorship operations
  async getSponsorships(): Promise<Sponsorship[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(sponsorships);
  }

  async getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.eventId, eventId));
  }

  async getSponsorship(id: number): Promise<Sponsorship | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [sponsorship] = await db.select().from(sponsorships).where(eq(sponsorships.id, id));
    return sponsorship;
  }

  async createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(sponsorships)
      .values({
        ...sponsorship,
        amount: sponsorship.amount || null,
        contactName: sponsorship.contactName || null,
        contactEmail: sponsorship.contactEmail || null,
        notes: sponsorship.notes || null,
      })
      .returning();
    return result;
  }

  async updateSponsorship(id: number, sponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(sponsorships)
      .set(sponsorship)
      .where(eq(sponsorships.id, id))
      .returning();
    return result;
  }

  async deleteSponsorship(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(sponsorships)
      .where(eq(sponsorships.id, id))
      .returning();
    return !!deleted;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(assets).orderBy(desc(assets.uploadedAt));
  }

  async getAssetsByEvent(eventId: number): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.eventId, eventId))
      .orderBy(desc(assets.uploadedAt));
  }

  async getAssetsByUser(userId: number): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.uploadedBy, userId))
      .orderBy(desc(assets.uploadedAt));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(assets)
      .values({
        ...asset,
        description: asset.description || null,
        eventId: asset.eventId || null,
        uploadedByName: asset.uploadedByName || null,
        cfpSubmissionId: asset.cfpSubmissionId || null,
        uploadedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(assets)
      .set(asset)
      .where(eq(assets.id, id))
      .returning();
    return result;
  }

  async deleteAsset(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();
    return !!deleted;
  }

  // Stakeholder operations
  async getStakeholders(): Promise<Stakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(stakeholders);
  }

  async getStakeholdersByRole(role: string): Promise<Stakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.role, role));
  }

  async getStakeholder(id: number): Promise<Stakeholder | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [stakeholder] = await db.select().from(stakeholders).where(eq(stakeholders.id, id));
    return stakeholder;
  }

  async createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(stakeholders)
      .values({
        ...stakeholder,
        userId: stakeholder.userId || null,
        department: stakeholder.department || null,
        notes: stakeholder.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateStakeholder(id: number, stakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(stakeholders)
      .set({
        ...stakeholder,
        updatedAt: new Date(),
      })
      .where(eq(stakeholders.id, id))
      .returning();
    return result;
  }

  async deleteStakeholder(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(stakeholders)
      .where(eq(stakeholders.id, id))
      .returning();
    return !!deleted;
  }

  // Approval workflow operations
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(approvalWorkflows).orderBy(desc(approvalWorkflows.createdAt));
  }

  async getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [workflow] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, id));
    return workflow;
  }

  async createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(approvalWorkflows)
      .values({
        ...workflow,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateApprovalWorkflow(id: number, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(approvalWorkflows)
      .set({
        ...workflow,
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return result;
  }

  async deleteApprovalWorkflow(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return !!deleted;
  }

  // Workflow reviewer operations
  async getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.workflowId, workflowId));
  }

  async createWorkflowReviewer(reviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(workflowReviewers)
      .values({
        ...reviewer,
        status: "pending",
        isRequired: reviewer.isRequired ?? true,
        reviewedAt: null,
        comments: reviewer.comments || null,
      })
      .returning();
    return result;
  }

  async updateWorkflowReviewer(id: number, reviewer: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .update(workflowReviewers)
      .set({
        ...reviewer,
        reviewedAt: new Date(),
      })
      .where(eq(workflowReviewers.id, id))
      .returning();
    return result;
  }

  async deleteWorkflowReviewer(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(workflowReviewers)
      .where(eq(workflowReviewers.id, id))
      .returning();
    return !!deleted;
  }

  // Workflow stakeholder operations
  async getWorkflowStakeholders(workflowId: number): Promise<WorkflowStakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowStakeholders)
      .where(eq(workflowStakeholders.workflowId, workflowId));
  }

  async createWorkflowStakeholder(stakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(workflowStakeholders)
      .values(stakeholder)
      .returning();
    return result;
  }

  async deleteWorkflowStakeholder(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const [deleted] = await db
      .delete(workflowStakeholders)
      .where(eq(workflowStakeholders.id, id))
      .returning();
    return !!deleted;
  }

  // Workflow comment operations
  async getWorkflowComments(workflowId: number): Promise<WorkflowComment[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.workflowId, workflowId))
      .orderBy(asc(workflowComments.createdAt));
  }

  async createWorkflowComment(comment: InsertWorkflowComment): Promise<WorkflowComment> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(workflowComments)
      .values({
        ...comment,
        createdAt: new Date(),
      })
      .returning();
    return result;
  }

  // Workflow history operations
  async getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowHistory)
      .where(eq(workflowHistory.workflowId, workflowId))
      .orderBy(asc(workflowHistory.createdAt));
  }

  async createWorkflowHistory(history: InsertWorkflowHistory): Promise<WorkflowHistory> {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .insert(workflowHistory)
      .values({
        ...history,
        createdAt: new Date(),
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();