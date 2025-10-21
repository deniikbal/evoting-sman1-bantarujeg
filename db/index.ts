import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';

export const db = drizzle(process.env.DATABASE_URL!, {
    schema: { ...authSchema, ...evotingSchema }
});

export * from './schema/auth';
export * from './schema/evoting';