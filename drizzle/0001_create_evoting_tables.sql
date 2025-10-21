-- Migration: Create e-voting system tables
-- Created for SMAN 1 Bantarujeg e-voting application

-- Create students table
CREATE TABLE IF NOT EXISTS "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"nis" text NOT NULL,
	"name" text NOT NULL,
	"grade" text NOT NULL,
	"class" text NOT NULL,
	"has_voted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"bio" text NOT NULL,
	"vision" text,
	"mission" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create voting_tokens table
CREATE TABLE IF NOT EXISTS "voting_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"student_id" integer NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "voting_tokens_token_unique" UNIQUE("token")
);

-- Create votes table
CREATE TABLE IF NOT EXISTS "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"token_id" integer NOT NULL,
	"voting_time" timestamp DEFAULT now() NOT NULL,
	"ip_address" text
);

-- Create settings table
CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_students_nis" ON "students" ("nis");
CREATE INDEX IF NOT EXISTS "idx_students_has_voted" ON "students" ("has_voted");
CREATE INDEX IF NOT EXISTS "idx_candidates_is_active" ON "candidates" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_voting_tokens_token" ON "voting_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_voting_tokens_student_id" ON "voting_tokens" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_voting_tokens_is_used" ON "voting_tokens" ("is_used");
CREATE INDEX IF NOT EXISTS "idx_votes_candidate_id" ON "votes" ("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_votes_student_id" ON "votes" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_votes_token_id" ON "votes" ("token_id");
CREATE INDEX IF NOT EXISTS "idx_settings_key" ON "settings" ("key");

-- Create foreign key constraints
DO $$ BEGIN
ALTER TABLE "voting_tokens" ADD CONSTRAINT "voting_tokens_student_id_students_id_fk"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "votes" ADD CONSTRAINT "votes_student_id_students_id_fk"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
ALTER TABLE "votes" ADD CONSTRAINT "votes_token_id_voting_tokens_id_fk"
FOREIGN KEY ("token_id") REFERENCES "voting_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

-- Insert default settings
INSERT INTO "settings" ("key", "value", "description")
VALUES
('voting_enabled', 'false', 'Enable/disable voting period'),
('voting_start_time', '', 'Voting period start time'),
('voting_end_time', '', 'Voting period end time'),
('school_name', 'SMAN 1 Bantarujeg', 'School name'),
('election_title', 'Pemilihan Ketua OSIS 2024/2025', 'Election title')
ON CONFLICT ("key") DO NOTHING;