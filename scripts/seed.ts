import 'dotenv/config';
import { db } from '../db';
import * as schema from '../db/schema/evoting';
import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';

function hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
}

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // Check if admin already exists
        const existingAdmin = await db.query.admins.findFirst({
            where: eq(schema.admins.email, "admin@evoting.com"),
        });

        if (!existingAdmin) {
            // Create default admin
            const adminId = randomBytes(16).toString("hex");
            await db.insert(schema.admins).values({
                id: adminId,
                name: "Administrator",
                email: "admin@evoting.com",
                password: hashPassword("admin123"),
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log("✅ Default admin created");
            console.log("   Email: admin@evoting.com");
            console.log("   Password: admin123");
        } else {
            console.log("ℹ️  Admin already exists");
        }

        // Check if voting settings exists
        const existingSettings = await db.query.votingSettings.findFirst();

        if (!existingSettings) {
            // Create default voting settings
            const settingsId = randomBytes(16).toString("hex");
            await db.insert(schema.votingSettings).values({
                id: settingsId,
                isVotingOpen: false,
                title: "Pemilihan Ketua OSIS",
                description: "Pemilihan Ketua OSIS SMAN 1 Bantarujeg",
                updatedAt: new Date(),
            });
            console.log("✅ Default voting settings created");
        } else {
            console.log("ℹ️  Voting settings already exists");
        }

        console.log("🎉 Seeding completed!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
