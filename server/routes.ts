import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEventSchema, insertCfpSubmissionSchema, 
  insertAttendeeSchema, insertSponsorshipSchema,
  updateUserProfileSchema, insertAssetSchema,
  assetTypes
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure file upload middleware
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true, 
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));

  // Events API routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
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
      const eventData = insertEventSchema.safeParse(req.body);
      
      if (!eventData.success) {
        const validationError = fromZodError(eventData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const event = await storage.createEvent(eventData.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const eventData = insertEventSchema.partial().safeParse(req.body);
      
      if (!eventData.success) {
        const validationError = fromZodError(eventData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const event = await storage.updateEvent(id, eventData.data);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
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
      
      res.status(204).end();
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
      
      res.status(204).end();
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
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendee" });
    }
  });

  // Sponsorships API routes
  app.get("/api/sponsorships", async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      
      let sponsorships;
      if (eventId) {
        sponsorships = await storage.getSponsorshipsByEvent(eventId);
      } else {
        sponsorships = await storage.getSponsorships();
      }
      
      res.json(sponsorships);
    } catch (error) {
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
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sponsorship" });
    }
  });

  // This section has been deleted to fix the duplicate declaration issue.

  // User profile API routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id/profile", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const profileData = updateUserProfileSchema.safeParse(req.body);
      
      if (!profileData.success) {
        const validationError = fromZodError(profileData.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const user = await storage.updateUserProfile(id, profileData.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.post("/api/users/:id/headshot", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No file was uploaded" });
      }

      // The name of the input field is "headshot"
      const headshotFile = req.files.headshot as fileUpload.UploadedFile;
      
      // Validate file size (already capped by middleware but double-check)
      if (headshotFile.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Headshot file size exceeds the 10MB limit" });
      }

      // Validate file type
      const fileExt = path.extname(headshotFile.name).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      if (!validExtensions.includes(fileExt)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, and GIF are allowed" });
      }

      // Create a unique filename
      const fileName = `user_${id}_${Date.now()}${fileExt}`;
      const uploadPath = path.join(uploadsDir, fileName);

      // Move the file
      await headshotFile.mv(uploadPath);

      // Update user profile with the headshot path
      const headshotUrl = `/uploads/${fileName}`;
      const updatedUser = await storage.updateUserProfile(id, { headshot: headshotUrl });

      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser!;
      res.json({ 
        message: "Headshot uploaded successfully", 
        user: userWithoutPassword 
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
      
      // Enhance asset data with user information
      const enhancedAssets = await Promise.all(assets.map(async (asset) => {
        const user = await storage.getUser(asset.uploadedBy);
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
      const user = await storage.getUser(asset.uploadedBy);
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

  app.post("/api/assets", async (req: Request, res: Response) => {
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
        filePath: publicPath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: parseInt(uploadedBy as string),
        eventId: eventId ? parseInt(eventId as string) : null,
        cfpSubmissionId: cfpSubmissionId ? parseInt(cfpSubmissionId as string) : null,
        description: description || null
      };

      const asset = await storage.createAsset(assetData);
      
      // Add user information to the response
      const user = await storage.getUser(asset.uploadedBy);
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
      const user = await storage.getUser(asset.uploadedBy);
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
      const filePath = path.join(process.cwd(), 'public', asset.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete the record from storage
      const success = await storage.deleteAsset(id);
      if (!success) {
        return res.status(404).json({ message: "Failed to delete asset" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
