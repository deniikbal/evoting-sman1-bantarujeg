# Cloudflare D1 Setup Guide

Panduan lengkap untuk setup dan menggunakan Cloudflare D1 dengan aplikasi E-Voting.

## Prerequisites

- Akun Cloudflare (gratis)
- Wrangler CLI sudah terinstall (sudah ada di project)
- Node.js dan npm terinstall

## Step 1: Login ke Cloudflare

```bash
npm run cf:login
```

Browser akan terbuka, login dengan akun Cloudflare Anda.

## Step 2: Buat D1 Database

### Development Database
```bash
npm run d1:create
```

Command ini akan membuat database D1 dan menampilkan:
```
✅ Successfully created DB 'evoting-db'
📋 database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**PENTING:** Copy `database_id` yang ditampilkan!

### Production Database (Opsional)
```bash
npm run d1:create:prod
```

## Step 3: Update wrangler.toml

Buka file `wrangler.toml` dan update `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "evoting-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Paste database_id dari step 2

# Untuk production
[[env.production.d1_databases]]
binding = "DB"
database_name = "evoting-db-production"
database_id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"  # Paste production database_id
```

## Step 4: Run Migrations

Jalankan migrations untuk membuat tabel di D1:

```bash
# Development
npm run d1:migrate

# Production
npm run d1:migrate:prod
```

## Step 5: Seed Data (Opsional)

Untuk mendapatkan SQL commands untuk seeding:

```bash
npm run d1:seed
```

Copy SQL commands yang ditampilkan dan execute secara manual:

```bash
wrangler d1 execute evoting-db --command="INSERT INTO admins ..."
```

Atau gunakan Wrangler console:
```bash
wrangler d1 execute evoting-db --remote
```

## Useful Commands

### List Semua D1 Databases
```bash
npm run d1:list
```

### Info Database
```bash
# Development
npm run d1:info

# Production
npm run d1:info:prod
```

### Execute SQL Command
```bash
wrangler d1 execute evoting-db --command="SELECT * FROM admins"
```

### Execute SQL File
```bash
wrangler d1 execute evoting-db --file=./path/to/file.sql
```

### Access D1 Console (Interactive)
```bash
wrangler d1 execute evoting-db --remote
```

## Environment Variables untuk D1

Jika ingin menggunakan Drizzle Kit dengan D1 (HTTP API), update `.env`:

```env
# Cloudflare D1 Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_D1_TOKEN=your-api-token
```

Untuk mendapatkan:
- **Account ID**: Dashboard Cloudflare > Workers & Pages > Settings
- **Database ID**: Dari output `npm run d1:create`
- **API Token**: Dashboard Cloudflare > My Profile > API Tokens > Create Token

## Menggunakan D1 dalam Aplikasi

### Next.js API Routes

```typescript
import { getD1Database } from '@/db/d1';

export async function GET(request: Request) {
    // D1 akan tersedia melalui context di Cloudflare Pages
    const env = (request as any).env;
    const db = getD1Database(env.DB);
    
    const admins = await db.select().from(admins);
    return Response.json(admins);
}
```

### Cloudflare Pages Functions

Buat folder `functions` di root project:

```typescript
// functions/api/test.ts
import { getD1Database } from '../../db/d1';

export async function onRequest(context) {
    const db = getD1Database(context.env.DB);
    const admins = await db.select().from(admins);
    return Response.json(admins);
}
```

## Deploy ke Cloudflare Pages

```bash
npm run cf:deploy
```

## Troubleshooting

### Error: "Database not found"
- Pastikan `database_id` di `wrangler.toml` sudah benar
- Pastikan sudah login: `npm run cf:login`

### Error: "No migrations found"
- Generate migrations dulu: `npm run db:generate`
- Pastikan file migration ada di folder `./drizzle/`

### Query tidak bekerja
- D1 menggunakan SQLite dialect, beberapa SQL syntax mungkin berbeda dari PostgreSQL
- Cek dokumentasi SQLite untuk syntax yang supported

## Local Development

Untuk development lokal, aplikasi akan tetap menggunakan SQLite file (`evoting.db`). D1 hanya digunakan saat deploy ke Cloudflare.

```env
# .env (Local Development)
DATABASE_URL=evoting.db
```

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Drizzle ORM with D1](https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1)
