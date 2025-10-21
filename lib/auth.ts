import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema/auth";
import { students, votingTokens } from "@/db/schema/evoting";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            enabled: true,
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    // Custom credentials provider for student authentication
    credentials: {
        enabled: true,
        name: "student-login",
        fields: {
            nis: {
                type: "text",
                placeholder: "Enter your NIS",
                required: true,
            },
            token: {
                type: "text",
                placeholder: "Enter your voting token",
                required: true,
            },
        },
        async authorize(credentials) {
            try {
                const { nis, token } = credentials as {
                    nis: string;
                    token: string;
                };

                if (!nis || !token) {
                    return null;
                }

                // Find student by NIS
                const student = await db
                    .select()
                    .from(students)
                    .where(eq(students.nis, nis))
                    .limit(1);

                if (student.length === 0) {
                    return null;
                }

                // Find valid and unused token for this student
                const votingToken = await db
                    .select()
                    .from(votingTokens)
                    .where(eq(votingTokens.token, token))
                    .limit(1);

                if (votingToken.length === 0) {
                    return null;
                }

                const tokenData = votingToken[0];

                // Check if token belongs to the student and is not used/expired
                if (
                    tokenData.studentId !== student[0].id ||
                    tokenData.isUsed ||
                    new Date() > tokenData.expiresAt
                ) {
                    return null;
                }

                // Create a user session for the student
                // We'll use the student's NIS as the email field for compatibility
                const userData = {
                    id: `student-${student[0].id}`,
                    name: student[0].name,
                    email: `${student[0].nis}@student.local`, // Fake email for compatibility
                    image: null,
                    emailVerified: true,
                    role: "student",
                    studentId: student[0].id,
                    nis: student[0].nis,
                };

                return userData;
            } catch (error) {
                console.error("Student auth error:", error);
                return null;
            }
        },
    },
});