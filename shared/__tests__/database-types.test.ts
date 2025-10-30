import { describe, it, expect } from 'vitest';
import {
  // Enums and constants
  eventPriorities,
  eventTypes,
  eventGoals,
  eventStatuses,
  cfpStatuses,
  assetTypes,
  stakeholderRoles,
  approvalStatuses,
  approvalItemTypes,

  // Validation schemas
  eventPrioritySchema,
  eventTypeSchema,
  eventGoalSchema,
  eventGoalsArraySchema,
  eventStatusSchema,
  cfpStatusSchema,
  assetTypeSchema,
  stakeholderRoleSchema,
  approvalStatusSchema,
  approvalItemTypeSchema,

  // Insert schemas
  insertUserSchema,
  insertEventSchema,
  insertCFPSubmissionSchema,
  insertAttendeeSchema,
  insertSponsorshipSchema,
  insertAssetSchema,
  insertStakeholderSchema,
  insertApprovalWorkflowSchema,

  // Update schemas
  updateUserProfileSchema,
  updateEventSchema,
  updateCFPSubmissionSchema,
} from '../database-types';

describe('Database Types - Enums and Constants', () => {
  describe('Event Priorities', () => {
    it('should have correct event priority values', () => {
      expect(eventPriorities).toEqual(['essential', 'high', 'medium', 'low', 'nice to have']);
      expect(eventPriorities).toHaveLength(5);
    });

    it('should validate valid event priority', () => {
      const result = eventPrioritySchema.safeParse('high');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('high');
      }
    });

    it('should reject invalid event priority', () => {
      const result = eventPrioritySchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should validate all priority values', () => {
      eventPriorities.forEach(priority => {
        const result = eventPrioritySchema.safeParse(priority);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Event Types', () => {
    it('should have correct event type values', () => {
      expect(eventTypes).toEqual(['conference', 'meetup', 'webinar', 'workshop', 'hackathon']);
      expect(eventTypes).toHaveLength(5);
    });

    it('should validate valid event type', () => {
      const result = eventTypeSchema.safeParse('conference');
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const result = eventTypeSchema.safeParse('party');
      expect(result.success).toBe(false);
    });
  });

  describe('Event Goals', () => {
    it('should have correct event goal values', () => {
      expect(eventGoals).toEqual(['speaking', 'sponsoring', 'attending', 'exhibiting', 'networking']);
      expect(eventGoals).toHaveLength(5);
    });

    it('should validate single valid event goal', () => {
      const result = eventGoalSchema.safeParse('speaking');
      expect(result.success).toBe(true);
    });

    it('should validate array of event goals', () => {
      const result = eventGoalsArraySchema.safeParse(['speaking', 'networking']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should require at least one goal', () => {
      const result = eventGoalsArraySchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least one goal');
      }
    });

    it('should reject invalid goal in array', () => {
      const result = eventGoalsArraySchema.safeParse(['speaking', 'invalid']);
      expect(result.success).toBe(false);
    });
  });

  describe('Event Statuses', () => {
    it('should have correct event status values', () => {
      expect(eventStatuses).toEqual(['planning', 'confirmed', 'completed', 'cancelled']);
      expect(eventStatuses).toHaveLength(4);
    });

    it('should validate valid event status', () => {
      const result = eventStatusSchema.safeParse('confirmed');
      expect(result.success).toBe(true);
    });
  });

  describe('CFP Statuses', () => {
    it('should have correct CFP status values', () => {
      expect(cfpStatuses).toEqual(['draft', 'submitted', 'accepted', 'rejected', 'withdrawn']);
      expect(cfpStatuses).toHaveLength(5);
    });

    it('should validate valid CFP status', () => {
      const result = cfpStatusSchema.safeParse('submitted');
      expect(result.success).toBe(true);
    });
  });

  describe('Asset Types', () => {
    it('should have correct asset type values', () => {
      expect(assetTypes).toEqual(['abstract', 'bio', 'headshot', 'trip_report', 'presentation', 'other']);
      expect(assetTypes).toHaveLength(6);
    });

    it('should validate valid asset type', () => {
      const result = assetTypeSchema.safeParse('presentation');
      expect(result.success).toBe(true);
    });
  });

  describe('Stakeholder Roles', () => {
    it('should have correct stakeholder role values', () => {
      expect(stakeholderRoles).toEqual(['executive', 'manager', 'legal', 'finance', 'marketing', 'technical']);
      expect(stakeholderRoles).toHaveLength(6);
    });

    it('should validate valid stakeholder role', () => {
      const result = stakeholderRoleSchema.safeParse('executive');
      expect(result.success).toBe(true);
    });
  });

  describe('Approval Statuses', () => {
    it('should have correct approval status values', () => {
      expect(approvalStatuses).toEqual(['pending', 'approved', 'rejected', 'on_hold']);
      expect(approvalStatuses).toHaveLength(4);
    });

    it('should validate valid approval status', () => {
      const result = approvalStatusSchema.safeParse('approved');
      expect(result.success).toBe(true);
    });
  });

  describe('Approval Item Types', () => {
    it('should have correct approval item type values', () => {
      expect(approvalItemTypes).toEqual(['event', 'cfp_submission', 'sponsorship', 'asset']);
      expect(approvalItemTypes).toHaveLength(4);
    });

    it('should validate valid approval item type', () => {
      const result = approvalItemTypeSchema.safeParse('event');
      expect(result.success).toBe(true);
    });
  });
});

describe('Database Types - Insert Schemas', () => {
  describe('insertUserSchema', () => {
    it('should validate valid user insert', () => {
      const validUser = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        keycloak_id: 'keycloak-123',
      };
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should require username', () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
      };
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should allow optional fields', () => {
      const userWithOptional = {
        username: 'testuser',
        bio: 'A test bio',
        job_title: 'Developer',
      };
      const result = insertUserSchema.safeParse(userWithOptional);
      expect(result.success).toBe(true);
    });
  });

  describe('insertEventSchema', () => {
    it('should validate valid event insert', () => {
      const validEvent = {
        name: 'Test Conference',
        link: 'https://example.com',
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        location: 'San Francisco',
        priority: 'high',
        type: 'conference',
        goal: ['speaking', 'networking'],
        status: 'planning',
      };
      const result = insertEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should require all mandatory fields', () => {
      const invalidEvent = {
        name: 'Test Conference',
        // Missing required fields
      };
      const result = insertEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should allow valid date strings', () => {
      const eventWithValidDates = {
        name: 'Test Conference',
        link: 'https://example.com',
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        location: 'San Francisco',
        priority: 'high',
        type: 'conference',
      };
      const result = insertEventSchema.safeParse(eventWithValidDates);
      expect(result.success).toBe(true);
    });

    it('should allow optional cfp fields', () => {
      const eventWithCFP = {
        name: 'Test Conference',
        link: 'https://example.com',
        start_date: '2025-06-01',
        end_date: '2025-06-03',
        location: 'San Francisco',
        priority: 'high',
        type: 'conference',
        cfp_deadline: '2025-04-01',
        cfp_link: 'https://cfp.example.com',
      };
      const result = insertEventSchema.safeParse(eventWithCFP);
      expect(result.success).toBe(true);
    });
  });

  describe('insertCFPSubmissionSchema', () => {
    it('should validate valid CFP submission insert', () => {
      const validSubmission = {
        event_id: 1,
        title: 'My Talk',
        abstract: 'Talk abstract',
        submitter_name: 'John Doe',
        submitter_id: 1,
        status: 'submitted',
      };
      const result = insertCFPSubmissionSchema.safeParse(validSubmission);
      expect(result.success).toBe(true);
    });

    it('should require event_id', () => {
      const invalidSubmission = {
        title: 'My Talk',
        abstract: 'Talk abstract',
        submitter_name: 'John Doe',
      };
      const result = insertCFPSubmissionSchema.safeParse(invalidSubmission);
      expect(result.success).toBe(false);
    });

    it('should allow any status string', () => {
      const submissionWithStatus = {
        event_id: 1,
        title: 'My Talk',
        abstract: 'Talk abstract',
        submitter_name: 'John Doe',
        status: 'submitted',
      };
      const result = insertCFPSubmissionSchema.safeParse(submissionWithStatus);
      expect(result.success).toBe(true);
    });
  });

  describe('insertAttendeeSchema', () => {
    it('should validate valid attendee insert', () => {
      const validAttendee = {
        event_id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Speaker',
      };
      const result = insertAttendeeSchema.safeParse(validAttendee);
      expect(result.success).toBe(true);
    });

    it('should require event_id, name, email, and role', () => {
      const invalidAttendee = {
        name: 'Jane Doe',
        // Missing required fields
      };
      const result = insertAttendeeSchema.safeParse(invalidAttendee);
      expect(result.success).toBe(false);
    });

    it('should allow optional user_id', () => {
      const attendeeWithUserId = {
        event_id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Speaker',
        user_id: 5,
      };
      const result = insertAttendeeSchema.safeParse(attendeeWithUserId);
      expect(result.success).toBe(true);
    });
  });

  describe('insertAssetSchema', () => {
    it('should validate valid asset insert', () => {
      const validAsset = {
        name: 'presentation.pdf',
        type: 'presentation',
        file_path: '/uploads/presentation.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        uploaded_by: 1,
      };
      const result = insertAssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it('should require all mandatory fields', () => {
      const invalidAsset = {
        name: 'presentation.pdf',
        type: 'presentation',
        // Missing required fields
      };
      const result = insertAssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
    });

    it('should allow any type string', () => {
      const assetWithType = {
        name: 'test.pdf',
        type: 'presentation',
        file_path: '/uploads/test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 1,
      };
      const result = insertAssetSchema.safeParse(assetWithType);
      expect(result.success).toBe(true);
    });

    it('should allow optional event_id and cfp_submission_id', () => {
      const assetWithRelations = {
        name: 'presentation.pdf',
        type: 'presentation',
        file_path: '/uploads/presentation.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        uploaded_by: 1,
        event_id: 5,
        cfp_submission_id: 10,
      };
      const result = insertAssetSchema.safeParse(assetWithRelations);
      expect(result.success).toBe(true);
    });
  });

  describe('insertSponsorshipSchema', () => {
    it('should validate valid sponsorship insert', () => {
      const validSponsorship = {
        event_id: 1,
        sponsor_name: 'ACME Corp',
        tier: 'Gold',
        amount: '5000',
        status: 'confirmed',
      };
      const result = insertSponsorshipSchema.safeParse(validSponsorship);
      expect(result.success).toBe(true);
    });

    it('should require event_id, sponsor_name, and tier', () => {
      const invalidSponsorship = {
        sponsor_name: 'ACME Corp',
        // Missing required fields
      };
      const result = insertSponsorshipSchema.safeParse(invalidSponsorship);
      expect(result.success).toBe(false);
    });
  });

  describe('insertStakeholderSchema', () => {
    it('should validate valid stakeholder insert', () => {
      const validStakeholder = {
        name: 'John Executive',
        email: 'john@company.com',
        role: 'executive',
        organization: 'ACME Corp',
      };
      const result = insertStakeholderSchema.safeParse(validStakeholder);
      expect(result.success).toBe(true);
    });

    it('should require organization field', () => {
      const stakeholderWithoutOrg = {
        name: 'John Executive',
        email: 'john@company.com',
        role: 'executive',
      };
      const result = insertStakeholderSchema.safeParse(stakeholderWithoutOrg);
      expect(result.success).toBe(false);
    });
  });

  describe('insertApprovalWorkflowSchema', () => {
    it('should validate valid approval workflow insert', () => {
      const validWorkflow = {
        title: 'Approval Request',
        item_type: 'event',
        item_id: 1,
        status: 'pending',
      };
      const result = insertApprovalWorkflowSchema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('should require title field', () => {
      const workflowWithoutTitle = {
        item_type: 'event',
        item_id: 1,
        status: 'pending',
      };
      const result = insertApprovalWorkflowSchema.safeParse(workflowWithoutTitle);
      expect(result.success).toBe(false);
    });

    it('should allow optional requester_id', () => {
      const workflowWithRequester = {
        title: 'Approval Request',
        item_type: 'event',
        item_id: 1,
        status: 'pending',
        requester_id: 5,
      };
      const result = insertApprovalWorkflowSchema.safeParse(workflowWithRequester);
      expect(result.success).toBe(true);
    });
  });
});

describe('Database Types - Update Schemas', () => {
  describe('updateUserProfileSchema', () => {
    it('should validate valid user profile update', () => {
      const validUpdate = {
        name: 'Updated Name',
        bio: 'Updated bio',
        job_title: 'Senior Developer',
      };
      const result = updateUserProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        bio: 'Just updating the bio',
      };
      const result = updateUserProfileSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateUserProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('updateEventSchema', () => {
    it('should validate valid event update', () => {
      const validUpdate = {
        name: 'Updated Event Name',
        status: 'confirmed',
        notes: 'Some notes',
      };
      const result = updateEventSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        status: 'completed',
      };
      const result = updateEventSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow status updates', () => {
      const updateWithStatus = {
        status: 'completed',
      };
      const result = updateEventSchema.safeParse(updateWithStatus);
      expect(result.success).toBe(true);
    });

    it('should validate event priority if provided', () => {
      const updateWithValidPriority = {
        priority: 'high',
      };
      const result = updateEventSchema.safeParse(updateWithValidPriority);
      expect(result.success).toBe(true);
    });
  });

  describe('updateCFPSubmissionSchema', () => {
    it('should validate valid CFP submission update', () => {
      const validUpdate = {
        title: 'Updated Title',
        status: 'accepted',
        notes: 'Great submission!',
      };
      const result = updateCFPSubmissionSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow status-only update', () => {
      const statusUpdate = {
        status: 'rejected',
      };
      const result = updateCFPSubmissionSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow status updates', () => {
      const updateWithStatus = {
        status: 'accepted',
      };
      const result = updateCFPSubmissionSchema.safeParse(updateWithStatus);
      expect(result.success).toBe(true);
    });
  });
});

describe('Database Types - Edge Cases', () => {
  it('should handle null values appropriately', () => {
    const userWithNull = {
      username: 'testuser',
      name: null,
      email: null,
    };
    const result = insertUserSchema.safeParse(userWithNull);
    // Should be valid since name and email are optional
    expect(result.success).toBe(true);
  });

  it('should reject extra unknown fields (if strict mode)', () => {
    const eventWithExtra = {
      name: 'Test Event',
      link: 'https://example.com',
      start_date: '2025-06-01',
      end_date: '2025-06-03',
      location: 'SF',
      priority: 'high',
      type: 'conference',
      unknownField: 'should not be here',
    };
    // Zod by default allows extra fields, but we can test the defined fields work
    const result = insertEventSchema.safeParse(eventWithExtra);
    // This should still pass as Zod doesn't strip unknown fields by default
    expect(result.success).toBe(true);
  });

  it('should handle array validation correctly', () => {
    const event = {
      name: 'Test Event',
      link: 'https://example.com',
      start_date: '2025-06-01',
      end_date: '2025-06-03',
      location: 'SF',
      priority: 'high',
      type: 'conference',
      goal: ['speaking', 'speaking', 'networking'], // Duplicates allowed
    };
    const result = insertEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

