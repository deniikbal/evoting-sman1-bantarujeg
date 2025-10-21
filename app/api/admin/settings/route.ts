import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET /api/admin/settings - Get all settings
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

        // Get all settings
        const allSettings = await db
            .select({ key: settings.key, value: settings.value })
            .from(settings);

        // Convert to key-value object
        const settingsObject: Record<string, any> = {};
        allSettings.forEach(setting => {
            // Convert string values to appropriate types
            if (setting.key === 'voting_enabled') {
                settingsObject.votingEnabled = setting.value === 'true';
            } else {
                settingsObject[setting.key.replace(/_/g, '')] = setting.value;
            }
        });

        return NextResponse.json({
            votingEnabled: settingsObject.votingenabled || false,
            startTime: settingsObject.votingstarttime || '',
            endTime: settingsObject.votingendtime || '',
            schoolName: settingsObject.schoolname || 'SMAN 1 Bantarujeg',
            electionTitle: settingsObject.electiontitle || 'Pemilihan Ketua OSIS 2024/2025',
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// POST /api/admin/settings - Update settings
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
        const { votingEnabled, startTime, endTime, schoolName, electionTitle } = body;

        // Update or insert each setting
        const settingsToUpdate = [
            { key: 'voting_enabled', value: votingEnabled.toString() },
            { key: 'voting_start_time', value: startTime || '' },
            { key: 'voting_end_time', value: endTime || '' },
            { key: 'school_name', value: schoolName || 'SMAN 1 Bantarujeg' },
            { key: 'election_title', value: electionTitle || 'Pemilihan Ketua OSIS 2024/2025' },
        ];

        for (const setting of settingsToUpdate) {
            await db
                .update(settings)
                .set({
                    value: setting.value,
                    updatedAt: new Date(),
                })
                .where(eq(settings.key, setting.key));
        }

        return NextResponse.json({
            message: 'Settings updated successfully',
            settings: {
                votingEnabled,
                startTime,
                endTime,
                schoolName,
                electionTitle,
            },
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}