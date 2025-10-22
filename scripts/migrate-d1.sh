#!/bin/bash

# Script to migrate database to Cloudflare D1
# Usage: npm run db:migrate-d1 or npm run db:migrate-d1:prod

ENV=${1:-development}

if [ "$ENV" = "production" ]; then
    echo "🚀 Migrating to PRODUCTION D1 database..."
    wrangler d1 execute evoting-db-production --file=./drizzle/0000_fixed_starfox.sql --env=production
else
    echo "🔧 Migrating to DEVELOPMENT D1 database..."
    wrangler d1 execute evoting-db --file=./drizzle/0000_fixed_starfox.sql
fi

echo "✅ Migration completed!"
