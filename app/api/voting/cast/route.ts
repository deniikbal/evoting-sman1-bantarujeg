import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, candidates, votingTokens, votes, settings } from '@/db/schema/evoting';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { voteSchema } from '@/db/schema/evoting';
import { z } from 'zod';
import { AuditLogger, extractRequestMetadata } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
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

        // Check if voting is enabled
        const votingSetting = await db
            .select({ value: settings.value })
            .from(settings)
            .where(eq(settings.key, 'voting_enabled'))
            .limit(1);

        if (votingSetting.length === 0 || votingSetting[0].value !== 'true') {
            return NextResponse.json(
                { error: 'Voting is currently disabled' },
                { status: 403 }
            );
        }

        // Check if student has already voted
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

        if (student[0].hasVoted) {
            return NextResponse.json(
                { error: 'You have already voted' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = voteSchema.parse(body);

        // Check if candidate exists and is active
        const candidate = await db
            .select({ id: candidates.id, name: candidates.name })
            .from(candidates)
            .where(and(
                eq(candidates.id, validatedData.candidateId),
                eq(candidates.isActive, true)
            ))
            .limit(1);

        if (candidate.length === 0) {
            return NextResponse.json(
                { error: 'Invalid candidate' },
                { status: 404 }
            );
        }

        // Find unused token for this student
        const token = await db
            .select({ id: votingTokens.id, token: votingTokens.token })
            .from(votingTokens)
            .where(and(
                eq(votingTokens.studentId, studentId),
                eq(votingTokens.isUsed, false)
            ))
            .limit(1);

        if (token.length === 0) {
            return NextResponse.json(
                { error: 'No valid voting token found' },
                { status: 403 }
            );
        }

        // Use a transaction to ensure atomicity
        await db.transaction(async (tx) => {
            // Record the vote
            await tx.insert(votes).values({
                candidateId: validatedData.candidateId,
                studentId: studentId,
                tokenId: token[0].id,
                ipAddress: request.ip || 'unknown',
            });

            // Mark token as used
            await tx
                .update(votingTokens)
                .set({
                    isUsed: true,
                    usedAt: new Date()
                })
                .where(eq(votingTokens.id, token[0].id));

            // Mark student as has voted
            await tx
                .update(students)
                .set({
                    hasVoted: true,
                    updatedAt: new Date()
                })
                .where(eq(students.id, studentId));

            // Increment candidate vote count
            await tx
                .update(candidates)
                .set({
                    voteCount: db.raw(`vote_count + 1`),
                    updatedAt: new Date()
                })
                .where(eq(candidates.id, validatedData.candidateId));
        });

        // Log the vote for audit purposes
        await AuditLogger.logVoteCast(
            studentId,
            validatedData.candidateId,
            token[0].id,
            extractRequestMetadata(request)
        );

        return NextResponse.json({
            success: true,
            message: 'Vote recorded successfully'
        });
    } catch (error) {
        console.error('Error casting vote:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to cast vote' },
            { status: 500 }
        );
    }
}