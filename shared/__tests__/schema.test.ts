import { describe, it, expect } from 'vitest';
import { relations } from 'drizzle-orm';
import * as schema from '../schema';

describe('Schema - Re-exports', () => {
  describe('Table Exports', () => {
    it('should export all table definitions', () => {
      expect(schema.users).toBeDefined();
      expect(schema.events).toBeDefined();
      expect(schema.cfpSubmissions).toBeDefined();
      expect(schema.attendees).toBeDefined();
      expect(schema.sponsorships).toBeDefined();
      expect(schema.assets).toBeDefined();
      expect(schema.stakeholders).toBeDefined();
      expect(schema.approvalWorkflows).toBeDefined();
      expect(schema.workflowReviewers).toBeDefined();
      expect(schema.workflowStakeholders).toBeDefined();
      expect(schema.workflowComments).toBeDefined();
      expect(schema.workflowHistory).toBeDefined();
      expect(schema.editHistory).toBeDefined();
    });
  });

  describe('Type Exports', () => {
    it('should export enum constants', () => {
      expect(schema.eventPriorities).toBeDefined();
      expect(schema.eventTypes).toBeDefined();
      expect(schema.eventGoals).toBeDefined();
      expect(schema.eventStatuses).toBeDefined();
      expect(schema.cfpStatuses).toBeDefined();
      expect(schema.assetTypes).toBeDefined();
      expect(schema.stakeholderRoles).toBeDefined();
      expect(schema.approvalStatuses).toBeDefined();
      expect(schema.approvalItemTypes).toBeDefined();
    });

    it('should export validation schemas', () => {
      expect(schema.eventPrioritySchema).toBeDefined();
      expect(schema.eventTypeSchema).toBeDefined();
      expect(schema.eventGoalSchema).toBeDefined();
      expect(schema.eventGoalsArraySchema).toBeDefined();
      expect(schema.eventStatusSchema).toBeDefined();
      expect(schema.cfpStatusSchema).toBeDefined();
      expect(schema.assetTypeSchema).toBeDefined();
      expect(schema.stakeholderRoleSchema).toBeDefined();
      expect(schema.approvalStatusSchema).toBeDefined();
      expect(schema.approvalItemTypeSchema).toBeDefined();
    });

    it('should export insert schemas', () => {
      expect(schema.insertUserSchema).toBeDefined();
      expect(schema.insertEventSchema).toBeDefined();
      expect(schema.insertCFPSubmissionSchema).toBeDefined();
      expect(schema.insertAttendeeSchema).toBeDefined();
      expect(schema.insertSponsorshipSchema).toBeDefined();
      expect(schema.insertAssetSchema).toBeDefined();
      expect(schema.insertStakeholderSchema).toBeDefined();
      expect(schema.insertApprovalWorkflowSchema).toBeDefined();
    });

    it('should export update schemas', () => {
      expect(schema.updateUserProfileSchema).toBeDefined();
      expect(schema.updateEventSchema).toBeDefined();
      expect(schema.updateCFPSubmissionSchema).toBeDefined();
      expect(schema.updateAttendeeSchema).toBeDefined();
      expect(schema.updateSponsorshipSchema).toBeDefined();
      expect(schema.updateAssetSchema).toBeDefined();
      expect(schema.updateStakeholderSchema).toBeDefined();
      expect(schema.updateApprovalWorkflowSchema).toBeDefined();
    });
  });

  describe('Legacy Compatibility Exports', () => {
    it('should export legacy schema aliases', () => {
      expect(schema.insertCfpSubmissionSchema).toBeDefined();
      expect(schema.updateCfpSubmissionSchema).toBeDefined();
      expect(schema.updateUserPreferencesSchema).toBeDefined();
    });

    it('should ensure legacy aliases match new names', () => {
      expect(schema.insertCfpSubmissionSchema).toBe(schema.insertCFPSubmissionSchema);
      expect(schema.updateCfpSubmissionSchema).toBe(schema.updateCFPSubmissionSchema);
      expect(schema.updateUserPreferencesSchema).toBe(schema.updateUserProfileSchema);
    });
  });
});

describe('Schema - Relations', () => {
  describe('usersRelations', () => {
    it('should define users relations', () => {
      expect(schema.usersRelations).toBeDefined();
    });

    it('should have many events', () => {
      // Relations are defined but we can't easily test the structure
      // Just verify it's exported
      expect(schema.usersRelations).toBeTruthy();
    });
  });

  describe('eventsRelations', () => {
    it('should define events relations', () => {
      expect(schema.eventsRelations).toBeDefined();
    });

    it('should be properly configured', () => {
      expect(schema.eventsRelations).toBeTruthy();
    });
  });

  describe('cfpSubmissionsRelations', () => {
    it('should define CFP submissions relations', () => {
      expect(schema.cfpSubmissionsRelations).toBeDefined();
    });
  });

  describe('attendeesRelations', () => {
    it('should define attendees relations', () => {
      expect(schema.attendeesRelations).toBeDefined();
    });
  });

  describe('sponsorshipsRelations', () => {
    it('should define sponsorships relations', () => {
      expect(schema.sponsorshipsRelations).toBeDefined();
    });
  });

  describe('assetsRelations', () => {
    it('should define assets relations', () => {
      expect(schema.assetsRelations).toBeDefined();
    });
  });

  describe('stakeholdersRelations', () => {
    it('should define stakeholders relations', () => {
      expect(schema.stakeholdersRelations).toBeDefined();
    });
  });

  describe('approvalWorkflowsRelations', () => {
    it('should define approval workflows relations', () => {
      expect(schema.approvalWorkflowsRelations).toBeDefined();
    });
  });

  describe('workflowReviewersRelations', () => {
    it('should define workflow reviewers relations', () => {
      expect(schema.workflowReviewersRelations).toBeDefined();
    });
  });

  describe('workflowStakeholdersRelations', () => {
    it('should define workflow stakeholders relations', () => {
      expect(schema.workflowStakeholdersRelations).toBeDefined();
    });
  });

  describe('workflowCommentsRelations', () => {
    it('should define workflow comments relations', () => {
      expect(schema.workflowCommentsRelations).toBeDefined();
    });
  });

  describe('workflowHistoryRelations', () => {
    it('should define workflow history relations', () => {
      expect(schema.workflowHistoryRelations).toBeDefined();
    });
  });

  it('should export all relation definitions', () => {
    const allRelations = [
      schema.usersRelations,
      schema.eventsRelations,
      schema.cfpSubmissionsRelations,
      schema.attendeesRelations,
      schema.sponsorshipsRelations,
      schema.assetsRelations,
      schema.stakeholdersRelations,
      schema.approvalWorkflowsRelations,
      schema.workflowReviewersRelations,
      schema.workflowStakeholdersRelations,
      schema.workflowCommentsRelations,
      schema.workflowHistoryRelations,
    ];

    allRelations.forEach(relation => {
      expect(relation).toBeDefined();
      expect(relation).toBeTruthy();
    });
  });
});

describe('Schema - Integration Tests', () => {
  it('should allow importing everything from schema module', () => {
    // Test that the main schema file properly re-exports everything
    expect(Object.keys(schema).length).toBeGreaterThan(50);
  });

  it('should maintain backward compatibility', () => {
    // Verify old import patterns still work
    const { insertCfpSubmissionSchema, updateUserPreferencesSchema } = schema;
    expect(insertCfpSubmissionSchema).toBeDefined();
    expect(updateUserPreferencesSchema).toBeDefined();
  });

  it('should provide both old and new naming', () => {
    // New naming (PascalCase CFP)
    expect(schema.insertCFPSubmissionSchema).toBeDefined();
    expect(schema.updateCFPSubmissionSchema).toBeDefined();

    // Old naming (camelCase cfp)
    expect(schema.insertCfpSubmissionSchema).toBeDefined();
    expect(schema.updateCfpSubmissionSchema).toBeDefined();
  });
});

describe('Schema - Validation Integration', () => {
  it('should allow validating event with all schemas', () => {
    const testEvent = {
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

    const result = schema.insertEventSchema.safeParse(testEvent);
    expect(result.success).toBe(true);
  });

  it('should allow validating user with all schemas', () => {
    const testUser = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      keycloak_id: 'keycloak-123',
    };

    const result = schema.insertUserSchema.safeParse(testUser);
    expect(result.success).toBe(true);
  });

  it('should allow validating CFP submission with all schemas', () => {
    const testSubmission = {
      event_id: 1,
      title: 'My Talk',
      abstract: 'Talk abstract',
      submitter_name: 'John Doe',
      submitter_id: 1,
      status: 'submitted',
    };

    // Test both old and new naming
    const result1 = schema.insertCFPSubmissionSchema.safeParse(testSubmission);
    const result2 = schema.insertCfpSubmissionSchema.safeParse(testSubmission);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it('should reject invalid data across all schemas', () => {
    const invalidEvent = {
      name: 'Test',
      // Missing required fields
    };

    const result = schema.insertEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });
});

describe('Schema - Type Inference', () => {
  it('should infer correct types from schemas', () => {
    // This is more of a compile-time test, but we can verify at runtime
    const validData = schema.insertUserSchema.parse({
      username: 'test',
      name: 'Test User',
    });

    expect(validData.username).toBe('test');
    expect(validData.name).toBe('Test User');
  });

  it('should handle optional fields in updates', () => {
    const update = schema.updateEventSchema.parse({
      name: 'Updated Name',
    });

    expect(update.name).toBe('Updated Name');
    expect(Object.keys(update)).toHaveLength(1);
  });

  it('should validate enum values through schemas', () => {
    // Valid enum value
    const validPriority = schema.eventPrioritySchema.parse('high');
    expect(validPriority).toBe('high');

    // Invalid enum value should throw
    expect(() => {
      schema.eventPrioritySchema.parse('invalid');
    }).toThrow();
  });
});

describe('Schema - Complete Export Coverage', () => {
  it('should export all enum arrays', () => {
    const enums = [
      schema.eventPriorities,
      schema.eventTypes,
      schema.eventGoals,
      schema.eventStatuses,
      schema.cfpStatuses,
      schema.assetTypes,
      schema.stakeholderRoles,
      schema.approvalStatuses,
      schema.approvalItemTypes,
    ];

    enums.forEach(enumArray => {
      expect(Array.isArray(enumArray)).toBe(true);
      expect(enumArray.length).toBeGreaterThan(0);
    });
  });

  it('should export all database tables', () => {
    const tables = [
      schema.users,
      schema.events,
      schema.cfpSubmissions,
      schema.attendees,
      schema.sponsorships,
      schema.assets,
      schema.stakeholders,
      schema.approvalWorkflows,
      schema.workflowReviewers,
      schema.workflowStakeholders,
      schema.workflowComments,
      schema.workflowHistory,
      schema.editHistory,
    ];

    tables.forEach(table => {
      expect(table).toBeDefined();
    });
  });

  it('should export all relation definitions', () => {
    const relations = [
      schema.usersRelations,
      schema.eventsRelations,
      schema.cfpSubmissionsRelations,
      schema.attendeesRelations,
      schema.sponsorshipsRelations,
      schema.assetsRelations,
      schema.stakeholdersRelations,
      schema.approvalWorkflowsRelations,
      schema.workflowReviewersRelations,
      schema.workflowStakeholdersRelations,
      schema.workflowCommentsRelations,
      schema.workflowHistoryRelations,
    ];

    relations.forEach(relation => {
      expect(relation).toBeDefined();
    });
  });
});

