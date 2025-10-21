import { db, admins } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";

export function hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
    const inputHash = hashPassword(password);
    return inputHash === hashedPassword;
}

export function generateSessionToken() {
    return randomBytes(32).toString("hex");
}

export async function verifyAdminCredentials(email: string, password: string) {
    try {
        const admin = await db.query.admins.findFirst({
            where: eq(admins.email, email),
        });

        if (!admin) {
            return { success: false, error: "Email atau password salah" };
        }

        const isPasswordValid = verifyPassword(password, admin.password);

        if (!isPasswordValid) {
            return { success: false, error: "Email atau password salah" };
        }

        return {
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        };
    } catch (error) {
        console.error("Error verifying admin credentials:", error);
        return { success: false, error: "Terjadi kesalahan sistem" };
    }
}

export async function createAdminSession(adminId: string) {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    cookieStore.set("admin_id", adminId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    return { sessionToken, expiresAt };
}

export async function getAdminSession() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("admin_session");
        const adminId = cookieStore.get("admin_id");

        if (!sessionToken || !adminId) {
            return null;
        }

        const admin = await db.query.admins.findFirst({
            where: eq(admins.id, adminId.value),
        });

        if (!admin) {
            return null;
        }

        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        };
    } catch (error) {
        console.error("Error getting admin session:", error);
        return null;
    }
}

export async function clearAdminSession() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    cookieStore.delete("admin_id");
}
