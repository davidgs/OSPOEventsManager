import { describe, it, expect } from 'vitest';
import {
  approvalStatuses,
  approvalItemTypes,
  eventPriorities,
  reviewStatuses,
  userRoles,
  assetTypes,
  eventTypes,
  sponsorshipLevels,
  attendeeRoles,
  stakeholderRoles,
  cfpStatuses,
  sponsorshipStatuses,
} from '@/lib/constants';

describe('Constants', () => {
  describe('Approval Workflow Constants', () => {
    it('should have all approval statuses', () => {
      expect(approvalStatuses).toEqual([
        'pending',
        'in_review',
        'approved',
        'rejected',
        'on_hold',
      ]);
    });

    it('should have unique approval statuses', () => {
      const unique = new Set(approvalStatuses);
      expect(unique.size).toBe(approvalStatuses.length);
    });

    it('should have all approval item types', () => {
      expect(approvalItemTypes).toEqual([
        'event',
        'cfp_submission',
        'sponsorship',
        'budget_request',
        'travel_request',
        'speaker_proposal',
      ]);
    });

    it('should have unique approval item types', () => {
      const unique = new Set(approvalItemTypes);
      expect(unique.size).toBe(approvalItemTypes.length);
    });

    it('should have all review statuses', () => {
      expect(reviewStatuses).toEqual([
        'pending',
        'approved',
        'rejected',
        'needs_changes',
      ]);
    });

    it('should have unique review statuses', () => {
      const unique = new Set(reviewStatuses);
      expect(unique.size).toBe(reviewStatuses.length);
    });
  });

  describe('Event Constants', () => {
    it('should have all event priorities', () => {
      expect(eventPriorities).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('should have priorities in order', () => {
      // Verify priorities are in ascending order of importance
      expect(eventPriorities[0]).toBe('low');
      expect(eventPriorities[eventPriorities.length - 1]).toBe('critical');
    });

    it('should have all event types', () => {
      expect(eventTypes).toEqual([
        'conference',
        'meetup',
        'webinar',
        'workshop',
        'hackathon',
        'summit',
      ]);
    });

    it('should have unique event types', () => {
      const unique = new Set(eventTypes);
      expect(unique.size).toBe(eventTypes.length);
    });
  });

  describe('User and Role Constants', () => {
    it('should have all user roles', () => {
      expect(userRoles).toEqual(['admin', 'manager', 'reviewer', 'user']);
    });

    it('should have roles in hierarchy order', () => {
      // Verify roles are in descending order of privilege
      expect(userRoles[0]).toBe('admin');
      expect(userRoles[userRoles.length - 1]).toBe('user');
    });

    it('should have unique user roles', () => {
      const unique = new Set(userRoles);
      expect(unique.size).toBe(userRoles.length);
    });

    it('should have all attendee roles', () => {
      expect(attendeeRoles).toEqual([
        'attendee',
        'speaker',
        'sponsor',
        'organizer',
        'volunteer',
        'media',
        'vip',
      ]);
    });

    it('should have unique attendee roles', () => {
      const unique = new Set(attendeeRoles);
      expect(unique.size).toBe(attendeeRoles.length);
    });

    it('should have all stakeholder roles', () => {
      expect(stakeholderRoles).toEqual([
        'primary_contact',
        'decision_maker',
        'technical_reviewer',
        'budget_approver',
        'legal_reviewer',
        'marketing_contact',
        'logistics_coordinator',
      ]);
    });

    it('should have unique stakeholder roles', () => {
      const unique = new Set(stakeholderRoles);
      expect(unique.size).toBe(stakeholderRoles.length);
    });
  });

  describe('Asset Constants', () => {
    it('should have all asset types', () => {
      expect(assetTypes).toEqual([
        'abstract',
        'bio',
        'headshot',
        'trip_report',
        'presentation',
        'contract',
        'invoice',
        'other',
      ]);
    });

    it('should have unique asset types', () => {
      const unique = new Set(assetTypes);
      expect(unique.size).toBe(assetTypes.length);
    });

    it('should include "other" as catch-all', () => {
      expect(assetTypes).toContain('other');
    });
  });

  describe('Sponsorship Constants', () => {
    it('should have all sponsorship levels', () => {
      expect(sponsorshipLevels).toEqual([
        'platinum',
        'gold',
        'silver',
        'bronze',
        'startup',
        'community',
      ]);
    });

    it('should have levels in tier order', () => {
      // Verify levels are in descending order of prestige
      expect(sponsorshipLevels[0]).toBe('platinum');
      expect(sponsorshipLevels[3]).toBe('bronze');
    });

    it('should have unique sponsorship levels', () => {
      const unique = new Set(sponsorshipLevels);
      expect(unique.size).toBe(sponsorshipLevels.length);
    });

    it('should have all sponsorship statuses', () => {
      expect(sponsorshipStatuses).toEqual([
        'pending',
        'confirmed',
        'cancelled',
        'negotiating',
        'declined',
      ]);
    });

    it('should have unique sponsorship statuses', () => {
      const unique = new Set(sponsorshipStatuses);
      expect(unique.size).toBe(sponsorshipStatuses.length);
    });
  });

  describe('CFP Constants', () => {
    it('should have all CFP statuses', () => {
      expect(cfpStatuses).toEqual([
        'draft',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'withdrawn',
      ]);
    });

    it('should have unique CFP statuses', () => {
      const unique = new Set(cfpStatuses);
      expect(unique.size).toBe(cfpStatuses.length);
    });

    it('should have draft as initial status', () => {
      expect(cfpStatuses[0]).toBe('draft');
    });

    it('should have terminal statuses', () => {
      expect(cfpStatuses).toContain('accepted');
      expect(cfpStatuses).toContain('rejected');
      expect(cfpStatuses).toContain('withdrawn');
    });
  });

  describe('Type Safety', () => {
    it('should be readonly arrays', () => {
      // TypeScript enforces this at compile time via 'as const'
      // At runtime, we can verify they are arrays
      expect(Array.isArray(approvalStatuses)).toBe(true);
      expect(Array.isArray(eventTypes)).toBe(true);
      expect(Array.isArray(userRoles)).toBe(true);
    });

    it('should contain only strings', () => {
      const allConstants = [
        ...approvalStatuses,
        ...approvalItemTypes,
        ...eventPriorities,
        ...reviewStatuses,
        ...userRoles,
        ...assetTypes,
        ...eventTypes,
        ...sponsorshipLevels,
        ...attendeeRoles,
        ...stakeholderRoles,
        ...cfpStatuses,
        ...sponsorshipStatuses,
      ];

      allConstants.forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });

    it('should use snake_case for multi-word values', () => {
      const snakeCasePattern = /^[a-z]+(_[a-z]+)*$/;

      const multiWordValues = [
        ...approvalItemTypes,
        ...stakeholderRoles,
        ...cfpStatuses,
      ].filter(v => v.includes('_'));

      multiWordValues.forEach((value) => {
        expect(value).toMatch(snakeCasePattern);
      });
    });
  });

  describe('Completeness', () => {
    it('should export all constant arrays', () => {
      expect(approvalStatuses).toBeDefined();
      expect(approvalItemTypes).toBeDefined();
      expect(eventPriorities).toBeDefined();
      expect(reviewStatuses).toBeDefined();
      expect(userRoles).toBeDefined();
      expect(assetTypes).toBeDefined();
      expect(eventTypes).toBeDefined();
      expect(sponsorshipLevels).toBeDefined();
      expect(attendeeRoles).toBeDefined();
      expect(stakeholderRoles).toBeDefined();
      expect(cfpStatuses).toBeDefined();
      expect(sponsorshipStatuses).toBeDefined();
    });

    it('should have non-empty arrays', () => {
      expect(approvalStatuses.length).toBeGreaterThan(0);
      expect(approvalItemTypes.length).toBeGreaterThan(0);
      expect(eventPriorities.length).toBeGreaterThan(0);
      expect(reviewStatuses.length).toBeGreaterThan(0);
      expect(userRoles.length).toBeGreaterThan(0);
      expect(assetTypes.length).toBeGreaterThan(0);
      expect(eventTypes.length).toBeGreaterThan(0);
      expect(sponsorshipLevels.length).toBeGreaterThan(0);
      expect(attendeeRoles.length).toBeGreaterThan(0);
      expect(stakeholderRoles.length).toBeGreaterThan(0);
      expect(cfpStatuses.length).toBeGreaterThan(0);
      expect(sponsorshipStatuses.length).toBeGreaterThan(0);
    });
  });
});

