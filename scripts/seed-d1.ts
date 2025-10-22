import 'dotenv/config';
import * as schema from '../db/schema/evoting';
import { randomBytes, createHash } from 'crypto';

// For D1, we need to use wrangler d1 execute command
// This script is for reference only
// Use: wrangler d1 execute evoting-db --command="INSERT INTO admins..."

function hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
}

const adminId = randomBytes(16).toString("hex");
const settingsId = randomBytes(16).toString("hex");
const now = Date.now();

console.log("📝 SQL Commands for D1 Seeding:\n");
console.log("=== Admin User ===");
console.log(`INSERT INTO admins (id, name, email, password, role, created_at, updated_at) 
VALUES ('${adminId}', 'Administrator', 'admin@evoting.com', '${hashPassword('admin123')}', 'admin', ${now}, ${now});`);

console.log("\n=== Voting Settings ===");
console.log(`INSERT INTO voting_settings (id, is_voting_open, title, description, updated_at) 
VALUES ('${settingsId}', 0, 'Pemilihan Ketua OSIS', 'Pemilihan Ketua OSIS SMAN 1 Bantarujeg', ${now});`);

console.log("\n📋 To execute these commands:");
console.log("1. Development: wrangler d1 execute evoting-db --command=\"<SQL_COMMAND>\"");
console.log("2. Production: wrangler d1 execute evoting-db-production --env=production --command=\"<SQL_COMMAND>\"");
