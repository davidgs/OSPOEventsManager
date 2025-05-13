import { 
  Event, InsertEvent, 
  CfpSubmission, InsertCfpSubmission,
  Attendee, InsertAttendee,
  Sponsorship, InsertSponsorship,
  User, InsertUser,
  Asset, InsertAsset,
  AssetType,
  Stakeholder, InsertStakeholder,
  ApprovalWorkflow, InsertApprovalWorkflow,
  WorkflowReviewer, InsertWorkflowReviewer,
  WorkflowStakeholder, InsertWorkflowStakeholder,
  WorkflowComment, InsertWorkflowComment,
  WorkflowHistory, InsertWorkflowHistory,
  ApprovalStatus, ApprovalItemType,
  events, cfpSubmissions, attendees, sponsorships, users, assets,
  stakeholders, approvalWorkflows, workflowReviewers, workflowStakeholders,
  workflowComments, workflowHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByKeycloakId(keycloakId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, userData: { name?: string; email?: string; bio?: string; role?: string; jobTitle?: string; headshot?: string }): Promise<User | undefined>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // CFP Submission methods
  getCfpSubmissions(): Promise<CfpSubmission[]>;
  getCfpSubmissionsByEvent(eventId: number): Promise<CfpSubmission[]>;
  getCfpSubmission(id: number): Promise<CfpSubmission | undefined>;
  createCfpSubmission(submission: InsertCfpSubmission): Promise<CfpSubmission>;
  updateCfpSubmission(id: number, submission: Partial<InsertCfpSubmission>): Promise<CfpSubmission | undefined>;
  deleteCfpSubmission(id: number): Promise<boolean>;
  
  // Attendee methods
  getAttendees(): Promise<Attendee[]>;
  getAttendeesByEvent(eventId: number): Promise<Attendee[]>;
  getAttendee(id: number): Promise<Attendee | undefined>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: number, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: number): Promise<boolean>;
  
  // Sponsorship methods
  getSponsorships(): Promise<Sponsorship[]>;
  getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]>;
  getSponsorship(id: number): Promise<Sponsorship | undefined>;
  createSponsorship(sponsorship: InsertSponsorship): Promise<Sponsorship>;
  updateSponsorship(id: number, sponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined>;
  deleteSponsorship(id: number): Promise<boolean>;
  
  // Asset management methods
  getAssets(): Promise<Asset[]>;
  getAssetsByType(type: AssetType): Promise<Asset[]>;
  getAssetsByEvent(eventId: number): Promise<Asset[]>;
  getAssetsByCfpSubmission(cfpSubmissionId: number): Promise<Asset[]>;
  getAssetsByUser(userId: number): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;
  
  // Stakeholder methods
  getStakeholders(): Promise<Stakeholder[]>;
  getStakeholdersByRole(role: string): Promise<Stakeholder[]>;
  getStakeholder(id: number): Promise<Stakeholder | undefined>;
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: number, stakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: number): Promise<boolean>;
  
  // Approval workflow methods
  getApprovalWorkflows(): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByStatus(status: ApprovalStatus): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByItemType(itemType: ApprovalItemType): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByItem(itemType: ApprovalItemType, itemId: number): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]>;
  getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined>;
  createApprovalWorkflow(workflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow>;
  updateApprovalWorkflow(id: number, workflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined>;
  updateApprovalWorkflowStatus(id: number, status: ApprovalStatus, userId: number): Promise<ApprovalWorkflow | undefined>;
  deleteApprovalWorkflow(id: number): Promise<boolean>;
  
  // Workflow reviewer methods
  getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]>;
  getWorkflowReviewersByUser(userId: number): Promise<WorkflowReviewer[]>;
  getWorkflowReviewer(id: number): Promise<WorkflowReviewer | undefined>;
  createWorkflowReviewer(reviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer>;
  updateWorkflowReviewer(id: number, reviewer: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined>;
  updateWorkflowReviewerStatus(id: number, status: ApprovalStatus, comments?: string): Promise<WorkflowReviewer | undefined>;
  deleteWorkflowReviewer(id: number): Promise<boolean>;
  
  // Workflow stakeholder methods
  getWorkflowStakeholders(workflowId: number): Promise<WorkflowStakeholder[]>;
  getWorkflowStakeholdersByStakeholder(stakeholderId: number): Promise<WorkflowStakeholder[]>;
  getWorkflowStakeholder(id: number): Promise<WorkflowStakeholder | undefined>;
  createWorkflowStakeholder(stakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder>;
  updateWorkflowStakeholder(id: number, stakeholder: Partial<InsertWorkflowStakeholder>): Promise<WorkflowStakeholder | undefined>;
  notifyWorkflowStakeholder(id: number): Promise<WorkflowStakeholder | undefined>;
  deleteWorkflowStakeholder(id: number): Promise<boolean>;
  
  // Workflow comment methods
  getWorkflowComments(workflowId: number): Promise<WorkflowComment[]>;
  getWorkflowCommentsByUser(userId: number): Promise<WorkflowComment[]>;
  getWorkflowComment(id: number): Promise<WorkflowComment | undefined>;
  createWorkflowComment(comment: InsertWorkflowComment): Promise<WorkflowComment>;
  updateWorkflowComment(id: number, comment: Partial<InsertWorkflowComment>): Promise<WorkflowComment | undefined>;
  deleteWorkflowComment(id: number): Promise<boolean>;
  
  // Workflow history methods
  getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]>;
  createWorkflowHistory(history: InsertWorkflowHistory): Promise<WorkflowHistory>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private cfpSubmissions: Map<number, CfpSubmission>;
  private attendees: Map<number, Attendee>;
  private sponsorships: Map<number, Sponsorship>;
  private assets: Map<number, Asset>;
  private stakeholders: Map<number, Stakeholder>;
  private approvalWorkflows: Map<number, ApprovalWorkflow>;
  private workflowReviewers: Map<number, WorkflowReviewer>;
  private workflowStakeholders: Map<number, WorkflowStakeholder>;
  private workflowComments: Map<number, WorkflowComment>;
  private workflowHistory: Map<number, WorkflowHistory>;
  
  private userId: number;
  private eventId: number;
  private cfpSubmissionId: number;
  private attendeeId: number;
  private sponsorshipId: number;
  private assetId: number;
  private stakeholderId: number;
  private approvalWorkflowId: number;
  private workflowReviewerId: number;
  private workflowStakeholderId: number;
  private workflowCommentId: number;
  private workflowHistoryId: number;
  
  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.cfpSubmissions = new Map();
    this.attendees = new Map();
    this.sponsorships = new Map();
    this.assets = new Map();
    this.stakeholders = new Map();
    this.approvalWorkflows = new Map();
    this.workflowReviewers = new Map();
    this.workflowStakeholders = new Map();
    this.workflowComments = new Map();
    this.workflowHistory = new Map();
    
    this.userId = 1;
    this.eventId = 1;
    this.cfpSubmissionId = 1;
    this.attendeeId = 1;
    this.sponsorshipId = 1;
    this.assetId = 1;
    this.stakeholderId = 1;
    this.approvalWorkflowId = 1;
    this.workflowReviewerId = 1;
    this.workflowStakeholderId = 1;
    this.workflowCommentId = 1;
    this.workflowHistoryId = 1;
    
    // Add some sample data
    this.seedData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      name: null,
      email: null,
      bio: null,
      role: null,
      jobTitle: null,
      headshot: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfile(id: number, userData: { name?: string; email?: string; bio?: string; role?: string; jobTitle?: string; headshot?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    // If name has been changed, update related records
    if (userData.name && userData.name !== user.name) {
      console.log(`[MemStorage] Updating name from "${user.name}" to "${userData.name}" for user ID ${id}`);
      
      // Update CFP submissions where this user is the submitter
      let cfpUpdated = 0;
      for (const submission of this.cfpSubmissions.values()) {
        if (submission.submitterId === id) {
          submission.submitterName = userData.name;
          this.cfpSubmissions.set(submission.id, submission);
          cfpUpdated++;
        }
      }
      console.log(`[MemStorage] Updated ${cfpUpdated} CFP submissions`);
      
      // Update attendees where this user has entries
      let attendeesUpdated = 0;
      for (const attendee of this.attendees.values()) {
        if (attendee.userId === id) {
          attendee.name = userData.name;
          this.attendees.set(attendee.id, attendee);
          attendeesUpdated++;
        }
      }
      console.log(`[MemStorage] Updated ${attendeesUpdated} attendee records`);
    }
    
    return updatedUser;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    try {
      console.log('getEvents called');
      // Transform events array to ensure goals is parsed from JSON string
      const events = Array.from(this.events.values());
      
      if (events.length === 0) {
        console.log('No events found');
        return [];
      }
      
      // Process each event to handle legacy data or properly format goals
      const processedEvents = events.map(event => {
        try {
          console.log('Processing event:', event.id);
          
          if (!event) {
            console.log('Found null event');
            return null;
          }
          
          // Create a safe copy of the event
          const safeEvent = { ...event };
          
          // If event has the old 'goal' property instead of 'goals'
          if ('goal' in safeEvent && !('goals' in safeEvent)) {
            console.log('Event has legacy goal property:', safeEvent.id);
            // @ts-ignore - handle legacy data
            const goal = safeEvent.goal || 'attending';
            safeEvent.goals = JSON.stringify([goal]);
            // Delete old property to avoid confusion
            // @ts-ignore
            delete safeEvent.goal;
          } else if (safeEvent.goals === undefined || safeEvent.goals === null) {
            // If goals is missing entirely, set a default
            console.log('Event has no goals property:', safeEvent.id);
            safeEvent.goals = JSON.stringify(['attending']);
          } else if (typeof safeEvent.goals === 'string') {
            // Try to validate if goals is a valid JSON string of array
            try {
              JSON.parse(safeEvent.goals);
              console.log('Event has valid JSON goals:', safeEvent.id);
            } catch (e) {
              // If not valid JSON, wrap it as a single-item array
              console.log('Event has goals string that is not JSON:', safeEvent.id);
              safeEvent.goals = JSON.stringify([safeEvent.goals]);
            }
          }
          
          return safeEvent;
        } catch (err) {
          console.error('Error processing event:', err);
          // Skip invalid events
          return null;
        }
      })
      .filter(event => event !== null) as Event[];
      
      console.log('Processed events count:', processedEvents.length);
      return processedEvents;
    } catch (err) {
      console.error('Error in getEvents method:', err);
      // Return empty array on error to prevent complete failure
      return [];
    }
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const event = this.events.get(id);
    
    if (!event) return undefined;
    
    // Create a safe copy of the event
    const safeEvent = { ...event };
    
    // If event has the old 'goal' property instead of 'goals'
    if ('goal' in safeEvent && !('goals' in safeEvent)) {
      console.log('Event has legacy goal property:', safeEvent.id);
      // @ts-ignore - handle legacy data
      const goal = safeEvent.goal || 'attending';
      safeEvent.goals = JSON.stringify([goal]);
      // Delete old property to avoid confusion
      // @ts-ignore
      delete safeEvent.goal;
    } else if (safeEvent.goals === undefined || safeEvent.goals === null) {
      // If goals is missing entirely, set a default
      console.log('Event has no goals property:', safeEvent.id);
      safeEvent.goals = JSON.stringify(['attending']);
    } else if (typeof safeEvent.goals === 'string') {
      // Try to validate if goals is a valid JSON string of array
      try {
        JSON.parse(safeEvent.goals);
        console.log('Event has valid JSON goals:', safeEvent.id);
      } catch (e) {
        // If not valid JSON, wrap it as a single-item array
        console.log('Event has goals string that is not JSON:', safeEvent.id);
        safeEvent.goals = JSON.stringify([safeEvent.goals]);
      }
    }
    
    return safeEvent;
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    
    // Ensure goals is stored as a JSON string if it's an array
    const processedEvent = {
      ...insertEvent,
      goals: Array.isArray(insertEvent.goals) 
        ? JSON.stringify(insertEvent.goals) 
        : insertEvent.goals
    };
    
    const event: Event = { ...processedEvent, id, status: "planning" };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    // Process goals array for storage
    const processedUpdate = { ...updateEvent };
    
    if (updateEvent.goals) {
      processedUpdate.goals = Array.isArray(updateEvent.goals) 
        ? JSON.stringify(updateEvent.goals) 
        : updateEvent.goals;
    }
    
    const updatedEvent = { ...event, ...processedUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  // CFP Submission methods
  async getCfpSubmissions(): Promise<CfpSubmission[]> {
    return Array.from(this.cfpSubmissions.values());
  }
  
  async getCfpSubmissionsByEvent(eventId: number): Promise<CfpSubmission[]> {
    return Array.from(this.cfpSubmissions.values()).filter(
      (submission) => submission.eventId === eventId
    );
  }
  
  async getCfpSubmission(id: number): Promise<CfpSubmission | undefined> {
    return this.cfpSubmissions.get(id);
  }
  
  async createCfpSubmission(insertSubmission: InsertCfpSubmission): Promise<CfpSubmission> {
    const id = this.cfpSubmissionId++;
    const submission: CfpSubmission = { ...insertSubmission, id };
    this.cfpSubmissions.set(id, submission);
    return submission;
  }
  
  async updateCfpSubmission(id: number, updateSubmission: Partial<InsertCfpSubmission>): Promise<CfpSubmission | undefined> {
    const submission = this.cfpSubmissions.get(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...updateSubmission };
    this.cfpSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  async deleteCfpSubmission(id: number): Promise<boolean> {
    return this.cfpSubmissions.delete(id);
  }
  
  // Attendee methods
  async getAttendees(): Promise<Attendee[]> {
    return Array.from(this.attendees.values());
  }
  
  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return Array.from(this.attendees.values()).filter(
      (attendee) => attendee.eventId === eventId
    );
  }
  
  async getAttendee(id: number): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }
  
  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const id = this.attendeeId++;
    const attendee: Attendee = { ...insertAttendee, id };
    this.attendees.set(id, attendee);
    return attendee;
  }
  
  async updateAttendee(id: number, updateAttendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const attendee = this.attendees.get(id);
    if (!attendee) return undefined;
    
    const updatedAttendee = { ...attendee, ...updateAttendee };
    this.attendees.set(id, updatedAttendee);
    return updatedAttendee;
  }
  
  async deleteAttendee(id: number): Promise<boolean> {
    return this.attendees.delete(id);
  }
  
  // Sponsorship methods
  async getSponsorships(): Promise<Sponsorship[]> {
    return Array.from(this.sponsorships.values());
  }
  
  async getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]> {
    return Array.from(this.sponsorships.values()).filter(
      (sponsorship) => sponsorship.eventId === eventId
    );
  }
  
  async getSponsorship(id: number): Promise<Sponsorship | undefined> {
    return this.sponsorships.get(id);
  }
  
  async createSponsorship(insertSponsorship: InsertSponsorship): Promise<Sponsorship> {
    const id = this.sponsorshipId++;
    const sponsorship: Sponsorship = { ...insertSponsorship, id };
    this.sponsorships.set(id, sponsorship);
    return sponsorship;
  }
  
  async updateSponsorship(id: number, updateSponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined> {
    const sponsorship = this.sponsorships.get(id);
    if (!sponsorship) return undefined;
    
    const updatedSponsorship = { ...sponsorship, ...updateSponsorship };
    this.sponsorships.set(id, updatedSponsorship);
    return updatedSponsorship;
  }
  
  async deleteSponsorship(id: number): Promise<boolean> {
    return this.sponsorships.delete(id);
  }
  
  // Asset management methods
  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }
  
  async getAssetsByType(type: AssetType): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.type === type
    );
  }
  
  async getAssetsByEvent(eventId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.eventId === eventId
    );
  }
  
  async getAssetsByCfpSubmission(cfpSubmissionId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.cfpSubmissionId === cfpSubmissionId
    );
  }
  
  async getAssetsByUser(userId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.uploadedBy === userId
    );
  }
  
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }
  
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetId++;
    const now = new Date().toISOString();
    const asset: Asset = { ...insertAsset, id, uploadedAt: now };
    this.assets.set(id, asset);
    return asset;
  }
  
  async updateAsset(id: number, updateAsset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    
    const updatedAsset = { ...asset, ...updateAsset };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    return this.assets.delete(id);
  }

  // Stakeholder methods
  async getStakeholders(): Promise<Stakeholder[]> {
    return Array.from(this.stakeholders.values());
  }
  
  async getStakeholdersByRole(role: string): Promise<Stakeholder[]> {
    return Array.from(this.stakeholders.values()).filter(
      (stakeholder) => stakeholder.role === role
    );
  }
  
  async getStakeholder(id: number): Promise<Stakeholder | undefined> {
    return this.stakeholders.get(id);
  }
  
  async createStakeholder(insertStakeholder: InsertStakeholder): Promise<Stakeholder> {
    const id = this.stakeholderId++;
    const now = new Date().toISOString();
    const stakeholder: Stakeholder = { 
      ...insertStakeholder, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.stakeholders.set(id, stakeholder);
    return stakeholder;
  }
  
  async updateStakeholder(id: number, updateStakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    const stakeholder = this.stakeholders.get(id);
    if (!stakeholder) return undefined;
    
    const now = new Date().toISOString();
    const updatedStakeholder = { 
      ...stakeholder, 
      ...updateStakeholder, 
      updatedAt: now 
    };
    this.stakeholders.set(id, updatedStakeholder);
    return updatedStakeholder;
  }
  
  async deleteStakeholder(id: number): Promise<boolean> {
    return this.stakeholders.delete(id);
  }
  
  // Approval workflow methods
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return Array.from(this.approvalWorkflows.values());
  }
  
  async getApprovalWorkflowsByStatus(status: ApprovalStatus): Promise<ApprovalWorkflow[]> {
    return Array.from(this.approvalWorkflows.values()).filter(
      (workflow) => workflow.status === status
    );
  }
  
  async getApprovalWorkflowsByItemType(itemType: ApprovalItemType): Promise<ApprovalWorkflow[]> {
    return Array.from(this.approvalWorkflows.values()).filter(
      (workflow) => workflow.itemType === itemType
    );
  }
  
  async getApprovalWorkflowsByItem(itemType: ApprovalItemType, itemId: number): Promise<ApprovalWorkflow[]> {
    return Array.from(this.approvalWorkflows.values()).filter(
      (workflow) => workflow.itemType === itemType && workflow.itemId === itemId
    );
  }
  
  async getApprovalWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]> {
    return Array.from(this.approvalWorkflows.values()).filter(
      (workflow) => workflow.requesterId === requesterId
    );
  }
  
  async getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    return this.approvalWorkflows.get(id);
  }
  
  async createApprovalWorkflow(insertWorkflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    const id = this.approvalWorkflowId++;
    const now = new Date().toISOString();
    
    // Extract reviewer and stakeholder IDs before creating the workflow
    const { reviewerIds, stakeholderIds, ...workflowData } = insertWorkflow;
    
    const workflow: ApprovalWorkflow = { 
      ...workflowData, 
      id, 
      status: "pending" as ApprovalStatus, 
      createdAt: now, 
      updatedAt: now,
      // Make sure estimatedCosts field is properly included if provided
      estimatedCosts: workflowData.estimatedCosts || null,
      metadata: workflowData.metadata || null
    };
    
    this.approvalWorkflows.set(id, workflow);
    
    // Create workflow reviewers
    for (const reviewerId of reviewerIds) {
      await this.createWorkflowReviewer({
        workflowId: id,
        reviewerId,
        isRequired: true
      });
    }
    
    // Create workflow stakeholders if provided
    if (stakeholderIds && stakeholderIds.length > 0) {
      for (const stakeholderId of stakeholderIds) {
        await this.createWorkflowStakeholder({
          workflowId: id,
          stakeholderId,
          notificationType: "email"
        });
      }
    }
    
    // Create initial history entry
    await this.createWorkflowHistory({
      workflowId: id,
      userId: insertWorkflow.requesterId,
      action: "created",
      details: "Workflow created",
      newStatus: "pending"
    });
    
    return workflow;
  }
  
  async updateApprovalWorkflow(id: number, updateWorkflow: Partial<InsertApprovalWorkflow>): Promise<ApprovalWorkflow | undefined> {
    const workflow = this.approvalWorkflows.get(id);
    if (!workflow) return undefined;
    
    const now = new Date().toISOString();
    
    // Extract reviewer and stakeholder IDs before updating the workflow
    const { reviewerIds, stakeholderIds, ...workflowData } = updateWorkflow;
    
    const updatedWorkflow = { 
      ...workflow, 
      ...workflowData, 
      updatedAt: now 
    };
    
    this.approvalWorkflows.set(id, updatedWorkflow);
    
    // Update workflow reviewers if provided
    if (reviewerIds && reviewerIds.length > 0) {
      // First, remove existing reviewers
      for (const reviewer of Array.from(this.workflowReviewers.values())) {
        if (reviewer.workflowId === id) {
          this.workflowReviewers.delete(reviewer.id);
        }
      }
      
      // Then, create new reviewers
      for (const reviewerId of reviewerIds) {
        await this.createWorkflowReviewer({
          workflowId: id,
          reviewerId,
          isRequired: true
        });
      }
    }
    
    // Update workflow stakeholders if provided
    if (stakeholderIds && stakeholderIds.length > 0) {
      // First, remove existing stakeholders
      for (const stakeholder of Array.from(this.workflowStakeholders.values())) {
        if (stakeholder.workflowId === id) {
          this.workflowStakeholders.delete(stakeholder.id);
        }
      }
      
      // Then, create new stakeholders
      for (const stakeholderId of stakeholderIds) {
        await this.createWorkflowStakeholder({
          workflowId: id,
          stakeholderId,
          notificationType: "email"
        });
      }
    }
    
    return updatedWorkflow;
  }
  
  async updateApprovalWorkflowStatus(id: number, status: ApprovalStatus, userId: number): Promise<ApprovalWorkflow | undefined> {
    const workflow = this.approvalWorkflows.get(id);
    if (!workflow) return undefined;
    
    const now = new Date().toISOString();
    const previousStatus = workflow.status;
    
    const updatedWorkflow = { 
      ...workflow, 
      status, 
      updatedAt: now 
    };
    
    this.approvalWorkflows.set(id, updatedWorkflow);
    
    // Create history entry for status change
    await this.createWorkflowHistory({
      workflowId: id,
      userId,
      action: "status_updated",
      details: `Status changed from ${previousStatus} to ${status}`,
      previousStatus,
      newStatus: status
    });
    
    return updatedWorkflow;
  }
  
  async deleteApprovalWorkflow(id: number): Promise<boolean> {
    // First delete all related entities
    for (const reviewer of Array.from(this.workflowReviewers.values())) {
      if (reviewer.workflowId === id) {
        this.workflowReviewers.delete(reviewer.id);
      }
    }
    
    for (const stakeholder of Array.from(this.workflowStakeholders.values())) {
      if (stakeholder.workflowId === id) {
        this.workflowStakeholders.delete(stakeholder.id);
      }
    }
    
    for (const comment of Array.from(this.workflowComments.values())) {
      if (comment.workflowId === id) {
        this.workflowComments.delete(comment.id);
      }
    }
    
    for (const history of Array.from(this.workflowHistory.values())) {
      if (history.workflowId === id) {
        this.workflowHistory.delete(history.id);
      }
    }
    
    // Then delete the workflow itself
    return this.approvalWorkflows.delete(id);
  }
  
  // Workflow reviewer methods
  async getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]> {
    return Array.from(this.workflowReviewers.values()).filter(
      (reviewer) => reviewer.workflowId === workflowId
    );
  }
  
  async getWorkflowReviewersByUser(userId: number): Promise<WorkflowReviewer[]> {
    return Array.from(this.workflowReviewers.values()).filter(
      (reviewer) => reviewer.reviewerId === userId
    );
  }
  
  async getWorkflowReviewer(id: number): Promise<WorkflowReviewer | undefined> {
    return this.workflowReviewers.get(id);
  }
  
  async createWorkflowReviewer(insertReviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer> {
    const id = this.workflowReviewerId++;
    const reviewer: WorkflowReviewer = { 
      ...insertReviewer, 
      id, 
      status: "pending" as ApprovalStatus,
      reviewedAt: null
    };
    this.workflowReviewers.set(id, reviewer);
    return reviewer;
  }
  
  async updateWorkflowReviewer(id: number, updateReviewer: Partial<InsertWorkflowReviewer>): Promise<WorkflowReviewer | undefined> {
    const reviewer = this.workflowReviewers.get(id);
    if (!reviewer) return undefined;
    
    const updatedReviewer = { ...reviewer, ...updateReviewer };
    this.workflowReviewers.set(id, updatedReviewer);
    return updatedReviewer;
  }
  
  async updateWorkflowReviewerStatus(id: number, status: ApprovalStatus, comments?: string): Promise<WorkflowReviewer | undefined> {
    const reviewer = this.workflowReviewers.get(id);
    if (!reviewer) return undefined;
    
    const now = new Date().toISOString();
    const updatedReviewer = { 
      ...reviewer, 
      status, 
      reviewedAt: now,
      comments: comments || reviewer.comments
    };
    
    this.workflowReviewers.set(id, updatedReviewer);
    
    // Get user who made the review
    const user = this.users.get(reviewer.reviewerId);
    
    // Get the workflow
    const workflow = this.approvalWorkflows.get(reviewer.workflowId);
    if (workflow && user) {
      // Create history entry for reviewer status change
      await this.createWorkflowHistory({
        workflowId: reviewer.workflowId,
        userId: reviewer.reviewerId,
        action: "reviewer_updated",
        details: `Reviewer ${user.name || user.username} changed status to ${status}${comments ? `: "${comments}"` : ""}`,
        previousStatus: reviewer.status,
        newStatus: status
      });
      
      // Check if all required reviewers have approved
      const requiredReviewers = Array.from(this.workflowReviewers.values()).filter(
        (r) => r.workflowId === reviewer.workflowId && r.isRequired
      );
      
      const allApproved = requiredReviewers.every((r) => r.status === "approved");
      
      if (allApproved && workflow.status === "pending") {
        // Auto-update workflow status if all required reviewers approved
        await this.updateApprovalWorkflowStatus(
          reviewer.workflowId,
          "approved",
          reviewer.reviewerId
        );
      } else if (status === "rejected" && workflow.status === "pending") {
        // Auto-update workflow status if any required reviewer rejected
        await this.updateApprovalWorkflowStatus(
          reviewer.workflowId,
          "rejected",
          reviewer.reviewerId
        );
      }
    }
    
    return updatedReviewer;
  }
  
  async deleteWorkflowReviewer(id: number): Promise<boolean> {
    return this.workflowReviewers.delete(id);
  }
  
  // Workflow stakeholder methods
  async getWorkflowStakeholders(workflowId: number): Promise<WorkflowStakeholder[]> {
    return Array.from(this.workflowStakeholders.values()).filter(
      (stakeholder) => stakeholder.workflowId === workflowId
    );
  }
  
  async getWorkflowStakeholdersByStakeholder(stakeholderId: number): Promise<WorkflowStakeholder[]> {
    return Array.from(this.workflowStakeholders.values()).filter(
      (workflowStakeholder) => workflowStakeholder.stakeholderId === stakeholderId
    );
  }
  
  async getWorkflowStakeholder(id: number): Promise<WorkflowStakeholder | undefined> {
    return this.workflowStakeholders.get(id);
  }
  
  async createWorkflowStakeholder(insertStakeholder: InsertWorkflowStakeholder): Promise<WorkflowStakeholder> {
    const id = this.workflowStakeholderId++;
    const stakeholder: WorkflowStakeholder = { 
      ...insertStakeholder, 
      id,
      notifiedAt: null
    };
    this.workflowStakeholders.set(id, stakeholder);
    return stakeholder;
  }
  
  async updateWorkflowStakeholder(id: number, updateStakeholder: Partial<InsertWorkflowStakeholder>): Promise<WorkflowStakeholder | undefined> {
    const stakeholder = this.workflowStakeholders.get(id);
    if (!stakeholder) return undefined;
    
    const updatedStakeholder = { ...stakeholder, ...updateStakeholder };
    this.workflowStakeholders.set(id, updatedStakeholder);
    return updatedStakeholder;
  }
  
  async notifyWorkflowStakeholder(id: number): Promise<WorkflowStakeholder | undefined> {
    const stakeholder = this.workflowStakeholders.get(id);
    if (!stakeholder) return undefined;
    
    const now = new Date().toISOString();
    const updatedStakeholder = { ...stakeholder, notifiedAt: now };
    this.workflowStakeholders.set(id, updatedStakeholder);
    
    // Get actual stakeholder data
    const actualStakeholder = this.stakeholders.get(stakeholder.stakeholderId);
    
    // Get the workflow
    const workflow = this.approvalWorkflows.get(stakeholder.workflowId);
    
    if (workflow && actualStakeholder) {
      // Create history entry for stakeholder notification
      await this.createWorkflowHistory({
        workflowId: stakeholder.workflowId,
        userId: workflow.requesterId, // Use requester as the actor
        action: "stakeholder_notified",
        details: `Stakeholder ${actualStakeholder.name} was notified via ${stakeholder.notificationType}`
      });
    }
    
    return updatedStakeholder;
  }
  
  async deleteWorkflowStakeholder(id: number): Promise<boolean> {
    return this.workflowStakeholders.delete(id);
  }
  
  // Workflow comment methods
  async getWorkflowComments(workflowId: number): Promise<WorkflowComment[]> {
    return Array.from(this.workflowComments.values()).filter(
      (comment) => comment.workflowId === workflowId
    );
  }
  
  async getWorkflowCommentsByUser(userId: number): Promise<WorkflowComment[]> {
    return Array.from(this.workflowComments.values()).filter(
      (comment) => comment.userId === userId
    );
  }
  
  async getWorkflowComment(id: number): Promise<WorkflowComment | undefined> {
    return this.workflowComments.get(id);
  }
  
  async createWorkflowComment(insertComment: InsertWorkflowComment): Promise<WorkflowComment> {
    const id = this.workflowCommentId++;
    const now = new Date().toISOString();
    const comment: WorkflowComment = { 
      ...insertComment, 
      id, 
      createdAt: now 
    };
    this.workflowComments.set(id, comment);
    
    // Get user who made the comment
    const user = this.users.get(insertComment.userId);
    
    // Get the workflow
    const workflow = this.approvalWorkflows.get(insertComment.workflowId);
    
    if (workflow && user) {
      // Create history entry for new comment
      await this.createWorkflowHistory({
        workflowId: insertComment.workflowId,
        userId: insertComment.userId,
        action: "comment_added",
        details: `${user.name || user.username} added a comment${insertComment.isPrivate ? " (private)" : ""}`
      });
    }
    
    return comment;
  }
  
  async updateWorkflowComment(id: number, updateComment: Partial<InsertWorkflowComment>): Promise<WorkflowComment | undefined> {
    const comment = this.workflowComments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, ...updateComment };
    this.workflowComments.set(id, updatedComment);
    
    // Get user who updated the comment
    const user = this.users.get(comment.userId);
    
    if (user) {
      // Create history entry for comment update
      await this.createWorkflowHistory({
        workflowId: comment.workflowId,
        userId: comment.userId,
        action: "comment_updated",
        details: `${user.name || user.username} updated a comment`
      });
    }
    
    return updatedComment;
  }
  
  async deleteWorkflowComment(id: number): Promise<boolean> {
    const comment = this.workflowComments.get(id);
    if (!comment) return false;
    
    const result = this.workflowComments.delete(id);
    
    if (result) {
      // Get user who deleted the comment
      const user = this.users.get(comment.userId);
      
      if (user) {
        // Create history entry for comment deletion
        await this.createWorkflowHistory({
          workflowId: comment.workflowId,
          userId: comment.userId,
          action: "comment_deleted",
          details: `${user.name || user.username} deleted a comment`
        });
      }
    }
    
    return result;
  }
  
  // Workflow history methods
  async getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]> {
    // Sort by timestamp in descending order (newest first)
    return Array.from(this.workflowHistory.values())
      .filter((history) => history.workflowId === workflowId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createWorkflowHistory(insertHistory: InsertWorkflowHistory): Promise<WorkflowHistory> {
    const id = this.workflowHistoryId++;
    const now = new Date().toISOString();
    const history: WorkflowHistory = { 
      ...insertHistory, 
      id, 
      timestamp: now
    };
    this.workflowHistory.set(id, history);
    return history;
  }

  // Seed method to add initial data
  private seedData() {
    // Create demo user
    const user = this.createUser({
      username: "demo_user",
      password: "password123",
    });

    // Create sample events
    const event1 = this.createEvent({
      name: "KubeCon + CloudNativeCon Europe 2023",
      link: "https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/",
      startDate: new Date("2023-04-17"),
      endDate: new Date("2023-04-21"),
      location: "Amsterdam, Netherlands",
      priority: "high",
      type: "conference",
      goals: ["speaking", "attending"],
      cfpDeadline: new Date("2023-01-15"),
      notes: "Major cloud native conference in Europe",
    });

    const event2 = this.createEvent({
      name: "Open Source Summit North America",
      link: "https://events.linuxfoundation.org/open-source-summit-north-america/",
      startDate: new Date("2023-05-10"),
      endDate: new Date("2023-05-12"),
      location: "Vancouver, Canada",
      priority: "medium",
      type: "conference",
      goals: ["sponsoring", "attending"],
      cfpDeadline: new Date("2023-02-05"),
      notes: "Flagship conference for open source",
    });

    const event3 = this.createEvent({
      name: "DevOps Days Seattle",
      link: "https://devopsdays.org/seattle",
      startDate: new Date("2023-06-05"),
      endDate: new Date("2023-06-06"),
      location: "Seattle, USA",
      priority: "low",
      type: "conference",
      goals: ["attending"],
      cfpDeadline: new Date("2023-03-01"),
      notes: "Local DevOps community event",
    });

    const event4 = this.createEvent({
      name: "DockerCon 2023",
      link: "https://www.docker.com/dockercon/",
      startDate: new Date("2023-08-23"),
      endDate: new Date("2023-08-24"),
      location: "Virtual",
      priority: "medium",
      type: "conference",
      goals: ["speaking", "attending"],
      cfpDeadline: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: "Annual Docker conference",
    });

    const event5 = this.createEvent({
      name: "JSConf EU",
      link: "https://jsconf.eu/",
      startDate: new Date("2023-09-15"),
      endDate: new Date("2023-09-16"),
      location: "Berlin, Germany",
      priority: "low",
      type: "conference",
      goals: ["attending"],
      notes: "JavaScript focused conference",
    });

    // Add CFP submissions
    this.createCfpSubmission({
      eventId: 1,
      title: "Scaling Kubernetes in Production",
      abstract: "Learn how to scale Kubernetes clusters to support enterprise workloads",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "submitted",
      submissionDate: new Date("2023-01-10"),
      notes: "Submitted before deadline",
    });

    this.createCfpSubmission({
      eventId: 1,
      title: "Observability Best Practices",
      abstract: "How to implement effective observability for cloud native applications",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "accepted",
      submissionDate: new Date("2023-01-12"),
      notes: "Accepted for main track",
    });

    this.createCfpSubmission({
      eventId: 1,
      title: "GitOps Workflows with Flux",
      abstract: "Implementing GitOps practices using Flux and Kubernetes",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "submitted",
      submissionDate: new Date("2023-01-14"),
      notes: "Waiting for review",
    });

    this.createCfpSubmission({
      eventId: 2,
      title: "Open Source Program Office Best Practices",
      abstract: "How to establish and run an effective OSPO",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "submitted",
      submissionDate: new Date("2023-02-01"),
      notes: "Submitted for management track",
    });

    this.createCfpSubmission({
      eventId: 2,
      title: "Contributing to Kubernetes: A Beginner's Guide",
      abstract: "How to start contributing to the Kubernetes project",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "accepted",
      submissionDate: new Date("2023-02-04"),
      notes: "Beginner friendly talk",
    });

    this.createCfpSubmission({
      eventId: 3,
      title: "DevOps Culture Transformation",
      abstract: "How to change organizational culture to support DevOps practices",
      submitterName: "Alex Johnson",
      submitterId: 1,
      status: "submitted",
      submissionDate: new Date("2023-02-15"),
      notes: "Cultural focus",
    });

    // Add attendees
    this.createAttendee({
      eventId: 1,
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "Speaker",
      userId: 1,
      notes: "Giving two talks",
    });

    this.createAttendee({
      eventId: 1,
      name: "Sam Peterson",
      email: "sam@example.com",
      role: "Engineer",
      notes: "Attending technical workshops",
    });

    this.createAttendee({
      eventId: 1,
      name: "Jamie Watson",
      email: "jamie@example.com",
      role: "Manager",
      notes: "Interested in community meetings",
    });

    this.createAttendee({
      eventId: 1,
      name: "Morgan Lee",
      email: "morgan@example.com",
      role: "Developer Advocate",
      notes: "Running booth demos",
    });

    this.createAttendee({
      eventId: 1,
      name: "Casey Brown",
      email: "casey@example.com",
      role: "Developer",
      notes: "First time attendee",
    });

    this.createAttendee({
      eventId: 2,
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "Speaker",
      userId: 1,
      notes: "Also coordinating sponsor activities",
    });

    this.createAttendee({
      eventId: 2,
      name: "Jordan Williams",
      email: "jordan@example.com",
      role: "OSPO Lead",
      notes: "Interested in OSPO discussions",
    });

    this.createAttendee({
      eventId: 2,
      name: "Taylor Garcia",
      email: "taylor@example.com",
      role: "Community Manager",
      notes: "Networking focus",
    });

    this.createAttendee({
      eventId: 3,
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "Attendee",
      userId: 1,
      notes: "Learning focus",
    });

    this.createAttendee({
      eventId: 3,
      name: "Robin Chen",
      email: "robin@example.com",
      role: "DevOps Engineer",
      notes: "Interested in workshops",
    });

    // Add sponsorships
    this.createSponsorship({
      eventId: 2,
      level: "Gold",
      amount: "$50,000",
      status: "confirmed",
      contactName: "Finance Department",
      contactEmail: "finance@example.com",
      notes: "Includes booth and speaking slot",
    });
    
    // Add trip report assets
    this.createAsset({
      name: "KubeCon Trip Report - Key Insights",
      type: "trip_report",
      description: "Summary of key sessions and learnings from KubeCon",
      filePath: "/uploads/trip_reports/kubecon_report.pdf",
      fileSize: 2048000, // ~2MB
      mimeType: "application/pdf",
      uploadedBy: 1,
      uploadedByName: "Alex Johnson",
      eventId: 1,
      cfpSubmissionId: null
    });
    
    this.createAsset({
      name: "KubeCon Networking Outcomes",
      type: "trip_report",
      description: "Notable connections and partnership opportunities from KubeCon",
      filePath: "/uploads/trip_reports/kubecon_networking.docx",
      fileSize: 1024000, // ~1MB
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadedBy: 1,
      uploadedByName: "Alex Johnson",
      eventId: 1,
      cfpSubmissionId: null
    });
    
    this.createAsset({
      name: "Open Source Summit Trip Report",
      type: "trip_report",
      description: "Executive summary of Open Source Summit attendance",
      filePath: "/uploads/trip_reports/oss_report.pdf",
      fileSize: 3072000, // ~3MB
      mimeType: "application/pdf",
      uploadedBy: 1,
      uploadedByName: "Alex Johnson",
      eventId: 2,
      cfpSubmissionId: null
    });
  }
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // User methods with Keycloak integration
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByKeycloakId(keycloakId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.keycloakId, keycloakId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserPreferences(id: number, preferences: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        preferences,
        lastLogin: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }
  
  async updateUserProfile(id: number, userData: { name?: string; email?: string; bio?: string; role?: string; jobTitle?: string; headshot?: string; preferences?: string }): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    // If name has been updated and there are related records, update them
    if (userData.name && userData.name !== user.name) {
      // Update CFP submissions where this user is the submitter
      await db
        .update(cfpSubmissions)
        .set({ submitterName: userData.name })
        .where(eq(cfpSubmissions.submitterId, id));
      
      // Future: Update any other tables that reference the user's name
    }
    
    return updatedUser || undefined;
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser || undefined;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    const eventsList = await db.select().from(events);
    return eventsList;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    // Handle goal vs goals field
    const { goals, ...restEvent } = insertEvent as any;
    
    // If there's a goals field from the client, use it for the goal column
    const eventData = {
      ...restEvent,
      status: "planning"
    };
    
    // If goals exists in the client data, convert it to goal for db storage
    if (goals) {
      eventData.goal = Array.isArray(goals) ? goals : [goals];
    }
    
    const [event] = await db
      .insert(events)
      .values(eventData)
      .returning();
    
    return event;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    // Handle goal vs goals field
    const { goals, ...restUpdate } = updateEvent as any;
    
    // Set up the update data
    const updateData = { ...restUpdate };
    
    // If goals exists in the update data, move it to goal for db storage
    if (goals) {
      updateData.goal = Array.isArray(goals) ? goals : [goals];
    }
    
    const [event] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();
    return !!deletedEvent;
  }

  // CFP Submission methods
  async getCfpSubmissions(): Promise<CfpSubmission[]> {
    return await db.select().from(cfpSubmissions);
  }

  async getCfpSubmissionsByEvent(eventId: number): Promise<CfpSubmission[]> {
    return await db
      .select()
      .from(cfpSubmissions)
      .where(eq(cfpSubmissions.eventId, eventId));
  }

  async getCfpSubmission(id: number): Promise<CfpSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(cfpSubmissions)
      .where(eq(cfpSubmissions.id, id));
    return submission || undefined;
  }

  async createCfpSubmission(insertSubmission: InsertCfpSubmission): Promise<CfpSubmission> {
    const [submission] = await db
      .insert(cfpSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async updateCfpSubmission(id: number, updateSubmission: Partial<InsertCfpSubmission>): Promise<CfpSubmission | undefined> {
    const [submission] = await db
      .update(cfpSubmissions)
      .set(updateSubmission)
      .where(eq(cfpSubmissions.id, id))
      .returning();
    return submission || undefined;
  }

  async deleteCfpSubmission(id: number): Promise<boolean> {
    const [deletedSubmission] = await db
      .delete(cfpSubmissions)
      .where(eq(cfpSubmissions.id, id))
      .returning();
    return !!deletedSubmission;
  }
  
  // Asset management methods
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }
  
  async getAssetsByType(type: AssetType): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.type, type));
  }
  
  async getAssetsByEvent(eventId: number): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.eventId, eventId));
  }
  
  async getAssetsByCfpSubmission(cfpSubmissionId: number): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.cfpSubmissionId, cfpSubmissionId));
  }
  
  async getAssetsByUser(userId: number): Promise<Asset[]> {
    return await db
      .select()
      .from(assets)
      .where(eq(assets.uploadedBy, userId));
  }
  
  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));
    return asset || undefined;
  }
  
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }
  
  async updateAsset(id: number, updateAsset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [asset] = await db
      .update(assets)
      .set(updateAsset)
      .where(eq(assets.id, id))
      .returning();
    return asset || undefined;
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();
    return !!deletedAsset;
  }

  // Attendee methods
  async getAttendees(): Promise<Attendee[]> {
    return await db.select().from(attendees);
  }

  async getAttendeesByEvent(eventId: number): Promise<Attendee[]> {
    return await db
      .select()
      .from(attendees)
      .where(eq(attendees.eventId, eventId));
  }

  async getAttendee(id: number): Promise<Attendee | undefined> {
    const [attendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, id));
    return attendee || undefined;
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const [attendee] = await db
      .insert(attendees)
      .values(insertAttendee)
      .returning();
    return attendee;
  }

  async updateAttendee(id: number, updateAttendee: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const [attendee] = await db
      .update(attendees)
      .set(updateAttendee)
      .where(eq(attendees.id, id))
      .returning();
    return attendee || undefined;
  }

  async deleteAttendee(id: number): Promise<boolean> {
    const [deletedAttendee] = await db
      .delete(attendees)
      .where(eq(attendees.id, id))
      .returning();
    return !!deletedAttendee;
  }

  // Sponsorship methods
  async getSponsorships(): Promise<Sponsorship[]> {
    return await db.select().from(sponsorships);
  }

  async getSponsorshipsByEvent(eventId: number): Promise<Sponsorship[]> {
    return await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.eventId, eventId));
  }

  async getSponsorship(id: number): Promise<Sponsorship | undefined> {
    const [sponsorship] = await db
      .select()
      .from(sponsorships)
      .where(eq(sponsorships.id, id));
    return sponsorship || undefined;
  }

  async createSponsorship(insertSponsorship: InsertSponsorship): Promise<Sponsorship> {
    const [sponsorship] = await db
      .insert(sponsorships)
      .values(insertSponsorship)
      .returning();
    return sponsorship;
  }

  async updateSponsorship(id: number, updateSponsorship: Partial<InsertSponsorship>): Promise<Sponsorship | undefined> {
    const [sponsorship] = await db
      .update(sponsorships)
      .set(updateSponsorship)
      .where(eq(sponsorships.id, id))
      .returning();
    return sponsorship || undefined;
  }

  async deleteSponsorship(id: number): Promise<boolean> {
    const [deletedSponsorship] = await db
      .delete(sponsorships)
      .where(eq(sponsorships.id, id))
      .returning();
    return !!deletedSponsorship;
  }

  // Approval workflow methods
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return await db.select().from(approvalWorkflows);
  }

  async getApprovalWorkflowsByStatus(status: ApprovalStatus): Promise<ApprovalWorkflow[]> {
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.status, status));
  }

  async getApprovalWorkflowsByItemType(itemType: ApprovalItemType): Promise<ApprovalWorkflow[]> {
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.itemType, itemType));
  }

  async getApprovalWorkflowsByItem(
    itemType: ApprovalItemType,
    itemId: number
  ): Promise<ApprovalWorkflow[]> {
    return await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.itemType, itemType),
          eq(approvalWorkflows.itemId, itemId)
        )
      );
  }

  async getApprovalWorkflowsByRequester(requesterId: number): Promise<ApprovalWorkflow[]> {
    return await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.requesterId, requesterId));
  }

  async getApprovalWorkflow(id: number): Promise<ApprovalWorkflow | undefined> {
    const [workflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id));
    return workflow || undefined;
  }

  async createApprovalWorkflow(insertWorkflow: InsertApprovalWorkflow): Promise<ApprovalWorkflow> {
    // Extract reviewer and stakeholder IDs before creating the workflow
    const { reviewerIds, stakeholderIds, ...workflowData } = insertWorkflow;
    
    // Insert the workflow and get the new workflow with ID
    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({
        ...workflowData,
        status: "pending" as ApprovalStatus,
      })
      .returning();

    // Create workflow reviewers
    for (const reviewerId of reviewerIds) {
      await db.insert(workflowReviewers).values({
        workflowId: workflow.id,
        reviewerId,
        isRequired: true,
      });
    }

    // Create workflow stakeholders if any
    if (stakeholderIds && stakeholderIds.length > 0) {
      for (const stakeholderId of stakeholderIds) {
        await db.insert(workflowStakeholders).values({
          workflowId: workflow.id,
          stakeholderId,
          notificationType: "email",
        });
      }
    }

    // Add an entry to the workflow history
    await db.insert(workflowHistory).values({
      workflowId: workflow.id,
      userId: workflow.requesterId,
      action: "created",
      details: `Workflow created with title "${workflow.title}"`,
      newStatus: "pending" as ApprovalStatus,
    });

    return workflow;
  }

  async updateApprovalWorkflow(
    id: number,
    updateWorkflow: Partial<InsertApprovalWorkflow>
  ): Promise<ApprovalWorkflow | undefined> {
    // Extract reviewer and stakeholder IDs if provided
    const { reviewerIds, stakeholderIds, ...workflowData } = updateWorkflow;

    // Update the workflow
    const [workflow] = await db
      .update(approvalWorkflows)
      .set({
        ...workflowData,
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    if (!workflow) {
      return undefined;
    }

    // Update reviewers if provided
    if (reviewerIds && reviewerIds.length > 0) {
      // Delete existing reviewers
      await db.delete(workflowReviewers).where(eq(workflowReviewers.workflowId, id));

      // Insert new reviewers
      for (const reviewerId of reviewerIds) {
        await db.insert(workflowReviewers).values({
          workflowId: id,
          reviewerId,
          isRequired: true,
        });
      }
    }

    // Update stakeholders if provided
    if (stakeholderIds && stakeholderIds.length > 0) {
      // Delete existing stakeholders
      await db.delete(workflowStakeholders).where(eq(workflowStakeholders.workflowId, id));

      // Insert new stakeholders
      for (const stakeholderId of stakeholderIds) {
        await db.insert(workflowStakeholders).values({
          workflowId: id,
          stakeholderId,
          notificationType: "email",
        });
      }
    }

    // Add an entry to the workflow history
    await db.insert(workflowHistory).values({
      workflowId: id,
      userId: workflow.requesterId, // Use the requester ID for now
      action: "updated",
      details: `Workflow details updated`,
    });

    return workflow;
  }

  async updateApprovalWorkflowStatus(
    id: number,
    status: ApprovalStatus,
    userId: number
  ): Promise<ApprovalWorkflow | undefined> {
    // Get the current workflow to retrieve the previous status
    const [currentWorkflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id));

    if (!currentWorkflow) {
      return undefined;
    }

    const previousStatus = currentWorkflow.status;

    // Update the workflow status
    const [workflow] = await db
      .update(approvalWorkflows)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id))
      .returning();

    if (!workflow) {
      return undefined;
    }

    // Add an entry to the workflow history
    await db.insert(workflowHistory).values({
      workflowId: id,
      userId,
      action: "status_changed",
      details: `Workflow status changed from ${previousStatus} to ${status}`,
      previousStatus: previousStatus as ApprovalStatus,
      newStatus: status,
    });

    return workflow;
  }

  async deleteApprovalWorkflow(id: number): Promise<boolean> {
    // Delete related records first
    await db.delete(workflowReviewers).where(eq(workflowReviewers.workflowId, id));
    await db.delete(workflowStakeholders).where(eq(workflowStakeholders.workflowId, id));
    await db.delete(workflowComments).where(eq(workflowComments.workflowId, id));
    await db.delete(workflowHistory).where(eq(workflowHistory.workflowId, id));

    // Delete the workflow
    const [deletedWorkflow] = await db
      .delete(approvalWorkflows)
      .where(eq(approvalWorkflows.id, id))
      .returning();

    return !!deletedWorkflow;
  }

  // Workflow reviewer methods
  async getWorkflowReviewers(workflowId: number): Promise<WorkflowReviewer[]> {
    return await db
      .select()
      .from(workflowReviewers)
      .where(eq(workflowReviewers.workflowId, workflowId));
  }

  async createWorkflowReviewer(insertReviewer: InsertWorkflowReviewer): Promise<WorkflowReviewer> {
    const [reviewer] = await db
      .insert(workflowReviewers)
      .values(insertReviewer)
      .returning();
    return reviewer;
  }

  async updateWorkflowReviewerStatus(
    id: number,
    status: ApprovalStatus,
    comments: string | null
  ): Promise<WorkflowReviewer | undefined> {
    const [reviewer] = await db
      .update(workflowReviewers)
      .set({
        status,
        comments,
        reviewedAt: new Date(),
      })
      .where(eq(workflowReviewers.id, id))
      .returning();
    return reviewer;
  }

  // Workflow comment methods
  async getWorkflowComments(workflowId: number): Promise<WorkflowComment[]> {
    return await db
      .select()
      .from(workflowComments)
      .where(eq(workflowComments.workflowId, workflowId));
  }

  async createWorkflowComment(insertComment: InsertWorkflowComment): Promise<WorkflowComment> {
    const [comment] = await db
      .insert(workflowComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // Workflow history methods
  async getWorkflowHistory(workflowId: number): Promise<WorkflowHistory[]> {
    return await db
      .select()
      .from(workflowHistory)
      .where(eq(workflowHistory.workflowId, workflowId))
      .orderBy(workflowHistory.timestamp);
  }

  async createWorkflowHistory(insertHistory: InsertWorkflowHistory): Promise<WorkflowHistory> {
    const [history] = await db
      .insert(workflowHistory)
      .values(insertHistory)
      .returning();
    return history;
  }
}

// Decide which storage implementation to use based on environment
// For Kubernetes deployment, use DatabaseStorage with PostgreSQL
// For Replit testing environment, use MemStorage as a fallback

// Detect if we're running in Replit (for testing)
const isRunningInReplit = process.env.REPL_ID && process.env.REPL_OWNER;
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;

// Check if we can connect to the database
let useDatabase = db !== null;

// If we're in Replit and not in Kubernetes, default to MemStorage for testing
if (isRunningInReplit && !isKubernetes) {
  console.log('Running in Replit: Using MemStorage for testing');
  useDatabase = false;
}

if (!useDatabase) {
  console.log('Database connection not available, falling back to MemStorage');
}

// Create storage instance 
const memStorage = new MemStorage();
const dbStorage = useDatabase ? new DatabaseStorage() : memStorage;

// For MemStorage, ensure seed data is loaded for testing
if (!useDatabase) {
  console.log('Initializing MemStorage with seed data for testing');
  // The MemStorage constructor already loads seed data
}

// Export the appropriate storage based on environment
export const storage = dbStorage;

console.log(`Using ${useDatabase ? 'DatabaseStorage (PostgreSQL)' : 'MemStorage (in-memory)'} for data storage`);
