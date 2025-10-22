import 'dotenv/config';
import { drizzle } from 'drizzle-orm/d1';
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';

// This function will be used with Cloudflare Workers/Pages
export function getD1Database(d1: D1Database) {
    return drizzle(d1, {
        schema: { ...authSchema, ...evotingSchema }
    });
}

export type D1DB = ReturnType<typeof getD1Database>;

export * from './schema/auth';
export * from './schema/evoting';
