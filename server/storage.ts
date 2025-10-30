import {
  users, events, cfpSubmissions, attendees, sponsorships, assets, stakeholders,
  approvalWorkflows, workflowReviewers, workflowStakeholders, workflowComments, workflowHistory,
  editHistory
} from "../shared/database-schema.js";
import {
  type User, type Event, type CFPSubmission, type Attendee, type Sponsorship, type Asset,
  type Stakeholder, type ApprovalWorkflow, type WorkflowReviewer, type WorkflowStakeholder,
  type WorkflowComment, type WorkflowHistory, type EditHistory,
  type InsertUser, type InsertEvent, type InsertCFPSubmission, type InsertAttendee,
  type InsertSponsorship, type InsertAsset, type InsertStakeholder, type InsertApprovalWorkflow,
  type InsertWorkflowReviewer, type InsertWorkflowStakeholder, type InsertWorkflowComment,
  type InsertWorkflowHistory, type InsertEditHistory
} from "../shared/database-types.js";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByKeycloakId(keycloakId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserProfile(id: number, updates: any): Promise<User | undefined>;
  getUsers(): Promise<User[]>;

  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(insertEvent: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // CFP submission operations
  getCfpSubmissions(): Promise<CFPSubmission[]>;
  getCfpSubmissionsByEvent(eventId: number): Promise<CFPSubmission[]>;
  getCfpSubmission(id: number): Promise<CFPSubmission | undefined>;
  createCfpSubmission(insertCfpSubmission: InsertCFPSubmission): Promise<CFPSubmission>;
  updateCfpSubmission(id: number, updates: Partial<InsertCFPSubmission>): Promise<CFPSubmission | undefined>;
  deleteCfpSubmission(id: number): Promise<boolean>;

  // Attendee operations
  getAttendees(): Promise<Attendee[]>;
  getAttendeesByEvent(eventId: number): Promise<Attendee[]>;
  getAttendee(id: number): Promise<Attendee | undefined>;
  createAttendee(insertAttendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: number, updates: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: number): Promise<boolean>;

  // Sponsorship operations
  getSponsorships(): Promise<Sponsorship[]>;
  getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]>;
  getSponsorship(id: number): Promise<Sponsorship | undefined>;
  createSponsorship(insertSponsorship: InsertSponsorship): Promise<Sponsorship>;
  updateSponsorship(id: number, updates: Partial<InsertSponsorship>): Promise<Sponsorship | undefined>;
  deleteSponsorship(id: number): Promise<boolean>;

  // Asset operations
  getAssets(): Promise<Asset[]>;
  getAssetsByUser(userId: number): Promise<Asset[]>;
  getAssetsByEvent(eventId: number): Promise<Asset[]>;
  getAssetsByCfpSubmission(cfpSubmissionId: number): Promise<Asset[]>;
  getAssetsByType(type: string): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(insertAsset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, updates: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;

  // Stakeholder operations
  getStakeholders(): Promise<Stakeholder[]>;
  getStakeholder(id: number): Promise<Stakeholder | undefined>;
  createStakeholder(insertStakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: number, updates: Partial<InsertStakeholder>): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: number): Promise<boolean>;
  getStakeholdersByRole(role: string): Promise<Stakeholder[]>;

  // Approval workflow operations
  getApprovalWorkflows(): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined>;
  createApprovalWorkflow(insertApprovalWorkflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow>;
  updateApprovalWorkflow(id: number, updates: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined>;
  updateApprovalWorkflowStatus(id: number, status: string): Promise<ApprovalWorkflow | undefined>;
  deleteApprovalWorkflow(id: number): Promise<boolean>;
  getApprovalWorkflowsByStatus(status: string): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByItem(itemType: string, itemId: number): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByItemType(itemType: string): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]>;

  // Workflow reviewer operations
  getWorkflowReviewers(): Promise<WorkflowReviewer[]>;
  getWorkflowReviewersByWorkflow(workflowId: number): Promise<WorkflowReviewer[]>;
  getWorkflowReviewersByUser(userId: number): Promise<WorkflowReviewer[]>;
  createWorkflowReviewer(insertWorkflowReviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer>;
  updateWorkflowReviewer(id: number, updates: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined>;
  updateWorkflowReviewerStatus(id: number, status: string): Promise<WorkflowReviewer | undefined>;
  deleteWorkflowReviewer(id: number): Promise<boolean>;

  // Workflow stakeholder operations
  getWorkflowStakeholders(): Promise<WorkflowStakeholder[]>;
  getWorkflowStakeholdersByWorkflow(workflowId: number): Promise<WorkflowStakeholder[]>;
  createWorkflowStakeholder(insertWorkflowStakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder>;
  updateWorkflowStakeholder(id: number, updates: Partial<InsertWorkflowStakeholder>): Promise<WorkflowStakeholder | undefined>;
  deleteWorkflowStakeholder(id: number): Promise<boolean>;

  // Workflow comment operations
  getWorkflowComments(): Promise<WorkflowComment[]>;
  getWorkflowCommentsByWorkflow(workflowId: number): Promise<WorkflowComment[]>;
  createWorkflowComment(insertWorkflowComment: InsertWorkflowComment): Promise<WorkflowComment>;
  updateWorkflowComment(id: number, updates: Partial<InsertWorkflowComment>): Promise<WorkflowComment | undefined>;
  deleteWorkflowComment(id: number): Promise<boolean>;

  // Workflow history operations
  getWorkflowHistory(): Promise<WorkflowHistory[]>;
  getWorkflowHistoryByWorkflow(workflowId: number): Promise<WorkflowHistory[]>;
  createWorkflowHistory(insertWorkflowHistory: InsertWorkflowHistory): Promise<WorkflowHistory>;

  // Edit history operations
  getEditHistory(entityType: string, entityId: number): Promise<EditHistory[]>;
  createEditHistory(insertEditHistory: InsertEditHistory): Promise<EditHistory>;
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
    console.log(`[getUserByKeycloakId] Querying for user with Keycloak ID: ${keycloakId}`);
    const [user] = await db.select().from(users).where(eq(users.keycloak_id, keycloakId));
    console.log(`[getUserByKeycloakId] Query result:`, user);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: number, updates: any): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [user] = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(users).orderBy(asc(users.name));
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(events).orderBy(desc(events.start_date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    if (!db) throw new Error("Database not initialized");
    const [event] = await db.insert(events).values([insertEvent]).returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [event] = await db
      .update(events)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount! > 0;
  }

  // CFP submission operations
  async getCfpSubmissions(): Promise<CFPSubmission[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(cfpSubmissions).orderBy(desc(cfpSubmissions.submission_date));
  }

  async getCfpSubmissionsByEvent(eventId: number): Promise<CFPSubmission[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(cfpSubmissions)
      .where(eq(cfpSubmissions.event_id, eventId))
      .orderBy(desc(cfpSubmissions.submission_date));
  }

  async getCfpSubmission(id: number): Promise<CFPSubmission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [cfpSubmission] = await db.select().from(cfpSubmissions).where(eq(cfpSubmissions.id, id));
    return cfpSubmission;
  }

  async createCfpSubmission(insertCfpSubmission: InsertCFPSubmission): Promise<CFPSubmission> {
    if (!db) throw new Error("Database not initialized");
    const [cfpSubmission] = await db.insert(cfpSubmissions).values([insertCfpSubmission]).returning();
    return cfpSubmission;
  }

  async updateCfpSubmission(id: number, updates: Partial<InsertCFPSubmission>): Promise<CFPSubmission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [cfpSubmission] = await db
      .update(cfpSubmissions)
      .set(updates)
      .where(eq(cfpSubmissions.id, id))
      .returning();
    return cfpSubmission;
  }

  async deleteCfpSubmission(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(cfpSubmissions).where(eq(cfpSubmissions.id, id));
    return result.rowCount! > 0;
  }

  // Attendee operations
  async getAttendees(): Promise<Attendee[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(attendees).orderBy(asc(attendees.name));
  }

  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(attendees)
      .where(eq(attendees.event_id, eventId))
      .orderBy(asc(attendees.name));
  }

  async getAttendee(id: number): Promise<Attendee | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [attendee] = await db.select().from(attendees).where(eq(attendees.id, id));
    return attendee;
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    if (!db) throw new Error("Database not initialized");
    const [attendee] = await db.insert(attendees).values(insertAttendee).returning();
    return attendee;
  }

  async updateAttendee(id: number, updates: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [attendee] = await db
      .update(attendees)
      .set(updates)
      .where(eq(attendees.id, id))
      .returning();
    return attendee;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(attendees).where(eq(attendees.id, id));
    return result.rowCount! > 0;
  }

  // Sponsorship operations
  async getSponsorships(): Promise<Sponsorship[]> {
    if (!db) throw new Error("Database not initialized");
    try {
      console.log("Executing getSponsorships query...");
      const result = await db.select().from(sponsorships).orderBy(desc(sponsorships.created_at));
      console.log("getSponsorships query successful, found", result.length, "records");
      return result;
    } catch (error) {
      console.error("Error in getSponsorships:", error);
      throw error;
    }
  }

  async getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.event_id, eventId))
      .orderBy(desc(sponsorships.created_at));
  }

  async getSponsorship(id: number): Promise<Sponsorship | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [sponsorship] = await db.select().from(sponsorships).where(eq(sponsorships.id, id));
    return sponsorship;
  }

  async createSponsorship(insertSponsorship: InsertSponsorship): Promise<Sponsorship> {
    if (!db) throw new Error("Database not initialized");
    const [sponsorship] = await db.insert(sponsorships).values(insertSponsorship).returning();
    return sponsorship;
  }

  async updateSponsorship(id: number, updates: Partial<InsertSponsorship>): Promise<Sponsorship | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [sponsorship] = await db
      .update(sponsorships)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(sponsorships.id, id))
      .returning();
    return sponsorship;
  }

  async deleteSponsorship(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(sponsorships).where(eq(sponsorships.id, id));
    return result.rowCount! > 0;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(assets).orderBy(desc(assets.uploaded_at));
  }

  async getAssetsByUser(userId: number): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.uploaded_by, userId))
      .orderBy(desc(assets.uploaded_at));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    if (!db) throw new Error("Database not initialized");
    const [asset] = await db.insert(assets).values([insertAsset]).returning();
    return asset;
  }

  async updateAsset(id: number, updates: Partial<InsertAsset>): Promise<Asset | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [asset] = await db
      .update(assets)
      .set(updates)
      .where(eq(assets.id, id))
      .returning();
    return asset;
  }

  async deleteAsset(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.rowCount! > 0;
  }

  async getAssetsByEvent(eventId: number): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.event_id, eventId))
      .orderBy(desc(assets.uploaded_at));
  }

  async getAssetsByCfpSubmission(cfpSubmissionId: number): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.cfp_submission_id, cfpSubmissionId))
      .orderBy(desc(assets.uploaded_at));
  }

  async getAssetsByType(type: string): Promise<Asset[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(assets)
      .where(eq(assets.type, type as any))
      .orderBy(desc(assets.uploaded_at));
  }

  // Stakeholder operations - using raw SQL to bypass schema issues
  async getStakeholders(): Promise<Stakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    // Use raw SQL to avoid schema issues
    const result = await db.execute(sql`
      SELECT id, user_id, name, email, role, department, organization, notes, created_at, updated_at
      FROM stakeholders
      ORDER BY name ASC
    `);
    return result.rows as Stakeholder[];
  }

  async getStakeholder(id: number): Promise<Stakeholder | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.execute(sql`
      SELECT id, user_id, name, email, role, department, organization, notes, created_at, updated_at
      FROM stakeholders
      WHERE id = ${id}
    `);
    return result.rows[0] as Stakeholder | undefined;
  }

  async createStakeholder(insertStakeholder: InsertStakeholder): Promise<Stakeholder> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.execute(sql`
      INSERT INTO stakeholders (user_id, name, email, role, department, organization, notes)
      VALUES (${insertStakeholder.user_id}, ${insertStakeholder.name}, ${insertStakeholder.email},
              ${insertStakeholder.role}, ${insertStakeholder.department}, ${insertStakeholder.organization},
              ${insertStakeholder.notes})
      RETURNING id, user_id, name, email, role, department, organization, notes, created_at, updated_at
    `);
    return result.rows[0] as Stakeholder;
  }

  async updateStakeholder(id: number, updates: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    if (!db) throw new Error("Database not initialized");

    // Use Drizzle's type-safe update method instead of raw SQL
    const updateData: any = { ...updates, updated_at: new Date() };

    const [stakeholder] = await db
      .update(stakeholders)
      .set(updateData)
      .where(eq(stakeholders.id, id))
      .returning();

    return stakeholder;
  }

  async deleteStakeholder(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.execute(sql`DELETE FROM stakeholders WHERE id = ${id}`);
    return result.rowCount! > 0;
  }

  async getStakeholdersByRole(role: string): Promise<Stakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.execute(sql`
      SELECT id, user_id, name, email, role, department, organization, notes, created_at, updated_at
      FROM stakeholders
      WHERE role = ${role}
      ORDER BY name ASC
    `);
    return result.rows as Stakeholder[];
  }

  // Approval workflow operations
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(approvalWorkflows).orderBy(desc(approvalWorkflows.created_at));
  }

  async getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [workflow] = await db.select().from(approvalWorkflows).where(eq(approvalWorkflows.id, id));
    return workflow;
  }

  async createApprovalWorkflow(insertApprovalWorkflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    if (!db) throw new Error("Database not initialized");
    const [workflow] = await db.insert(approvalWorkflows).values([insertApprovalWorkflow]).returning();
    return workflow;
  }

  async updateApprovalWorkflow(id: number, updates: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [workflow] = await db
      .update(approvalWorkflows)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return workflow;
  }

  async deleteApprovalWorkflow(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(approvalWorkflows).where(eq(approvalWorkflows.id, id));
    return result.rowCount! > 0;
  }

  async updateApprovalWorkflowStatus(id: number, status: string): Promise<ApprovalWorkflow | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [workflow] = await db
      .update(approvalWorkflows)
      .set({ current_status: status as any, updated_at: new Date() })
      .where(eq(approvalWorkflows.id, id))
      .returning();
    return workflow;
  }

  async getApprovalWorkflowsByStatus(status: string): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.current_status, status as any))
      .orderBy(desc(approvalWorkflows.created_at));
  }

  async getApprovalWorkflowsByItem(itemType: string, itemId: number): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(and(eq(approvalWorkflows.item_type, itemType as any), eq(approvalWorkflows.item_id, itemId)))
      .orderBy(desc(approvalWorkflows.created_at));
  }

  async getApprovalWorkflowsByItemType(itemType: string): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.item_type, itemType as any))
      .orderBy(desc(approvalWorkflows.created_at));
  }

  async getApprovalWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.requester_id, requesterId))
      .orderBy(desc(approvalWorkflows.created_at));
  }

  // Workflow reviewer operations
  async getWorkflowReviewers(): Promise<WorkflowReviewer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(workflowReviewers);
  }

  async getWorkflowReviewersByWorkflow(workflowId: number): Promise<WorkflowReviewer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.workflow_id, workflowId));
  }

  async createWorkflowReviewer(insertWorkflowReviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer> {
    if (!db) throw new Error("Database not initialized");
    const [reviewer] = await db.insert(workflowReviewers).values([insertWorkflowReviewer]).returning();
    return reviewer;
  }

  async updateWorkflowReviewer(id: number, updates: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [reviewer] = await db
      .update(workflowReviewers)
      .set(updates)
      .where(eq(workflowReviewers.id, id))
      .returning();
    return reviewer;
  }

  async deleteWorkflowReviewer(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(workflowReviewers).where(eq(workflowReviewers.id, id));
    return result.rowCount! > 0;
  }

  async getWorkflowReviewersByUser(userId: number): Promise<WorkflowReviewer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.user_id, userId));
  }

  async updateWorkflowReviewerStatus(id: number, status: string): Promise<WorkflowReviewer | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [reviewer] = await db
      .update(workflowReviewers)
      .set({ status: status as any })
      .where(eq(workflowReviewers.id, id))
      .returning();
    return reviewer;
  }

  // Workflow stakeholder operations
  async getWorkflowStakeholders(): Promise<WorkflowStakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(workflowStakeholders);
  }

  async getWorkflowStakeholdersByWorkflow(workflowId: number): Promise<WorkflowStakeholder[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowStakeholders)
      .where(eq(workflowStakeholders.workflow_id, workflowId));
  }

  async createWorkflowStakeholder(insertWorkflowStakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder> {
    if (!db) throw new Error("Database not initialized");
    const [stakeholder] = await db.insert(workflowStakeholders).values(insertWorkflowStakeholder).returning();
    return stakeholder;
  }

  async updateWorkflowStakeholder(id: number, updates: Partial<InsertWorkflowStakeholder>): Promise<WorkflowStakeholder | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [stakeholder] = await db
      .update(workflowStakeholders)
      .set(updates)
      .where(eq(workflowStakeholders.id, id))
      .returning();
    return stakeholder;
  }

  async deleteWorkflowStakeholder(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(workflowStakeholders).where(eq(workflowStakeholders.id, id));
    return result.rowCount! > 0;
  }

  // Workflow comment operations
  async getWorkflowComments(): Promise<WorkflowComment[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(workflowComments).orderBy(desc(workflowComments.created_at));
  }

  async getWorkflowCommentsByWorkflow(workflowId: number): Promise<WorkflowComment[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.workflow_id, workflowId))
      .orderBy(desc(workflowComments.created_at));
  }

  async createWorkflowComment(insertWorkflowComment: InsertWorkflowComment): Promise<WorkflowComment> {
    if (!db) throw new Error("Database not initialized");
    const [comment] = await db.insert(workflowComments).values(insertWorkflowComment).returning();
    return comment;
  }

  async updateWorkflowComment(id: number, updates: Partial<InsertWorkflowComment>): Promise<WorkflowComment | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [comment] = await db
      .update(workflowComments)
      .set(updates)
      .where(eq(workflowComments.id, id))
      .returning();
    return comment;
  }

  async deleteWorkflowComment(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(workflowComments).where(eq(workflowComments.id, id));
    return result.rowCount! > 0;
  }

  // Workflow history operations
  async getWorkflowHistory(): Promise<WorkflowHistory[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(workflowHistory).orderBy(desc(workflowHistory.created_at));
  }

  async getWorkflowHistoryByWorkflow(workflowId: number): Promise<WorkflowHistory[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(workflowHistory)
      .where(eq(workflowHistory.workflow_id, workflowId))
      .orderBy(desc(workflowHistory.created_at));
  }

  async createWorkflowHistory(insertWorkflowHistory: InsertWorkflowHistory): Promise<WorkflowHistory> {
    if (!db) throw new Error("Database not initialized");
    const [history] = await db.insert(workflowHistory).values([insertWorkflowHistory]).returning();
    return history;
  }

  // Edit history operations
  async getEditHistory(entityType: string, entityId: number): Promise<EditHistory[]> {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(editHistory)
      .where(and(
        eq(editHistory.entity_type, entityType),
        eq(editHistory.entity_id, entityId)
      ))
      .orderBy(desc(editHistory.edited_at));
  }

  async createEditHistory(insertEditHistory: InsertEditHistory): Promise<EditHistory> {
    if (!db) throw new Error("Database not initialized");
    const [history] = await db.insert(editHistory).values([insertEditHistory]).returning();
    return history;
  }
}

export const storage = new DatabaseStorage();