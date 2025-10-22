import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = process.env.DATABASE_URL || 'evoting.db';

// Ensure directory exists
const dbDir = dirname(dbPath);
if (dbDir !== '.' && !existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, {
    schema: { ...authSchema, ...evotingSchema }
});

export * from './schema/auth';
export * from './schema/evoting';