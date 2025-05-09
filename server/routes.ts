import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEventSchema, insertCfpSubmissionSchema, 
  insertAttendeeSchema, insertSponsorshipSchema 
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
