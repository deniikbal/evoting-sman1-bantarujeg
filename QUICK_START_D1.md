# ⚡ Quick Start: Sync ke D1 Cloudflare

Panduan super cepat untuk mengirim database SQLite Anda ke Cloudflare D1.

## 🚀 5 Langkah Sederhana

### 1️⃣ Login ke Cloudflare

```bash
npm run cf:login
```

- Browser akan terbuka
- Login dengan akun Cloudflare Anda
- Kembali ke terminal setelah selesai

---

### 2️⃣ Buat D1 Database

```bash
npm run d1:create
```

Output:
```
✅ Successfully created DB 'evoting-db'
📋 database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**📝 COPY `database_id` ini!**

---

### 3️⃣ Update wrangler.toml

Buka file `wrangler.toml` dan paste `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "evoting-db"
database_id = "PASTE_DATABASE_ID_DI_SINI"
```

Save file.

---

### 4️⃣ Sync Database

```bash
npm run d1:sync
```

Tunggu sampai selesai... Done! ✅

---

### 5️⃣ Verifikasi

```bash
wrangler d1 execute evoting-db --command="SELECT * FROM admins"
```

Jika muncul data admin, berarti berhasil! 🎉

---

## 📊 Yang Akan Di-Sync

Dari hasil export, data berikut akan dikirim ke D1:

✅ **1 Admin**
- Email: admin@evoting.com
- Password: admin123

✅ **35 Kelas**
- X 1 - X 12 (12 kelas)
- XI IPS 1-7, XI MIPA 1-5 (12 kelas)
- XII EBIM, GBIM, SBIM (11 kelas)

✅ **1 Voting Settings**
- Title: "Pemilihan Ketua OSIS"

---

## ❓ Troubleshooting Cepat

### Command tidak dikenali?
```bash
# Install dependencies dulu
npm install
```

### Database tidak ditemukan?
```bash
# Login ulang
npm run cf:login

# Check database list
npm run d1:list
```

### Ingin sync ulang?
```bash
# Jalankan sync lagi
npm run d1:sync
```

---

## 🎯 Next Steps

Setelah berhasil sync:

1. ✅ Login admin di: http://localhost:3000
   - Email: admin@evoting.com
   - Password: admin123

2. ✅ Deploy ke Cloudflare Pages:
   ```bash
   npm run cf:deploy
   ```

3. ✅ Setup production database:
   ```bash
   npm run d1:create:prod
   npm run d1:sync:prod
   ```

---

## 📚 Need More Help?

- **Detail lengkap**: Baca `SYNC_TO_D1.md`
- **Setup D1**: Baca `D1_SETUP.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/d1/

---

## 💡 Pro Tips

- Export akan otomatis dilakukan saat `npm run d1:sync`
- File export ada di: `drizzle/data-export.sql`
- Bisa sync berkali-kali tanpa masalah
- Data lokal tidak akan hilang

**Selamat! Database Anda siap di cloud! ☁️**
