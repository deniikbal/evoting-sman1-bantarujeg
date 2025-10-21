import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema/evoting';
import { candidateSchema } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/admin/candidates - Get all candidates
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

        const allCandidates = await db
            .select()
            .from(candidates)
            .orderBy(candidates.id);

        return NextResponse.json(allCandidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch candidates' },
            { status: 500 }
        );
    }
}

// POST /api/admin/candidates - Add new candidate
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
        const validatedData = candidateSchema.parse(body);

        // Insert new candidate
        const [newCandidate] = await db
            .insert(candidates)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(newCandidate, { status: 201 });
    } catch (error) {
        console.error('Error adding candidate:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid candidate data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to add candidate' },
            { status: 500 }
        );
    }
}