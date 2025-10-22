#!/bin/bash

# Script to check what tables exist in D1
echo "🔍 Checking tables in D1 database..."
echo ""

wrangler d1 execute evoting-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

echo ""
echo "📊 Checking row counts..."
echo ""

wrangler d1 execute evoting-db --command="SELECT 'admins' as table_name, COUNT(*) as count FROM admins UNION ALL SELECT 'classes', COUNT(*) FROM classes UNION ALL SELECT 'students', COUNT(*) FROM students UNION ALL SELECT 'candidates', COUNT(*) FROM candidates UNION ALL SELECT 'votes', COUNT(*) FROM votes"
