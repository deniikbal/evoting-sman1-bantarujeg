import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getAdminSession } from "@/lib/auth-admin";

// GET all tokens for export
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all tokens with student and class information
        const allTokens = await db.query.tokens.findMany({
            with: {
                student: {
                    with: {
                        class: true,
                    },
                },
            },
            orderBy: (tokens, { desc }) => [desc(tokens.generatedAt)],
        });

        // Format data for export
        const exportData = allTokens.map(token => ({
            name: token.student?.name || "-",
            class: token.student?.class?.name || token.student?.class || "-",
            token: token.token,
            status: token.isUsed ? "Terpakai" : "Belum Terpakai",
            nis: token.student?.nis || "-",
        }));

        return NextResponse.json({
            success: true,
            data: exportData,
            total: exportData.length,
        });
    } catch (error) {
        console.error("Export tokens error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
