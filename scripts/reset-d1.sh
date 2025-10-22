#!/bin/bash

# Script to reset D1 database (drop all tables and data)
echo "⚠️  WARNING: This will DELETE all data in D1 database!"
echo ""
read -p "Are you sure? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🗑️  Dropping all tables..."

# Drop tables in correct order (respecting foreign keys)
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS votes"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS tokens"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS students"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS candidates"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS classes"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS voting_settings"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS admins"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS verification"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS account"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS session"
wrangler d1 execute evoting-db --command="DROP TABLE IF EXISTS user"

echo ""
echo "✅ All tables dropped!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run d1:sync (to recreate and populate)"
