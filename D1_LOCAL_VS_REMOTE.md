# 📍 D1 Local vs Remote

## Perbedaan Penting

### 🏠 D1 Local (Development)
- **Lokasi**: `.wrangler/state/v3/d1/`
- **Fungsi**: Testing dan development di komputer lokal
- **Command**: Tanpa flag `--remote`
- **Contoh**: `wrangler d1 execute evoting-db --command="SELECT * FROM admins"`

✅ **Anda sudah berhasil sync ke D1 Local!**

### ☁️ D1 Remote (Production/Cloudflare)
- **Lokasi**: Server Cloudflare
- **Fungsi**: Database production yang bisa diakses dari internet
- **Command**: Dengan flag `--remote`
- **Contoh**: `wrangler d1 execute evoting-db --remote --command="SELECT * FROM admins"`

---

## 🎯 Status Saat Ini

### ✅ Yang Sudah Berhasil

**D1 Local** sudah berisi data:
- ✅ 1 Admin (admin@evoting.com)
- ✅ 35 Kelas
- ✅ 1 Voting Settings

**Lokasi**: `.wrangler/state/v3/d1/evoting-db.sqlite`

### ⏳ Yang Belum

**D1 Remote** masih kosong (jika sudah dibuat).

---

## 🚀 Sync ke D1 Remote (Cloudflare)

Untuk mengirim data ke D1 Remote di Cloudflare:

### Option 1: Manual Sync

```bash
# 1. Export data
npm run db:export

# 2. Migrate schema ke remote
wrangler d1 execute evoting-db --remote --file=./drizzle/0000_fixed_starfox.sql

# 3. Import data ke remote
wrangler d1 execute evoting-db --remote --file=./drizzle/data-export.sql
```

### Option 2: Deploy via Cloudflare Pages

Ketika Anda deploy aplikasi Next.js ke Cloudflare Pages, aplikasi akan otomatis connect ke D1 Remote (jika sudah di-configure di wrangler.toml).

---

## 🔍 Cara Check Database

### Check D1 Local
```bash
wrangler d1 execute evoting-db --command="SELECT COUNT(*) FROM admins"
```

### Check D1 Remote
```bash
wrangler d1 execute evoting-db --remote --command="SELECT COUNT(*) FROM admins"
```

---

## 📝 NPM Scripts Update

Tambahkan scripts untuk remote:

```json
{
  "d1:check:remote": "wrangler d1 execute evoting-db --remote --command=\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\"",
  "d1:migrate:remote": "wrangler d1 execute evoting-db --remote --file=./drizzle/0000_fixed_starfox.sql",
  "d1:sync:remote": "npm run db:export && npm run d1:migrate:remote && wrangler d1 execute evoting-db --remote --file=./drizzle/data-export.sql"
}
```

---

## 🎯 Kapan Menggunakan Local vs Remote?

### Gunakan D1 Local untuk:
- ✅ Development dan testing
- ✅ Coba fitur baru tanpa affect production
- ✅ Debug issues
- ✅ Cepat dan gratis

### Gunakan D1 Remote untuk:
- ✅ Production deployment
- ✅ Accessible dari internet
- ✅ Deploy ke Cloudflare Pages/Workers
- ✅ Share dengan tim atau users

---

## 🔄 Workflow Recommended

1. **Development**: Gunakan SQLite lokal (`evoting.db`)
   ```bash
   npm run dev
   ```

2. **Test D1 Local**: Sync ke D1 local untuk test
   ```bash
   npm run d1:sync
   ```

3. **Deploy**: Sync ke D1 Remote dan deploy
   ```bash
   npm run d1:sync:remote
   npm run cf:deploy
   ```

---

## ⚠️ Catatan Penting

1. **Data Tidak Auto-Sync**: Local dan Remote adalah database terpisah
2. **Manual Sync Required**: Harus manual sync dari local ke remote
3. **Cost**: D1 Local gratis, D1 Remote ada [free tier](https://developers.cloudflare.com/d1/platform/pricing/)
4. **Backup**: Selalu backup data sebelum sync ke remote

---

## 🎉 Summary

✅ Database SQLite lokal Anda sudah berhasil di-sync ke **D1 Local**
✅ Struktur dan data sudah sama persis
✅ Siap untuk development dan testing

**Next Step**: Jika ingin deploy ke production, sync ke **D1 Remote** dengan flag `--remote`
