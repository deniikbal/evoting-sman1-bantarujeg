import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, votingTokens } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: new Headers()
        });

        if (!session?.user || session.user.role !== 'student') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const studentId = session.user.studentId;
        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID not found' },
                { status: 400 }
            );
        }

        // Check if student exists and has voted
        const student = await db
            .select({ hasVoted: students.hasVoted })
            .from(students)
            .where(eq(students.id, studentId))
            .limit(1);

        if (student.length === 0) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            hasVoted: student[0].hasVoted
        });
    } catch (error) {
        console.error('Error checking voting status:', error);
        return NextResponse.json(
            { error: 'Failed to check voting status' },
            { status: 500 }
        );
    }
}