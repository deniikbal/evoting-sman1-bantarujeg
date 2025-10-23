# Cloudflare Pages Cache Error Fix

## Problem
Cloudflare Pages deployment fails with:
```
✘ [ERROR] Error: Pages only supports files up to 25 MiB in size
cache/webpack/client-production/0.pack is 105 MiB in size
```

## Root Cause
The `.next/cache/` directory contains large webpack cache files that exceed Cloudflare's 25 MiB file size limit.

## Solutions

### Solution 1: Use Cloudflare Pages Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Navigate to Pages
   - Create new project or select existing one
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`

3. **The dashboard automatically ignores cache files** - it builds from scratch each time

### Solution 2: Clean Local Build Before Deploy

If deploying via CLI, delete the cache folder first:

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force .next\cache
npm run build
```

**Linux/Mac:**
```bash
rm -rf .next/cache
npm run build
```

### Solution 3: Use Wrangler CLI with Ignore Files

The project now includes:
- `.wranglerignore` - Excludes cache from wrangler deployments
- `.cfignore` - Excludes cache from Cloudflare Pages uploads

These files should automatically exclude the cache directory.

### Solution 4: Add Clean Script (Cross-platform)

If you want automated cleanup, install `rimraf`:

```bash
npm install --save-dev rimraf
```

Then update `package.json`:
```json
{
  "scripts": {
    "clean": "rimraf .next/cache",
    "pages:build": "npm run clean && next build"
  }
}
```

## Configuration Files Created

### `.wranglerignore`
Excludes cache and other large files from wrangler deployments.

### Changes to `next.config.ts`
Removed `output: 'standalone'` as it's not needed for Cloudflare Pages.

### Changes to `wrangler.toml`
Added build configuration section.

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

If you still get the error:

1. **Check ignore files exist**:
   - `.wranglerignore`
   - `.cfignore`

2. **Manually delete cache before deploy**:
   ```bash
   # PowerShell (Windows)
   Remove-Item -Recurse -Force .next
   
   # Bash (Linux/Mac)
   rm -rf .next
   ```

3. **Use Cloudflare Pages Dashboard** instead of CLI deployment

4. **Check Cloudflare Dashboard settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Node version: `18` or higher
