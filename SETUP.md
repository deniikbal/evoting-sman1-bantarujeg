# 📦 Setup E-Voting SMAN 1 Bantarujeg

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (via Docker atau lokal)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

File `.env` sudah dikonfigurasi. Pastikan DATABASE_URL sudah benar:

```env
DATABASE_URL=postgresql://postgres:Arshena1502@localhost:5432/voting
POSTGRES_DB=voting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Arshena1502

BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### 3. Start Database

```bash
# Jalankan PostgreSQL dengan Docker
docker compose up postgres -d
```

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Seed Default Data

```bash
npm run db:seed
```

Ini akan membuat:
- **Admin default**
  - Email: `admin@evoting.com`
  - Password: `admin123`
- **Voting settings default**

### 6. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

---

## 📚 Fitur Aplikasi

### Student Portal (`/student/login`)
- Login menggunakan NIS + Token
- Melihat kandidat
- Memberikan suara (hanya sekali)
- Konfirmasi setelah voting

### Admin Panel (`/admin/login`)
- Dashboard dengan statistik real-time
- **Manajemen Siswa**: CRUD siswa
- **Manajemen Kandidat**: CRUD kandidat dengan visi/misi
- **Manajemen Token**: Generate token untuk siswa
- **Pengaturan**: Toggle pemilihan (buka/tutup)

---

## 🗂️ Database Schema

### Tables:
1. **admins** - Admin users
2. **students** - Data siswa (NIS, nama, kelas)
3. **tokens** - Token voting (1 per siswa)
4. **candidates** - Kandidat ketua OSIS
5. **votes** - Record suara yang masuk
6. **voting_settings** - Konfigurasi pemilihan

---

## 🔐 Default Login

### Admin
- URL: `/admin/login`
- Email: `admin@evoting.com`
- Password: `admin123`

**⚠️ PENTING:** Ganti password default setelah login pertama kali!

### Student
- URL: `/student/login`
- NIS: (harus ditambahkan oleh admin)
- Token: (generate dari admin panel)

---

## 📝 Workflow Penggunaan

### 1. Setup Awal (Admin)
1. Login sebagai admin
2. Tambah data siswa di menu "Siswa"
3. Generate token untuk siswa
4. Tambah kandidat di menu "Kandidat"
5. Buka pemilihan di menu "Pengaturan"

### 2. Voting (Student)
1. Siswa login dengan NIS + Token
2. Pilih kandidat
3. Kirim suara
4. Lihat konfirmasi

### 3. Monitoring (Admin)
1. Lihat dashboard untuk statistik
2. Monitor jumlah suara masuk
3. Lihat hasil sementara
4. Tutup pemilihan setelah selesai

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Push schema to database
npm run db:pull          # Pull schema from database
npm run db:generate      # Generate migrations
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed default data

# Docker
npm run db:up            # Start postgres
npm run db:down          # Stop postgres

# Build
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🔧 Troubleshooting

### Database connection error
```bash
# Pastikan Docker running
docker ps

# Restart database
docker compose down postgres
docker compose up postgres -d
```

### Port already in use
```bash
# Cek port yang digunakan
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Kill process atau ganti port di .env
```

### Token tidak bisa di-generate
- Pastikan siswa sudah ditambahkan
- Cek apakah siswa sudah punya token aktif
- Token hanya bisa 1 per siswa

---

## 📄 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL, Drizzle ORM
- **Auth**: Custom authentication (cookies)
- **Validation**: Zod

---

## 🤝 Support

Untuk bantuan atau pertanyaan, hubungi administrator sistem.

---

**Built with ❤️ for SMAN 1 Bantarujeg**
