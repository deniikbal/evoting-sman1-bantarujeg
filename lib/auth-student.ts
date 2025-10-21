import { db, students, tokens } from "@/db";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export function generateSessionToken() {
    return randomBytes(32).toString("hex");
}

export async function verifyStudentCredentials(nis: string, token: string) {
    try {
        const student = await db.query.students.findFirst({
            where: eq(students.nis, nis),
        });

        if (!student) {
            return { success: false, error: "NIS tidak ditemukan" };
        }

        const studentToken = await db.query.tokens.findFirst({
            where: and(
                eq(tokens.token, token),
                eq(tokens.studentId, student.id),
                eq(tokens.isUsed, false)
            ),
        });

        if (!studentToken) {
            return { success: false, error: "Token tidak valid atau sudah digunakan" };
        }

        return { 
            success: true, 
            student: {
                id: student.id,
                nis: student.nis,
                name: student.name,
                class: student.class,
                hasVoted: student.hasVoted
            }
        };
    } catch (error) {
        console.error("Error verifying student credentials:", error);
        return { success: false, error: "Terjadi kesalahan sistem" };
    }
}

export async function createStudentSession(studentId: string) {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set("student_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    cookieStore.set("student_id", studentId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    return { sessionToken, expiresAt };
}

export async function getStudentSession() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("student_session");
        const studentId = cookieStore.get("student_id");

        if (!sessionToken || !studentId) {
            return null;
        }

        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId.value),
        });

        if (!student) {
            return null;
        }

        return {
            id: student.id,
            nis: student.nis,
            name: student.name,
            class: student.class,
            hasVoted: student.hasVoted,
        };
    } catch (error) {
        console.error("Error getting student session:", error);
        return null;
    }
}

export async function clearStudentSession() {
    const cookieStore = await cookies();
    cookieStore.delete("student_session");
    cookieStore.delete("student_id");
}
