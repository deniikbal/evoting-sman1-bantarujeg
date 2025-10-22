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

// GET tokens with pagination, search, and filter
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all"; // all, used, unused
        const offset = (page - 1) * limit;

        // Get all tokens with students for filtering
        const allTokens = await db.query.tokens.findMany({
            with: {
                student: true,
            },
            orderBy: (tokens, { desc }) => [desc(tokens.generatedAt)],
        });

        // Apply search filter
        let filteredTokens = allTokens;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredTokens = filteredTokens.filter(
                (token) =>
                    token.student?.nis?.toLowerCase().includes(searchLower) ||
                    token.student?.name?.toLowerCase().includes(searchLower) ||
                    token.token?.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (status === "used") {
            filteredTokens = filteredTokens.filter((token) => token.isUsed);
        } else if (status === "unused") {
            filteredTokens = filteredTokens.filter((token) => !token.isUsed);
        }

        const total = filteredTokens.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const tokens = filteredTokens.slice(offset, offset + limit);

        return NextResponse.json({
            tokens,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        });
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
