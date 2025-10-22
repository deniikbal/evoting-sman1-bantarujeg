import { NextRequest, NextResponse } from "next/server";
import { db, classes, students } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";
import { z } from "zod";
import { randomBytes } from "crypto";

const classSchema = z.object({
    name: z.string().min(1, "Nama kelas harus diisi"),
    teacher: z.string().min(1, "Wali kelas harus diisi"),
});

// GET all classes with pagination and search
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
        const offset = (page - 1) * limit;

        // Get all classes with student count
        const allClasses = await db.query.classes.findMany({
            with: {
                students: true,
            },
        });

        // Map to include student count and apply natural sort
        const classesWithCount = allClasses
            .map((cls) => ({
                ...cls,
                studentCount: cls.students.length,
                students: undefined, // Remove students array from response
            }))
            .sort((a, b) => 
                a.name.localeCompare(b.name, undefined, { 
                    numeric: true, 
                    sensitivity: 'base' 
                })
            );

        // Apply search filter
        let filteredClasses = classesWithCount;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredClasses = filteredClasses.filter(
                (cls) =>
                    cls.name?.toLowerCase().includes(searchLower) ||
                    cls.teacher?.toLowerCase().includes(searchLower)
            );
        }

        const total = filteredClasses.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const paginatedClasses = filteredClasses.slice(offset, offset + limit);

        return NextResponse.json({
            classes: paginatedClasses,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        });
    } catch (error) {
        console.error("Get classes error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// POST create class
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = classSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, teacher } = validation.data;

        // Check if class name already exists
        const existingClass = await db.query.classes.findFirst({
            where: eq(classes.name, name),
        });

        if (existingClass) {
            return NextResponse.json(
                { error: "Nama kelas sudah terdaftar" },
                { status: 400 }
            );
        }

        const classId = randomBytes(16).toString("hex");
        await db.insert(classes).values({
            id: classId,
            name,
            teacher,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: "Kelas berhasil ditambahkan",
        });
    } catch (error) {
        console.error("Create class error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// PUT update class
export async function PUT(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, teacher } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Class ID diperlukan" },
                { status: 400 }
            );
        }

        const validation = classSchema.safeParse({ name, teacher });

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        // Check if class exists
        const existingClass = await db.query.classes.findFirst({
            where: eq(classes.id, id),
        });

        if (!existingClass) {
            return NextResponse.json(
                { error: "Kelas tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if class name already used by another class
        const nameCheck = await db.query.classes.findFirst({
            where: eq(classes.name, name),
        });

        if (nameCheck && nameCheck.id !== id) {
            return NextResponse.json(
                { error: "Nama kelas sudah digunakan oleh kelas lain" },
                { status: 400 }
            );
        }

        await db.update(classes)
            .set({
                name,
                teacher,
                updatedAt: new Date(),
            })
            .where(eq(classes.id, id));

        return NextResponse.json({
            success: true,
            message: "Data kelas berhasil diperbarui",
        });
    } catch (error) {
        console.error("Update class error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// DELETE class
export async function DELETE(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("id");

        if (!classId) {
            return NextResponse.json(
                { error: "Class ID diperlukan" },
                { status: 400 }
            );
        }

        await db.delete(classes).where(eq(classes.id, classId));

        return NextResponse.json({
            success: true,
            message: "Kelas berhasil dihapus",
        });
    } catch (error) {
        console.error("Delete class error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
