import { NextRequest, NextResponse } from "next/server";
import { db, students } from "@/db";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { z } from "zod";
import { randomBytes } from "crypto";

const studentSchema = z.object({
    nis: z.string().min(1, "NIS harus diisi"),
    name: z.string().min(1, "Nama harus diisi"),
    class: z.string().min(1, "Kelas harus diisi"),
});

// GET all students
export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allStudents = await db.query.students.findMany({
            orderBy: (students, { asc }) => [asc(students.class), asc(students.name)],
        });

        return NextResponse.json({ students: allStudents });
    } catch (error) {
        console.error("Get students error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// POST create student
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = studentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { nis, name, class: studentClass } = validation.data;

        // Check if NIS already exists
        const existingStudent = await db.query.students.findFirst({
            where: eq(students.nis, nis),
        });

        if (existingStudent) {
            return NextResponse.json(
                { error: "NIS sudah terdaftar" },
                { status: 400 }
            );
        }

        const studentId = randomBytes(16).toString("hex");
        await db.insert(students).values({
            id: studentId,
            nis,
            name,
            class: studentClass,
            hasVoted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: "Siswa berhasil ditambahkan",
        });
    } catch (error) {
        console.error("Create student error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// DELETE student
export async function DELETE(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("id");

        if (!studentId) {
            return NextResponse.json(
                { error: "Student ID diperlukan" },
                { status: 400 }
            );
        }

        await db.delete(students).where(eq(students.id, studentId));

        return NextResponse.json({
            success: true,
            message: "Siswa berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete student error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
