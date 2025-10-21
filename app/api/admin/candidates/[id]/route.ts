import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema/evoting';
import { candidateSchema } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// PUT /api/admin/candidates/[id] - Update candidate
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const candidateId = parseInt(params.id);
        if (isNaN(candidateId)) {
            return NextResponse.json(
                { error: 'Invalid candidate ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validatedData = candidateSchema.parse(body);

        // Check if candidate exists
        const existingCandidate = await db
            .select({ id: candidates.id })
            .from(candidates)
            .where(eq(candidates.id, candidateId))
            .limit(1);

        if (existingCandidate.length === 0) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        // Update candidate
        const [updatedCandidate] = await db
            .update(candidates)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(candidates.id, candidateId))
            .returning();

        return NextResponse.json(updatedCandidate);
    } catch (error) {
        console.error('Error updating candidate:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid candidate data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update candidate' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/candidates/[id] - Delete candidate
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const candidateId = parseInt(params.id);
        if (isNaN(candidateId)) {
            return NextResponse.json(
                { error: 'Invalid candidate ID' },
                { status: 400 }
            );
        }

        // Check if candidate exists
        const existingCandidate = await db
            .select({ id: candidates.id })
            .from(candidates)
            .where(eq(candidates.id, candidateId))
            .limit(1);

        if (existingCandidate.length === 0) {
            return NextResponse.json(
                { error: 'Candidate not found' },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false instead of actually deleting
        const [updatedCandidate] = await db
            .update(candidates)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(candidates.id, candidateId))
            .returning();

        return NextResponse.json({
            message: 'Candidate deleted successfully',
            candidate: updatedCandidate,
        });
    } catch (error) {
        console.error('Error deleting candidate:', error);
        return NextResponse.json(
            { error: 'Failed to delete candidate' },
            { status: 500 }
        );
    }
}