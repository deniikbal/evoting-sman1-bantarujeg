import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votingTokens, students } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET /api/admin/tokens - Get all tokens with student info
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

        const allTokens = await db
            .select({
                token: votingTokens.token,
                studentName: students.name,
                nis: students.nis,
                isUsed: votingTokens.isUsed,
                createdAt: votingTokens.createdAt,
                usedAt: votingTokens.usedAt,
            })
            .from(votingTokens)
            .leftJoin(students, eq(votingTokens.studentId, students.id))
            .orderBy(votingTokens.createdAt);

        return NextResponse.json(allTokens);
    } catch (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}