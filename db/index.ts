import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';

const sqlite = new Database(process.env.DATABASE_URL || 'evoting.db');

export const db = drizzle(sqlite, {
    schema: { ...authSchema, ...evotingSchema }
});

export * from './schema/auth';
export * from './schema/evoting';