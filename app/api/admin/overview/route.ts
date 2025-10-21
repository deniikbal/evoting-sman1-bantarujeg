import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, candidates, votes, votingTokens, settings } from '@/db/schema/evoting';
import { eq, sql } from 'drizzle-orm';
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

        // Get total students
        const totalStudentsResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(students);

        // Get total active candidates
        const totalCandidatesResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(candidates)
            .where(eq(candidates.isActive, true));

        // Get total votes
        const totalVotesResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(votes);

        // Get pending tokens
        const pendingTokensResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(votingTokens)
            .where(eq(votingTokens.isUsed, false));

        // Get voting enabled status
        const votingSetting = await db
            .select({ value: settings.value })
            .from(settings)
            .where(eq(settings.key, 'voting_enabled'))
            .limit(1);

        const totalStudents = totalStudentsResult[0]?.count || 0;
        const totalCandidates = totalCandidatesResult[0]?.count || 0;
        const totalVotes = totalVotesResult[0]?.count || 0;
        const pendingTokens = pendingTokensResult[0]?.count || 0;
        const votingEnabled = votingSetting.length > 0 ? votingSetting[0].value === 'true' : false;
        const turnoutPercentage = totalStudents > 0 ? (totalVotes / totalStudents) * 100 : 0;

        return NextResponse.json({
            totalStudents,
            totalCandidates,
            totalVotes,
            pendingTokens,
            votingEnabled,
            turnoutPercentage,
        });
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overview data' },
            { status: 500 }
        );
    }
}