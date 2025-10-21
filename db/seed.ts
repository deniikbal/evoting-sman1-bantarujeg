import { db } from './index';
import { students, candidates, votingTokens, settings } from './schema/evoting';
import { eq } from 'drizzle-orm';

// Sample student data
const sampleStudents = [
  { nis: '1001', name: 'Ahmad Rizki', grade: '12', class: 'IPA 1' },
  { nis: '1002', name: 'Siti Nurhaliza', grade: '12', class: 'IPA 2' },
  { nis: '1003', name: 'Budi Santoso', grade: '11', class: 'IPS 1' },
  { nis: '1004', name: 'Dewi Lestari', grade: '11', class: 'IPS 2' },
  { nis: '1005', name: 'Muhammad Fachri', grade: '10', class: 'IPA 1' },
  { nis: '1006', name: 'Fitri Handayani', grade: '10', class: 'IPA 2' },
  { nis: '1007', name: 'Rizky Pratama', grade: '12', class: 'IPS 1' },
  { nis: '1008', name: 'Anisa Maharani', grade: '11', class: 'IPA 1' },
];

// Sample candidate data
const sampleCandidates = [
  {
    name: 'Ahmad Rizki',
    bio: 'Siswa berprestasi dengan visi memajukan OSIS dan meningkatkan kualitas pendidikan siswa.',
    vision: 'Mewujudkan OSIS yang inovatif, responsif, dan berorientasi pada kesejahteraan siswa.',
    mission: '1. Meningkatkan komunikasi antar siswa 2. Mengadakan program pengembangan bakat 3. Memperkuat sinergi dengan guru dan staff sekolah',
    photoUrl: '',
  },
  {
    name: 'Siti Nurhaliza',
    bio: 'Ketua kelas yang berpengalaman dalam organisasi dan memiliki leadership yang kuat.',
    vision: 'Membangun OSIS yang menjadi wadah pengembangan diri dan inovasi siswa.',
    mission: '1. Menciptakan lingkungan sekolah yang kondusif 2. Memfasilitasi ekstrakurikuler yang berkualitas 3. Meningkatkan partisipasi siswa dalam kegiatan sekolah',
    photoUrl: '',
  },
  {
    name: 'Budi Santoso',
    bio: 'Aktif dalam kegiatan sosial dan memiliki semangat untuk memajukan sekolah.',
    vision: 'OSIS sebagai pionir perubahan positif dan inspirasi bagi seluruh warga sekolah.',
    mission: '1. Memperkuat jiwa kepemimpinan siswa 2. Mengembangkan program lingkungan hijau 3. Meningkatkan prestasi akademik dan non-akademik',
    photoUrl: '',
  },
];

// Generate random token
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Function to seed the database
export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Seed students
    console.log('Seeding students...');
    for (const student of sampleStudents) {
      await db.insert(students).values(student).onConflictDoNothing({
        target: students.nis,
      });
    }

    // Seed candidates
    console.log('Seeding candidates...');
    for (const candidate of sampleCandidates) {
      await db.insert(candidates).values(candidate).onConflictDoNothing({
        target: candidates.name,
      });
    }

    // Generate tokens for all students
    console.log('Generating voting tokens...');
    const allStudents = await db.select().from(students);
    for (const student of allStudents) {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

      await db.insert(votingTokens).values({
        token,
        studentId: student.id,
        expiresAt,
      }).onConflictDoNothing({
        target: votingTokens.token,
      });
    }

    console.log('Database seeded successfully!');

    // Display generated tokens for testing
    console.log('\nGenerated tokens:');
    const tokens = await db
      .select({
        token: votingTokens.token,
        studentName: students.name,
        nis: students.nis,
      })
      .from(votingTokens)
      .leftJoin(students, eq(votingTokens.studentId, students.id));

    tokens.forEach(({ token, studentName, nis }) => {
      console.log(`NIS: ${nis} | Name: ${studentName} | Token: ${token}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}