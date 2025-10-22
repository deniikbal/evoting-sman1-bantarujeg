# 🚀 Deploy ke Cloudflare Pages

Panduan lengkap deploy aplikasi E-Voting Next.js dengan D1 ke Cloudflare Pages.

---

## ⚠️ Penting: Tentang Deployment

Aplikasi ini menggunakan:
- ✅ Next.js App Router
- ✅ 20+ API Routes
- ✅ Cloudflare D1 Database
- ✅ Server-side rendering

Karena kompleksitas ini, ada **2 cara deploy** dengan **trade-offs** masing-masing.

---

## 🎯 Option 1: Cloudflare Dashboard (RECOMMENDED) ⭐

### Kelebihan:
- ✅ Paling mudah dan reliable
- ✅ Auto-detect Next.js
- ✅ Git integration (auto deploy on push)
- ✅ Preview deployments
- ✅ Free SSL & CDN
- ✅ D1 binding otomatis

### Steps:

#### 1. Push ke Git Repository

```bash
# Init git (jika belum)
git init
git add .
git commit -m "Initial commit"

# Push ke GitHub/GitLab
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

#### 2. Buka Cloudflare Dashboard

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih **Workers & Pages**
3. Click **Create application**
4. Click **Pages** tab
5. Click **Connect to Git**

#### 3. Connect Repository

1. Authorize GitHub/GitLab
2. Pilih repository: `evoting-sman1-bantarujeg`
3. Click **Begin setup**

#### 4. Configure Build Settings

```yaml
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
Node version: 18 or later
```

#### 5. Environment Variables

Tambahkan environment variables:

```env
NODE_VERSION=18
BETTER_AUTH_SECRET=your-secret-key-change-this
BETTER_AUTH_URL=https://your-app.pages.dev
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.pages.dev
```

#### 6. Configure D1 Binding

Di Pages settings:
1. Go to **Settings** > **Functions**
2. Scroll to **D1 database bindings**
3. Add binding:
   - Variable name: `DB`
   - D1 database: `evoting-db`

#### 7. Deploy!

Click **Save and Deploy**

⏳ Wait 2-5 minutes...

✅ Done! Your app is live at: `https://your-project.pages.dev`

---

## 🔧 Option 2: Deploy via CLI dengan Adapter

### Kelebihan:
- ✅ Deploy langsung dari terminal
- ✅ Full control

### Kekurangan:
- ⚠️ Perlu setup adapter
- ⚠️ Lebih kompleks
- ⚠️ Potential compatibility issues

### Steps:

#### 1. Install Cloudflare Adapter

```bash
npm install --save-dev @cloudflare/next-on-pages
```

#### 2. Update package.json

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:deploy": "npm run pages:build && wrangler pages deploy .vercel/output/static",
    "pages:dev": "npx @cloudflare/next-on-pages --dev"
  }
}
```

#### 3. Update next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Cloudflare Pages
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

#### 4. Build & Deploy

```bash
# Build for Cloudflare
npm run pages:build

# Deploy
npm run pages:deploy
```

**⚠️ WARNING**: Option ini memerlukan testing extensive dan mungkin ada compatibility issues dengan some Next.js features.

---

## 🗄️ Sync Database ke D1 Remote

Setelah deploy, database D1 remote masih kosong. Sync data:

```bash
# 1. Check database exists
npm run d1:list

# 2. Sync schema dan data
npm run d1:sync:remote

# 3. Verify
wrangler d1 execute evoting-db --remote --command="SELECT COUNT(*) FROM admins"
```

Expected output:
```json
{
  "results": [{ "COUNT(*)": 1 }]
}
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module"
**Solusi**: Pastikan semua dependencies terinstall
```bash
npm install
```

### Error: "Build failed"
**Solusi**: Test build locally dulu
```bash
npm run build
```

### Error: "D1 binding not found"
**Solusi**: 
1. Check D1 binding di Pages settings
2. Variable name harus `DB`
3. Redeploy setelah adding binding

### API Routes not working
**Solusi**:
1. Pastikan menggunakan Next.js 13+ App Router
2. Check Cloudflare Pages Functions compatibility
3. Review error logs di Cloudflare Dashboard

### Database empty
**Solusi**: Sync database ke remote
```bash
npm run d1:sync:remote
```

---

## 📊 Verifikasi Deployment

### 1. Check App Status
```
https://your-app.pages.dev
```

### 2. Check API Routes
```
https://your-app.pages.dev/api/admin/dashboard
```

### 3. Check Database
```bash
wrangler d1 execute evoting-db --remote --command="SELECT * FROM admins"
```

### 4. Test Login
- URL: `https://your-app.pages.dev/admin`
- Email: admin@evoting.com
- Password: admin123

---

## 🎯 Recommended Workflow

### Development:
```bash
# Local development
npm run dev

# Test dengan D1 local
npm run d1:sync
```

### Staging:
```bash
# Push ke git
git push

# Auto deploy via Cloudflare Dashboard
# Check preview URL
```

### Production:
```bash
# Sync database ke remote
npm run d1:sync:remote

# Merge ke main branch
git merge staging
git push

# Auto deploy ke production
```

---

## 💰 Cost & Limits

### Cloudflare Pages (Free Tier):
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ Unlimited static bandwidth
- ✅ 100,000 Functions requests/day

### Cloudflare D1 (Free Tier):
- ✅ 5 GB storage
- ✅ 5M reads/day
- ✅ 100K writes/day

**Untuk aplikasi sekolah ini, free tier sudah lebih dari cukup!**

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Update `BETTER_AUTH_SECRET` dengan value yang secure
- [ ] Update all environment variables
- [ ] Remove console.log dari production code
- [ ] Enable HTTPS only
- [ ] Setup custom domain (optional)
- [ ] Test semua fitur di staging dulu
- [ ] Backup database sebelum sync ke remote

---

## 🌐 Custom Domain (Optional)

1. Go to Cloudflare Dashboard
2. Select your Pages project
3. Go to **Custom domains**
4. Click **Set up a custom domain**
5. Follow the DNS setup instructions

Example: `evoting.sman1bantarujeg.sch.id`

---

## 📚 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

---

## ✨ Summary

### Option 1: Dashboard (RECOMMENDED)
1. Push code ke Git
2. Connect di Cloudflare Dashboard
3. Configure D1 binding
4. Deploy!
5. Sync database: `npm run d1:sync:remote`

### Option 2: CLI
1. Install adapter
2. Build: `npm run pages:build`
3. Deploy: `npm run pages:deploy`
4. Sync database: `npm run d1:sync:remote`

**🎯 Untuk kemudahan dan reliability, gunakan Option 1 (Dashboard).**

---

## 🆘 Need Help?

Jika ada masalah saat deployment, check:
1. Cloudflare Dashboard > Pages > Deployment logs
2. Browser console untuk errors
3. D1 database logs
4. Wrangler logs: `~/.wrangler/logs/`

**Good luck! 🚀**
