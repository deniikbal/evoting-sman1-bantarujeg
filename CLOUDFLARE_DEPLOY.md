# Deploying to Cloudflare Pages

## Prerequisites

1. Cloudflare account
2. GitHub/GitLab repository connected to Cloudflare Pages
3. D1 database created (see D1 setup instructions)

## Deployment Configuration

### Framework: Next.js with OpenNext

This project uses **OpenNext** adapter to deploy Next.js to Cloudflare Pages.

### Build Settings

Configure these in your Cloudflare Pages dashboard:

1. **Framework preset**: `Next.js`
2. **Build command**: `npm run build`
3. **Build output directory**: `.open-next/worker`
4. **Node.js version**: `18` or higher

### Environment Variables

Add these in Cloudflare Pages Settings → Environment variables:

#### Required Variables

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://your-domain.pages.dev

# Database (automatically bound via wrangler.toml)
# DB binding is configured in wrangler.toml
```

#### How to Generate BETTER_AUTH_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### D1 Database Binding

The database binding is configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "evoting-db"
database_id = "your-database-id"
```

Make sure your D1 database is:
1. Created: `wrangler d1 create evoting-db`
2. Migrated: `wrangler d1 execute evoting-db --file=./drizzle/0000_fixed_starfox.sql --remote`
3. Seeded: Update data-export.sql and run `wrangler d1 execute evoting-db --file=./drizzle/data-export.sql --remote`

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Connect Repository**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your GitHub/GitLab
   - Select this repository

2. **Configure Build Settings** (as shown above)

3. **Add Environment Variables**

4. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy on every push to main branch

### Option 2: Manual Deployment via CLI

```bash
# Login to Cloudflare
wrangler login

# Build locally
npm run build

# Deploy
wrangler pages deploy .open-next/worker
```

## Post-Deployment

### 1. Verify Deployment

Visit your Cloudflare Pages URL: `https://your-project.pages.dev`

### 2. Check D1 Connection

- Navigate to admin login
- Try logging in
- Check if data loads correctly

### 3. Setup Custom Domain (Optional)

1. Go to Cloudflare Pages → Custom domains
2. Add your domain
3. DNS will be automatically configured

## Troubleshooting

### 404 Error

If you get 404:
- Check build output directory is `.open-next/worker`
- Verify build completed successfully
- Check build logs for errors

### Database Errors

If database queries fail:
- Verify D1 database binding in wrangler.toml
- Check database has been migrated
- Verify database has seed data

### Build Failures

Common issues:
1. **Cache too large**: Already fixed with auto-clean script
2. **Node version**: Ensure Node.js 18+ is used
3. **Missing dependencies**: Check package.json

### Environment Variables Not Working

- Double-check variable names match code
- Restart deployment after adding variables
- Check for typos in variable values

## Build Process Explained

When you run `npm run build`:

1. **Next.js Build**: `next build` creates the Next.js production build
2. **OpenNext Transform**: `open-next build` converts Next.js output to Cloudflare Workers format
3. **Cache Clean**: `node scripts/clean-cache.js` removes large cache files
4. **Output**: Final build in `.open-next/worker` directory ready for Cloudflare Pages

## Performance Optimization

### Cold Starts

Cloudflare Workers have minimal cold start times compared to traditional serverless.

### Caching

Cloudflare automatically caches static assets at the edge.

### Database Queries

D1 is globally distributed and fast. For best performance:
- Use indexes on frequently queried fields
- Minimize query complexity
- Use pagination for large datasets

## Monitoring

### Cloudflare Dashboard

Monitor your deployment:
1. Pages → Your Project → Analytics
2. View requests, bandwidth, errors
3. Check build history

### Logs

View real-time logs:
```bash
wrangler pages deployment tail
```

## Rollback

If deployment fails or has issues:

1. Go to Pages → Deployments
2. Find a previous working deployment
3. Click "Rollback to this deployment"

## Notes

- **Static files** are cached globally
- **API routes** run on Cloudflare Workers
- **Database queries** use D1 (SQLite on edge)
- **Authentication** uses Better Auth with cookies

## Support

For issues:
1. Check Cloudflare Pages documentation
2. Check OpenNext documentation: https://opennext.js.org
3. Review build logs in Cloudflare Dashboard
