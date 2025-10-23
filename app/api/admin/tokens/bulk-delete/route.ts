import { NextRequest, NextResponse } from "next/server";
import { db, tokens } from "@/db";
import { inArray } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

// POST bulk delete tokens
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { tokenIds } = body;

        if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
            return NextResponse.json(
                { error: "Token IDs diperlukan dan harus berupa array" },
                { status: 400 }
            );
        }

        // Delete all selected tokens
        await db.delete(tokens).where(inArray(tokens.id, tokenIds));

        return NextResponse.json({
            success: true,
            deletedCount: tokenIds.length,
            message: `Berhasil menghapus ${tokenIds.length} token`,
        });
    } catch (error) {
        console.error("Bulk delete tokens error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
