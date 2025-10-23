import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';

// Lazy load database connection
let _db: BetterSQLite3Database<typeof authSchema & typeof evotingSchema> | null = null;

function initDatabase() {
    if (_db) return _db;

    // Skip database initialization during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.log('Skipping database initialization during build');
        // Return a mock database for build time
        return null as any;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Database = require('better-sqlite3');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { existsSync, mkdirSync } = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { dirname } = require('path');

        const dbPath = process.env.DATABASE_URL || 'evoting.db';

        // Ensure directory exists
        const dbDir = dirname(dbPath);
        if (dbDir !== '.' && !existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        const sqlite = new Database(dbPath);
        _db = drizzle(sqlite, {
            schema: { ...authSchema, ...evotingSchema }
        });

        return _db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Return mock during build
        return null as any;
    }
}

// Export lazy-loaded db
export const db = new Proxy({} as any, {
    get(target, prop) {
        const database = initDatabase();
        return database?.[prop as keyof typeof database];
    }
});

export * from './schema/auth';
export * from './schema/evoting';