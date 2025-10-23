# Alternative Deployment Solutions

## Problem with Cloudflare Pages

Next.js deployment on Cloudflare Pages is problematic:

1. **`@cloudflare/next-on-pages`**: Deprecated and fails on Windows
2. **OpenNext**: Creates AWS Lambda structure, not Cloudflare Workers format
3. **Native Next.js**: Not compatible with Cloudflare Workers runtime

### Why Cloudflare Pages is Difficult

- Cloudflare Workers use V8 Isolates, not Node.js runtime
- Next.js requires Node.js APIs not available on Workers
- Build adapters are experimental and unstable
- Windows compatibility issues

## ✅ Recommended Solutions

### Option 1: Deploy to Vercel (Easiest & Best)

**Vercel** is made by Next.js creators and provides:
- ✅ Zero configuration
- ✅ Automatic builds on git push
- ✅ Free tier with generous limits
- ✅ Full Next.js feature support
- ✅ Edge runtime available
- ✅ Built-in analytics

**Steps:**

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import project** from GitHub

3. **Add Environment Variables**:
   ```env
   BETTER_AUTH_SECRET=your-secret-here
   BETTER_AUTH_URL=https://your-domain.vercel.app
   ```

4. **Database**: 
   - Use Vercel Postgres instead of D1
   - Or use Turso (SQLite on edge, similar to D1)

5. **Deploy** - Automatic!

### Option 2: Railway.app

**Railway** provides:
- ✅ Full Node.js runtime
- ✅ PostgreSQL database included
- ✅ Automatic HTTPS
- ✅ Easy deployment
- ✅ Free tier

**Steps:**

1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add Postgres service
4. Set environment variables
5. Deploy

### Option 3: Render.com

**Render** offers:
- ✅ Free tier for web services
- ✅ Automatic deploys from Git
- ✅ PostgreSQL included
- ✅ Easy to use

**Steps:**

1. Sign up at [render.com](https://render.com)
2. New Web Service → Connect repository
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables
6. Deploy

### Option 4: Self-Hosted with Docker

Use the included Docker setup:

```bash
# Build and run
docker-compose up -d

# Access at http://localhost:3000
```

**Requirements:**
- Docker installed
- VPS or server (DigitalOcean, Linode, AWS, etc.)

### Option 5: Cloudflare Pages (Static Only)

For static pages only (no SSR/API routes):

1. **Update `next.config.ts`**:
   ```typescript
   const nextConfig = {
     output: 'export',
   };
   ```

2. **Build**: `npm run build`

3. **Deploy `out/` folder** to Cloudflare Pages

4. **Move API routes** to separate Cloudflare Workers

**Limitations**:
- No Server-Side Rendering (SSR)
- No API routes in Next.js
- Need separate backend for API

## Database Options

### If NOT using Cloudflare D1:

#### 1. Turso (Recommended for Edge)

SQLite on edge, similar to D1 but works everywhere:

```bash
npm install @libsql/client
```

**Pros**:
- SQLite-based (like D1)
- Edge deployment
- Free tier
- Works with existing schema

#### 2. Supabase

PostgreSQL with great features:

```bash
npm install @supabase/supabase-js
```

**Pros**:
- Real-time subscriptions
- Auth built-in
- File storage
- Free tier

#### 3. PlanetScale

MySQL-compatible, serverless:

**Pros**:
- Serverless MySQL
- Free tier
- Good performance
- Branching like Git

## Migration Guide

### From D1 to Turso

1. **Install Turso CLI**:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Create database**:
   ```bash
   turso db create evoting-db
   ```

3. **Get connection URL**:
   ```bash
   turso db show evoting-db
   ```

4. **Update `db/index.ts`**:
   ```typescript
   import { drizzle } from 'drizzle-orm/libsql';
   import { createClient } from '@libsql/client';
   
   const client = createClient({
     url: process.env.TURSO_DATABASE_URL!,
     authToken: process.env.TURSO_AUTH_TOKEN!,
   });
   
   export const db = drizzle(client);
   ```

5. **Migrate**:
   ```bash
   turso db shell evoting-db < drizzle/0000_fixed_starfox.sql
   ```

### From D1 to PostgreSQL (Vercel/Railway/Render)

1. **Update schema** (Drizzle handles most of this):
   ```bash
   npm install drizzle-orm pg
   npm install --save-dev @types/pg
   ```

2. **Update `db/index.ts`**:
   ```typescript
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   
   export const db = drizzle(pool);
   ```

3. **Generate PostgreSQL migration**:
   ```bash
   npm run db:generate
   ```

4. **Apply migration**:
   ```bash
   npm run db:push
   ```

## Recommendation Summary

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Vercel** | ⭐ Easy | Free tier | Production apps |
| **Railway** | ⭐⭐ Easy | Free tier | Full-stack apps |
| **Render** | ⭐⭐ Easy | Free tier | Simple deploys |
| **Docker (Self-hosted)** | ⭐⭐⭐ Medium | VPS cost | Full control |
| **Cloudflare Pages (Static)** | ⭐⭐⭐⭐ Hard | Free | Static only |

## Final Recommendation

🎯 **Deploy to Vercel** for the best experience:

1. Zero configuration hassle
2. Perfect Next.js compatibility  
3. Free for this project size
4. Easy database integration
5. Automatic HTTPS & domains
6. Built-in CI/CD

**Next best**: Railway or Render if you prefer alternatives.

**Avoid**: Cloudflare Pages for full Next.js apps (use for static sites only).
