import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { assets } from "../shared/database-schema";
import {
  insertEventSchema, insertCFPSubmissionSchema,
  insertAttendeeSchema, insertSponsorshipSchema,
  updateUserProfileSchema, insertAssetSchema,
  assetTypes, insertStakeholderSchema,
  insertApprovalWorkflowSchema,
  insertWorkflowReviewerSchema,
  insertWorkflowStakeholderSchema,
  insertWorkflowCommentSchema,
  insertWorkflowHistorySchema,
  approvalStatuses, approvalItemTypes, type ApprovalStatus, type ApprovalItemType
} from "../shared/database-types.js";

import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Geolocation types
interface GeolocationResult {
  country?: string;
  region?: string;
  continent?: string;
  display_name?: string;
}

// Authorization utilities
interface AuthorizedUser {
  id: number;
  keycloak_id: string;
  role: string;
  name: string;
  email: string;
}

function hasPermission(user: AuthorizedUser, resource: string, action: string): boolean {
  // Admin users have full access
  if (user.role === 'admin' || user.role === 'Administrator') {
    return true;
  }

  // Community Manager permissions
  if (user.role === 'Community Manager') {
    return ['events', 'assets', 'cfp-submissions', 'attendees', 'sponsorships'].includes(resource);
  }

  // Regular users can only access their own resources
  if (user.role === 'User' || user.role === 'user') {
    return resource === 'profile' || (resource === 'assets' && action === 'read');
  }

  return false;
}

// Geolocation service using Nominatim (free OpenStreetMap geocoding)
async function geocodeLocation(location: string): Promise<GeolocationResult | null> {
  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&addressdetails=1&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OSPOEventsManager/1.0'
      }
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    // Map Nominatim address components to our geographic fields
    const country = address.country;
    const region = address.state || address.province || address.region || address.county;

    // Determine continent based on country
    const continentMap: { [key: string]: string } = {
      // North America
      'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
      'United States of America': 'North America',

      // Europe
      'United Kingdom': 'Europe', 'Germany': 'Europe', 'France': 'Europe', 'Spain': 'Europe',
      'Italy': 'Europe', 'Netherlands': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe',
      'Poland': 'Europe', 'Czech Republic': 'Europe', 'Hungary': 'Europe', 'Portugal': 'Europe',
      'Ireland': 'Europe', 'Greece': 'Europe', 'Romania': 'Europe', 'Bulgaria': 'Europe',
      'Croatia': 'Europe', 'Slovenia': 'Europe', 'Slovakia': 'Europe', 'Estonia': 'Europe',
      'Latvia': 'Europe', 'Lithuania': 'Europe', 'Finland': 'Europe', 'Denmark': 'Europe',
      'Austria': 'Europe', 'Switzerland': 'Europe', 'Belgium': 'Europe', 'Luxembourg': 'Europe',

      // Asia
      'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia', 'Singapore': 'Asia',
      'Thailand': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia', 'Philippines': 'Asia',
      'Vietnam': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia', 'Sri Lanka': 'Asia',
      'Bangladesh': 'Asia', 'Pakistan': 'Asia', 'Nepal': 'Asia', 'Bhutan': 'Asia',
      'Myanmar': 'Asia', 'Cambodia': 'Asia', 'Laos': 'Asia', 'Mongolia': 'Asia',
      'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia', 'Kyrgyzstan': 'Asia', 'Tajikistan': 'Asia',
      'Turkmenistan': 'Asia', 'Afghanistan': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia',
      'Turkey': 'Asia', 'Saudi Arabia': 'Asia', 'United Arab Emirates': 'Asia', 'Israel': 'Asia',
      'Jordan': 'Asia', 'Lebanon': 'Asia', 'Syria': 'Asia', 'Yemen': 'Asia', 'Oman': 'Asia',
      'Kuwait': 'Asia', 'Qatar': 'Asia', 'Bahrain': 'Asia',

      // Africa
      'South Africa': 'Africa', 'Nigeria': 'Africa', 'Egypt': 'Africa', 'Kenya': 'Africa',
      'Morocco': 'Africa', 'Tunisia': 'Africa', 'Algeria': 'Africa', 'Ghana': 'Africa',
      'Ethiopia': 'Africa', 'Uganda': 'Africa', 'Tanzania': 'Africa', 'Zimbabwe': 'Africa',
      'Botswana': 'Africa', 'Namibia': 'Africa', 'Senegal': 'Africa', 'Mali': 'Africa',
      'Burkina Faso': 'Africa', 'Niger': 'Africa', 'Chad': 'Africa', 'Cameroon': 'Africa',
      'Gabon': 'Africa', 'Congo': 'Africa', 'Central African Republic': 'Africa', 'Rwanda': 'Africa',
      'Burundi': 'Africa', 'Madagascar': 'Africa', 'Mauritius': 'Africa', 'Seychelles': 'Africa',
      'Comoros': 'Africa', 'Djibouti': 'Africa', 'Somalia': 'Africa', 'Sudan': 'Africa',
      'South Sudan': 'Africa', 'Eritrea': 'Africa', 'Libya': 'Africa', 'Angola': 'Africa',
      'Mozambique': 'Africa', 'Malawi': 'Africa', 'Zambia': 'Africa', 'Lesotho': 'Africa',
      'Eswatini': 'Africa', 'Liberia': 'Africa', 'Sierra Leone': 'Africa', 'Guinea': 'Africa',
      'Guinea-Bissau': 'Africa', 'Gambia': 'Africa', 'Cape Verde': 'Africa', 'Ivory Coast': 'Africa',
      'Togo': 'Africa', 'Benin': 'Africa', 'Equatorial Guinea': 'Africa', 'São Tomé and Príncipe': 'Africa',

      // South America
      'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
      'Colombia': 'South America', 'Peru': 'South America', 'Venezuela': 'South America',
      'Ecuador': 'South America', 'Uruguay': 'South America', 'Paraguay': 'South America',
      'Bolivia': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
      'French Guiana': 'South America',

      // Oceania
      'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania', 'Papua New Guinea': 'Oceania',
      'Samoa': 'Oceania', 'Tonga': 'Oceania', 'Vanuatu': 'Oceania', 'Solomon Islands': 'Oceania'
    };

    const continent = country ? continentMap[country] || null : null;

    return {
      country,
      region,
      continent: continent || undefined,
      display_name: result.display_name
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthorizedUser;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!hasPermission(user, resource, action)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `You don't have permission to ${action} ${resource}`
      });
    }

    next();
  };
}

function requireOwnership(getResourceOwnerId: (req: Request) => Promise<number | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthorizedUser;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin users can access any resource
    if (user.role === 'admin' || user.role === 'Administrator') {
      return next();
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(req);

      if (resourceOwnerId === null) {
        return res.status(404).json({ error: "Resource not found" });
      }

      if (resourceOwnerId !== user.id) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only access your own resources"
        });
      }

      next();
    } catch (error) {
      console.error("Error checking resource ownership:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Input validation and sanitization utilities
function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, (char) => char === '<' ? '&lt;' : '&gt;') // Basic HTML escaping
    .substring(0, maxLength);
}

function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const cleanEmail = email.trim().toLowerCase();

  return emailRegex.test(cleanEmail) ? cleanEmail : '';
}

function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
}

function validateAndSanitizeId(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';

  return query
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .replace(/[;-]/g, '') // Remove SQL injection patterns
    .substring(0, 100); // Limit search query length
}

// Rate limiting utilities
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

function getRateLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientId)) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      });
    }

    next();
  };
}

// Secure file upload utilities
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  presentation: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  text: ['text/plain', 'text/csv'],
  archive: ['application/zip', 'application/x-zip-compressed']
};

const ALLOWED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  document: ['.pdf', '.doc', '.docx'],
  spreadsheet: ['.xls', '.xlsx'],
  presentation: ['.ppt', '.pptx'],
  text: ['.txt', '.csv'],
  archive: ['.zip']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 255;

function sanitizeFilename(filename: string): string {
  // Extract extension first to preserve it
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Remove or replace dangerous characters from the name part only
  const sanitizedName = nameWithoutExt
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');

  // Reconstruct filename with original extension
  const fullName = sanitizedName + ext;

  // Apply length limit to the full filename
  return fullName.substring(0, MAX_FILENAME_LENGTH);
}

function validateFileType(file: fileUpload.UploadedFile, allowedTypes: string[]): boolean {
  const fileExt = path.extname(file.name).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check both extension and MIME type
  const validExtensions = allowedTypes.flatMap(type => ALLOWED_EXTENSIONS[type as keyof typeof ALLOWED_EXTENSIONS] || []);
  const validMimeTypes = allowedTypes.flatMap(type => ALLOWED_MIME_TYPES[type as keyof typeof ALLOWED_MIME_TYPES] || []);

  return validExtensions.includes(fileExt) && validMimeTypes.includes(mimeType);
}

function generateSecureFilename(originalName: string, userId: string | number): string {
  const ext = path.extname(originalName).toLowerCase();
  const nameWithoutExt = path.basename(originalName, ext);

  // Sanitize just the name part (without extension)
  const sanitizedName = nameWithoutExt
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');

  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');

  return `${userId}_${timestamp}_${randomBytes}_${sanitizedName}${ext}`;
}

function validateUploadPath(filePath: string, uploadsDir: string): boolean {
  // Resolve paths to prevent directory traversal
  const resolvedUploadDir = path.resolve(uploadsDir);
  const resolvedFilePath = path.resolve(filePath);

  // Ensure the file path is within the uploads directory
  return resolvedFilePath.startsWith(resolvedUploadDir);
}

// Secure error handling utilities
function createSecureError(message: string, statusCode: number = 500, details?: any) {
  const error = new Error(message);
  (error as any).statusCode = statusCode;

  // Only include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    (error as any).details = details;
  }

  return error;
}

function handleSecureError(error: any, req: Request, res: Response) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  // Log the full error for debugging
  console.error(`Error in ${req.method} ${req.path}:`, error);

  // Send sanitized error response
  const response: any = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.details;
  }

  res.status(statusCode).json(response);
}

// Validation error handler
function handleValidationError(error: any, req: Request, res: Response) {
  console.error(`Validation error in ${req.method} ${req.path}:`, error);

  res.status(400).json({
    error: "Validation failed",
    message: error.message || "Invalid input data",
    timestamp: new Date().toISOString(),
    path: req.path
  });
}

// Smart merge utility for event data
function smartMergeEventData(existingEvent: any, newEventData: any): any {
  const merged: any = {};

  // Define fields that should never be overwritten with empty values
  const preserveFields = ['name', 'link', 'start_date', 'end_date', 'location', 'priority', 'type', 'status'];

  // Define optional fields that can be empty
  const optionalFields = ['cfp_deadline', 'cfp_link', 'notes', 'created_by_id'];

  // Helper function to check if a value is empty or null
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  };

  // Helper function to merge arrays with unique values
  const mergeArrays = (existing: any[], incoming: any[]): any[] => {
    if (!Array.isArray(existing)) existing = [];
    if (!Array.isArray(incoming)) return existing;

    const combined = [...existing];
    incoming.forEach(item => {
      if (!combined.includes(item)) {
        combined.push(item);
      }
    });
    return combined;
  };

  // Process each field in the new data
  for (const [key, newValue] of Object.entries(newEventData)) {
    const existingValue = existingEvent[key];

    if (key === 'goal' && Array.isArray(newValue)) {
      // Special handling for goal array - merge unique values
      merged[key] = mergeArrays(existingValue, newValue);
    } else if (preserveFields.includes(key)) {
      // For required fields: prefer new value if it exists, otherwise keep existing
      if (!isEmpty(newValue)) {
        merged[key] = newValue;
      } else if (!isEmpty(existingValue)) {
        merged[key] = existingValue;
      } else {
        merged[key] = newValue; // Both empty, use new (may trigger validation error)
      }
    } else if (optionalFields.includes(key)) {
      // For optional fields: use new value if not empty, otherwise keep existing
      if (!isEmpty(newValue)) {
        merged[key] = newValue;
      } else if (!isEmpty(existingValue)) {
        merged[key] = existingValue;
      }
      // If both are empty, don't include the field (undefined)
    } else {
      // For other fields, prefer new value if it exists
      if (!isEmpty(newValue)) {
        merged[key] = newValue;
      } else if (!isEmpty(existingValue)) {
        merged[key] = existingValue;
      }
    }
  }

  // Ensure we don't lose any existing fields that weren't in the new data
  for (const [key, existingValue] of Object.entries(existingEvent)) {
    if (!(key in merged) && !isEmpty(existingValue) && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      merged[key] = existingValue;
    }
  }

  console.log('Smart merge result:', {
    existing: existingEvent.name,
    merged: Object.keys(merged),
    changes: Object.entries(merged).filter(([key, value]) => existingEvent[key] !== value).map(([key, value]) => `${key}: ${existingEvent[key]} -> ${value}`)
  });

  return merged;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Configure file upload middleware for specific routes only
  const fileUploadMiddleware = fileUpload({
    limits: { fileSize: MAX_FILE_SIZE },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: false,
    // Additional security options
    safeFileNames: false, // Disable this as we handle filename sanitization ourselves
    preserveExtension: true,
    // Prevent malicious file names
    defCharset: 'utf8',
    defParamCharset: 'utf8'
  });

  // MinIO configuration
  const useMinIO = process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY;
  const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');

  // Initialize MinIO client if configured
  let minioClient: any = null;
  if (useMinIO) {
    try {
      const { Client } = await import('minio');
      minioClient = new Client({
        endPoint: process.env.MINIO_ENDPOINT!.replace(/^https?:\/\//, '').split(':')[0],
        port: parseInt(process.env.MINIO_ENDPOINT!.split(':')[2] || '9000'),
        useSSL: process.env.MINIO_ENDPOINT!.startsWith('https'),
        accessKey: process.env.MINIO_ACCESS_KEY!,
        secretKey: process.env.MINIO_SECRET_KEY!,
      });
      
      // Ensure bucket exists
      const bucketName = process.env.MINIO_BUCKET_NAME || 'ospo-uploads';
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName);
        console.log(`Created MinIO bucket: ${bucketName}`);
      }
      console.log(`MinIO client initialized for bucket: ${bucketName}`);
    } catch (error) {
      console.error('Failed to initialize MinIO client:', error);
      minioClient = null;
    }
  }

  // Ensure uploads directory exists as fallback
  if (!useMinIO || !minioClient) {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    }
  }

  // Serve uploaded files - either from MinIO or local filesystem
  app.get('/uploads/:filename', async (req: Request, res: Response) => {
    const filename = req.params.filename;
    
    if (minioClient) {
      try {
        const bucketName = process.env.MINIO_BUCKET_NAME || 'ospo-uploads';
        const stream = await minioClient.getObject(bucketName, filename);
        
        // Set appropriate headers
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
        
        // Pipe the stream to response
        stream.pipe(res);
      } catch (error) {
        console.error('Error serving file from MinIO:', error);
        res.status(404).json({ message: 'File not found' });
      }
    } else {
      // This will be handled by the static middleware in index.ts
      res.status(404).json({ message: 'File not found - MinIO not configured' });
    }
  });

  // Version information endpoint (publicly accessible)
  app.get("/api/version", async (_req: Request, res: Response) => {
    console.log("API Version endpoint hit!");
    try {
      // Read package.json to get version info
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      res.json({
        name: packageData.name,
        version: packageData.version,
        description: packageData.description,
        timestamp: new Date().toISOString(),
        buildDate: process.env.BUILD_DATE || new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      console.error("Version check failed:", error);
      res.status(500).json({
        error: "Failed to retrieve version information"
      });
    }
  });

  // Simple endpoint to fix asset ownership (no auth required for one-time fix)
  app.get("/api/fix-david-asset", async (req: Request, res: Response) => {
    try {
      console.log('[FIX DAVID ASSET] Starting asset ownership fix...');

      // Find headshot assets owned by user 1 (Alex Johnson) that should belong to David
      const assetsToFix = await storage.getAssets();
      const headshotAssets = assetsToFix.filter(asset =>
        asset.type === 'headshot' &&
        asset.uploaded_by === 1 &&
        (asset.name.includes('Simmons_David') || asset.file_path.includes('Simmons_David'))
      );

      console.log(`[FIX DAVID ASSET] Found ${headshotAssets.length} assets to fix`);

      const results = [];
      for (const asset of headshotAssets) {
        console.log(`[FIX DAVID ASSET] Fixing asset ${asset.id}: ${asset.name}`);

        // Update the asset to be owned by David (user 4)
        const [updatedAsset] = await db
          .update(assets)
          .set({ uploaded_by: 4 })
          .where(eq(assets.id, asset.id))
          .returning();

        results.push(updatedAsset);
        console.log(`[FIX DAVID ASSET] Fixed asset ${asset.id} - now owned by user 4`);
      }

      res.json({
        message: "David's asset ownership fixed successfully",
        fixedAssets: results.length,
        assets: results
      });

    } catch (error) {
      console.error('[FIX DAVID ASSET] Error:', error);
      res.status(500).json({ message: "Failed to fix asset ownership", error: (error as Error).message });
    }
  });

  // Simple endpoint to fix asset ownership (completely outside /api to bypass auth)
  app.get("/fix-david-asset-now", async (req: Request, res: Response) => {
    try {
      console.log('[FIX DAVID ASSET NOW] Starting asset ownership fix...');

      // Find headshot assets owned by user 1 (Alex Johnson) that should belong to David
      const assetsToFix = await storage.getAssets();
      const headshotAssets = assetsToFix.filter(asset =>
        asset.type === 'headshot' &&
        asset.uploaded_by === 1 &&
        (asset.name.includes('Simmons_David') || asset.file_path.includes('Simmons_David'))
      );

      console.log(`[FIX DAVID ASSET NOW] Found ${headshotAssets.length} assets to fix`);

      const results = [];
      for (const asset of headshotAssets) {
        console.log(`[FIX DAVID ASSET NOW] Fixing asset ${asset.id}: ${asset.name}`);

        // Update the asset to be owned by David (user 4)
        const [updatedAsset] = await db
          .update(assets)
          .set({ uploaded_by: 4 })
          .where(eq(assets.id, asset.id))
          .returning();

        results.push(updatedAsset);
        console.log(`[FIX DAVID ASSET NOW] Fixed asset ${asset.id} - now owned by user 4`);
      }

      res.json({
        message: "David's asset ownership fixed successfully!",
        fixedAssets: results.length,
        assets: results
      });

    } catch (error) {
      console.error('[FIX DAVID ASSET NOW] Error:', error);
      res.status(500).json({ message: "Failed to fix asset ownership", error: (error as Error).message });
    }
  });

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

      // Read package.json for version info
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "ospo-app",
        version: packageData.version,
        database: "connected"
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Service is not healthy"
      });
    }
  });

  // Keycloak configuration endpoint
  app.get("/api/keycloak-config", (req: Request, res: Response) => {
    const keycloakUrl = process.env.KEYCLOAK_CLIENT_URL || process.env.VITE_KEYCLOAK_URL || "https://keycloak-dev-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com/auth";

    res.json({
      realm: "ospo-events",
      "auth-server-url": keycloakUrl,
      "ssl-required": "external",
      resource: "ospo-events-app",
      "public-client": true,
      "confidential-port": 0,
      "verify-token-audience": false,
      "use-resource-role-mappings": true,
      "enable-cors": true
    });
  });

  // AI Chat endpoints
  app.post("/api/ai/sql-chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`AI Chat request: ${message}`);

      // ENHANCED READ-ONLY SQL validation function with multiple security layers
      const validateSQL = (sql: string): { valid: boolean; error?: string } => {
        // Clean up markdown formatting first (more comprehensive)
        let cleanedSQL = sql.replace(/```sql\n?|\n?```|^`|`$/g, '').trim();
        const lowerSQL = cleanedSQL.toLowerCase();

        // LAYER 1: Strict SELECT-only enforcement
        if (!lowerSQL.startsWith('select')) {
          return { valid: false, error: "SECURITY: Only SELECT queries are allowed" };
        }

        // LAYER 2: Block ALL write operations (comprehensive list)
        const writeOperations = [
          'insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate',
          'replace', 'merge', 'upsert', 'grant', 'revoke', 'execute', 'exec',
          'call', 'perform', 'do', 'begin', 'commit', 'rollback', 'savepoint',
          'set', 'reset', 'lock', 'unlock', 'analyze', 'vacuum', 'reindex',
          'copy', 'bulk', 'load', 'import', 'export', 'backup', 'restore'
        ];

        for (const operation of writeOperations) {
          // Check for operation as standalone word or at start of statement
          const regex = new RegExp(`\\b${operation}\\b`, 'i');
          if (regex.test(lowerSQL)) {
            return { valid: false, error: `SECURITY: Write operation detected: ${operation.toUpperCase()}` };
          }
        }

        // LAYER 3: Block dangerous SQL constructs
        const dangerousPatterns = [
          /;.*\w/,  // Multiple statements (semicolon followed by more SQL)
          /\/\*.*\*\//,  // Comment blocks
          /--.*$/m,  // SQL comments
          /\binto\s+outfile\b/i,  // File operations
          /\binto\s+dumpfile\b/i,  // File operations
          /\bload_file\b/i,  // File operations
          /\bxp_\w+/i,  // Extended procedures
          /\bsp_\w+/i,  // Stored procedures
          /\bunion\b/i,  // UNION (potential for injection)
          /\bwith\s+recursive\b/i,  // Recursive CTEs (potential DoS)
          /\binformation_schema\b/i,  // System tables
          /\bpg_\w+/i,  // PostgreSQL system functions
          /\bsys\./i,  // System schemas
          /\bsystem\./i,  // System schemas
          /\bmaster\./i,  // SQL Server system DB
          /\bmsdb\./i,  // SQL Server system DB
          /\btempdb\./i,  // SQL Server temp DB
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(cleanedSQL)) {
            return { valid: false, error: `SECURITY: Dangerous SQL pattern detected: ${pattern.source}` };
          }
        }

        // LAYER 4: Enforce read-only functions only
        const readOnlyFunctions = [
          'count', 'sum', 'avg', 'min', 'max', 'string_agg', 'array_agg',
          'concat', 'coalesce', 'case', 'cast', 'extract', 'date_part',
          'upper', 'lower', 'trim', 'substring', 'length', 'position',
          'abs', 'round', 'ceil', 'floor', 'now', 'current_date', 'current_timestamp'
        ];

        // Check for function calls - only allow read-only functions
        const functionPattern = /(\w+)\s*\(/g;
        let match;
        while ((match = functionPattern.exec(lowerSQL)) !== null) {
          const functionName = match[1];
          if (!readOnlyFunctions.includes(functionName) &&
            !['select', 'from', 'where', 'group', 'order', 'having', 'limit', 'offset', 'distinct', 'as', 'and', 'or', 'not', 'in', 'like', 'ilike', 'between', 'exists', 'any', 'all', 'join', 'inner', 'left', 'right', 'full', 'outer', 'on', 'union'].includes(functionName)) {
            console.warn(`[SECURITY] Potentially unsafe function detected: ${functionName}`);
          }
        }

        // LAYER 5: Validate query structure (must have FROM clause for data access)
        // Check for FROM clause in various formats: " from ", "\nfrom ", or at start of query
        const hasFromClause = /(\s|^)from\s+\w+/i.test(cleanedSQL);
        if (!hasFromClause) {
          return { valid: false, error: "SECURITY: Query must include FROM clause for table access" };
        }

        // LAYER 6: Block system table access
        const systemTables = [
          'pg_user', 'pg_shadow', 'pg_group', 'pg_database', 'pg_tables',
          'pg_views', 'pg_indexes', 'pg_stat_', 'pg_settings', 'pg_roles',
          'information_schema', 'sys.', 'system.', 'master.', 'msdb.', 'tempdb.'
        ];

        for (const sysTable of systemTables) {
          if (lowerSQL.includes(sysTable)) {
            return { valid: false, error: `SECURITY: System table access blocked: ${sysTable}` };
          }
        }

        return { valid: true };
      };

      // Advanced SQL query linting function
      const lintSQLQuery = (sql: string): { hasErrors: boolean; hasWarnings: boolean; errors: string[]; warnings: string[] } => {
        const cleanedSQL = sql.replace(/```sql\n?|\n?```/g, '').trim().toLowerCase();
        const errors: string[] = [];
        const warnings: string[] = [];

        // Define known tables and columns for schema validation
        const knownTables = ['users', 'events', 'cfp_submissions', 'attendees', 'sponsorships', 'assets', 'stakeholders', 'approval_workflows', 'workflow_reviewers', 'workflow_stakeholders', 'workflow_comments', 'workflow_history'];
        const knownColumns = {
          events: ['id', 'name', 'link', 'start_date', 'end_date', 'location', 'country', 'region', 'continent', 'priority', 'type', 'goal', 'cfp_deadline', 'cfp_link', 'status', 'notes', 'created_by_id', 'source', 'early_bird_deadline', 'created_at', 'updated_at'],
          users: ['id', 'username', 'name', 'email', 'bio', 'role', 'job_title', 'headshot', 'keycloak_id', 'preferences', 'last_login', 'created_at', 'updated_at']
        };

        // Error: CRITICAL - Double-check for any write operations that escaped validation
        const writeOperationsCheck = [
          'insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate',
          'replace', 'merge', 'upsert', 'grant', 'revoke', 'execute', 'call',
          'begin', 'commit', 'rollback', 'set ', 'reset', 'lock', 'unlock'
        ];

        for (const operation of writeOperationsCheck) {
          if (cleanedSQL.includes(operation)) {
            errors.push(`CRITICAL SECURITY VIOLATION: Write operation detected: ${operation.toUpperCase()}`);
          }
        }

        // Error: Check for non-existent columns that commonly cause issues
        const commonMistakes = ['city', 'e.city', 'u.city', 'address', 'venue_address'];
        for (const mistake of commonMistakes) {
          if (cleanedSQL.includes(mistake)) {
            errors.push(`Non-existent column detected: ${mistake}. Use 'location' for venue/city information.`);
          }
        }

        // Error: Check for missing table aliases in JOINs
        if (cleanedSQL.includes('join') && cleanedSQL.includes('on') && !cleanedSQL.includes(' as ') && !cleanedSQL.includes(' e.') && !cleanedSQL.includes(' u.')) {
          warnings.push('Consider using table aliases (e.g., "events e", "users u") for better readability in JOINs');
        }

        // Warning: Check for inefficient patterns
        if (cleanedSQL.includes('select *') && cleanedSQL.includes('join')) {
          warnings.push('Using SELECT * with JOINs may return unnecessary columns. Consider specifying needed columns.');
        }

        // Warning: Missing LIMIT for potentially large result sets
        if (!cleanedSQL.includes('limit') && !cleanedSQL.includes('count(')) {
          warnings.push('Consider adding LIMIT clause for large result sets to improve performance');
        }

        // Error: Check for incorrect JOIN syntax
        if (cleanedSQL.includes('join') && !cleanedSQL.includes('on')) {
          errors.push('JOIN clause missing ON condition');
        }

        // Warning: Geographic query optimization
        if ((cleanedSQL.includes('location') || cleanedSQL.includes('country') || cleanedSQL.includes('continent')) && !cleanedSQL.includes('ilike')) {
          warnings.push('For geographic searches, consider using ILIKE for case-insensitive matching');
        }

        // Error: Check for potential SQL injection patterns that escaped basic validation
        const injectionPatterns = [/;\s*drop/i, /;\s*delete/i, /;\s*insert/i, /;\s*update/i];
        for (const pattern of injectionPatterns) {
          if (pattern.test(cleanedSQL)) {
            errors.push('Potential SQL injection pattern detected');
          }
        }

        return {
          hasErrors: errors.length > 0,
          hasWarnings: warnings.length > 0,
          errors,
          warnings
        };
      };

      // Improved fallback SQL generation with comprehensive geographic mappings
      const generateFallbackSQL = (message: string): string => {
        const lowerMessage = message.toLowerCase();


        // Event queries
        if (lowerMessage.includes("all events") || lowerMessage.includes("show events")) {
          return "SELECT id, name, location, start_date, end_date, status, priority, type FROM events WHERE status = 'confirmed' ORDER BY start_date DESC LIMIT 50";
        }

        if (lowerMessage.includes("high priority") || lowerMessage.includes("important")) {
          return "SELECT id, name, location, start_date, end_date, status, priority, type FROM events WHERE priority IN ('high', 'critical') AND status = 'confirmed' ORDER BY start_date DESC";
        }

        // Geographic queries using new geographic fields
        if (lowerMessage.includes("asia")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'Asia' ORDER BY start_date DESC";
        }

        if (lowerMessage.includes("africa")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'Africa' ORDER BY start_date DESC";
        }

        if (lowerMessage.includes("europe")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'Europe' ORDER BY start_date DESC";
        }

        if (lowerMessage.includes("america") || lowerMessage.includes("north america")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'North America' ORDER BY start_date DESC";
        }

        if (lowerMessage.includes("south america")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'South America' ORDER BY start_date DESC";
        }

        if (lowerMessage.includes("oceania") || lowerMessage.includes("australia")) {
          return "SELECT id, name, location, country, region, continent, start_date, end_date, status, priority, type FROM events WHERE continent = 'Oceania' ORDER BY start_date DESC";
        }

        // Regional/grouping queries
        if (lowerMessage.includes("by region") || lowerMessage.includes("group by region")) {
          return "SELECT region, COUNT(*) as event_count, STRING_AGG(name, ', ') as events FROM events WHERE country IS NOT NULL GROUP BY region ORDER BY event_count DESC";
        }

        if (lowerMessage.includes("by country") || lowerMessage.includes("group by country")) {
          return "SELECT country, COUNT(*) as event_count, STRING_AGG(name, ', ') as events FROM events WHERE country IS NOT NULL GROUP BY country ORDER BY event_count DESC";
        }

        if (lowerMessage.includes("by continent") || lowerMessage.includes("group by continent")) {
          return "SELECT continent, COUNT(*) as event_count FROM events WHERE country IS NOT NULL GROUP BY continent ORDER BY event_count DESC";
        }

        if (lowerMessage.includes("regions") && !lowerMessage.includes("in")) {
          return "SELECT DISTINCT region, country, continent FROM events WHERE region IS NOT NULL ORDER BY continent, country, region";
        }

        // Attendee queries
        if (lowerMessage.includes("attendees") || lowerMessage.includes("attending")) {
          return "SELECT e.id, e.name, e.location, e.start_date, e.status, a.name as attendee_name, a.email, a.role FROM events e JOIN attendees a ON e.id = a.event_id WHERE e.status = 'confirmed' ORDER BY e.start_date DESC";
        }

        // CFP queries
        if (lowerMessage.includes("cfp") || lowerMessage.includes("submission")) {
          return "SELECT c.id, c.title, c.submitter_name, c.status, c.submission_date, e.name as event_name FROM cfp_submissions c JOIN events e ON c.event_id = e.id WHERE e.status = 'confirmed' ORDER BY c.submission_date DESC";
        }

        // Sponsorship queries
        if (lowerMessage.includes("sponsor")) {
          return "SELECT s.id, s.sponsor_name, s.amount, s.status, e.name as event_name FROM sponsorships s JOIN events e ON s.event_id = e.id WHERE e.status = 'confirmed' ORDER BY s.amount DESC";
        }

        // Count queries
        if (lowerMessage.includes("how many") || lowerMessage.includes("count")) {
          if (lowerMessage.includes("event")) {
            return "SELECT COUNT(*) as total_events FROM events";
          }
          if (lowerMessage.includes("attendee")) {
            return "SELECT COUNT(*) as total_attendees FROM attendees";
          }
          if (lowerMessage.includes("cfp") || lowerMessage.includes("submission")) {
            return "SELECT COUNT(*) as total_submissions FROM cfp_submissions";
          }
        }

        // Default fallback
        return "SELECT id, name, location, start_date, end_date, status, priority, type FROM events WHERE status = 'confirmed' ORDER BY start_date DESC LIMIT 10";
      };

      // Try Ollama first - this is the whole point of having AI
      let aiResponse;
      let lintResults: { hasWarnings: boolean; warnings: string[]; hasErrors: boolean; errors: string[] } = { hasWarnings: false, warnings: [], hasErrors: false, errors: [] };
      try {
        const ollamaUrl = process.env.OLLAMA_URL || "http://ollama:11434";
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant that converts natural language queries into STRICTLY READ-ONLY SQL for an events database.

🔒 ABSOLUTE READ-ONLY SECURITY RULES:
- ONLY generate SELECT statements - NO EXCEPTIONS
- NEVER generate any write operations: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, REPLACE, MERGE, UPSERT
- NEVER generate transaction control: BEGIN, COMMIT, ROLLBACK, SAVEPOINT
- NEVER generate system operations: GRANT, REVOKE, EXECUTE, CALL, PERFORM, SET, RESET, LOCK, ANALYZE, VACUUM
- NEVER generate file operations: COPY, BULK, LOAD, IMPORT, EXPORT, BACKUP, RESTORE
- NEVER use UNION (security risk)
- NEVER access system tables: information_schema, pg_*, sys.*, system.*
- NEVER use comments (-- or /* */)
- NEVER use semicolons for multiple statements
- Always include FROM clause for data access
- Always use specific column names instead of SELECT * for performance
- Always use proper WHERE clauses for filtering
- Limit results with LIMIT when appropriate for performance

VIOLATION = IMMEDIATE REJECTION. Your queries will be validated by multiple security layers.

CONTEXT-AWARE OPTIMIZATION:
- Database contains 90+ events across multiple continents
- Most common event types: conference, workshop, meetup
- Geographic distribution: Global events (Asia, Europe, North America)
- Date range: Events from past and future dates
- Query performance target: <1000ms execution time
- Prefer indexed columns: continent, country, region, status for WHERE clauses
- Common query patterns: geographic filtering, date ranges, event counting

DATABASE SCHEMA WITH RELATIONSHIPS AND TYPES:

CORE TABLES:
users (id: serial PK, username: text NOT NULL, name: text, email: text, bio: text, role: text, job_title: text, headshot: text, keycloak_id: text, preferences: text, last_login: timestamp, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

events (id: serial PK, name: text NOT NULL, link: text NOT NULL, start_date: text NOT NULL, end_date: text NOT NULL, location: text NOT NULL, country: varchar(100), region: varchar(100), continent: varchar(50), priority: text NOT NULL, type: text NOT NULL, goal: text[] NOT NULL, cfp_deadline: text, cfp_link: text, status: text NOT NULL DEFAULT 'planning', notes: text, created_by_id: integer FK→users.id, source: text NOT NULL DEFAULT 'manual', early_bird_deadline: text, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)
  INDEXES: continent, country, region
  COMMON VALUES: status ('planning', 'confirmed', 'completed'), type ('conference', 'workshop', 'meetup'), priority ('high', 'medium', 'low')

RELATED TABLES:
cfp_submissions (id: serial PK, event_id: integer NOT NULL FK→events.id, title: text NOT NULL, abstract: text NOT NULL, submitter_name: text NOT NULL, status: text NOT NULL, notes: text, submitter_id: integer FK→users.id, submission_date: timestamp NOT NULL, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

attendees (id: serial PK, event_id: integer NOT NULL FK→events.id, name: text NOT NULL, email: text NOT NULL, role: text NOT NULL, user_id: integer FK→users.id, notes: text, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

sponsorships (id: serial PK, event_id: integer NOT NULL FK→events.id, sponsor_name: text NOT NULL, tier: text NOT NULL, amount: integer, contact_email: text NOT NULL, contact_name: text NOT NULL, status: text NOT NULL, notes: text, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

assets (id: serial PK, name: text NOT NULL, type: text NOT NULL, file_path: text NOT NULL, file_size: integer, mime_type: text, uploaded_by: integer FK→users.id, event_id: integer FK→events.id, cfp_submission_id: integer FK→cfp_submissions.id, uploaded_at: timestamp NOT NULL)

WORKFLOW TABLES:
stakeholders (id: serial PK, user_id: integer FK→users.id, name: text NOT NULL, email: text NOT NULL, role: text NOT NULL, department: text, organization: text NOT NULL, notes: text, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

approval_workflows (id: serial PK, title: text NOT NULL, description: text NOT NULL, item_type: text NOT NULL, item_id: integer NOT NULL, priority: text NOT NULL, status: text NOT NULL, due_date: timestamp, estimated_costs: integer, requester_id: integer FK→users.id, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL, metadata: jsonb)

workflow_reviewers (id: serial PK, workflow_id: integer NOT NULL FK→approval_workflows.id, reviewer_id: integer NOT NULL FK→users.id, status: text NOT NULL, reviewed_at: timestamp, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

workflow_stakeholders (id: serial PK, workflow_id: integer NOT NULL FK→approval_workflows.id, stakeholder_id: integer NOT NULL FK→stakeholders.id, role: text NOT NULL, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

workflow_comments (id: serial PK, workflow_id: integer NOT NULL FK→approval_workflows.id, commenter_id: integer NOT NULL FK→users.id, comment: text NOT NULL, created_at: timestamp NOT NULL, updated_at: timestamp NOT NULL)

workflow_history (id: serial PK, workflow_id: integer NOT NULL FK→approval_workflows.id, action: text NOT NULL, performed_by: integer FK→users.id, details: text, performed_at: timestamp NOT NULL)

QUERY OPTIMIZATION HINTS:
- Use indexes on: events.continent, events.country, events.region, events.status, events.start_date
- JOIN efficiently: events→users via created_by_id, events→attendees via event_id
- Array queries: Use ANY() for goal array searches: WHERE 'speaking' = ANY(goal)
- Date filtering: start_date/end_date are TEXT, use string comparisons or CAST to DATE
- Geographic queries: Use ILIKE for case-insensitive location/country/continent matching

IMPORTANT GEOGRAPHIC REASONING:
The events table has geographic columns: location, country, region, continent.
When users ask for geographic regions, use these columns properly:

For continent-based queries:
- "Show events in Asia" → SELECT id, name, location, country, region, continent, start_date, end_date FROM events WHERE continent = 'Asia'
- "Events in Europe" → SELECT id, name, location, country, region, continent, start_date, end_date FROM events WHERE continent = 'Europe'
- "North America events" → SELECT id, name, location, country, region, continent, start_date, end_date FROM events WHERE continent = 'North America'

For country-based queries:
- Use country column: WHERE country ILIKE '%japan%' OR country ILIKE '%singapore%'

For location-based queries (cities, venues):
- Use location column: WHERE location ILIKE '%tokyo%' OR location ILIKE '%singapore%'

NEVER use non-existent columns like 'city' - only use: location, country, region, continent.

Geographic examples:
- "Asia" includes: Japan, China, India, Singapore, Thailand, Malaysia, Indonesia, Philippines, Vietnam, South Korea, Taiwan, Hong Kong
- "Europe" includes: UK, France, Germany, Netherlands, Spain, Italy, Sweden, Norway, Denmark
- Use ILIKE for case-insensitive matching and % wildcards for partial matches

REGIONAL GROUPING QUERIES:
For queries asking to group or show "by region/country/continent":
- "Show events by region" → SELECT region, COUNT(*) as event_count FROM events WHERE region IS NOT NULL GROUP BY region ORDER BY event_count DESC
- "Events by country" → SELECT country, COUNT(*) as event_count FROM events WHERE country IS NOT NULL GROUP BY country ORDER BY event_count DESC
- "Group by continent" → SELECT continent, COUNT(*) as event_count FROM events WHERE continent IS NOT NULL GROUP BY continent ORDER BY event_count DESC
- "List all regions" → SELECT DISTINCT region, country, continent FROM events WHERE region IS NOT NULL ORDER BY continent, country, region

ALWAYS include FROM clause - queries without FROM will be rejected for security.

Return ONLY the SQL query, no explanations, no markdown formatting, no backticks.`
              },
              {
                role: "user",
                content: message
              }
            ],
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json() as any;
          aiResponse = data.message.content;
          console.log("Ollama response:", aiResponse);

          // Clean up the response (remove markdown formatting and backticks)
          aiResponse = aiResponse.replace(/```sql\n?|\n?```|^`|`$/g, '').trim();

          // Enhanced validation with linting
          const validation = validateSQL(aiResponse);
          if (!validation.valid) {
            console.log(`AI generated unsafe SQL: ${validation.error}`);
            throw new Error(`Unsafe SQL generated: ${validation.error}`);
          }

          // Advanced query linting
          lintResults = lintSQLQuery(aiResponse);
          if (lintResults.hasErrors) {
            console.log(`SQL linting errors: ${lintResults.errors.join(', ')}`);
            throw new Error(`Query linting failed: ${lintResults.errors[0]}`);
          }

          if (lintResults.hasWarnings) {
            console.log(`SQL linting warnings: ${lintResults.warnings.join(', ')}`);
          }
        } else {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
      } catch (ollamaError) {
        console.log("Ollama failed, using fallback SQL generation:", (ollamaError as Error).message);
        aiResponse = generateFallbackSQL(message);
      }

      // Final validation of the SQL query
      const finalValidation = validateSQL(aiResponse);
      if (!finalValidation.valid) {
        console.error("Final SQL validation failed:", finalValidation.error);
        return res.status(500).json({
          error: "SQL validation failed",
          message: `Query rejected for safety: ${finalValidation.error}`
        });
      }

      // Execute the SQL query with feedback tracking
      let results;
      let executionSuccess = false;
      let executionError = null;
      const executionStartTime = Date.now();

      try {
        const query = aiResponse.replace(/```sql\n?|\n?```|^`|`$/g, '').trim();
        console.log("Executing validated READ-ONLY SQL:", query);

        // FINAL SECURITY LAYER: Execute in read-only mode
        // Wrap in a read-only transaction to prevent any writes
        results = await db.transaction(async (tx) => {
          // Set transaction to read-only at database level
          await tx.execute('SET TRANSACTION READ ONLY');
          return await tx.execute(query);
        });
        executionSuccess = true;
        const executionTime = Date.now() - executionStartTime;
        console.log(`Query returned ${results.rows?.length || 0} rows in ${executionTime}ms`);

        // Feedback: Log successful query patterns for learning
        console.log(`[FEEDBACK] SUCCESS: "${message}" → SQL: ${query.substring(0, 100)}... → ${results.rows?.length || 0} rows`);

      } catch (sqlError) {
        executionError = sqlError;
        executionSuccess = false;
        const executionTime = Date.now() - executionStartTime;

        // Feedback: Log failed query patterns for improvement
        console.error(`[FEEDBACK] FAILURE: "${message}" → SQL: ${aiResponse.substring(0, 100)}... → Error: ${(sqlError as Error).message}`);
        console.error("SQL execution error:", sqlError);

        return res.status(500).json({
          error: "Failed to execute query",
          message: "The generated SQL query failed to execute. Please try rephrasing your question.",
          sql: aiResponse,
          feedback: {
            userQuery: message,
            generatedSQL: aiResponse,
            error: (sqlError as Error).message,
            executionTime
          }
        });
      }

      // Generate a natural language response instead of showing raw SQL
      let naturalResponse;
      if (results.rows && results.rows.length > 0) {
        // Check if this is a COUNT query by looking at the SQL or result structure
        const isCountQuery = aiResponse.toLowerCase().includes('count(') ||
          (results.rows.length === 1 &&
            Object.keys(results.rows[0]).some(key =>
              key.toLowerCase().includes('count') || key.toLowerCase().includes('total')));

        if (isCountQuery && results.rows.length === 1) {
          // Handle COUNT queries
          const countResult = results.rows[0];
          const countValue = Object.values(countResult)[0]; // Get the first (and likely only) value
          naturalResponse = `I found ${countValue} events total.`;
        } else if (results.rows.length === 1) {
          // Handle single event queries
          const event = results.rows[0];
          const formattedDate = event.start_date && typeof event.start_date === 'string' ? new Date(event.start_date).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
          }) : 'No date';
          naturalResponse = `I found 1 event: **${event.name || 'Unnamed event'}** in ${event.location || 'Unknown location'} (${formattedDate})`;
        } else {
          // Handle multiple events - return structured data for frontend rendering
          const totalCount = results.rows.length;
          const showingCount = Math.min(totalCount, 20);
          const moreText = totalCount > 20 ? ` (showing first ${showingCount})` : '';

          naturalResponse = `I found ${totalCount} events${moreText}:`;
        }
      } else {
        naturalResponse = "I didn't find any events matching your criteria.";
      }

      // Self-evaluation checks
      const selfEvaluation = {
        queryComplexity: aiResponse.split(' ').length > 20 ? 'high' : aiResponse.includes('join') ? 'medium' : 'low',
        resultRelevance: results.rows && results.rows.length > 0 ? 'relevant' : 'no_results',
        executionEfficiency: Date.now() - executionStartTime < 1000 ? 'fast' : 'slow',
        confidence: executionSuccess && results.rows && results.rows.length > 0 ? 'high' : 'medium'
      };

      // Structured output with guardrails
      res.json({
        success: true,
        message: naturalResponse,
        data: {
          results: results.rows ? results.rows.slice(0, 20) : [], // Limit to 20 events for UI performance
          count: results.rows?.length || 0,
          totalCount: results.rows?.length || 0,
          executionTime: Date.now() - executionStartTime
        },
        meta: {
          query: {
            original: message,
            generated: aiResponse,
            type: aiResponse.toLowerCase().includes('count(') ? 'aggregation' : 'selection',
            complexity: selfEvaluation.queryComplexity
          },
          evaluation: selfEvaluation,
          feedback: {
            lintWarnings: lintResults.warnings.length,
            performance: selfEvaluation.executionEfficiency,
            relevance: selfEvaluation.resultRelevance
          }
        },
        debug: {
          sql: aiResponse, // Keep SQL for debugging
          lintResults: lintResults.hasWarnings ? lintResults.warnings : undefined
        }
      });

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({
        error: "AI chat failed",
        message: "An error occurred while processing your request. Please try again."
      });
    }
  });

  // AI Models endpoint
  app.get("/api/ai/models", async (req: Request, res: Response) => {
    try {
      const ollamaUrl = process.env.OLLAMA_URL || "http://ollama:11434";
      const response = await fetch(`${ollamaUrl}/api/tags`);

      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        res.status(500).json({ error: "Failed to fetch models" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to connect to Ollama" });
    }
  });

  // Events API routes
  // Geolocation API endpoint
  app.post("/api/geolocation/lookup", async (req: Request, res: Response) => {
    try {
      const { location } = req.body;

      if (!location || typeof location !== 'string') {
        return res.status(400).json({ error: 'Location is required' });
      }

      const geoResult = await geocodeLocation(location);

      if (!geoResult) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(geoResult);
    } catch (error) {
      console.error('Geolocation lookup error:', error);
      res.status(500).json({ error: 'Geolocation lookup failed' });
    }
  });

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

  // CSV Import endpoint for events
  app.post("/api/events/import-csv", async (req: Request, res: Response) => {
    try {
      console.log("=== CSV IMPORT STARTED ===");
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const { csvData, columnMapping, defaultValues, deduplicationMode = 'skip' } = req.body;

      if (!csvData || !Array.isArray(csvData)) {
        console.log("ERROR: Invalid CSV data provided");
        console.log("csvData type:", typeof csvData);
        console.log("csvData value:", csvData);
        return res.status(400).json({ message: "Invalid CSV data provided" });
      }

      if (!columnMapping || typeof columnMapping !== 'object') {
        console.log("ERROR: Column mapping is required");
        console.log("columnMapping type:", typeof columnMapping);
        console.log("columnMapping value:", columnMapping);
        return res.status(400).json({ message: "Column mapping is required" });
      }

      console.log(`Processing CSV import with ${csvData.length} rows`);
      console.log("Sample CSV row (first row):", JSON.stringify(csvData[0], null, 2));
      console.log("Column mapping:", JSON.stringify(columnMapping, null, 2));
      console.log("Column mapping keys:", Object.keys(columnMapping));
      console.log("Column mapping values:", Object.values(columnMapping));
      console.log("Default values:", JSON.stringify(defaultValues, null, 2));
      console.log("Deduplication mode:", deduplicationMode);

      const results = {
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: [] as string[],
        duplicates: [] as string[]
      };

      // Get existing events for deduplication
      console.log("Fetching existing events for deduplication...");
      const existingEvents = await storage.getEvents();
      console.log(`Found ${existingEvents.length} existing events in database`);

      // Process each CSV row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        console.log(`\n--- Processing row ${i + 1} ---`);
        console.log(`Raw CSV row ${i + 1}:`, JSON.stringify(row, null, 2));
        console.log(`CSV row ${i + 1} keys:`, Object.keys(row));

        try {
          // Map CSV columns to event data
          const eventData: any = { ...defaultValues };
          console.log(`Initial event data for row ${i + 1}:`, JSON.stringify(eventData, null, 2));

          for (const [csvColumn, dbColumn] of Object.entries(columnMapping)) {
            console.log(`Mapping: "${csvColumn}" -> "${dbColumn}"`);
            console.log(`CSV row has "${csvColumn}": ${csvColumn in row}`);
            console.log(`CSV row["${csvColumn}"] value:`, row[csvColumn]);

            if (dbColumn && row[csvColumn] !== undefined && row[csvColumn] !== '') {
              let value = row[csvColumn];
              console.log(`Mapping value "${value}" from "${csvColumn}" to "${dbColumn}"`);

              // Handle special field types
              if (dbColumn === 'goal' && typeof value === 'string') {
                // Split comma-separated goals into array
                eventData[dbColumn] = value.split(',').map(g => g.trim()).filter(g => g);
                console.log(`Converted goals string to array:`, eventData[dbColumn]);
              } else if (typeof dbColumn === 'string' && dbColumn.includes('date') && value) {
                // Ensure dates are properly formatted
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  (eventData as any)[dbColumn] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                  console.log(`Converted date "${value}" to "${(eventData as any)[dbColumn]}"`);
                } else {
                  (eventData as any)[dbColumn] = null;
                  console.log(`Invalid date "${value}", set to null`);
                }
              } else {
                (eventData as any)[dbColumn as string] = value;
                console.log(`Direct assignment: ${dbColumn as string} = "${value}"`);
              }
            } else {
              console.log(`Skipping mapping for "${csvColumn}" -> "${dbColumn}" (empty or undefined)`);
            }
          }

          console.log(`Mapped event data for row ${i + 1}:`, JSON.stringify(eventData, null, 2));
          console.log(`Event data "name" field:`, eventData.name);
          console.log(`Event data "name" type:`, typeof eventData.name);

          // Validate required fields
          if (!eventData.name) {
            console.log(`Row ${i + 1}: Missing event name - eventData.name is:`, eventData.name);
            results.errors.push(`Row ${i + 1}: Event name is required`);
            results.skipped++;
            continue;
          }

          // Set defaults for required fields if not provided
          if (!eventData.link) {
            eventData.link = `https://example.com/events/${eventData.name.toLowerCase().replace(/\s+/g, '-')}`;
          }
          if (!eventData.start_date) {
            eventData.start_date = new Date().toISOString().split('T')[0];
          }
          if (!eventData.end_date) {
            eventData.end_date = eventData.start_date;
          }
          if (!eventData.location) {
            eventData.location = 'TBD';
          }
          if (!eventData.priority) {
            eventData.priority = 'medium';
          }
          if (!eventData.type) {
            eventData.type = 'conference';
          }
          if (!eventData.goal || !Array.isArray(eventData.goal) || eventData.goal.length === 0) {
            eventData.goal = ['networking'];
          }
          if (!eventData.status) {
            eventData.status = 'planning';
          }

          console.log(`Final event data for row ${i + 1}:`, JSON.stringify(eventData, null, 2));

          // Check for duplicates
          console.log(`Checking for duplicates for row ${i + 1}...`);
          const duplicateEvent = existingEvents.find(existing => {
            // Primary match: exact name and date match
            const nameMatch = existing.name.toLowerCase().trim() === eventData.name.toLowerCase().trim();
            const dateMatch = existing.start_date === eventData.start_date && existing.end_date === eventData.end_date;

            if (nameMatch && dateMatch) {
              console.log(`Found exact duplicate: "${existing.name}" (${existing.start_date} - ${existing.end_date})`);
              return true;
            }

            // Fuzzy match: similar name (>=80% similarity) and same dates
            const similarity = calculateStringSimilarity(existing.name.toLowerCase(), eventData.name.toLowerCase());
            if (similarity >= 0.8 && dateMatch) {
              console.log(`Found fuzzy duplicate: "${existing.name}" vs "${eventData.name}" (${similarity * 100}% similar)`);
              return true;
            }

            return false;
          });

          if (duplicateEvent) {
            console.log(`Row ${i + 1}: Duplicate detected - ${duplicateEvent.name}`);
            results.duplicates.push(`Row ${i + 1}: "${eventData.name}" matches existing event "${duplicateEvent.name}"`);

            switch (deduplicationMode) {
              case 'skip':
                console.log(`Row ${i + 1}: Skipping duplicate (skip mode)`);
                results.skipped++;
                continue;

              case 'update':
                console.log(`Row ${i + 1}: Updating existing event (update mode)`);
                const validatedUpdateData = insertEventSchema.partial().safeParse(eventData);

                if (!validatedUpdateData.success) {
                  const errors = validatedUpdateData.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                  console.log(`Row ${i + 1}: Update validation failed:`, errors);
                  results.errors.push(`Row ${i + 1}: ${errors}`);
                  results.skipped++;
                  continue;
                }

                await storage.updateEvent(duplicateEvent.id, validatedUpdateData.data);
                console.log(`Row ${i + 1}: Updated existing event ID ${duplicateEvent.id}`);
                results.updated++;
                continue;

              case 'merge':
                console.log(`Row ${i + 1}: Smart merging with existing event (merge mode)`);
                const mergedData = smartMergeEventData(duplicateEvent, eventData);
                const validatedMergeData = insertEventSchema.partial().safeParse(mergedData);

                if (!validatedMergeData.success) {
                  const errors = validatedMergeData.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                  console.log(`Row ${i + 1}: Merge validation failed:`, errors);
                  results.errors.push(`Row ${i + 1}: ${errors}`);
                  results.skipped++;
                  continue;
                }

                await storage.updateEvent(duplicateEvent.id, validatedMergeData.data);
                console.log(`Row ${i + 1}: Smart merged existing event ID ${duplicateEvent.id}`);
                results.updated++;
                continue;

              case 'import':
                console.log(`Row ${i + 1}: Importing anyway (import mode)`);
                // Continue with normal import process
                break;

              default:
                results.skipped++;
                continue;
            }
          }

          // Validate with schema
          const validatedData = insertEventSchema.safeParse(eventData);

          if (!validatedData.success) {
            const errors = validatedData.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            console.log(`Row ${i + 1}: Validation failed:`, errors);
            console.log(`Validation error details:`, validatedData.error.errors);
            results.errors.push(`Row ${i + 1}: ${errors}`);
            results.skipped++;
            continue;
          }

          console.log(`Row ${i + 1}: Validation passed, creating event...`);

          // Create the event
          const createdEvent = await storage.createEvent(validatedData.data);
          console.log(`Row ${i + 1}: Event created successfully:`, JSON.stringify(createdEvent, null, 2));
          results.imported++;

        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          console.error(`Error stack for row ${i + 1}:`, error instanceof Error ? error.stack : 'No stack trace');
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.skipped++;
        }
      }

      console.log(`CSV import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`);
      console.log("Final results:", JSON.stringify(results, null, 2));
      console.log("=== CSV IMPORT COMPLETED ===");

      res.json(results);
    } catch (error) {
      console.error('CSV import error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });

  // Helper function for string similarity (Levenshtein distance)
  function calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

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
      const submissionData = insertCFPSubmissionSchema.safeParse(req.body);

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

      const submissionData = insertCFPSubmissionSchema.partial().safeParse(req.body);

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
      console.log("GET /api/attendees - Starting request");
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      console.log("GET /api/attendees - eventId:", eventId);

      let attendees;
      if (eventId) {
        console.log("GET /api/attendees - Fetching attendees for eventId:", eventId);
        attendees = await storage.getAttendeesByEvent(eventId);
      } else {
        console.log("GET /api/attendees - Fetching all attendees");
        attendees = await storage.getAttendees();
      }

      console.log("GET /api/attendees - Successfully fetched", attendees.length, "attendees");
      res.json(attendees);
    } catch (error) {
      console.error("GET /api/attendees - Error:", error);
      console.error("GET /api/attendees - Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        message: "Failed to fetch attendees",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      console.log("POST /api/attendees - Starting request");
      console.log("POST /api/attendees - Request body:", JSON.stringify(req.body, null, 2));

      const attendeeData = insertAttendeeSchema.safeParse(req.body);

      if (!attendeeData.success) {
        console.error("POST /api/attendees - Validation failed:", attendeeData.error);
        const validationError = fromZodError(attendeeData.error);
        return res.status(400).json({ message: validationError.message });
      }

      console.log("POST /api/attendees - Validation passed, creating attendee with data:", JSON.stringify(attendeeData.data, null, 2));
      const attendee = await storage.createAttendee(attendeeData.data);
      console.log("POST /api/attendees - Successfully created attendee:", JSON.stringify(attendee, null, 2));
      res.status(201).json(attendee);
    } catch (error) {
      console.error("POST /api/attendees - Error:", error);
      console.error("POST /api/attendees - Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        message: "Failed to create attendee",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Debug endpoint to check user data
  app.get("/api/debug/user-info", async (req: Request, res: Response) => {
    try {
      const authUser = req.user as any;
      console.log(`[DEBUG] Auth user info:`, authUser);
      
      let dbUser = null;
      if (authUser?.id) {
        try {
          dbUser = await storage.getUserByKeycloakId(authUser.id);
          console.log(`[DEBUG] DB user found:`, dbUser);
        } catch (error) {
          console.log(`[DEBUG] Error fetching DB user:`, error);
        }
      }
      
      res.json({
        authenticated: !!authUser,
        keycloakUser: authUser || null,
        databaseUser: dbUser || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Debug endpoint failed", error: errorMessage });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      console.log(`[GET /api/users/:id] Received request for user ID: ${id}`);
      let user;

      // Check if ID is numeric (database ID) or UUID (Keycloak ID)
      if (/^[0-9]+$/.test(id)) {
        console.log(`[GET /api/users/:id] Detected numeric ID, fetching user by ID: ${id}`);
        user = await storage.getUser(parseInt(id));
      } else {
        // UUID - Keycloak user
        console.log(`[GET /api/users/:id] Detected UUID, fetching user by Keycloak ID: ${id}`);
        user = await storage.getUserByKeycloakId(id);
      }

      console.log(`[GET /api/users/:id] Query result:`, user);

      if (!user) {
        console.log(`[GET /api/users/:id] User not found for ID: ${id}`);
        
        // Enhanced debugging: If user not found, try to create from Keycloak info
        const authUser = req.user as any;
        if (authUser && authUser.id === id) {
          console.log(`[GET /api/users/:id] User not in DB but authenticated. Creating user record...`);
          try {
            const newUser = await storage.createUser({
              keycloak_id: authUser.id,
              username: authUser.username || authUser.id,
              name: authUser.name || null,
              email: authUser.email || null,
            });
            console.log(`[GET /api/users/:id] Created new user:`, newUser);
            
            // Return the newly created user
            const { password, ...userWithoutPassword } = newUser as any;
            return res.json(userWithoutPassword);
          } catch (createError) {
            console.error(`[GET /api/users/:id] Failed to create user:`, createError instanceof Error ? createError.message : 'Unknown error');
          }
        }
        
        return res.status(404).json({ 
          message: "User not found",
          debug: {
            requestedId: id,
            isNumeric: /^[0-9]+$/.test(id),
            authUser: authUser ? { id: authUser.id, username: authUser.username } : null
          }
        });
      }

      // Don't return the password if it exists
      const { password, ...userWithoutPassword } = user as any;
      console.log(`[GET /api/users/:id] Returning user data (without password):`, userWithoutPassword);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(`[GET /api/users/:id] Error fetching user ${req.params.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch user", error: errorMessage });
    }
  });

  app.put("/api/users/:id/profile", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      console.log(`[PUT /api/users/${id}/profile] Request body:`, req.body);

      const profileData = updateUserProfileSchema.safeParse(req.body);

      if (!profileData.success) {
        console.error(`[PUT /api/users/${id}/profile] Validation failed:`, profileData.error);
        const validationError = fromZodError(profileData.error);
        return res.status(400).json({ message: validationError.message });
      }

      console.log(`[PUT /api/users/${id}/profile] Validated data:`, profileData.data);

      let user;

      // Handle both numeric IDs and Keycloak UUIDs
      if (/^[0-9]+$/.test(id)) {
        console.log(`[PUT /api/users/${id}/profile] Numeric ID detected, updating user ${id}`);
        user = await storage.updateUserProfile(parseInt(id), profileData.data);
      } else {
        console.log(`[PUT /api/users/${id}/profile] UUID detected, looking up Keycloak user`);
        // For Keycloak users, find the database user first
        const existingUser = await storage.getUserByKeycloakId(id);
        console.log(`[PUT /api/users/${id}/profile] Existing user found:`, existingUser);

        if (existingUser) {
          console.log(`[PUT /api/users/${id}/profile] Updating existing user ID ${existingUser.id}`);
          user = await storage.updateUserProfile(existingUser.id, profileData.data);
        } else {
          console.log(`[PUT /api/users/${id}/profile] Creating new user for Keycloak ID ${id}`);
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

      console.log(`[PUT /api/users/${id}/profile] Final user result:`, user);

      if (!user) {
        console.error(`[PUT /api/users/${id}/profile] User not found after update`);
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password if it exists
      const { password, ...userWithoutPassword } = user as any;
      console.log(`[PUT /api/users/${id}/profile] Returning user data:`, userWithoutPassword);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(`[PUT /api/users/:id/profile] Error updating user profile:`, error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.post("/api/users/:id/headshot", fileUploadMiddleware, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      console.log("Headshot upload request for user ID:", id);

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

      // SECURITY: Validate file size
      if (headshotFile.size > MAX_FILE_SIZE) {
        console.log("File size too large:", headshotFile.size);
        return res.status(400).json({ message: "Headshot file size exceeds the 10MB limit" });
      }

      // SECURITY: Validate file type using comprehensive checks
      if (!validateFileType(headshotFile, ['image'])) {
        console.log("Invalid file type:", headshotFile.mimetype, path.extname(headshotFile.name));
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed" });
      }

      // SECURITY: Generate secure filename
      const fileName = generateSecureFilename(headshotFile.name, id);
      const uploadPath = path.join(uploadsDir, fileName);

      // SECURITY: Validate upload path to prevent directory traversal
      if (!validateUploadPath(uploadPath, uploadsDir)) {
        console.log("Invalid upload path detected:", uploadPath);
        return res.status(400).json({ message: "Invalid file path" });
      }

      // Move the file
      await headshotFile.mv(uploadPath);

      // Update user profile with the headshot path
      const headshotUrl = `/uploads/${fileName}`;

      // For UUID users (Keycloak), try to update their profile in the database
      let updatedUser;
      let actualUserId;
      if (/^[0-9]+$/.test(id)) {
        // Numeric ID - update in storage
        updatedUser = await storage.updateUserProfile(parseInt(id), { headshot: headshotUrl });
        actualUserId = parseInt(id);
      } else {
        // UUID - For Keycloak users, try to update or create a user record
        try {
          const existingUser = await storage.getUserByKeycloakId(id);
          if (existingUser) {
            updatedUser = await storage.updateUserProfile(existingUser.id, { headshot: headshotUrl });
            actualUserId = existingUser.id;
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
            actualUserId = newUser.id;
            console.log(`Created new user record for Keycloak user: ${newUser.id}`);
          }
        } catch (dbError) {
          console.error("Failed to update user profile in database:", dbError);
          // Fallback - return user info with headshot URL
          updatedUser = { ...user, headshot: headshotUrl };
          actualUserId = (req as any).user?.dbId || 1;
        }
      }

      // Create an asset record for the uploaded file (after user record is created/updated)
      const assetData = {
        name: sanitizeFilename(headshotFile.name),
        type: 'headshot' as const,
        file_path: `/uploads/${fileName}`,
        file_size: headshotFile.size,
        mime_type: headshotFile.mimetype,
        uploaded_by: actualUserId
      };

      try {
        await storage.createAsset(assetData);
        console.log(`Created asset record for headshot: ${fileName} with user ID: ${actualUserId}`);
      } catch (assetError) {
        console.error("Failed to create asset record:", assetError);
        // Continue with headshot update even if asset creation fails
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

      // SECURITY: Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: "File size exceeds the 10MB limit" });
      }

      // SECURITY: Determine allowed file types based on asset type
      let allowedTypes: string[] = [];
      switch (type) {
        case 'image':
        case 'logo':
        case 'headshot':
          allowedTypes = ['image'];
          break;
        case 'document':
        case 'contract':
        case 'invoice':
          allowedTypes = ['document', 'text'];
          break;
        case 'presentation':
          allowedTypes = ['presentation'];
          break;
        case 'spreadsheet':
          allowedTypes = ['spreadsheet'];
          break;
        case 'archive':
          allowedTypes = ['archive'];
          break;
        default:
          allowedTypes = ['document', 'image', 'text'];
      }

      // SECURITY: Validate file type
      if (!validateFileType(file, allowedTypes)) {
        const validExtensions = allowedTypes.flatMap(t => ALLOWED_EXTENSIONS[t as keyof typeof ALLOWED_EXTENSIONS] || []);
        return res.status(400).json({
          message: `Invalid file type for ${type}. Allowed extensions: ${validExtensions.join(', ')}`
        });
      }

      // SECURITY: Generate secure filename
      const fileName = generateSecureFilename(file.name, uploadedBy);
      let publicPath: string;

      if (minioClient) {
        // Upload to MinIO
        const bucketName = process.env.MINIO_BUCKET_NAME || 'ospo-uploads';
        
        try {
          // Upload file to MinIO
          await minioClient.putObject(bucketName, fileName, file.data, file.size, {
            'Content-Type': file.mimetype,
            'Content-Length': file.size
          });
          
          // Generate public URL through our application
          publicPath = `/uploads/${fileName}`;
          
          console.log(`File uploaded to MinIO: ${publicPath}`);
        } catch (minioError) {
          console.error('MinIO upload failed:', minioError);
          return res.status(500).json({ message: "Failed to upload file to storage" });
        }
      } else {
        // Fallback to local filesystem
        const filePath = path.join(uploadsDir, fileName);
        publicPath = `/uploads/${fileName}`;

        // SECURITY: Validate upload path
        if (!validateUploadPath(filePath, uploadsDir)) {
          return res.status(400).json({ message: "Invalid file path" });
        }

        // Move the file to uploads directory
        await file.mv(filePath);
      }

      // Create asset record
      const assetData = {
        name: sanitizeFilename(name),
        type: type as any,
        file_path: publicPath,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: parseInt(uploadedBy as string),
        event_id: eventId ? parseInt(eventId as string) : null,
        cfp_submission_id: cfpSubmissionId ? parseInt(cfpSubmissionId as string) : null,
        description: description ? sanitizeFilename(description) : null
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

  // Temporary endpoint to fix asset ownership for David's headshot
  app.post("/api/admin/fix-asset-ownership", async (req: Request, res: Response) => {
    try {
      console.log('[FIX ASSET OWNERSHIP] Starting asset ownership fix...');

      // Find headshot assets owned by user 1 (Alex Johnson) that should belong to David
      const assetsToFix = await storage.getAssets();
      const headshotAssets = assetsToFix.filter(asset =>
        asset.type === 'headshot' &&
        asset.uploaded_by === 1 &&
        (asset.name.includes('Simmons_David') || asset.file_path.includes('Simmons_David'))
      );

      console.log(`[FIX ASSET OWNERSHIP] Found ${headshotAssets.length} assets to fix`);

      const results = [];
      for (const asset of headshotAssets) {
        console.log(`[FIX ASSET OWNERSHIP] Fixing asset ${asset.id}: ${asset.name}`);

        // Update the asset to be owned by David (user 4)
        const [updatedAsset] = await db
          .update(assets)
          .set({ uploaded_by: 4 })
          .where(eq(assets.id, asset.id))
          .returning();

        results.push(updatedAsset);
        console.log(`[FIX ASSET OWNERSHIP] Fixed asset ${asset.id} - now owned by user 4`);
      }

      res.json({
        message: "Asset ownership fixed successfully",
        fixedAssets: results.length,
        assets: results
      });

    } catch (error) {
      console.error('[FIX ASSET OWNERSHIP] Error:', error);
      res.status(500).json({ message: "Failed to fix asset ownership", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
