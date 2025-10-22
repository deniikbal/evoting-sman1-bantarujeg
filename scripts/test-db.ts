import 'dotenv/config';
import { db, admins, students, candidates } from '../db';
import { sql } from 'drizzle-orm';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        // Test querying admins table
        const adminsList = await db.select().from(admins);
        console.log('✓ Database connection successful!');
        console.log('Admins count:', adminsList.length);
        
        // Test querying students table
        const studentsList = await db.select().from(students);
        console.log('Students count:', studentsList.length);
        
        // Test querying candidates table
        const candidatesList = await db.select().from(candidates);
        console.log('Candidates count:', candidatesList.length);
        
        console.log('\n✓ All database operations working correctly!');
        
    } catch (error) {
        console.error('✗ Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
