# Cloudflare Pages Cache Error Fix

## 🚀 Quick Fix (TL;DR)

**The project is already configured!** Just deploy with these settings:

- **Build command**: `npm run build` ✅
- **Build output**: `.next`
- **Framework**: Next.js

The cache will be **automatically cleaned** after build. No manual steps needed!

---

## Problem
Cloudflare Pages deployment fails with:
```
✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
cache/webpack/client-production/0.pack is 105 MiB in size
```

## Root Cause
The `.next/cache/` directory contains large webpack cache files that exceed Cloudflare's 25 MiB file size limit.

## ✅ SOLUTION IMPLEMENTED

The project now **automatically cleans cache after build** using a post-build script.

**How it works:**
- `npm run build` now runs: `next build && node scripts/clean-cache.js`
- The script automatically removes `.next/cache/` after build completes
- **No manual intervention needed** - just use `npm run build` in Cloudflare Dashboard

## Cloudflare Pages Dashboard Configuration

1. **Go to Cloudflare Dashboard**
   - Navigate to Pages
   - Create new project or select existing one
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**
   - Framework preset: `Next.js`
   - Build command: `npm run build` ✅ (will auto-clean cache)
   - Build output directory: `.next`
   - Environment variables: Add your env vars

3. **Deploy** - The cache will be automatically cleaned after build

## Local Development

For local development (when you don't need cache cleaning), use:
```bash
npm run build:local
```

This runs `next build` without cleaning the cache, keeping your local build cache intact for faster rebuilds.

## Configuration Files Created

### `scripts/clean-cache.js`
Post-build script that automatically removes `.next/cache/` directory after build completes.

### `.wranglerignore`
Excludes cache and other large files from wrangler deployments (backup solution).

### Changes to `package.json`
- `build`: Now runs `next build && node scripts/clean-cache.js` (auto-cleans cache)
- `build:local`: Runs `next build` only (keeps cache for faster local rebuilds)

### Changes to `next.config.ts`
Removed `output: 'standalone'` as it's not needed for Cloudflare Pages.

### Changes to `wrangler.toml`
Removed `[build]` section (not supported by Pages).

## Verification

After applying fixes, verify:
1. `.next/cache/` is excluded from deployment
2. Build completes successfully on Cloudflare
3. Application works correctly in production

## Notes

- **Cloudflare Pages dashboard builds are clean** - they always start fresh
- **Local wrangler deployments** use ignore files
- **Cache is only for local development** - not needed in production
- Next.js will regenerate necessary cache on Cloudflare's build servers

## Troubleshooting

If you still get the cache error after implementing the fix:

1. **Verify the clean script exists**:
   - Check that `scripts/clean-cache.js` exists
   - Ensure `package.json` has: `"build": "next build && node scripts/clean-cache.js"`

2. **Clear Cloudflare build cache**:
   - Go to Cloudflare Dashboard → Pages → Your Project
   - Settings → Builds & deployments → Clear build cache
   - Retry deployment

3. **Check build logs**:
   - Look for the message: `🧹 Cleaning cache directory for deployment...`
   - If missing, the script didn't run

4. **Cloudflare Dashboard settings should be**:
   - Build command: `npm run build` (not `npm run pages:build`)
   - Output directory: `.next`
   - Node version: `18` or higher

5. **Manual verification**:
   Run locally to test:
   ```bash
   npm run build
   # Check if .next/cache/ was removed
   ```
