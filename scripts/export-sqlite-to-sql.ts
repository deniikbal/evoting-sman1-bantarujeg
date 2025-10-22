import 'dotenv/config';
import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join } from 'path';

const dbPath = process.env.DATABASE_URL || 'evoting.db';
console.log('📖 Reading from database:', dbPath);

const db = new Database(dbPath);

// Get all tables
const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
).all() as { name: string }[];

console.log('📋 Found tables:', tables.map(t => t.name).join(', '));

let sqlOutput = '-- SQLite Database Export\n';
sqlOutput += '-- Generated at: ' + new Date().toISOString() + '\n\n';

// Export data from each table
for (const table of tables) {
    const tableName = table.name;
    console.log(`\n📦 Exporting table: ${tableName}`);
    
    // Get all rows
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    
    if (rows.length === 0) {
        console.log(`   ⚠️  No data in ${tableName}`);
        sqlOutput += `-- No data in table: ${tableName}\n\n`;
        continue;
    }
    
    console.log(`   ✓ Found ${rows.length} rows`);
    sqlOutput += `-- Table: ${tableName} (${rows.length} rows)\n`;
    
    // Generate INSERT statements
    for (const row of rows) {
        const rowData = row as Record<string, unknown>;
        const columns = Object.keys(rowData);
        const values = columns.map(col => {
            const val = rowData[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return `'${val}'`;
        });
        
        sqlOutput += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
    
    sqlOutput += '\n';
}

// Save to file
const outputPath = join(process.cwd(), 'drizzle', 'data-export.sql');
writeFileSync(outputPath, sqlOutput, 'utf8');

console.log('\n✅ Export completed!');
console.log('📄 File saved to:', outputPath);
console.log('\n📋 Next steps:');
console.log('1. Run: npm run d1:migrate (to create tables in D1)');
console.log('2. Run: wrangler d1 execute evoting-db --file=./drizzle/data-export.sql');

db.close();
