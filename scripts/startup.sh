#!/bin/bash

echo "🚀 Running database setup..."

# Ensure the data directory exists
mkdir -p /opt/render/project/src/data

# Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Seed the database (only if needed)
echo "🌱 Seeding database..."
npm run db:seed:prod

# Start the app
echo "✅ Starting Next.js..."
npm run start