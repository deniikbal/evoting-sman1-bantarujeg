import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

// Import all schemas
import * as authSchema from './schema/auth';
import * as evotingSchema from './schema/evoting';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...evotingSchema,
  },
});

// Export all schema tables
export const {
  user,
  session,
  account,
  verification,
} = authSchema;

export const {
  students,
  candidates,
  votingTokens,
  votes,
  settings,
} = evotingSchema;

// Export types
export type * from './schema/auth';
export type * from './schema/evoting';