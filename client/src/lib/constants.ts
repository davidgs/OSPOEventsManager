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