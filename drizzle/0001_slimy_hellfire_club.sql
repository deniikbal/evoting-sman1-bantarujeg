CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"vision" text,
	"mission" text,
	"order_position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"teacher" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "classes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"nis" text NOT NULL,
	"name" text NOT NULL,
	"class" text NOT NULL,
	"has_voted" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "students_nis_unique" UNIQUE("nis")
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"student_id" text NOT NULL,
	"is_used" boolean NOT NULL,
	"generated_at" timestamp NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"voted_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"is_voting_open" boolean NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"title" text DEFAULT 'Pemilihan Ketua OSIS' NOT NULL,
	"description" text,
	"updated_at" timestamp NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;