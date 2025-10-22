# 🚀 Cloudflare Pages Deployment Guide

## ⚠️ PENTING: Cara Deploy yang Benar untuk Next.js

Next.js dengan Cloudflare Pages **TIDAK BISA langsung deploy** dari CLI karena:
- File cache terlalu besar (>25MB limit)
- Next.js perlu build adapter khusus untuk Cloudflare
- Better Auth perlu runtime compatibility

---

## ✅ **Recommended: Deploy via Cloudflare Dashboard** 

Ini adalah cara **tercepat dan paling reliable**.

### Step-by-Step:

#### 1. Push Code ke Git
```bash
git add .
git commit -m "Ready for Cloudflare Pages deployment"
git push origin main
```

#### 2. Login ke Cloudflare Dashboard
- Buka: https://dash.cloudflare.com/
- Login dengan akun Anda

#### 3. Create Pages Project
1. Klik **Workers & Pages**
2. Klik **Create application**
3. Pilih tab **Pages**
4. Klik **Connect to Git**

#### 4. Connect Repository
1. Authorize GitHub/GitLab
2. Select repository: `evoting-sman1-bantarujeg`
3. Klik **Begin setup**

#### 5. Configure Build Settings

**Framework preset:** Next.js (SSR)

**Build configuration:**
```yaml
Build command: npm run build
Build output directory: .next
Root directory: / (default)
Node version: 18 or later
```

**Environment Variables:**
```env
NODE_VERSION=20
DATABASE_URL=evoting.db
BETTER_AUTH_SECRET=your-random-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-app-name.pages.dev
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app-name.pages.dev
```

⚠️ **Change `your-random-secret-key-min-32-chars`** dengan secret yang secure!

#### 6. D1 Database Binding

**PENTING:** Setelah project dibuat:

1. Go to project **Settings** → **Functions**
2. Scroll ke **D1 database bindings**
3. Add binding:
   - **Variable name:** `DB`
   - **D1 database:** `evoting-db`
4. Save

#### 7. Deploy!
- Klik **Save and Deploy**
- Wait 3-5 minutes untuk first deployment
- Aplikasi akan live di: `https://your-app-name.pages.dev`

---

## 📊 Sync Database ke D1 Remote

Setelah aplikasi deployed, database D1 remote masih kosong. Sync data:

```bash
# Export data dari SQLite lokal
npm run db:export

# Migrate schema ke D1 remote
wrangler d1 execute evoting-db --remote --file=./drizzle/0000_fixed_starfox.sql

# Import data ke D1 remote
wrangler d1 execute evoting-db --remote --file=./drizzle/data-export.sql
```

### Verify:
```bash
wrangler d1 execute evoting-db --remote --command="SELECT COUNT(*) FROM admins"
wrangler d1 execute evoting-db --remote --command="SELECT COUNT(*) FROM classes"
```

Expected:
```json
{ "count": 1 }  // admins
{ "count": 35 } // classes
```

---

## 🔧 Alternative: Build & Deploy with Adapter

**⚠️ WARNING: Ini lebih kompleks dan mungkin ada compatibility issues.**

### Install Cloudflare Adapter

```bash
npm install --save-dev @cloudflare/next-on-pages
```

### Update package.json

Add scripts:
```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:deploy": "wrangler pages deploy .vercel/output/static",
    "pages:dev": "npx @cloudflare/next-on-pages --dev"
  }
}
```

### Build & Deploy

```bash
# 1. Build untuk Cloudflare
npm run pages:build

# 2. Deploy
npm run pages:deploy
```

**Issues yang mungkin muncul:**
- Runtime compatibility errors
- Some Next.js features tidak supported
- Better Auth compatibility issues
- Database connection issues

**Solusi:** Gunakan Cloudflare Dashboard (Recommended).

---

## ❌ **Kenapa `wrangler pages deploy` Gagal?**

Error yang muncul:
```
Error: Pages only supports files up to 25 MiB in size
cache/webpack/client-production/0.pack is 105 MiB in size
```

**Penyebab:**
- `.next/cache/` folder terlalu besar (100+ MB)
- Cloudflare Pages limit: 25 MB per file
- CLI deploy mencoba upload semua files termasuk cache

**Solusi:**
1. ✅ **Deploy via Dashboard** (Git integration) - Cache tidak di-upload
2. ❌ Jangan gunakan `wrangler pages deploy` direct upload
3. ✅ `.cfignore` sudah dibuat untuk exclude cache (tapi tetap gunakan Dashboard)

---

## 📋 Build Configuration

File yang sudah dikonfigurasi:

### wrangler.toml
```toml
name = "evoting-sman1-bantarujeg"
pages_build_output_dir = ".next"

[[d1_databases]]
binding = "DB"
database_name = "evoting-db"
database_id = "your-database-id"
```

### .cfignore
```
.next/cache/
node_modules/
*.db
.env*
*.md
```

---

## 🎯 Recommended Workflow

### Development
```bash
npm run dev
# Local SQLite database
```

### Staging (First Time)
```bash
# 1. Push to Git
git push

# 2. Deploy via Dashboard
# 3. Configure D1 binding
# 4. Sync database
npm run d1:sync:remote
```

### Production Updates
```bash
# 1. Test locally
npm run build

# 2. Commit changes
git add .
git commit -m "Update feature"
git push

# Auto-deploy via Cloudflare Pages
```

---

## ⚙️ Environment Variables

Required dalam Cloudflare Pages Settings:

| Variable | Value | Required |
|----------|-------|----------|
| NODE_VERSION | 20 | Yes |
| DATABASE_URL | evoting.db | Yes |
| BETTER_AUTH_SECRET | min 32 chars random | Yes |
| BETTER_AUTH_URL | https://your-app.pages.dev | Yes |
| NEXT_PUBLIC_BETTER_AUTH_URL | https://your-app.pages.dev | Yes |

**Generate secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Troubleshooting

### Build Fails
**Solution:**
1. Test build locally: `npm run build`
2. Check build logs di Cloudflare Dashboard
3. Verify all environment variables set

### D1 Binding Not Found
**Solution:**
1. Go to Settings → Functions
2. Add D1 binding with variable name: `DB`
3. Redeploy

### Database Empty
**Solution:**
```bash
npm run d1:sync:remote
```

### App Not Loading
**Solution:**
1. Check deployment logs
2. Verify BETTER_AUTH_URL matches your actual URL
3. Check browser console for errors

---

## ✅ **Summary: Best Practice**

1. ✅ **Use Cloudflare Dashboard** untuk deployment
2. ✅ Connect via **Git** (GitHub/GitLab)
3. ✅ Configure **D1 binding** after first deploy
4. ✅ Sync database dengan `npm run d1:sync:remote`
5. ✅ Set **environment variables** correctly
6. ❌ **DON'T** use `wrangler pages deploy` CLI

**Dashboard deployment = Automatic, Reliable, No file size issues**

---

## 🌐 Custom Domain (Optional)

1. Go to Cloudflare Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `evoting.yourschool.sch.id`
5. Follow DNS configuration

---

## 📚 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)

---

**Good luck with your deployment! 🚀**
