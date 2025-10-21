import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students } from '@/db/schema/evoting';
import { studentSchema } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/admin/students - Get all students
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: new Headers()
        });

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const allStudents = await db
            .select({
                id: students.id,
                nis: students.nis,
                name: students.name,
                grade: students.grade,
                class: students.class,
                hasVoted: students.hasVoted,
                createdAt: students.createdAt,
                updatedAt: students.updatedAt,
            })
            .from(students)
            .orderBy(students.name);

        return NextResponse.json(allStudents);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { error: 'Failed to fetch students' },
            { status: 500 }
        );
    }
}

// POST /api/admin/students - Add new student
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: new Headers()
        });

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = studentSchema.parse(body);

        // Check if NIS already exists
        const existingStudent = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.nis, validatedData.nis))
            .limit(1);

        if (existingStudent.length > 0) {
            return NextResponse.json(
                { error: 'NIS already exists' },
                { status: 400 }
            );
        }

        // Insert new student
        const [newStudent] = await db
            .insert(students)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(newStudent, { status: 201 });
    } catch (error) {
        console.error('Error adding student:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid student data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to add student' },
            { status: 500 }
        );
    }
}