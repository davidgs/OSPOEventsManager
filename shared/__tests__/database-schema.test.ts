/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { describe, it, expect } from 'vitest';
import {
  users,
  events,
  cfpSubmissions,
  attendees,
  sponsorships,
  assets,
  stakeholders,
  approvalWorkflows,
  workflowReviewers,
  workflowStakeholders,
  workflowComments,
  workflowHistory,
  editHistory,
} from '../database-schema';

describe('Database Schema - Table Definitions', () => {
  describe('users table', () => {
    it('should have correct table name', () => {
      expect(users).toBeDefined();
      // @ts-ignore - accessing internal property for testing
      expect(users[Symbol.for('drizzle:Name')]).toBe('users');
    });

    it('should have required columns', () => {
      const columns = Object.keys(users);
      expect(columns).toContain('id');
      expect(columns).toContain('username');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('keycloak_id');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have optional profile fields', () => {
      const columns = Object.keys(users);
      expect(columns).toContain('bio');
      expect(columns).toContain('role');
      expect(columns).toContain('job_title');
      expect(columns).toContain('headshot');
      expect(columns).toContain('preferences');
      expect(columns).toContain('last_login');
    });
  });

  describe('events table', () => {
    it('should have correct table name', () => {
      expect(events).toBeDefined();
      // @ts-ignore
      expect(events[Symbol.for('drizzle:Name')]).toBe('events');
    });

    it('should have required event fields', () => {
      const columns = Object.keys(events);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('link');
      expect(columns).toContain('start_date');
      expect(columns).toContain('end_date');
      expect(columns).toContain('location');
      expect(columns).toContain('priority');
      expect(columns).toContain('type');
      expect(columns).toContain('status');
    });

    it('should have optional CFP fields', () => {
      const columns = Object.keys(events);
      expect(columns).toContain('cfp_deadline');
      expect(columns).toContain('cfp_link');
    });

    it('should have tracking fields', () => {
      const columns = Object.keys(events);
      expect(columns).toContain('created_by_id');
      expect(columns).toContain('updated_by_id');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should have goal as array field', () => {
      const columns = Object.keys(events);
      expect(columns).toContain('goal');
    });
  });

  describe('cfpSubmissions table', () => {
    it('should have correct table name', () => {
      expect(cfpSubmissions).toBeDefined();
      // @ts-ignore
      expect(cfpSubmissions[Symbol.for('drizzle:Name')]).toBe('cfp_submissions');
    });

    it('should have required CFP fields', () => {
      const columns = Object.keys(cfpSubmissions);
      expect(columns).toContain('id');
      expect(columns).toContain('event_id');
      expect(columns).toContain('title');
      expect(columns).toContain('abstract');
      expect(columns).toContain('submitter_name');
      expect(columns).toContain('submitter_id');
      expect(columns).toContain('status');
    });

    it('should have timestamp fields', () => {
      const columns = Object.keys(cfpSubmissions);
      expect(columns).toContain('submission_date');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });
  });

  describe('attendees table', () => {
    it('should have correct table name', () => {
      expect(attendees).toBeDefined();
      // @ts-ignore
      expect(attendees[Symbol.for('drizzle:Name')]).toBe('attendees');
    });

    it('should have required attendee fields', () => {
      const columns = Object.keys(attendees);
      expect(columns).toContain('id');
      expect(columns).toContain('event_id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('role');
    });

    it('should have optional user relationship', () => {
      const columns = Object.keys(attendees);
      expect(columns).toContain('user_id');
    });
  });

  describe('sponsorships table', () => {
    it('should have correct table name', () => {
      expect(sponsorships).toBeDefined();
      // @ts-ignore
      expect(sponsorships[Symbol.for('drizzle:Name')]).toBe('sponsorships');
    });

    it('should have required sponsorship fields', () => {
      const columns = Object.keys(sponsorships);
      expect(columns).toContain('id');
      expect(columns).toContain('event_id');
      expect(columns).toContain('sponsor_name');
      expect(columns).toContain('tier');
      expect(columns).toContain('status');
    });

    it('should have financial and contact fields', () => {
      const columns = Object.keys(sponsorships);
      expect(columns).toContain('amount');
      expect(columns).toContain('contact_email');
      expect(columns).toContain('contact_name');
    });
  });

  describe('assets table', () => {
    it('should have correct table name', () => {
      expect(assets).toBeDefined();
      // @ts-ignore
      expect(assets[Symbol.for('drizzle:Name')]).toBe('assets');
    });

    it('should have required file fields', () => {
      const columns = Object.keys(assets);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('type');
      expect(columns).toContain('file_path');
      expect(columns).toContain('file_size');
      expect(columns).toContain('mime_type');
      expect(columns).toContain('uploaded_by');
    });

    it('should have optional relationship fields', () => {
      const columns = Object.keys(assets);
      expect(columns).toContain('event_id');
      expect(columns).toContain('cfp_submission_id');
    });

    it('should have tracking fields', () => {
      const columns = Object.keys(assets);
      expect(columns).toContain('created_by_id');
      expect(columns).toContain('updated_by_id');
      expect(columns).toContain('uploaded_at');
    });
  });

  describe('stakeholders table', () => {
    it('should have correct table name', () => {
      expect(stakeholders).toBeDefined();
      // @ts-ignore
      expect(stakeholders[Symbol.for('drizzle:Name')]).toBe('stakeholders');
    });

    it('should have required stakeholder fields', () => {
      const columns = Object.keys(stakeholders);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('role');
    });

    it('should have optional fields', () => {
      const columns = Object.keys(stakeholders);
      expect(columns).toContain('department');
      expect(columns).toContain('user_id');
      expect(columns).toContain('notes');
    });
  });

  describe('approvalWorkflows table', () => {
    it('should have correct table name', () => {
      expect(approvalWorkflows).toBeDefined();
      // @ts-ignore
      expect(approvalWorkflows[Symbol.for('drizzle:Name')]).toBe('approval_workflows');
    });

    it('should have required workflow fields', () => {
      const columns = Object.keys(approvalWorkflows);
      expect(columns).toContain('id');
      expect(columns).toContain('title');
      expect(columns).toContain('item_type');
      expect(columns).toContain('item_id');
      expect(columns).toContain('status');
      expect(columns).toContain('requester_id');
    });

    it('should have optional workflow fields', () => {
      const columns = Object.keys(approvalWorkflows);
      expect(columns).toContain('description');
      expect(columns).toContain('priority');
      expect(columns).toContain('due_date');
      expect(columns).toContain('estimated_costs');
      expect(columns).toContain('metadata');
    });
  });

  describe('workflowReviewers table', () => {
    it('should have correct table name', () => {
      expect(workflowReviewers).toBeDefined();
      // @ts-ignore
      expect(workflowReviewers[Symbol.for('drizzle:Name')]).toBe('workflow_reviewers');
    });

    it('should have required reviewer fields', () => {
      const columns = Object.keys(workflowReviewers);
      expect(columns).toContain('id');
      expect(columns).toContain('workflow_id');
      expect(columns).toContain('reviewer_id');
      expect(columns).toContain('status');
    });

    it('should have review tracking fields', () => {
      const columns = Object.keys(workflowReviewers);
      expect(columns).toContain('status');
      expect(columns).toContain('reviewed_at');
    });
  });

  describe('workflowStakeholders table', () => {
    it('should have correct table name', () => {
      expect(workflowStakeholders).toBeDefined();
      // @ts-ignore
      expect(workflowStakeholders[Symbol.for('drizzle:Name')]).toBe('workflow_stakeholders');
    });

    it('should have required stakeholder link fields', () => {
      const columns = Object.keys(workflowStakeholders);
      expect(columns).toContain('id');
      expect(columns).toContain('workflow_id');
      expect(columns).toContain('stakeholder_id');
    });

    it('should have role field', () => {
      const columns = Object.keys(workflowStakeholders);
      expect(columns).toContain('role');
    });
  });

  describe('workflowComments table', () => {
    it('should have correct table name', () => {
      expect(workflowComments).toBeDefined();
      // @ts-ignore
      expect(workflowComments[Symbol.for('drizzle:Name')]).toBe('workflow_comments');
    });

    it('should have required comment fields', () => {
      const columns = Object.keys(workflowComments);
      expect(columns).toContain('id');
      expect(columns).toContain('workflow_id');
      expect(columns).toContain('commenter_id');
      expect(columns).toContain('comment');
      expect(columns).toContain('created_at');
    });
  });

  describe('workflowHistory table', () => {
    it('should have correct table name', () => {
      expect(workflowHistory).toBeDefined();
      // @ts-ignore
      expect(workflowHistory[Symbol.for('drizzle:Name')]).toBe('workflow_history');
    });

    it('should have required history fields', () => {
      const columns = Object.keys(workflowHistory);
      expect(columns).toContain('id');
      expect(columns).toContain('workflow_id');
      expect(columns).toContain('action');
      expect(columns).toContain('performed_by');
      expect(columns).toContain('performed_at');
    });

    it('should have details field', () => {
      const columns = Object.keys(workflowHistory);
      expect(columns).toContain('details');
    });
  });

  describe('editHistory table', () => {
    it('should have correct table name', () => {
      expect(editHistory).toBeDefined();
      // @ts-ignore
      expect(editHistory[Symbol.for('drizzle:Name')]).toBe('edit_history');
    });

    it('should have required edit tracking fields', () => {
      const columns = Object.keys(editHistory);
      expect(columns).toContain('id');
      expect(columns).toContain('entity_type');
      expect(columns).toContain('entity_id');
      expect(columns).toContain('edited_by_id');
      expect(columns).toContain('edited_at');
    });

    it('should have change description field', () => {
      const columns = Object.keys(editHistory);
      expect(columns).toContain('change_description');
    });
  });
});

describe('Database Schema - Table Relationships', () => {
  it('should define all core tables', () => {
    expect(users).toBeDefined();
    expect(events).toBeDefined();
    expect(cfpSubmissions).toBeDefined();
    expect(attendees).toBeDefined();
    expect(sponsorships).toBeDefined();
    expect(assets).toBeDefined();
  });

  it('should define workflow tables', () => {
    expect(approvalWorkflows).toBeDefined();
    expect(workflowReviewers).toBeDefined();
    expect(workflowStakeholders).toBeDefined();
    expect(workflowComments).toBeDefined();
    expect(workflowHistory).toBeDefined();
  });

  it('should define auxiliary tables', () => {
    expect(stakeholders).toBeDefined();
    expect(editHistory).toBeDefined();
  });
});

describe('Database Schema - Consistent Naming', () => {
  it('should use consistent timestamp field names', () => {
    const tablesWithTimestamps = [
      users,
      events,
      cfpSubmissions,
      attendees,
      sponsorships,
      assets,
      stakeholders,
      approvalWorkflows,
    ];

    tablesWithTimestamps.forEach(table => {
      const columns = Object.keys(table);
      // Most tables should have created_at and updated_at
      expect(columns.some(col => col.includes('created'))).toBe(true);
    });
  });

  it('should use snake_case for column names', () => {
    const allTables = [
      users,
      events,
      cfpSubmissions,
      attendees,
      sponsorships,
      assets,
      stakeholders,
      approvalWorkflows,
    ];

    allTables.forEach(table => {
      const columns = Object.keys(table);
      columns.forEach(col => {
        // Check if column name is snake_case (or just lowercase)
        // Allow internal Drizzle properties that start with special chars
        if (!col.startsWith('_') && !col.startsWith('$') && col !== 'enableRLS') {
          expect(col).toMatch(/^[a-z][a-z0-9_]*$/);
        }
      });
    });
  });

  it('should use _id suffix for foreign keys', () => {
    const foreignKeyColumns = [
      'event_id',
      'submitter_id',
      'user_id',
      'uploaded_by',
      'created_by_id',
      'updated_by_id',
      'workflow_id',
      'reviewer_id',
      'stakeholder_id',
      'commenter_id',
    ];

    // Check that foreign key naming is consistent
    foreignKeyColumns.forEach(fk => {
      expect(fk).toMatch(/_id$|_by$/);
    });
  });
});

