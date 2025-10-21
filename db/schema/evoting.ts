import { pgTable, text, timestamp, boolean, integer, serial } from "drizzle-orm/pg-core";
import { z } from "zod";

// Students table - for student data and NIS
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  nis: text("nis").notNull().unique(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(),
  hasVoted: boolean("has_voted").default(false).notNull(),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
  updatedAt: timestamp("updated_at").default(new Date()).notNull(),
});

// Candidates table - for OSIS chair candidates
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio").notNull(),
  vision: text("vision"),
  mission: text("mission"),
  isActive: boolean("is_active").default(true).notNull(),
  voteCount: integer("vote_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
  updatedAt: timestamp("updated_at").default(new Date()).notNull(),
});

// Voting tokens table - for student login tokens
export const votingTokens = pgTable("voting_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(new Date()).notNull(),
  usedAt: timestamp("used_at"),
});

// Votes table - to store actual votes
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  tokenId: integer("token_id").references(() => votingTokens.id, { onDelete: "cascade" }).notNull(),
  votingTime: timestamp("voting_time").default(new Date()).notNull(),
  ipAddress: text("ip_address"),
});

// Settings table - for system settings like voting period
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").default(new Date()).notNull(),
});

// Zod schemas for validation
export const studentSchema = z.object({
  nis: z.string().min(1, "NIS is required"),
  name: z.string().min(1, "Name is required"),
  grade: z.string().min(1, "Grade is required"),
  class: z.string().min(1, "Class is required"),
});

export const candidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  vision: z.string().optional(),
  mission: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const votingTokenSchema = z.object({
  studentId: z.number().int().positive(),
  expiresInHours: z.number().int().positive().default(24),
});

export const voteSchema = z.object({
  candidateId: z.number().int().positive(),
  tokenId: z.number().int().positive(),
});

export const settingsSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
});

// Type exports
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type VotingToken = typeof votingTokens.$inferSelect;
export type NewVotingToken = typeof votingTokens.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;