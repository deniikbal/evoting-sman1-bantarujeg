# Infinite Loop Fix - OpenNext Build

## Problem

Build process was stuck in infinite loop, repeating the same build over and over:

```
12:47:33 Next.js build starts
12:48:20 OpenNext v3.1.3 - starts again
12:49:05 OpenNext v3.1.3 - starts again  
12:49:47 OpenNext v3.1.3 - starts again
...continues forever
```

## Root Cause

The build script was:
```json
"build": "next build && open-next build && node scripts/clean-cache.js"
```

**What happened:**
1. Cloudflare runs: `npm run build`
2. This executes: `next build && open-next build`
3. **OpenNext internally runs `npm run build` by default**
4. This triggers step 1 again → Infinite loop! 🔄

## Solution

### ✅ Fixed Configuration

**1. Updated `package.json`:**
```json
{
  "scripts": {
    "build": "npx open-next@latest build && node scripts/clean-cache.js",
    "build:next": "next build",
    "build:local": "next build"
  }
}
```

**2. Updated `open-next.config.ts`:**
```typescript
const config = {
  default: {
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
      generateDockerfile: false,
    },
  },
  buildCommand: 'npm run build:next',  // ← This breaks the loop!
};

export default config;
```

### How It Works Now

1. **Cloudflare runs**: `npm run build`
2. **Executes**: `npx open-next@latest build && node scripts/clean-cache.js`
3. **OpenNext internally runs**: `npm run build:next` (from config)
4. **build:next executes**: `next build` ✅ (No recursion!)
5. **OpenNext transforms** the build to Cloudflare Workers format
6. **Clean script runs**: Removes cache
7. **Done!** 🎉

## Key Changes

| Before (Broken) | After (Fixed) |
|----------------|---------------|
| `build: "next build && open-next build"` | `build: "npx open-next@latest build"` |
| OpenNext runs default `build` script | OpenNext runs `build:next` script |
| Infinite loop 🔄 | Clean build ✅ |

## Verification

After this fix, you should see in Cloudflare build logs:

```
✓ Next.js build (runs once)
✓ OpenNext transformation (runs once)  
✓ Cache cleanup (runs once)
✓ Build complete!
```

**NOT** repeated "OpenNext v3.1.3" messages.

## For Local Development

Use `npm run build:local` for faster local builds without OpenNext transformation:

```bash
npm run build:local  # Just Next.js build, keeps cache
```

## Cloudflare Dashboard Settings

No changes needed to dashboard settings:
- Build command: `npm run build` ✅
- Build output: `.open-next/worker` ✅
- Node version: `18+` ✅

## Why This Happened

OpenNext, by default, tries to run the "build" npm script to ensure Next.js is built. But if that script also calls OpenNext, it creates recursion.

The solution is to:
1. Have a **separate** Next.js build script (`build:next`)
2. Configure OpenNext to use that script (`buildCommand` in config)
3. Main `build` script only calls OpenNext (not Next.js directly)

## Related Issues

This is a common issue when using build tools that invoke npm scripts. Similar patterns apply to:
- Turborepo
- Nx
- Other meta-build tools

Always ensure the build command chain doesn't create cycles!

## Summary

**Before**: `build` → `next` + `open-next` → `build` → ∞  
**After**: `build` → `open-next` → `build:next` → `next` ✅
