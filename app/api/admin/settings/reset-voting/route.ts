import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, students, candidates, votingTokens, settings } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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

        // Use a transaction to ensure all operations succeed or fail together
        await db.transaction(async (tx) => {
            // Delete all votes
            await tx.delete(votes);

            // Reset all students voting status
            await tx
                .update(students)
                .set({
                    hasVoted: false,
                    updatedAt: new Date(),
                });

            // Reset all candidate vote counts
            await tx
                .update(candidates)
                .set({
                    voteCount: 0,
                    updatedAt: new Date(),
                });

            // Delete all voting tokens
            await tx.delete(votingTokens);

            // Disable voting
            await tx
                .update(settings)
                .set({
                    value: 'false',
                    updatedAt: new Date(),
                })
                .where(eq(settings.key, 'voting_enabled'));
        });

        return NextResponse.json({
            message: 'Voting data reset successfully',
        });
    } catch (error) {
        console.error('Error resetting voting:', error);
        return NextResponse.json(
            { error: 'Failed to reset voting data' },
            { status: 500 }
        );
    }
}