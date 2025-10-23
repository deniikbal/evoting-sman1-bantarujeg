import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, user, verification } from "@/db/schema/auth";

// Lazy import db to avoid build-time initialization
let _auth: ReturnType<typeof betterAuth> | null = null;

async function getAuth() {
    if (_auth) return _auth;

    // Import db lazily (dynamic import)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require("@/db");

    _auth = betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
            schema: {
                user: user,
                account: account,
                session: session,
                verification: verification,
            }
        }),
        emailAndPassword: {
            enabled: true,
        },
    });

    return _auth;
}

// Export lazy-loaded auth
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
    get(target, prop) {
        const authInstance = getAuth();
        return authInstance[prop as keyof typeof authInstance];
    }
});