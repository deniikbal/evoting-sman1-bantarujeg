import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const dbPath = process.env.DATABASE_URL || 'evoting.db';
console.log('Creating database at:', dbPath);

const db = new Database(dbPath);

const migrationPath = join(process.cwd(), 'drizzle', '0000_fixed_starfox.sql');
const migration = readFileSync(migrationPath, 'utf8');

const statements = migration.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);

console.log(`Executing ${statements.length} statements...`);

for (const statement of statements) {
    if (statement) {
        try {
            db.exec(statement);
            console.log('✓ Executed statement');
        } catch (error) {
            console.error('✗ Error executing statement:', error);
            console.error('Statement:', statement);
        }
    }
}

db.close();
console.log('Database initialized successfully!');
