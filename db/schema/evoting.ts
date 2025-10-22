import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Admins table for admin authentication
export const admins = sqliteTable("admins", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
});

// Classes table
export const classes = sqliteTable("classes", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(), // e.g., "XII IPA 1"
    teacher: text("teacher").notNull(), // Wali kelas
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
});

// Students table
export const students = sqliteTable("students", {
    id: text("id").primaryKey(),
    nis: text("nis").notNull().unique(), // Student ID number
    name: text("name").notNull(),
    class: text("class").notNull(), // e.g., "XII IPA 1" - kept for backward compatibility
    classId: text("class_id").references(() => classes.id, { onDelete: "set null" }), // Foreign key to classes
    hasVoted: integer("has_voted", { mode: "boolean" })
        .$defaultFn(() => false)
        .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
});

// Voting tokens table
export const tokens = sqliteTable("tokens", {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(), // The actual token string
    studentId: text("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    isUsed: integer("is_used", { mode: "boolean" })
        .$defaultFn(() => false)
        .notNull(),
    generatedAt: integer("generated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    usedAt: integer("used_at", { mode: "timestamp" }),
});

// Candidates table
export const candidates = sqliteTable("candidates", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    vision: text("vision"),
    mission: text("mission"),
    orderPosition: integer("order_position").notNull().default(0), // For display order
    isActive: integer("is_active", { mode: "boolean" })
        .$defaultFn(() => true)
        .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
});

// Votes table for audit and results
export const votes = sqliteTable("votes", {
    id: text("id").primaryKey(),
    studentId: text("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
        .notNull()
        .references(() => candidates.id, { onDelete: "cascade" }),
    votedAt: integer("voted_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
});

// Voting settings table
export const votingSettings = sqliteTable("voting_settings", {
    id: text("id").primaryKey(),
    isVotingOpen: integer("is_voting_open", { mode: "boolean" })
        .$defaultFn(() => false)
        .notNull(),
    startTime: integer("start_time", { mode: "timestamp" }),
    endTime: integer("end_time", { mode: "timestamp" }),
    title: text("title").notNull().default("Pemilihan Ketua OSIS"),
    description: text("description"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedBy: text("updated_by"), // admin ID who made the change
});

// Relations
export const classesRelations = relations(classes, ({ many }) => ({
    students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
    class: one(classes, {
        fields: [students.classId],
        references: [classes.id],
    }),
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
