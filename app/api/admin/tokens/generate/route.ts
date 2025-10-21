import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votingTokens, students } from '@/db/schema/evoting';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Generate random token
function generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST() {
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

        // Get all students who don't have tokens or have expired tokens
        const studentsWithoutTokens = await db
            .select({
                id: students.id,
                name: students.name,
                nis: students.nis,
            })
            .from(students);

        let generatedCount = 0;

        for (const student of studentsWithoutTokens) {
            // Check if student already has an unused token
            const existingToken = await db
                .select({ id: votingTokens.id })
                .from(votingTokens)
                .where(and(
                    eq(votingTokens.studentId, student.id),
                    eq(votingTokens.isUsed, false)
                ))
                .limit(1);

            // Only generate token if student doesn't have an unused one
            if (existingToken.length === 0) {
                const token = generateToken();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

                await db.insert(votingTokens).values({
                    token,
                    studentId: student.id,
                    expiresAt,
                    createdAt: new Date(),
                });

                generatedCount++;
            }
        }

        return NextResponse.json({
            message: 'Tokens generated successfully',
            count: generatedCount,
        });
    } catch (error) {
        console.error('Error generating tokens:', error);
        return NextResponse.json(
            { error: 'Failed to generate tokens' },
            { status: 500 }
        );
    }
}