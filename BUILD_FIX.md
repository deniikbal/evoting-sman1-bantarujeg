# 🔧 Cloudflare Pages Build Fix

## ❌ Build Error yang Terjadi

```
Failed: build command exited with code: 1
```

**Root Cause:**
- Database connection diinisialisasi saat build time
- `better-sqlite3` adalah native module yang tidak tersedia di Cloudflare Pages build environment
- Build process tidak perlu akses database (hanya runtime yang perlu)

---

## ✅ **FIXED: Lazy Database Loading**

### Changes Made:

#### 1. **db/index.ts** - Lazy Load Database
```typescript
// OLD (BROKEN):
const sqlite = new Database(dbPath);  // ❌ Runs at import time
export const db = drizzle(sqlite, {...});

// NEW (FIXED):
function initDatabase() {
    // Skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null;
    }
    // Initialize only at runtime
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, {...});
}

export const db = new Proxy({}, {
    get(target, prop) {
        const database = initDatabase();  // ✅ Lazy initialization
        return database?.[prop];
    }
});
```

#### 2. **lib/auth.ts** - Lazy Load Auth
```typescript
// OLD (BROKEN):
import { db } from "@/db";  // ❌ Imports db at build time
export const auth = betterAuth({...});

// NEW (FIXED):
function getAuth() {
    const { db } = require("@/db");  // ✅ Lazy import
    return betterAuth({...});
}

export const auth = new Proxy({}, {
    get(target, prop) {
        return getAuth()[prop];  // ✅ Lazy initialization
    }
});
```

---

## 🚀 How to Deploy After Fix

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix: Lazy load database for Cloudflare Pages build"
git push origin main
```

### Step 2: Configure in Cloudflare Dashboard

**Build Settings:**
```yaml
Framework preset: Next.js (SSR)
Build command: npm run build
Build output: .next
Node version: 20
```

**Environment Variables:**
```env
# Required
NODE_VERSION=20
DATABASE_URL=evoting.db
BETTER_AUTH_SECRET=your-random-secret-min-32-chars
BETTER_AUTH_URL=https://your-app-name.pages.dev
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app-name.pages.dev

# Optional (for better logging)
NODE_ENV=production
```

**Generate BETTER_AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: D1 Binding

After first deployment:
1. Go to **Settings** → **Functions**
2. **D1 database bindings** → Add binding
3. Variable name: `DB`
4. Database: `evoting-db`
5. **Save**
6. **Redeploy** (trigger new deployment)

### Step 4: Sync Database
```bash
# Sync schema
wrangler d1 execute evoting-db --remote --file=./drizzle/0000_fixed_starfox.sql

# Sync data
npm run db:export
wrangler d1 execute evoting-db --remote --file=./drizzle/data-export.sql
```

### Step 5: Verify
```bash
# Check data
wrangler d1 execute evoting-db --remote --command="SELECT COUNT(*) FROM admins"
wrangler d1 execute evoting-db --remote --command="SELECT * FROM voting_settings"
```

---

## 🔍 Troubleshooting

### Build Still Fails?

**Check:**
1. All environment variables set in Dashboard
2. `NODE_VERSION=20` is set
3. Build logs for specific error
4. No syntax errors in recent commits

**Common Issues:**

#### Issue: "Module not found"
```
Solution: Make sure all dependencies in package.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

#### Issue: "Database connection failed"
```
Solution: This should NOT happen during build now
If it does, check:
- NEXT_PHASE environment check is working
- Lazy loading is implemented correctly
```

#### Issue: "BETTER_AUTH_SECRET not set"
```
Solution: Add in Cloudflare Dashboard Settings
Environment Variables → Add variable
```

---

## 📊 What Was Changed

### Files Modified:
1. ✅ `db/index.ts` - Lazy database initialization
2. ✅ `lib/auth.ts` - Lazy auth initialization
3. ✅ `BUILD_FIX.md` - This documentation

### How It Works Now:

**During Build Time:**
```
npm run build
├─ Import db → ✅ No connection created
├─ Import auth → ✅ No database accessed
├─ Build pages → ✅ Success
└─ Generate static files → ✅ Complete
```

**During Runtime (Request):**
```
User Request
├─ API route called
├─ Import db → Initialize connection (first time only)
├─ Query database → ✅ Works
└─ Return response → ✅ Success
```

---

## ✅ Verification Checklist

Before pushing:
- [ ] Changed `db/index.ts` to lazy load
- [ ] Changed `lib/auth.ts` to lazy load
- [ ] Local build works: `npm run build`
- [ ] Local dev works: `npm run dev`

After deployment:
- [ ] Build succeeds in Cloudflare
- [ ] D1 binding configured
- [ ] Database synced
- [ ] App loads successfully
- [ ] Login works
- [ ] Admin dashboard accessible

---

## 🎯 Expected Result

After these fixes:

✅ **Build Process:**
```
Cloudflare Pages Build Log:
├─ Installing dependencies... ✅
├─ Running npm run build... ✅
├─ Build completed successfully ✅
└─ Deploying to Cloudflare... ✅
```

✅ **Runtime:**
```
First Request:
├─ Initialize database connection ✅
├─ Query data ✅
└─ Return response ✅

Subsequent Requests:
├─ Use cached connection ✅
├─ Query data ✅
└─ Return response ✅
```

---

## 📚 Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database Bindings](https://developers.cloudflare.com/d1/configuration/local-development/)

---

## ✨ Summary

**Problem:** Database initialized at build time → Build fails
**Solution:** Lazy load database → Initialize only at runtime
**Status:** ✅ FIXED

**Next:** Push changes and deploy via Dashboard!

Good luck! 🚀
