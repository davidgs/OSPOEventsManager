-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "keycloak_id" TEXT,
  "username" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "job_title" TEXT,
  "headshot_url" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "location" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "goal" TEXT[] NOT NULL,
  "cfp_deadline" DATE,
  "cfp_link" TEXT,
  "status" TEXT NOT NULL DEFAULT 'planning',
  "notes" TEXT,
  "created_by_id" INTEGER REFERENCES "users"("id"),
  "updated_by_id" INTEGER REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "cfp_submissions" (
  "id" SERIAL PRIMARY KEY,
  "event_id" INTEGER NOT NULL REFERENCES "events"("id"),
  "title" TEXT NOT NULL,
  "abstract" TEXT NOT NULL,
  "submitter_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "submitter_name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "submission_date" DATE NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "attendees" (
  "id" SERIAL PRIMARY KEY,
  "event_id" INTEGER NOT NULL REFERENCES "events"("id"),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "user_id" INTEGER REFERENCES "users"("id"),
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sponsorships" (
  "id" SERIAL PRIMARY KEY,
  "event_id" INTEGER NOT NULL REFERENCES "events"("id"),
  "level" TEXT NOT NULL,
  "amount" NUMERIC(10, 2) NOT NULL,
  "benefits" TEXT,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "assets" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "uploaded_by" INTEGER REFERENCES "users"("id"),
  "uploaded_by_name" TEXT,
  "event_id" INTEGER REFERENCES "events"("id"),
  "cfp_submission_id" INTEGER REFERENCES "cfp_submissions"("id"),
  "description" TEXT,
  "created_by_id" INTEGER REFERENCES "users"("id"),
  "updated_by_id" INTEGER REFERENCES "users"("id"),
  "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "edit_history" (
  "id" SERIAL PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "edited_by_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "edited_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "change_description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "stakeholders" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "department" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "approval_workflows" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "item_type" TEXT NOT NULL,
  "item_id" INTEGER NOT NULL,
  "priority" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_date" DATE,
  "estimated_costs" TEXT,
  "requester_id" INTEGER REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "workflow_reviewers" (
  "id" SERIAL PRIMARY KEY,
  "workflow_id" INTEGER REFERENCES "approval_workflows"("id"),
  "user_id" INTEGER REFERENCES "users"("id"),
  "status" TEXT DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "workflow_stakeholders" (
  "id" SERIAL PRIMARY KEY,
  "workflow_id" INTEGER REFERENCES "approval_workflows"("id"),
  "stakeholder_id" INTEGER REFERENCES "stakeholders"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "workflow_comments" (
  "id" SERIAL PRIMARY KEY,
  "workflow_id" INTEGER REFERENCES "approval_workflows"("id"),
  "user_id" INTEGER REFERENCES "users"("id"),
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "workflow_history" (
  "id" SERIAL PRIMARY KEY,
  "workflow_id" INTEGER REFERENCES "approval_workflows"("id"),
  "user_id" INTEGER REFERENCES "users"("id"),
  "action" TEXT NOT NULL,
  "details" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data
-- Demo users
INSERT INTO "users" ("id", "keycloak_id", "username", "name", "email", "job_title")
VALUES
  (1, 'user-1', 'admin', 'Alex Johnson', 'alex@example.com', 'OSPO Manager'),
  (2, 'user-2', 'demo', 'David G. Simmons', 'david@example.com', 'AI Community Architect')
ON CONFLICT (id) DO NOTHING;

-- Events
INSERT INTO "events" ("id", "name", "description", "location", "start_date", "end_date", "website", "type", "goals", "status")
VALUES
  (6, 'KubeCon + CloudNativeCon Europe', 'The Cloud Native Computing Foundation flagship conference', 'Paris, France', '2025-03-18', '2025-03-21', 'https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/', 'conference', '{"community_growth", "networking", "lead_generation"}', 'confirmed'),
  (7, 'Open Source Summit North America', 'The premier event for open source developers and communities', 'Seattle, WA', '2025-04-15', '2025-04-18', 'https://events.linuxfoundation.org/open-source-summit-north-america/', 'conference', '{"thought_leadership", "networking"}', 'confirmed'),
  (8, 'DevOps Days Seattle', 'Local DevOps community conference', 'Seattle, WA', '2025-05-12', '2025-05-13', 'https://devopsdays.org/seattle', 'conference', '{"community_growth"}', 'planned'),
  (9, 'CNCF AI Summit', 'Cloud Native AI Solutions', 'San Francisco, CA', '2025-06-24', '2025-06-25', 'https://www.cncf.io/events/', 'summit', '{"thought_leadership", "community_growth"}', 'planned'),
  (10, 'OSPO Con Europe', 'Conference for Open Source Program Offices', 'London, UK', '2025-09-10', '2025-09-12', 'https://ospocon.org', 'conference', '{"thought_leadership", "networking"}', 'tentative')
ON CONFLICT (id) DO NOTHING;

-- CFP Submissions
INSERT INTO "cfp_submissions" ("id", "event_id", "title", "abstract", "submitter_id", "submitter_name", "status", "submission_date", "notes")
VALUES
  (6, 6, 'Scaling Kubernetes in Production', 'Learn how to scale Kubernetes clusters to support enterprise workloads', 2, 'David G. Simmons', 'submitted', '2023-01-10', 'Submitted before deadline'),
  (7, 6, 'Observability Best Practices', 'How to implement effective observability for cloud native applications', 2, 'David G. Simmons', 'accepted', '2023-01-12', 'Accepted for main track'),
  (8, 6, 'GitOps Workflows with Flux', 'Implementing GitOps practices using Flux and Kubernetes', 2, 'David G. Simmons', 'submitted', '2023-01-14', 'Waiting for review'),
  (9, 7, 'Open Source Program Office Best Practices', 'How to establish and run an effective OSPO', 2, 'David G. Simmons', 'submitted', '2023-02-01', 'Submitted for consideration'),
  (10, 7, 'Contributing to Open Source Projects', 'A guide to making your first contributions', 2, 'David G. Simmons', 'rejected', '2023-02-05', 'Similar talk already accepted')
ON CONFLICT (id) DO NOTHING;

-- Attendees
INSERT INTO "attendees" ("id", "event_id", "name", "email", "role", "user_id", "notes")
VALUES
  (6, 6, 'Alex Johnson', 'alex@example.com', 'Developer', 2, 'Speaking at the event'),
  (7, 6, 'Sam Smith', 'sam@example.com', 'Product Manager', NULL, 'Attending workshops'),
  (8, 6, 'Robin Patel', 'robin@example.com', 'Developer', NULL, 'Interested in service mesh talks'),
  (9, 7, 'Alex Johnson', 'alex@example.com', 'Developer', 2, 'Giving a lightning talk'),
  (10, 7, 'Jordan Lee', 'jordan@example.com', 'CTO', NULL, 'Interested in OSPO formation discussions')
ON CONFLICT (id) DO NOTHING;

-- Sponsorships
INSERT INTO "sponsorships" ("id", "event_id", "level", "amount", "benefits", "status", "notes")
VALUES
  (1, 6, 'Gold', 25000.00, 'Booth, 4 passes, logo on website', 'confirmed', 'Payment processed'),
  (2, 7, 'Silver', 15000.00, 'Booth, 2 passes, logo on website', 'pending', 'Waiting for contract signature'),
  (3, 9, 'Platinum', 50000.00, 'Keynote, large booth, 8 passes, top logo placement', 'proposed', 'Proposal sent')
ON CONFLICT (id) DO NOTHING;

-- Stakeholders
INSERT INTO "stakeholders" ("id", "name", "email", "role", "department", "notes")
VALUES
  (1, 'Jane Watson', 'jane.watson@example.com', 'Finance Director', 'Finance', 'Approves all sponsorship requests over $10,000'),
  (2, 'Mark Robinson', 'mark.r@example.com', 'Legal Counsel', 'Legal', 'Reviews all contracts for compliance'),
  (3, 'Sarah Chen', 'sarah.c@example.com', 'VP Engineering', 'Engineering', 'Approves engineering staff speaking engagements'),
  (4, 'Michael Okonjo', 'michael.o@example.com', 'Marketing Director', 'Marketing', 'Coordinates all event marketing')
ON CONFLICT (id) DO NOTHING;

-- Reset the PostgreSQL sequence for each table to the highest existing ID + 1
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events));
SELECT setval('cfp_submissions_id_seq', (SELECT MAX(id) FROM cfp_submissions));
SELECT setval('attendees_id_seq', (SELECT MAX(id) FROM attendees));
SELECT setval('sponsorships_id_seq', (SELECT MAX(id) FROM sponsorships));
SELECT setval('assets_id_seq', COALESCE((SELECT MAX(id) FROM assets), 0) + 1);
SELECT setval('stakeholders_id_seq', (SELECT MAX(id) FROM stakeholders));
SELECT setval('approval_workflows_id_seq', COALESCE((SELECT MAX(id) FROM approval_workflows), 0) + 1);
SELECT setval('workflow_reviewers_id_seq', COALESCE((SELECT MAX(id) FROM workflow_reviewers), 0) + 1);
SELECT setval('workflow_stakeholders_id_seq', COALESCE((SELECT MAX(id) FROM workflow_stakeholders), 0) + 1);
SELECT setval('workflow_comments_id_seq', COALESCE((SELECT MAX(id) FROM workflow_comments), 0) + 1);
SELECT setval('workflow_history_id_seq', COALESCE((SELECT MAX(id) FROM workflow_history), 0) + 1);