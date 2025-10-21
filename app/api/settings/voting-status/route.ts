import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const votingEnabled = await db
            .select({ value: settings.value })
            .from(settings)
            .where(eq(settings.key, 'voting_enabled'))
            .limit(1);

        const startTime = await db
            .select({ value: settings.value })
            .from(settings)
            .where(eq(settings.key, 'voting_start_time'))
            .limit(1);

        const endTime = await db
            .select({ value: settings.value })
            .from(settings)
            .where(eq(settings.key, 'voting_end_time'))
            .limit(1);

        return NextResponse.json({
            enabled: votingEnabled.length > 0 ? votingEnabled[0].value === 'true' : false,
            startTime: startTime.length > 0 ? startTime[0].value : null,
            endTime: endTime.length > 0 ? endTime[0].value : null,
        });
    } catch (error) {
        console.error('Error fetching voting status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voting status' },
            { status: 500 }
        );
    }
}