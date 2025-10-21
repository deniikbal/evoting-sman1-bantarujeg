import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { candidates } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const activeCandidates = await db
            .select({
                id: candidates.id,
                name: candidates.name,
                photoUrl: candidates.photoUrl,
                bio: candidates.bio,
                vision: candidates.vision,
                mission: candidates.mission,
            })
            .from(candidates)
            .where(eq(candidates.isActive, true))
            .orderBy(candidates.id);

        return NextResponse.json(activeCandidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch candidates' },
            { status: 500 }
        );
    }
}