import { NextRequest, NextResponse } from "next/server";
import { db, students } from "@/db";
import { eq, asc } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

// GET students by class ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: classId } = await params;

        // Get students in this class
        const classStudents = await db.query.students.findMany({
            where: eq(students.classId, classId),
            orderBy: [asc(students.name)],
        });

        return NextResponse.json({
            students: classStudents,
        });
    } catch (error) {
        console.error("Get class students error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
