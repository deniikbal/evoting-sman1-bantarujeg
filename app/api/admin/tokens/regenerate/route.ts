import { NextRequest, NextResponse } from "next/server";
import { db, tokens, students } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

// Generate 8 character alphanumeric token
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
        token += chars[bytes[i] % chars.length];
    }
    return token;
}

// POST regenerate token for a student
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: "Student ID diperlukan" },
                { status: 400 }
            );
        }

        // Check if student exists
        const student = await db.query.students.findFirst({
            where: eq(students.id, studentId),
        });

        if (!student) {
            return NextResponse.json(
                { error: "Siswa tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if student already has a used token
        const existingToken = await db.query.tokens.findFirst({
            where: eq(tokens.studentId, studentId),
        });

        if (existingToken && existingToken.isUsed) {
            return NextResponse.json(
                { error: "Token sudah terpakai. Siswa sudah melakukan voting, tidak dapat di-generate ulang" },
                { status: 400 }
            );
        }

        // Delete existing tokens for this student (only unused tokens at this point)
        await db.delete(tokens).where(eq(tokens.studentId, studentId));

        // Generate new token
        const tokenId = randomBytes(16).toString("hex");
        const tokenString = generateToken();

        await db.insert(tokens).values({
            id: tokenId,
            token: tokenString,
            studentId: studentId,
            isUsed: false,
            generatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            token: tokenString,
            message: "Token berhasil di-generate ulang",
        });
    } catch (error) {
        console.error("Regenerate token error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
