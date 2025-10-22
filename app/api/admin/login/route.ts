import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/auth-admin";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(1, "Password harus diisi"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        const result = await verifyAdminCredentials(email, password);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

        await createAdminSession(result.admin!.id);

        return NextResponse.json({
            success: true,
            admin: result.admin,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
