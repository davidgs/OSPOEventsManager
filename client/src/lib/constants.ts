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

// Approval workflow constants
export const approvalStatuses = [
  "pending",
  "in_review", 
  "approved",
  "rejected",
  "on_hold"
] as const;

export const approvalItemTypes = [
  "event",
  "cfp_submission",
  "sponsorship", 
  "budget_request",
  "travel_request",
  "speaker_proposal"
] as const;

export const eventPriorities = [
  "low",
  "medium", 
  "high",
  "critical"
] as const;

export const reviewStatuses = [
  "pending",
  "approved",
  "rejected", 
  "needs_changes"
] as const;

export const userRoles = [
  "admin",
  "manager",
  "reviewer",
  "user"
] as const;

export const assetTypes = [
  "abstract",
  "bio", 
  "headshot",
  "trip_report",
  "presentation",
  "contract",
  "invoice",
  "other"
] as const;

export const eventTypes = [
  "conference",
  "meetup",
  "webinar", 
  "workshop",
  "hackathon",
  "summit"
] as const;

export const sponsorshipLevels = [
  "platinum",
  "gold",
  "silver", 
  "bronze",
  "startup",
  "community"
] as const;

export const attendeeRoles = [
  "attendee",
  "speaker",
  "sponsor",
  "organizer",
  "volunteer",
  "media",
  "vip"
] as const;

export const stakeholderRoles = [
  "primary_contact",
  "decision_maker",
  "technical_reviewer",
  "budget_approver",
  "legal_reviewer",
  "marketing_contact",
  "logistics_coordinator"
] as const;

export const cfpStatuses = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn"
] as const;

export const sponsorshipStatuses = [
  "pending",
  "confirmed", 
  "cancelled",
  "negotiating",
  "declined"
] as const;