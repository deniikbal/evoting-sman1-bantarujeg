import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Admins table for admin authentication
export const admins = pgTable("admins", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

// Students table
export const students = pgTable("students", {
    id: text("id").primaryKey(),
    nis: text("nis").notNull().unique(), // Student ID number
    name: text("name").notNull(),
    class: text("class").notNull(), // e.g., "XII IPA 1"
    hasVoted: boolean("has_voted")
        .$defaultFn(() => false)
        .notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

// Voting tokens table
export const tokens = pgTable("tokens", {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(), // The actual token string
    studentId: text("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    isUsed: boolean("is_used")
        .$defaultFn(() => false)
        .notNull(),
    generatedAt: timestamp("generated_at")
        .$defaultFn(() => new Date())
        .notNull(),
    usedAt: timestamp("used_at"),
});

// Candidates table
export const candidates = pgTable("candidates", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    vision: text("vision"),
    mission: text("mission"),
    orderPosition: integer("order_position").notNull().default(0), // For display order
    isActive: boolean("is_active")
        .$defaultFn(() => true)
        .notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

// Votes table for audit and results
export const votes = pgTable("votes", {
    id: text("id").primaryKey(),
    studentId: text("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
        .notNull()
        .references(() => candidates.id, { onDelete: "cascade" }),
    votedAt: timestamp("voted_at")
        .$defaultFn(() => new Date())
        .notNull(),
});

// Voting settings table
export const votingSettings = pgTable("voting_settings", {
    id: text("id").primaryKey(),
    isVotingOpen: boolean("is_voting_open")
        .$defaultFn(() => false)
        .notNull(),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    title: text("title").notNull().default("Pemilihan Ketua OSIS"),
    description: text("description"),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedBy: text("updated_by"), // admin ID who made the change
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
    tokens: many(tokens),
    votes: many(votes),
}));

export const tokensRelations = relations(tokens, ({ one }) => ({
    student: one(students, {
        fields: [tokens.studentId],
        references: [students.id],
    }),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
    votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
    student: one(students, {
        fields: [votes.studentId],
        references: [students.id],
    }),
    candidate: one(candidates, {
        fields: [votes.candidateId],
        references: [candidates.id],
    }),
}));
