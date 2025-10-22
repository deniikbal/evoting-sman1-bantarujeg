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
    classId: z.string().optional(),
});

// GET all students with pagination, search, and filter
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const classFilter = searchParams.get("class") || "all";
        const voteStatus = searchParams.get("voteStatus") || "all"; // all, voted, not_voted
        const offset = (page - 1) * limit;

        // Get all students for filtering
        const allStudents = await db.query.students.findMany();
        
        // Sort by NIS descending (terbesar ke terkecil)
        allStudents.sort((a, b) => {
            // Convert NIS to number for proper numeric comparison
            const nisA = parseInt(a.nis) || 0;
            const nisB = parseInt(b.nis) || 0;
            return nisB - nisA; // Descending order (besar ke kecil)
        });

        // Apply search filter
        let filteredStudents = allStudents;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredStudents = filteredStudents.filter(
                (student) =>
                    student.nis?.toLowerCase().includes(searchLower) ||
                    student.name?.toLowerCase().includes(searchLower) ||
                    student.class?.toLowerCase().includes(searchLower)
            );
        }

        // Apply class filter
        if (classFilter !== "all") {
            filteredStudents = filteredStudents.filter((student) => student.class === classFilter);
        }

        // Apply vote status filter
        if (voteStatus === "voted") {
            filteredStudents = filteredStudents.filter((student) => student.hasVoted);
        } else if (voteStatus === "not_voted") {
            filteredStudents = filteredStudents.filter((student) => !student.hasVoted);
        }

        const total = filteredStudents.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const students = filteredStudents.slice(offset, offset + limit);

        // Get unique classes for filter options with natural sort
        const uniqueClasses = [...new Set(allStudents.map((s) => s.class))].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            filters: {
                classes: uniqueClasses,
            },
        });
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
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { nis, name, class: studentClass, classId } = validation.data;

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
            classId: classId || null,
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

// PUT update student
export async function PUT(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, nis, name, class: studentClass, classId } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Student ID diperlukan" },
                { status: 400 }
            );
        }

        const validation = studentSchema.safeParse({ nis, name, class: studentClass, classId });

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if student exists
        const existingStudent = await db.query.students.findFirst({
            where: eq(students.id, id),
        });

        if (!existingStudent) {
            return NextResponse.json(
                { error: "Siswa tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if NIS already used by another student
        const nisCheck = await db.query.students.findFirst({
            where: eq(students.nis, nis),
        });

        if (nisCheck && nisCheck.id !== id) {
            return NextResponse.json(
                { error: "NIS sudah digunakan oleh siswa lain" },
                { status: 400 }
            );
        }

        await db.update(students)
            .set({
                nis,
                name,
                class: studentClass,
                classId: classId || null,
                updatedAt: new Date(),
            })
            .where(eq(students.id, id));

        return NextResponse.json({
            success: true,
            message: "Data siswa berhasil diperbarui",
        });
    } catch (error) {
        console.error("Update student error:", error);
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
