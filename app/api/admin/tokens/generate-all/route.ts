import { NextResponse } from "next/server";
import { db, tokens, students } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { randomBytes } from "crypto";

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

export async function POST() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all students without active tokens
        const allStudents = await db.query.students.findMany();
        const generatedTokens: Array<{ nis: string; name: string; token: string }> = [];

        for (const student of allStudents) {
            // Check if student already has an active token
            const existingToken = await db.query.tokens.findFirst({
                where: eq(tokens.studentId, student.id),
            });

            if (!existingToken) {
                const tokenId = randomBytes(16).toString("hex");
                const tokenString = generateToken();

                await db.insert(tokens).values({
                    id: tokenId,
                    token: tokenString,
                    studentId: student.id,
                    isUsed: false,
                    generatedAt: new Date(),
                });

                generatedTokens.push({
                    nis: student.nis,
                    name: student.name,
                    token: tokenString,
                });
            }
        }

        return NextResponse.json({
            success: true,
            count: generatedTokens.length,
            tokens: generatedTokens,
            message: `Berhasil generate ${generatedTokens.length} token`,
        });
    } catch (error) {
        console.error("Generate all tokens error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
