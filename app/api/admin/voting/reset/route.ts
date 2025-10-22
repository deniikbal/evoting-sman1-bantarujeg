import { NextRequest, NextResponse } from "next/server";
import { db, votes, students, tokens, admins } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession, verifyPassword } from "@/lib/auth-admin";
import { z } from "zod";

const resetSchema = z.object({
    password: z.string().min(1, "Password harus diisi"),
});

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        const validation = resetSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { password } = validation.data;

        const adminData = await db.query.admins.findFirst({
            where: eq(admins.id, admin.id),
        });

        if (!adminData) {
            return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
        }

        const isPasswordValid = verifyPassword(password, adminData.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Password salah" },
                { status: 401 }
            );
        }

        await db.delete(votes);

        await db.update(students).set({
            hasVoted: false,
        });

        await db.update(tokens).set({
            isUsed: false,
            usedAt: null,
        });

        return NextResponse.json({
            success: true,
            message: "Data voting berhasil direset",
        });
    } catch (error) {
        console.error("Reset voting error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
