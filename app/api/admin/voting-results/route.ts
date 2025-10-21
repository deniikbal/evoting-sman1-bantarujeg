import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates, votes } from '@/db/schema/evoting';
import { eq, sql, desc } from 'drizzle-orm';
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

        // Get total votes count
        const totalVotesResult = await db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(votes);

        const totalVotes = totalVotesResult[0]?.count || 0;

        // Get candidates with vote counts
        const candidatesWithVotes = await db
            .select({
                id: candidates.id,
                name: candidates.name,
                photoUrl: candidates.photoUrl,
                voteCount: candidates.voteCount,
            })
            .from(candidates)
            .where(eq(candidates.isActive, true))
            .orderBy(desc(candidates.voteCount));

        // Calculate percentages
        const candidatesWithPercentages = candidatesWithVotes.map(candidate => ({
            ...candidate,
            percentage: totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0,
        }));

        return NextResponse.json({
            candidates: candidatesWithPercentages,
            totalVotes,
        });
    } catch (error) {
        console.error('Error fetching voting results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voting results' },
            { status: 500 }
        );
    }
}