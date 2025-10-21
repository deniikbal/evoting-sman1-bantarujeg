import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema/evoting';
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

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid enabled value' },
                { status: 400 }
            );
        }

        // Update voting enabled setting
        await db
            .update(settings)
            .set({
                value: enabled.toString(),
                updatedAt: new Date(),
            })
            .where(eq(settings.key, 'voting_enabled'));

        return NextResponse.json({
            message: `Voting ${enabled ? 'enabled' : 'disabled'} successfully`,
            enabled,
        });
    } catch (error) {
        console.error('Error toggling voting:', error);
        return NextResponse.json(
            { error: 'Failed to toggle voting' },
            { status: 500 }
        );
    }
}