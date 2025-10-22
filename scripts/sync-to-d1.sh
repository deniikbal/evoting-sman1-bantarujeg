#!/bin/bash

# Script to sync local SQLite database to Cloudflare D1
# Usage: npm run d1:sync or npm run d1:sync:prod

ENV=${1:-development}

echo "🚀 Syncing local database to D1..."

# Step 1: Export data from local SQLite
echo ""
echo "📦 Step 1: Exporting data from local SQLite..."
npm run db:export

if [ $? -ne 0 ]; then
    echo "❌ Export failed!"
    exit 1
fi

# Step 2: Migrate schema to D1
echo ""
echo "📋 Step 2: Migrating schema to D1..."
if [ "$ENV" = "production" ]; then
    npm run d1:migrate:prod
else
    npm run d1:migrate
fi

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

# Step 3: Import data to D1
echo ""
echo "📥 Step 3: Importing data to D1..."
if [ "$ENV" = "production" ]; then
    wrangler d1 execute evoting-db-production --file=./drizzle/data-export.sql --env=production
else
    wrangler d1 execute evoting-db --file=./drizzle/data-export.sql
fi

if [ $? -ne 0 ]; then
    echo "❌ Import failed!"
    exit 1
fi

echo ""
echo "✅ Sync completed successfully!"
echo ""
echo "📊 Verify data with:"
if [ "$ENV" = "production" ]; then
    echo "   wrangler d1 execute evoting-db-production --command=\"SELECT * FROM admins\" --env=production"
else
    echo "   wrangler d1 execute evoting-db --command=\"SELECT * FROM admins\""
fi
