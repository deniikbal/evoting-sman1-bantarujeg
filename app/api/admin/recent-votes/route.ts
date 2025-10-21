import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, students, candidates } from '@/db/schema/evoting';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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

        // Get recent votes with student and candidate names
        const recentVotes = await db
            .select({
                id: votes.id,
                studentName: students.name,
                candidateName: candidates.name,
                votingTime: votes.votingTime,
                ipAddress: votes.ipAddress,
            })
            .from(votes)
            .innerJoin(students, eq(votes.studentId, students.id))
            .innerJoin(candidates, eq(votes.candidateId, candidates.id))
            .orderBy(desc(votes.votingTime))
            .limit(10);

        return NextResponse.json({
            votes: recentVotes,
        });
    } catch (error) {
        console.error('Error fetching recent votes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recent votes' },
            { status: 500 }
        );
    }
}