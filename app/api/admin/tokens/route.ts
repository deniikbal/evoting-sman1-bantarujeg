import { NextRequest, NextResponse } from "next/server";
import { db, tokens, students } from "@/db";
import { eq, and } from "drizzle-orm";
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

// GET tokens
export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allTokens = await db.query.tokens.findMany({
            with: {
                student: true,
            },
            orderBy: (tokens, { desc }) => [desc(tokens.generatedAt)],
        });

        return NextResponse.json({ tokens: allTokens });
    } catch (error) {
        console.error("Get tokens error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// POST generate token
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

        // Check if student already has an active token
        const existingToken = await db.query.tokens.findFirst({
            where: and(
                eq(tokens.studentId, studentId),
                eq(tokens.isUsed, false)
            ),
        });

        if (existingToken) {
            return NextResponse.json(
                { error: "Siswa sudah memiliki token aktif" },
                { status: 400 }
            );
        }

        // Generate token
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
            message: "Token berhasil dibuat",
        });
    } catch (error) {
        console.error("Generate token error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// DELETE token
export async function DELETE(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tokenId = searchParams.get("id");

        if (!tokenId) {
            return NextResponse.json(
                { error: "Token ID diperlukan" },
                { status: 400 }
            );
        }

        await db.delete(tokens).where(eq(tokens.id, tokenId));

        return NextResponse.json({
            success: true,
            message: "Token berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete token error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
