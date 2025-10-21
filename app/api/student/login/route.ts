import { NextRequest, NextResponse } from "next/server";
import { verifyStudentCredentials, createStudentSession } from "@/lib/auth-student";
import { db, votingSettings } from "@/db";
import { z } from "zod";

const loginSchema = z.object({
    nis: z.string().min(1, "NIS harus diisi"),
    token: z.string().min(1, "Token harus diisi"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { nis, token } = validation.data;

        // Check if voting is open
        const settings = await db.query.votingSettings.findFirst();
        if (!settings || !settings.isVotingOpen) {
            return NextResponse.json(
                { error: "Pemilihan belum dibuka atau sudah ditutup" },
                { status: 403 }
            );
        }

        // Verify credentials
        const result = await verifyStudentCredentials(nis, token);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

        // Create session
        await createStudentSession(result.student!.id);

        return NextResponse.json({
            success: true,
            student: result.student,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
