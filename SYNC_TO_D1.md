# 📤 Sync Database SQLite ke Cloudflare D1

Panduan lengkap untuk mengirim database SQLite lokal Anda ke Cloudflare D1.

## 🎯 Tujuan

Memastikan database D1 di Cloudflare memiliki:
1. ✅ Struktur tabel yang sama (schema)
2. ✅ Data yang sama (semua records)

## 📋 Prerequisites

- Sudah login ke Cloudflare: `npm run cf:login`
- Database SQLite lokal sudah ada dan berisi data
- Wrangler CLI sudah terinstall (sudah include di project)

---

## 🚀 Metode 1: Sync Otomatis (Recommended)

### Step 1: Login ke Cloudflare
```bash
npm run cf:login
```

### Step 2: Buat D1 Database
```bash
npm run d1:create
```

Output akan seperti ini:
```
✅ Successfully created DB 'evoting-db'
📋 database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**PENTING:** Copy `database_id` tersebut!

### Step 3: Update wrangler.toml

Edit file `wrangler.toml` dan paste `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "evoting-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 👈 Paste di sini
```

### Step 4: Jalankan Sync

```bash
npm run d1:sync
```

Script ini akan otomatis:
1. ✅ Export semua data dari SQLite lokal
2. ✅ Migrate schema ke D1
3. ✅ Import semua data ke D1

**Done!** Database Anda sekarang sudah di D1 🎉

---

## 🔧 Metode 2: Manual Step-by-Step

Jika ingin lebih kontrol, ikuti langkah manual:

### Step 1: Export Data dari SQLite Lokal

```bash
npm run db:export
```

Output akan seperti:
```
📖 Reading from database: evoting.db
📋 Found tables: admins, classes, students, candidates, votes, ...
✅ Export completed!
📄 File saved to: D:\...\drizzle\data-export.sql
```

### Step 2: Migrate Schema ke D1

```bash
npm run d1:migrate
```

Ini akan membuat semua tabel di D1 sesuai schema.

### Step 3: Import Data ke D1

```bash
wrangler d1 execute evoting-db --file=./drizzle/data-export.sql
```

### Step 4: Verifikasi Data

```bash
wrangler d1 execute evoting-db --command="SELECT * FROM admins"
```

---

## 🔍 Verifikasi Data

### Check Jumlah Records di Setiap Tabel

```bash
# Admins
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM admins"

# Classes
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM classes"

# Students
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM students"

# Candidates
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM candidates"

# Votes
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM votes"
```

### Check Data Specific

```bash
# Lihat semua admins
wrangler d1 execute evoting-db --command="SELECT id, name, email FROM admins"

# Lihat semua classes
wrangler d1 execute evoting-db --command="SELECT id, name, teacher FROM classes LIMIT 10"

# Lihat voting settings
wrangler d1 execute evoting-db --command="SELECT * FROM voting_settings"
```

---

## 🔄 Update Data di D1

Jika Anda mengubah data di SQLite lokal dan ingin update D1:

### Option 1: Sync Ulang (Replace All)

```bash
# Hapus semua data di D1
wrangler d1 execute evoting-db --command="DELETE FROM votes"
wrangler d1 execute evoting-db --command="DELETE FROM tokens"
wrangler d1 execute evoting-db --command="DELETE FROM students"
wrangler d1 execute evoting-db --command="DELETE FROM candidates"
wrangler d1 execute evoting-db --command="DELETE FROM classes"
wrangler d1 execute evoting-db --command="DELETE FROM admins"

# Sync ulang
npm run d1:sync
```

### Option 2: Insert Manual

Export data terbaru dan import:
```bash
npm run db:export
wrangler d1 execute evoting-db --file=./drizzle/data-export.sql
```

---

## 📊 Status Database Saat Ini

Berdasarkan export terakhir, database Anda berisi:

✅ **admins**: 1 record
- Email: admin@evoting.com

✅ **classes**: 35 records
- Kelas X: 12 kelas (X 1 - X 12)
- Kelas XI: 12 kelas (XI IPS 1-7, XI MIPA 1-5)
- Kelas XII: 11 kelas (XII EBIM 1-3, XII GBIM 1-5, XII SBIM 1-3)

✅ **voting_settings**: 1 record
- Title: "Pemilihan Ketua OSIS"
- Status: Voting belum dibuka

⚠️ **Kosong**:
- students (belum ada siswa)
- candidates (belum ada kandidat)
- votes (belum ada vote)
- tokens (belum ada token)

---

## 🌐 Untuk Production

Jika ingin sync ke production D1:

### 1. Buat Production Database
```bash
npm run d1:create:prod
```

### 2. Update wrangler.toml
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "evoting-db-production"
database_id = "your-production-database-id"  # 👈 Paste production ID
```

### 3. Sync ke Production
```bash
npm run d1:sync:prod
```

---

## ⚠️ Troubleshooting

### Error: "Cannot find database"
**Solusi:**
- Pastikan sudah login: `npm run cf:login`
- Pastikan `database_id` di `wrangler.toml` sudah benar
- Check database exists: `npm run d1:list`

### Error: "UNIQUE constraint failed"
**Penyebab:** Data sudah ada di D1
**Solusi:** 
- Hapus data lama terlebih dahulu, atau
- Skip error dengan melanjutkan import

### Data tidak muncul di D1
**Solusi:**
1. Check file export: `drizzle/data-export.sql`
2. Pastikan ada data di SQLite lokal
3. Verifikasi dengan query SELECT

### Export tidak menemukan database
**Solusi:**
```bash
# Pastikan environment variable benar
$env:DATABASE_URL="evoting.db"
npm run db:export
```

---

## 💡 Tips

1. **Backup dulu** sebelum sync ke production
2. **Test di development** dulu (`npm run d1:sync`)
3. **Verifikasi data** setelah sync dengan query SELECT
4. Export file disimpan di: `drizzle/data-export.sql`
5. Untuk sync ulang, jalankan `npm run d1:sync` kapan saja

---

## 🔗 Next Steps

Setelah database berhasil di D1:

1. ✅ Deploy aplikasi ke Cloudflare Pages
2. ✅ Configure environment variables di Cloudflare
3. ✅ Test aplikasi di production
4. ✅ Monitor database usage di Cloudflare Dashboard

---

## 📚 Resources

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Limits & Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
