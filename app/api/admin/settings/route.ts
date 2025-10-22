import { NextRequest, NextResponse } from "next/server";
import { db, votingSettings } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { randomBytes } from "crypto";

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let settings = await db.query.votingSettings.findFirst();

        // Create default settings if not exists
        if (!settings) {
            const settingsId = randomBytes(16).toString("hex");
            await db.insert(votingSettings).values({
                id: settingsId,
                isVotingOpen: false,
                title: "Pemilihan Ketua OSIS",
                description: "Pemilihan Ketua OSIS SMAN 1 Bantarujeg",
                updatedAt: new Date(),
            });

            settings = await db.query.votingSettings.findFirst();
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Get settings error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { isVotingOpen, title, description } = body;

        const settings = await db.query.votingSettings.findFirst();

        if (!settings) {
            // Create if not exists
            const settingsId = randomBytes(16).toString("hex");
            await db.insert(votingSettings).values({
                id: settingsId,
                isVotingOpen: isVotingOpen || false,
                title: title || "Pemilihan Ketua OSIS",
                description: description || null,
                updatedAt: new Date(),
                updatedBy: admin.id,
            });
        } else {
            // Update existing
            await db
                .update(votingSettings)
                .set({
                    isVotingOpen: isVotingOpen !== undefined ? isVotingOpen : settings.isVotingOpen,
                    title: title || settings.title,
                    description: description !== undefined ? description : settings.description,
                    updatedAt: new Date(),
                    updatedBy: admin.id,
                })
                .where(eq(votingSettings.id, settings.id));
        }

        return NextResponse.json({
            success: true,
            message: "Pengaturan berhasil diupdate",
        });
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
