import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { z } from "zod";
import { randomBytes } from "crypto";

const candidateSchema = z.object({
    name: z.string().min(1, "Nama harus diisi"),
    vision: z.string().optional(),
    mission: z.string().optional(),
    photoUrl: z.string().optional(),
    orderPosition: z.number().optional(),
});

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allCandidates = await db.query.candidates.findMany({
            orderBy: (candidates, { asc }) => [asc(candidates.orderPosition)],
        });

        return NextResponse.json({ candidates: allCandidates });
    } catch (error) {
        console.error("Get candidates error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = candidateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { name, vision, mission, photoUrl, orderPosition } = validation.data;

        const candidateId = randomBytes(16).toString("hex");
        await db.insert(candidates).values({
            id: candidateId,
            name,
            vision: vision || null,
            mission: mission || null,
            photoUrl: photoUrl || null,
            orderPosition: orderPosition || 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true, message: "Kandidat berhasil ditambahkan" });
    } catch (error) {
        console.error("Create candidate error:", error);
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
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Candidate ID diperlukan" }, { status: 400 });
        }

        await db.update(candidates).set({ ...updateData, updatedAt: new Date() }).where(eq(candidates.id, id));

        return NextResponse.json({ success: true, message: "Kandidat berhasil diupdate" });
    } catch (error) {
        console.error("Update candidate error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get("id");

        if (!candidateId) {
            return NextResponse.json({ error: "Candidate ID diperlukan" }, { status: 400 });
        }

        await db.delete(candidates).where(eq(candidates.id, candidateId));

        return NextResponse.json({ success: true, message: "Kandidat berhasil dihapus" });
    } catch (error) {
        console.error("Delete candidate error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
