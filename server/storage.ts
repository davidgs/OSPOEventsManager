import { 
  Event, InsertEvent, 
  CfpSubmission, InsertCfpSubmission,
  Attendee, InsertAttendee,
  Sponsorship, InsertSponsorship,
  User, InsertUser,
  Asset, InsertAsset,
  AssetType,
  events, cfpSubmissions, attendees, sponsorships, users, assets
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private cfpSubmissions: Map<number, CfpSubmission>;
  private attendees: Map<number, Attendee>;
  private sponsorships: Map<number, Sponsorship>;
  private assets: Map<number, Asset>;
  
  private userId: number;
  private eventId: number;
  private cfpSubmissionId: number;
  private attendeeId: number;
  private sponsorshipId: number;
  private assetId: number;
  
  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.cfpSubmissions = new Map();
    this.attendees = new Map();
    this.sponsorships = new Map();
    this.assets = new Map();
    
    this.userId = 1;
    this.eventId = 1;
    this.cfpSubmissionId = 1;
    this.attendeeId = 1;
    this.sponsorshipId = 1;
    this.assetId = 1;
    
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
  }
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
  
  async updateUserProfile(id: number, userData: { name?: string; email?: string; bio?: string; role?: string; jobTitle?: string; headshot?: string }): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    // If name has been changed, update related records
    if (userData.name && userData.name !== user.name) {
      console.log(`Updating name from "${user.name}" to "${userData.name}" for user ID ${id}`);
      
      // Update CFP submissions where this user is the submitter
      const cfpUpdated = await db
        .update(cfpSubmissions)
        .set({ submitterName: userData.name })
        .where(eq(cfpSubmissions.submitterId, id))
        .returning();
      console.log(`Updated ${cfpUpdated.length} CFP submissions`);
        
      // Update attendees where this user has entries
      const attendeesUpdated = await db
        .update(attendees)
        .set({ name: userData.name })
        .where(eq(attendees.userId, id))
        .returning();
      console.log(`Updated ${attendeesUpdated.length} attendee records`);
      
      // Also update any other tables that might reference this user's name
      // e.g., events.createdByName (if such field exists), etc.
    }
      
    return updatedUser;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...insertEvent,
        status: "planning"
      })
      .returning();
    return event;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updateEvent)
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
}

// Use MemStorage instead of DatabaseStorage to handle the goals as arrays without DB schema changes
// We need to use memory storage since the database schema has 'goal' not 'goals' column
export const storage = new MemStorage();
