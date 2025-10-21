import { NextResponse } from "next/server";
import { clearStudentSession } from "@/lib/auth-student";

export async function POST() {
    try {
        await clearStudentSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
