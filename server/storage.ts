import { 
  Event, InsertEvent, 
  CfpSubmission, InsertCfpSubmission,
  Attendee, InsertAttendee,
  Sponsorship, InsertSponsorship,
  User, InsertUser,
  events, cfpSubmissions, attendees, sponsorships, users 
} from "@shared/schema";

// Storage interface for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private cfpSubmissions: Map<number, CfpSubmission>;
  private attendees: Map<number, Attendee>;
  private sponsorships: Map<number, Sponsorship>;
  
  private userId: number;
  private eventId: number;
  private cfpSubmissionId: number;
  private attendeeId: number;
  private sponsorshipId: number;
  
  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.cfpSubmissions = new Map();
    this.attendees = new Map();
    this.sponsorships = new Map();
    
    this.userId = 1;
    this.eventId = 1;
    this.cfpSubmissionId = 1;
    this.attendeeId = 1;
    this.sponsorshipId = 1;
    
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { ...insertEvent, id, status: "planning" };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...updateEvent };
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
      goal: "speaking",
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
      goal: "sponsoring",
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
      goal: "attending",
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
      goal: "speaking",
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
      goal: "attending",
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

export const storage = new MemStorage();
