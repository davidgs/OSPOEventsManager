import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEventSchema, insertCfpSubmissionSchema, 
  insertAttendeeSchema, insertSponsorshipSchema,
  updateUserPreferencesSchema, insertAssetSchema,
  assetTypes, insertStakeholderSchema,
  insertApprovalWorkflowSchema,
  insertWorkflowReviewerSchema,
  insertWorkflowStakeholderSchema,
  insertWorkflowCommentSchema,
  insertWorkflowHistorySchema,
  approvalStatuses, approvalItemTypes, type ApprovalStatus, type ApprovalItemType
} from "@shared/schema";

// Use the updateUserPreferencesSchema as our profile update schema since it contains all the fields we need
const updateUserProfileSchema = updateUserPreferencesSchema;

// Import our new services
import { UserService } from "./services/user-service";
import { WorkflowService } from "./services/workflow-service";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure file upload middleware for specific routes only
  const fileUploadMiddleware = fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true, 
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: false
  });
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  // Health check endpoint for Kubernetes
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      // In a production environment, we would add more checks:
      // 1. Database connectivity
      // 2. Keycloak connectivity
      // 3. MinIO connectivity
      // 4. File system access for uploads

      // For now, a simple check that our storage layer is working
      await storage.getEvents();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "ospo-app",
        version: process.env.APP_VERSION || "1.0.0"
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service is not healthy"
      });
    }
  });

  // API Health check endpoint  
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      await storage.getEvents();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        database: "disconnected"
      });
    }
  });

  // Events API routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      console.log('GET /api/events called');
      const events = await storage.getEvents();
      console.log(`Retrieved ${events.length} events`);
      
      if (!events || events.length === 0) {
        console.log('No events found');
        return res.json([]);
      }
      
      res.json(events);
    } catch (error) {
      console.error('Error in GET /api/events:', error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      console.log('POST /api/events - Request body:', JSON.stringify(req.body, null, 2));
      
      const eventData = insertEventSchema.safeParse(req.body);
      
      if (!eventData.success) {
        console.error('Validation error:', eventData.error);
        const validationError = fromZodError(eventData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.log('Parsed event data:', JSON.stringify(eventData.data, null, 2));
      
      const event = await storage.createEvent(eventData.data);
      console.log('Created event:', JSON.stringify(event, null, 2));
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event - Full error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Log the request body for debugging
      console.log('PUT /api/events/:id - Request body:', req.body);
      
      const eventData = insertEventSchema.partial().safeParse(req.body);
      
      if (!eventData.success) {
        // Log validation errors
        console.error('Validation error:', eventData.error);
        const validationError = fromZodError(eventData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Log the parsed data
      console.log('Parsed event data:', eventData.data);
      
      const event = await storage.updateEvent(id, eventData.data);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // CFP Submissions API routes
  app.get("/api/cfp-submissions", async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      
      let submissions;
      if (eventId) {
        submissions = await storage.getCfpSubmissionsByEvent(eventId);
      } else {
        submissions = await storage.getCfpSubmissions();
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CFP submissions" });
    }
  });

  app.get("/api/cfp-submissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }

      const submission = await storage.getCfpSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CFP submission" });
    }
  });

  app.post("/api/cfp-submissions", async (req: Request, res: Response) => {
    try {
      const submissionData = insertCfpSubmissionSchema.safeParse(req.body);
      
      if (!submissionData.success) {
        const validationError = fromZodError(submissionData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const submission = await storage.createCfpSubmission(submissionData.data);
      res.status(201).json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create CFP submission" });
    }
  });

  app.put("/api/cfp-submissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }

      const submissionData = insertCfpSubmissionSchema.partial().safeParse(req.body);
      
      if (!submissionData.success) {
        const validationError = fromZodError(submissionData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const submission = await storage.updateCfpSubmission(id, submissionData.data);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update CFP submission" });
    }
  });

  app.delete("/api/cfp-submissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }

      const success = await storage.deleteCfpSubmission(id);
      if (!success) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete CFP submission" });
    }
  });

  // Attendees API routes
  app.get("/api/attendees", async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      
      let attendees;
      if (eventId) {
        attendees = await storage.getAttendeesByEvent(eventId);
      } else {
        attendees = await storage.getAttendees();
      }
      
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  app.get("/api/attendees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }

      const attendee = await storage.getAttendee(id);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }

      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendee" });
    }
  });

  app.post("/api/attendees", async (req: Request, res: Response) => {
    try {
      const attendeeData = insertAttendeeSchema.safeParse(req.body);
      
      if (!attendeeData.success) {
        const validationError = fromZodError(attendeeData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const attendee = await storage.createAttendee(attendeeData.data);
      res.status(201).json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to create attendee" });
    }
  });

  app.put("/api/attendees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }

      const attendeeData = insertAttendeeSchema.partial().safeParse(req.body);
      
      if (!attendeeData.success) {
        const validationError = fromZodError(attendeeData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const attendee = await storage.updateAttendee(id, attendeeData.data);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendee" });
    }
  });

  app.delete("/api/attendees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }

      const success = await storage.deleteAttendee(id);
      if (!success) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendee" });
    }
  });

  // Sponsorships API routes
  app.get("/api/sponsorships", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/sponsorships called");
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      
      let sponsorships;
      if (eventId) {
        console.log(`Fetching sponsorships for event ID: ${eventId}`);
        sponsorships = await storage.getSponsorshipsByEvent(eventId);
      } else {
        console.log("Fetching all sponsorships");
        sponsorships = await storage.getSponsorships();
      }
      
      console.log(`Retrieved ${sponsorships.length} sponsorships`);
      res.json(sponsorships);
    } catch (error) {
      console.error("Error in GET /api/sponsorships:", error);
      res.status(500).json({ message: "Failed to fetch sponsorships" });
    }
  });

  app.get("/api/sponsorships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sponsorship ID" });
      }

      const sponsorship = await storage.getSponsorship(id);
      if (!sponsorship) {
        return res.status(404).json({ message: "Sponsorship not found" });
      }

      res.json(sponsorship);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsorship" });
    }
  });

  app.post("/api/sponsorships", async (req: Request, res: Response) => {
    try {
      const sponsorshipData = insertSponsorshipSchema.safeParse(req.body);
      
      if (!sponsorshipData.success) {
        const validationError = fromZodError(sponsorshipData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const sponsorship = await storage.createSponsorship(sponsorshipData.data);
      res.status(201).json(sponsorship);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sponsorship" });
    }
  });

  app.put("/api/sponsorships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sponsorship ID" });
      }

      const sponsorshipData = insertSponsorshipSchema.partial().safeParse(req.body);
      
      if (!sponsorshipData.success) {
        const validationError = fromZodError(sponsorshipData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const sponsorship = await storage.updateSponsorship(id, sponsorshipData.data);
      if (!sponsorship) {
        return res.status(404).json({ message: "Sponsorship not found" });
      }
      
      res.json(sponsorship);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sponsorship" });
    }
  });

  app.delete("/api/sponsorships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sponsorship ID" });
      }

      const success = await storage.deleteSponsorship(id);
      if (!success) {
        return res.status(404).json({ message: "Sponsorship not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sponsorship" });
    }
  });

  // This section has been deleted to fix the duplicate declaration issue.

  // User profile API routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // For now, return a list with dummy users as we don't have a getUsers method yet
      // In a real application, this would fetch users from the database
      res.json([
        { id: 1, name: "Alex Johnson", email: "alex@example.com", role: "admin" },
        { id: 2, name: "Taylor Garcia", email: "taylor@example.com", role: "reviewer" }
      ]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      let user;
      
      // Check if ID is numeric (database ID) or UUID (Keycloak ID)
      if (/^[0-9]+$/.test(id)) {
        user = await storage.getUser(parseInt(id));
      } else {
        // UUID - Keycloak user
        user = await storage.getUserByKeycloakId(id);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password if it exists
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id/profile", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      const profileData = updateUserProfileSchema.safeParse(req.body);
      
      if (!profileData.success) {
        const validationError = fromZodError(profileData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      let user;
      
      // Handle both numeric IDs and Keycloak UUIDs
      if (/^[0-9]+$/.test(id)) {
        user = await storage.updateUserProfile(parseInt(id), profileData.data);
      } else {
        // For Keycloak users, find the database user first
        const existingUser = await storage.getUserByKeycloakId(id);
        if (existingUser) {
          user = await storage.updateUserProfile(existingUser.id, profileData.data);
        } else {
          // Create a new user record for this Keycloak user
          const newUser = await storage.createUser({
            keycloak_id: id,
            username: id,
            name: profileData.data.name ?? null,
            email: profileData.data.email ?? null,
            bio: profileData.data.bio ?? null,
            role: profileData.data.role ?? null,
            job_title: profileData.data.job_title ?? null,
            headshot: profileData.data.headshot ?? null,
            preferences: profileData.data.preferences ?? null
          });
          user = newUser;
        }
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password if it exists
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.post("/api/users/:id/headshot", fileUploadMiddleware, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      console.log("Headshot upload request for user ID:", id);
      console.log("Request files:", req.files);
      console.log("Request body:", req.body);
      
      if (!id) {
        console.log("No user ID provided");
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // For Keycloak integration, we'll handle UUID strings as well as numeric IDs
      let user;
      if (/^[0-9]+$/.test(id)) {
        // Numeric ID - use existing storage method
        console.log("Numeric user ID detected, fetching from storage");
        user = await storage.getUser(parseInt(id));
      } else {
        // UUID or string ID - for Keycloak users, we'll create a basic user record
        console.log("UUID user ID detected (Keycloak user)");
        user = { id, name: 'Keycloak User', email: '', username: id };
      }

      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        console.log("No files uploaded");
        return res.status(400).json({ message: "No file was uploaded" });
      }

      // The name of the input field is "headshot"
      const headshotFile = req.files.headshot as fileUpload.UploadedFile;
      
      if (!headshotFile) {
        console.log("No headshot file found in request");
        return res.status(400).json({ message: "No headshot file was uploaded" });
      }
      
      console.log("Headshot file details:", {
        name: headshotFile.name,
        size: headshotFile.size,
        mimetype: headshotFile.mimetype
      });
      
      // Validate file size (already capped by middleware but double-check)
      if (headshotFile.size > 10 * 1024 * 1024) {
        console.log("File size too large:", headshotFile.size);
        return res.status(400).json({ message: "Headshot file size exceeds the 10MB limit" });
      }

      // Validate file type
      const fileExt = path.extname(headshotFile.name).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      console.log("File extension:", fileExt);
      
      if (!validExtensions.includes(fileExt)) {
        console.log("Invalid file extension:", fileExt);
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, and GIF are allowed" });
      }

      // Create a unique filename
      const fileName = `user_${id}_${Date.now()}${fileExt}`;
      const uploadPath = path.join(uploadsDir, fileName);

      // Move the file
      await headshotFile.mv(uploadPath);

      // Update user profile with the headshot path
      const headshotUrl = `/uploads/${fileName}`;
      
      // Create an asset record for the uploaded file
      const assetData = {
        name: headshotFile.name,
        type: 'headshot' as const,
        file_path: `/uploads/${fileName}`,
        file_size: headshotFile.size,
        mime_type: headshotFile.mimetype,
        uploaded_by: /^[0-9]+$/.test(id) ? parseInt(id) : 1 // Use 1 as fallback for Keycloak users
      };

      try {
        await storage.createAsset(assetData);
        console.log(`Created asset record for headshot: ${fileName}`);
      } catch (assetError) {
        console.error("Failed to create asset record:", assetError);
        // Continue with headshot update even if asset creation fails
      }
      
      // For UUID users (Keycloak), try to update their profile in the database
      let updatedUser;
      if (/^[0-9]+$/.test(id)) {
        // Numeric ID - update in storage
        updatedUser = await storage.updateUserProfile(parseInt(id), { headshot: headshotUrl });
      } else {
        // UUID - For Keycloak users, try to update or create a user record
        try {
          const existingUser = await storage.getUserByKeycloakId(id);
          if (existingUser) {
            updatedUser = await storage.updateUserProfile(existingUser.id, { headshot: headshotUrl });
            console.log(`Updated headshot for existing Keycloak user: ${existingUser.id}`);
          } else {
            // Create a minimal user record for Keycloak user
            const newUser = await storage.createUser({
              keycloak_id: id,
              username: user.username || id,
              name: user.name || "Keycloak User",
              email: user.email || null,
              headshot: headshotUrl
            });
            updatedUser = newUser;
            console.log(`Created new user record for Keycloak user: ${newUser.id}`);
          }
        } catch (dbError) {
          console.error("Failed to update user profile in database:", dbError);
          // Fallback - return user info with headshot URL
          updatedUser = { ...user, headshot: headshotUrl };
        }
      }

      // Don't return the password if it exists
      const { password, ...userWithoutPassword } = updatedUser as any;
      res.json({ 
        message: "Headshot uploaded successfully", 
        user: userWithoutPassword,
        headshotUrl: headshotUrl
      });
    } catch (error) {
      console.error("Error uploading headshot:", error);
      res.status(500).json({ message: "Failed to upload headshot" });
    }
  });

  // Assets API routes
  app.get("/api/assets", async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      const cfpSubmissionId = req.query.cfpSubmissionId ? parseInt(req.query.cfpSubmissionId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const type = req.query.type as string;
      const unlinkedEventId = req.query.unlinked ? parseInt(req.query.unlinked as string) : undefined;
      
      let assets;
      if (unlinkedEventId) {
        // Get all assets that are not linked to the specified event
        const allAssets = await storage.getAssets();
        const linkedAssets = await storage.getAssetsByEvent(unlinkedEventId);
        const linkedAssetIds = new Set(linkedAssets.map(asset => asset.id));
        assets = allAssets.filter(asset => !linkedAssetIds.has(asset.id));
      } else if (eventId) {
        assets = await storage.getAssetsByEvent(eventId);
      } else if (cfpSubmissionId) {
        assets = await storage.getAssetsByCfpSubmission(cfpSubmissionId);
      } else if (userId) {
        assets = await storage.getAssetsByUser(userId);
      } else if (type && assetTypes.includes(type as any)) {
        assets = await storage.getAssetsByType(type as any);
      } else {
        assets = await storage.getAssets();
      }
      
      // For backward compatibility, ensure all assets have uploadedByName
      const enhancedAssets = await Promise.all(assets.map(async (asset) => {
        const user = await storage.getUser(asset.uploaded_by);
        return {
          ...asset,
          uploadedByName: user ? user.name : 'Unknown User'
        };
      }));
      
      res.json(enhancedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Add user information
      const user = await storage.getUser(asset.uploaded_by);
      const enhancedAsset = {
        ...asset,
        uploadedByName: user ? user.name : 'Unknown User'
      };

      res.json(enhancedAsset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", fileUploadMiddleware, async (req: Request, res: Response) => {
    try {
      // Check if a file was uploaded
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      const { name, type, eventId, cfpSubmissionId, uploadedBy, description } = req.body;

      // Validate asset data
      if (!name || !type || !uploadedBy) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate asset type
      if (!assetTypes.includes(type as any)) {
        return res.status(400).json({ 
          message: `Invalid asset type. Must be one of: ${assetTypes.join(', ')}` 
        });
      }

      // Generate a unique filename
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join('public', 'uploads', fileName);
      const publicPath = `/uploads/${fileName}`;

      // Move the file to uploads directory
      await file.mv(path.join(process.cwd(), filePath));

      // Create asset record
      const assetData = {
        name,
        type: type as any,
        file_path: publicPath,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: parseInt(uploadedBy as string),
        event_id: eventId ? parseInt(eventId as string) : null,
        cfp_submission_id: cfpSubmissionId ? parseInt(cfpSubmissionId as string) : null
      };

      const asset = await storage.createAsset(assetData);
      
      // Add user information to the response
      const user = await storage.getUser(asset.uploaded_by);
      const enhancedAsset = {
        ...asset,
        uploadedByName: user ? user.name : 'Unknown User'
      };
      
      res.status(201).json(enhancedAsset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.put("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const { name, description, eventId, cfpSubmissionId } = req.body;
      
      // Only allow updating certain fields
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (eventId !== undefined) updateData.eventId = eventId ? parseInt(eventId as string) : null;
      if (cfpSubmissionId !== undefined) updateData.cfpSubmissionId = cfpSubmissionId ? parseInt(cfpSubmissionId as string) : null;
      
      const asset = await storage.updateAsset(id, updateData);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Add user information to response
      const user = await storage.getUser(asset.uploaded_by);
      const enhancedAsset = {
        ...asset,
        uploadedByName: user ? user.name : 'Unknown User'
      };
      
      res.json(enhancedAsset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      // Get the asset to find the file path
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Delete the file from the file system
      const filePath = path.join(process.cwd(), 'public', asset.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete the record from storage
      const success = await storage.deleteAsset(id);
      if (!success) {
        return res.status(404).json({ message: "Failed to delete asset" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // ===== Stakeholders API =====
  
  app.get("/api/stakeholders", async (req: Request, res: Response) => {
    try {
      const stakeholders = await storage.getStakeholders();
      res.json(stakeholders);
    } catch (err) {
      console.error("Error fetching stakeholders:", err);
      res.status(500).json({ message: "Failed to fetch stakeholders" });
    }
  });
  
  app.get("/api/stakeholders/role/:role", async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const stakeholders = await storage.getStakeholdersByRole(role);
      res.json(stakeholders);
    } catch (err) {
      console.error(`Error fetching stakeholders by role ${req.params.role}:`, err);
      res.status(500).json({ message: "Failed to fetch stakeholders by role" });
    }
  });
  
  app.get("/api/stakeholders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const stakeholder = await storage.getStakeholder(id);
      
      if (!stakeholder) {
        return res.status(404).json({ message: "Stakeholder not found" });
      }
      
      res.json(stakeholder);
    } catch (err) {
      console.error(`Error fetching stakeholder ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to fetch stakeholder" });
    }
  });
  
  app.post("/api/stakeholders", async (req: Request, res: Response) => {
    try {
      const parseResult = insertStakeholderSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const stakeholder = await storage.createStakeholder(parseResult.data);
      res.status(201).json(stakeholder);
    } catch (err) {
      console.error("Error creating stakeholder:", err);
      res.status(500).json({ message: "Failed to create stakeholder" });
    }
  });
  
  app.put("/api/stakeholders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertStakeholderSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const stakeholder = await storage.updateStakeholder(id, parseResult.data);
      
      if (!stakeholder) {
        return res.status(404).json({ message: "Stakeholder not found" });
      }
      
      res.json(stakeholder);
    } catch (err) {
      console.error(`Error updating stakeholder ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to update stakeholder" });
    }
  });
  
  app.delete("/api/stakeholders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStakeholder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Stakeholder not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting stakeholder ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to delete stakeholder" });
    }
  });
  
  // ===== Approval Workflows API =====
  
  app.get("/api/approval-workflows", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as ApprovalStatus | undefined;
      const itemType = req.query.itemType as ApprovalItemType | undefined;
      const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
      const requesterId = req.query.requesterId ? parseInt(req.query.requesterId as string) : undefined;
      
      let workflows;
      
      if (status) {
        workflows = await storage.getApprovalWorkflowsByStatus(status);
      } else if (itemType && itemId) {
        workflows = await storage.getApprovalWorkflowsByItem(itemType, itemId);
      } else if (itemType) {
        workflows = await storage.getApprovalWorkflowsByItemType(itemType);
      } else if (requesterId) {
        workflows = await storage.getApprovalWorkflowsByRequester(requesterId);
      } else {
        workflows = await storage.getApprovalWorkflows();
      }
      
      res.json(workflows);
    } catch (err) {
      console.error("Error fetching approval workflows:", err);
      res.status(500).json({ message: "Failed to fetch approval workflows" });
    }
  });
  
  app.get("/api/approval-workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Fetching workflow with ID: ${id}`);
      const workflow = await storage.getApprovalWorkflow(id);
      
      if (!workflow) {
        console.log(`Workflow not found with ID: ${id}`);
        return res.status(404).json({ message: "Approval workflow not found" });
      }
      
      console.log(`Found workflow:`, workflow);
      
      // Get related data
      const reviewers = await storage.getWorkflowReviewersByWorkflow(id);
      const stakeholders = await storage.getWorkflowStakeholdersByWorkflow(id);
      const comments = await storage.getWorkflowCommentsByWorkflow(id);
      const history = await storage.getWorkflowHistoryByWorkflow(id);
      
      console.log(`Related data: reviewers=${reviewers.length || 0}, stakeholders=${stakeholders.length || 0}, comments=${comments.length || 0}, history=${history.length || 0}`);
      
      // Return workflow with related data
      const fullWorkflow = {
        ...workflow,
        reviewers: reviewers || [],
        stakeholders: stakeholders || [],
        comments: comments || [],
        history: history || []
      };
      
      console.log(`Returning full workflow data`);
      res.json(fullWorkflow);
    } catch (err) {
      console.error(`Error fetching approval workflow ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to fetch approval workflow" });
    }
  });
  
  app.post("/api/approval-workflows", async (req: Request, res: Response) => {
    try {
      console.log("Creating workflow:", req.body);
      
      // Add validation for the new item types
      console.log("Request body itemType:", req.body.itemType);
      console.log("Valid item types:", approvalItemTypes);
      
      const isValidItemType = approvalItemTypes.includes(req.body.itemType);
      if (!isValidItemType) {
        console.error(`Invalid itemType: "${req.body.itemType}"`);
        return res.status(400).json({ 
          message: `Invalid itemType. Allowed values: ${approvalItemTypes.join(', ')}` 
        });
      }
      
      // Log all request body fields for debugging
      console.log("Request body before validation:", {
        title: req.body.title,
        description: req.body.description,
        itemType: req.body.itemType,
        itemId: req.body.itemId,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
        requesterId: req.body.requesterId,
        reviewerIds: req.body.reviewerIds,
        stakeholderIds: req.body.stakeholderIds
      });
      
      const parseResult = insertApprovalWorkflowSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        console.error("Validation error details:", parseResult.error.errors);
        console.error("Validation error message:", validationError.message);
        return res.status(400).json({ 
          message: validationError.message,
          details: parseResult.error.errors 
        });
      }
      
      const workflow = await storage.createApprovalWorkflow(parseResult.data);
      res.status(201).json(workflow);
    } catch (err) {
      console.error("Error creating approval workflow:", err);
      res.status(500).json({ message: "Failed to create approval workflow" });
    }
  });
  
  app.put("/api/approval-workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = insertApprovalWorkflowSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const workflow = await storage.updateApprovalWorkflow(id, parseResult.data);
      
      if (!workflow) {
        return res.status(404).json({ message: "Approval workflow not found" });
      }
      
      res.json(workflow);
    } catch (err) {
      console.error(`Error updating approval workflow ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to update approval workflow" });
    }
  });
  
  app.put("/api/approval-workflows/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, userId } = req.body;
      
      // Validate inputs
      if (!status || !userId) {
        return res.status(400).json({ message: "Status and userId are required" });
      }
      
      if (!approvalStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const workflow = await storage.updateApprovalWorkflowStatus(id, status);
      
      if (!workflow) {
        return res.status(404).json({ message: "Approval workflow not found" });
      }
      
      res.json(workflow);
    } catch (err) {
      console.error(`Error updating approval workflow status ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to update approval workflow status" });
    }
  });
  
  app.delete("/api/approval-workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteApprovalWorkflow(id);
      
      if (!success) {
        return res.status(404).json({ message: "Approval workflow not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting approval workflow ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to delete approval workflow" });
    }
  });
  
  // ===== Workflow Reviewers API =====
  
  app.get("/api/workflow-reviewers", async (req: Request, res: Response) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let reviewers;
      
      if (workflowId) {
        reviewers = await storage.getWorkflowReviewersByWorkflow(workflowId);
      } else if (userId) {
        reviewers = await storage.getWorkflowReviewersByUser(userId);
      } else {
        return res.status(400).json({ message: "Either workflowId or userId is required" });
      }
      
      res.json(reviewers);
    } catch (err) {
      console.error("Error fetching workflow reviewers:", err);
      res.status(500).json({ message: "Failed to fetch workflow reviewers" });
    }
  });
  
  app.post("/api/workflow-reviewers", async (req: Request, res: Response) => {
    try {
      const parseResult = insertWorkflowReviewerSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const reviewer = await storage.createWorkflowReviewer(parseResult.data);
      res.status(201).json(reviewer);
    } catch (err) {
      console.error("Error creating workflow reviewer:", err);
      res.status(500).json({ message: "Failed to create workflow reviewer" });
    }
  });
  
  app.put("/api/workflow-reviewers/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, comments } = req.body;
      
      // Validate inputs
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      if (!approvalStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const reviewer = await storage.updateWorkflowReviewerStatus(id, status);
      
      if (!reviewer) {
        return res.status(404).json({ message: "Workflow reviewer not found" });
      }
      
      res.json(reviewer);
    } catch (err) {
      console.error(`Error updating workflow reviewer status ${req.params.id}:`, err);
      res.status(500).json({ message: "Failed to update workflow reviewer status" });
    }
  });
  
  // ===== Workflow Comments API =====
  
  app.get("/api/workflow-comments", async (req: Request, res: Response) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      
      if (!workflowId) {
        return res.status(400).json({ message: "workflowId is required" });
      }
      
      const comments = await storage.getWorkflowCommentsByWorkflow(workflowId);
      res.json(comments);
    } catch (err) {
      console.error("Error fetching workflow comments:", err);
      res.status(500).json({ message: "Failed to fetch workflow comments" });
    }
  });
  
  app.post("/api/workflow-comments", async (req: Request, res: Response) => {
    try {
      const parseResult = insertWorkflowCommentSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const comment = await storage.createWorkflowComment(parseResult.data);
      res.status(201).json(comment);
    } catch (err) {
      console.error("Error creating workflow comment:", err);
      res.status(500).json({ message: "Failed to create workflow comment" });
    }
  });
  
  // ===== Workflow History API =====
  
  app.get("/api/workflow-history/:workflowId", async (req: Request, res: Response) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      const history = await storage.getWorkflowHistoryByWorkflow(workflowId);
      res.json(history);
    } catch (err) {
      console.error(`Error fetching workflow history for workflow ${req.params.workflowId}:`, err);
      res.status(500).json({ message: "Failed to fetch workflow history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
